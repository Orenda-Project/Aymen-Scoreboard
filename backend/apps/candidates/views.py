import os
import uuid
import json
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Prefetch
from django.core.files.storage import FileSystemStorage
from .models import Candidate, CandidateData, UploadedFile
from apps.positions.models import ColumnDefinition
from .serializers import (
    CandidateSerializer,
    CandidateListSerializer,
    CandidateCreateSerializer,
    CandidateDataSerializer,
    CandidateDataUpdateSerializer,
    UploadedFileSerializer,
)


class CandidateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing candidates.

    Endpoints:
    - GET /api/candidates/ - List all candidates
    - POST /api/candidates/ - Create a new candidate
    - GET /api/candidates/{id}/ - Get candidate details with all data
    - PUT /api/candidates/{id}/ - Update candidate
    - DELETE /api/candidates/{id}/ - Delete candidate
    - PUT /api/candidates/{id}/data/ - Bulk update candidate data
    - POST /api/candidates/{id}/upload/ - Upload file for a column
    """

    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get candidates with optimized queries and filtering."""
        queryset = Candidate.objects.select_related('position').prefetch_related(
            'data_fields',
            'data_fields__column_definition',
            'data_fields__files'
        )

        # Filter by position if specified
        position_id = self.request.query_params.get('position')
        if position_id:
            queryset = queryset.filter(position_id=position_id)

        # Apply custom column filters
        column_filters = self.request.query_params.get('column_filters')
        if column_filters:
            try:
                filters_dict = json.loads(column_filters)
                queryset = self._apply_column_filters(queryset, filters_dict)
            except json.JSONDecodeError:
                pass

        return queryset

    def _apply_column_filters(self, queryset, filters_dict):
        """Apply filters based on custom column values."""
        for column_id, filter_value in filters_dict.items():
            try:
                column = ColumnDefinition.objects.get(id=column_id)

                if column.column_type == 'text':
                    # Text search (case-insensitive contains)
                    queryset = queryset.filter(
                        data_fields__column_definition_id=column_id,
                        data_fields__value_text__icontains=filter_value
                    )
                elif column.column_type == 'status':
                    # Exact match for status (can be multiple values)
                    if isinstance(filter_value, list):
                        queryset = queryset.filter(
                            data_fields__column_definition_id=column_id,
                            data_fields__value_text__in=filter_value
                        )
                    else:
                        queryset = queryset.filter(
                            data_fields__column_definition_id=column_id,
                            data_fields__value_text=filter_value
                        )
                elif column.column_type == 'percentage':
                    # Range filtering for percentage
                    if isinstance(filter_value, dict):
                        q = Q(data_fields__column_definition_id=column_id)
                        if 'min' in filter_value:
                            q &= Q(data_fields__value_numeric__gte=filter_value['min'])
                        if 'max' in filter_value:
                            q &= Q(data_fields__value_numeric__lte=filter_value['max'])
                        queryset = queryset.filter(q)
                elif column.column_type == 'date':
                    # Date range filtering
                    if isinstance(filter_value, dict):
                        q = Q(data_fields__column_definition_id=column_id)
                        if 'start' in filter_value:
                            q &= Q(data_fields__value_date__gte=filter_value['start'])
                        if 'end' in filter_value:
                            q &= Q(data_fields__value_date__lte=filter_value['end'])
                        queryset = queryset.filter(q)

            except ColumnDefinition.DoesNotExist:
                continue

        return queryset.distinct()

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'list':
            return CandidateListSerializer
        elif self.action == 'create':
            return CandidateCreateSerializer
        return CandidateSerializer

    @action(detail=True, methods=['put'], url_path='data')
    def update_data(self, request, pk=None):
        """
        Bulk update candidate data for custom columns.
        Expects: [{"column_id": 1, "value": "some value"}, ...]
        """
        candidate = self.get_object()
        updates = request.data

        if not isinstance(updates, list):
            return Response(
                {'error': 'Expected a list of updates'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for update in updates:
            serializer = CandidateDataUpdateSerializer(data=update)
            if not serializer.is_valid():
                continue

            column_id = serializer.validated_data['column_id']
            value = serializer.validated_data['value']

            try:
                column_def = ColumnDefinition.objects.get(id=column_id, position=candidate.position)
            except ColumnDefinition.DoesNotExist:
                continue

            # Get or create candidate data
            candidate_data, created = CandidateData.objects.get_or_create(
                candidate=candidate,
                column_definition=column_def
            )

            # Update the appropriate value field based on column type
            if column_def.column_type == 'text' or column_def.column_type == 'status':
                candidate_data.value_text = value
            elif column_def.column_type == 'date':
                candidate_data.value_date = value
            elif column_def.column_type == 'percentage':
                candidate_data.value_numeric = value
            elif column_def.column_type == 'file':
                candidate_data.value_json = value

            candidate_data.save()

        # Return updated candidate
        serializer = CandidateSerializer(candidate, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='upload', parser_classes=[MultiPartParser, FormParser])
    def upload_file(self, request, pk=None):
        """
        Upload a file for a file-type column.
        Expects: multipart/form-data with 'file' and 'column_id'
        """
        candidate = self.get_object()
        column_id = request.data.get('column_id')
        uploaded_file = request.FILES.get('file')

        if not uploaded_file or not column_id:
            return Response(
                {'error': 'Both file and column_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate column
        try:
            column = ColumnDefinition.objects.get(
                id=column_id,
                position=candidate.position,
                column_type='file'
            )
        except ColumnDefinition.DoesNotExist:
            return Response(
                {'error': 'Invalid column_id or column is not a file type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size
        config = column.config or {}
        max_size = config.get('maxSize', 10485760)  # 10MB default
        if uploaded_file.size > max_size:
            return Response(
                {'error': f'File size exceeds maximum allowed size of {max_size} bytes'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        allowed_types = config.get('allowedTypes', [])
        if allowed_types:
            file_ext = uploaded_file.name.split('.')[-1].lower()
            if file_ext not in allowed_types:
                return Response(
                    {'error': f'File type .{file_ext} is not allowed. Allowed types: {", ".join(allowed_types)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{uploaded_file.name}"

        # Save file
        fs = FileSystemStorage()
        filename = fs.save(f'uploads/{unique_filename}', uploaded_file)
        file_path = fs.path(filename)

        # Get or create candidate_data
        candidate_data, created = CandidateData.objects.get_or_create(
            candidate=candidate,
            column_definition=column,
            defaults={'value_json': {'files': []}}
        )

        # Create file record
        file_record = UploadedFile.objects.create(
            candidate_data=candidate_data,
            original_filename=uploaded_file.name,
            stored_filename=unique_filename,
            file_path=filename,
            file_size=uploaded_file.size,
            mime_type=uploaded_file.content_type
        )

        # Update value_json with file metadata
        if not candidate_data.value_json:
            candidate_data.value_json = {'files': []}
        if 'files' not in candidate_data.value_json:
            candidate_data.value_json['files'] = []

        candidate_data.value_json['files'].append({
            'id': file_record.id,
            'name': file_record.original_filename,
            'size': file_record.file_size,
            'url': request.build_absolute_uri(file_record.file_path.url)
        })
        candidate_data.save()

        # Return file info
        serializer = UploadedFileSerializer(file_record, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UploadedFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing uploaded files.

    Endpoints:
    - GET /api/files/ - List all files
    - GET /api/files/{id}/ - Get file details
    - DELETE /api/files/{id}/ - Delete file
    """

    queryset = UploadedFile.objects.select_related('candidate_data', 'candidate_data__candidate')
    serializer_class = UploadedFileSerializer

    def destroy(self, request, *args, **kwargs):
        """Delete file from filesystem and database."""
        instance = self.get_object()
        candidate_data = instance.candidate_data

        # Delete physical file
        if instance.file_path:
            try:
                if os.path.isfile(instance.file_path.path):
                    os.remove(instance.file_path.path)
            except Exception:
                pass

        # Remove from value_json
        if candidate_data.value_json and 'files' in candidate_data.value_json:
            candidate_data.value_json['files'] = [
                f for f in candidate_data.value_json['files']
                if f.get('id') != instance.id
            ]
            candidate_data.save()

        # Delete database record
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import Position, ColumnDefinition
from .serializers import (
    PositionSerializer,
    PositionListSerializer,
    ColumnDefinitionSerializer
)


class PositionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing job positions.

    Endpoints:
    - GET /api/positions/ - List all positions
    - POST /api/positions/ - Create a new position
    - GET /api/positions/{id}/ - Get position details with columns
    - PUT /api/positions/{id}/ - Update position
    - DELETE /api/positions/{id}/ - Delete position
    - POST /api/positions/{id}/columns/ - Add a column to this position
    """

    queryset = Position.objects.annotate(
        candidates_count=Count('candidates')
    ).prefetch_related('columns')
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == 'list':
            return PositionListSerializer
        return PositionSerializer

    @action(detail=True, methods=['post'], url_path='columns')
    def add_column(self, request, pk=None):
        """Add a new column definition to this position."""
        position = self.get_object()

        # Set the position ID in the data
        data = request.data.copy()
        data['position'] = position.id

        # Set column_order to be the last if not provided
        if 'column_order' not in data:
            max_order = position.columns.aggregate(models.Max('column_order'))['column_order__max']
            data['column_order'] = (max_order or 0) + 1

        serializer = ColumnDefinitionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='columns')
    def list_columns(self, request, pk=None):
        """List all columns for this position."""
        position = self.get_object()
        columns = position.columns.all()
        serializer = ColumnDefinitionSerializer(columns, many=True)
        return Response(serializer.data)


class ColumnDefinitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing column definitions.

    Endpoints:
    - GET /api/columns/ - List all columns
    - GET /api/columns/{id}/ - Get column details
    - PUT /api/columns/{id}/ - Update column
    - DELETE /api/columns/{id}/ - Delete column
    - POST /api/columns/reorder/ - Reorder columns
    """

    queryset = ColumnDefinition.objects.select_related('position')
    serializer_class = ColumnDefinitionSerializer
    filterset_fields = ['position', 'column_type']
    ordering_fields = ['column_order', 'created_at']
    ordering = ['position', 'column_order']

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """
        Reorder columns for a position.
        Expects: { "position_id": 1, "column_orders": [{"id": 1, "order": 0}, {"id": 2, "order": 1}] }
        """
        position_id = request.data.get('position_id')
        column_orders = request.data.get('column_orders', [])

        if not position_id or not column_orders:
            return Response(
                {'error': 'position_id and column_orders are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update each column's order
        for item in column_orders:
            try:
                column = ColumnDefinition.objects.get(id=item['id'], position_id=position_id)
                column.column_order = item['order']
                column.save()
            except ColumnDefinition.DoesNotExist:
                continue

        # Return updated columns
        columns = ColumnDefinition.objects.filter(position_id=position_id)
        serializer = self.get_serializer(columns, many=True)
        return Response(serializer.data)

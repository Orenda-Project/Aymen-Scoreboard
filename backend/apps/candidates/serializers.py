from rest_framework import serializers
from .models import Candidate, CandidateData, UploadedFile
from apps.positions.models import ColumnDefinition


class UploadedFileSerializer(serializers.ModelSerializer):
    """Serializer for uploaded files."""

    url = serializers.SerializerMethodField()

    class Meta:
        model = UploadedFile
        fields = [
            'id',
            'original_filename',
            'file_size',
            'mime_type',
            'url',
            'uploaded_at',
        ]
        read_only_fields = ['id', 'uploaded_at']

    def get_url(self, obj):
        """Return the file URL."""
        if obj.file_path:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_path.url)
            return obj.file_path.url
        return None


class CandidateDataSerializer(serializers.ModelSerializer):
    """Serializer for candidate data fields."""

    column_name = serializers.CharField(source='column_definition.column_name', read_only=True)
    column_type = serializers.CharField(source='column_definition.column_type', read_only=True)
    files = UploadedFileSerializer(many=True, read_only=True)

    class Meta:
        model = CandidateData
        fields = [
            'id',
            'column_definition',
            'column_name',
            'column_type',
            'value_text',
            'value_date',
            'value_numeric',
            'value_json',
            'files',
        ]
        read_only_fields = ['id']

    def validate(self, data):
        """Ensure the column_definition belongs to the same position as the candidate."""
        candidate = self.context.get('candidate')
        column_definition = data.get('column_definition')

        if candidate and column_definition:
            if column_definition.position != candidate.position:
                raise serializers.ValidationError(
                    "Column definition must belong to the same position as the candidate"
                )

        return data


class CandidateSerializer(serializers.ModelSerializer):
    """Detailed serializer for candidates with all data fields."""

    data_fields = CandidateDataSerializer(many=True, read_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'id',
            'position',
            'position_name',
            'name',
            'email',
            'phone',
            'data_fields',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CandidateListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for candidate lists."""

    class Meta:
        model = Candidate
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CandidateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating candidates with initial data."""

    initial_data = serializers.JSONField(
        required=False,
        write_only=True,
        help_text="Initial data for custom columns: {column_id: value}"
    )

    class Meta:
        model = Candidate
        fields = [
            'position',
            'name',
            'email',
            'phone',
            'initial_data',
        ]

    def create(self, validated_data):
        """Create candidate and optionally initialize custom column data."""
        initial_data = validated_data.pop('initial_data', {})
        candidate = Candidate.objects.create(**validated_data)

        # Create initial data for custom columns if provided
        for column_id, value in initial_data.items():
            try:
                column_def = ColumnDefinition.objects.get(id=column_id, position=candidate.position)
                candidate_data = CandidateData(
                    candidate=candidate,
                    column_definition=column_def
                )

                # Set the appropriate value field based on column type
                if column_def.column_type == 'text' or column_def.column_type == 'status':
                    candidate_data.value_text = value
                elif column_def.column_type == 'date':
                    candidate_data.value_date = value
                elif column_def.column_type == 'percentage':
                    candidate_data.value_numeric = value
                elif column_def.column_type == 'file':
                    candidate_data.value_json = value

                candidate_data.save()
            except ColumnDefinition.DoesNotExist:
                continue

        return candidate


class CandidateDataUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating candidate data."""

    column_id = serializers.IntegerField()
    value = serializers.JSONField()

    def validate_column_id(self, value):
        """Ensure the column exists."""
        try:
            ColumnDefinition.objects.get(id=value)
        except ColumnDefinition.DoesNotExist:
            raise serializers.ValidationError("Column definition does not exist")
        return value

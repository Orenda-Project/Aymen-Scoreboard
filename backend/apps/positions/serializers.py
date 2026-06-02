from rest_framework import serializers
from .models import Position, ColumnDefinition


class ColumnDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for column definitions."""

    column_type_display = serializers.CharField(source='get_column_type_display', read_only=True)

    class Meta:
        model = ColumnDefinition
        fields = [
            'id',
            'position',
            'column_name',
            'column_type',
            'column_type_display',
            'column_order',
            'is_required',
            'config',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_config(self, value):
        """Validate config based on column type."""
        column_type = self.initial_data.get('column_type')

        if column_type == 'status':
            # Ensure status columns have options
            if 'options' not in value or not value['options']:
                raise serializers.ValidationError(
                    "Status columns must have 'options' defined in config"
                )
            # Validate option structure
            for option in value['options']:
                if 'value' not in option or 'label' not in option:
                    raise serializers.ValidationError(
                        "Each status option must have 'value' and 'label' fields"
                    )

        return value


class PositionSerializer(serializers.ModelSerializer):
    """Serializer for positions."""

    columns = ColumnDefinitionSerializer(many=True, read_only=True)
    candidate_count = serializers.IntegerField(read_only=True, source='candidates.count')

    class Meta:
        model = Position
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'columns',
            'candidate_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PositionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for position lists (without nested columns)."""

    candidate_count = serializers.IntegerField(read_only=True, source='candidates.count')

    class Meta:
        model = Position
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'candidate_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

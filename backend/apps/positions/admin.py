from django.contrib import admin
from .models import Position, ColumnDefinition


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    """Admin interface for Position model."""

    list_display = ['name', 'is_active', 'candidate_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'candidate_count']
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ColumnDefinition)
class ColumnDefinitionAdmin(admin.ModelAdmin):
    """Admin interface for ColumnDefinition model."""

    list_display = ['column_name', 'position', 'column_type', 'column_order', 'is_required', 'created_at']
    list_filter = ['column_type', 'is_required', 'created_at']
    search_fields = ['column_name', 'position__name']
    readonly_fields = ['created_at']
    ordering = ['position', 'column_order']

    fieldsets = (
        ('Column Information', {
            'fields': ('position', 'column_name', 'column_type', 'column_order', 'is_required')
        }),
        ('Configuration', {
            'fields': ('config',),
            'description': 'JSON configuration for column-specific settings'
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

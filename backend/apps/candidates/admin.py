from django.contrib import admin
from .models import Candidate, CandidateData, UploadedFile


class CandidateDataInline(admin.TabularInline):
    """Inline admin for candidate data."""
    model = CandidateData
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    """Admin interface for Candidate model."""

    list_display = ['name', 'email', 'phone', 'position', 'created_at']
    list_filter = ['position', 'created_at']
    search_fields = ['name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    inlines = [CandidateDataInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('position', 'name', 'email', 'phone')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CandidateData)
class CandidateDataAdmin(admin.ModelAdmin):
    """Admin interface for CandidateData model."""

    list_display = ['candidate', 'column_definition', 'get_value_preview', 'updated_at']
    list_filter = ['column_definition__column_type', 'updated_at']
    search_fields = ['candidate__name', 'column_definition__column_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']

    fieldsets = (
        ('Reference', {
            'fields': ('candidate', 'column_definition')
        }),
        ('Values', {
            'fields': ('value_text', 'value_date', 'value_numeric', 'value_json'),
            'description': 'Only the field corresponding to the column type should have a value'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_value_preview(self, obj):
        """Show a preview of the stored value."""
        value = obj.get_value()
        if value is None:
            return '-'
        if isinstance(value, dict):
            return str(value)[:50] + '...' if len(str(value)) > 50 else str(value)
        return str(value)[:100]

    get_value_preview.short_description = 'Value'


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    """Admin interface for UploadedFile model."""

    list_display = ['original_filename', 'get_candidate_name', 'file_size_display', 'mime_type', 'uploaded_at']
    list_filter = ['mime_type', 'uploaded_at']
    search_fields = ['original_filename', 'candidate_data__candidate__name']
    readonly_fields = ['uploaded_at']
    ordering = ['-uploaded_at']

    fieldsets = (
        ('File Information', {
            'fields': ('candidate_data', 'original_filename', 'stored_filename', 'file_path')
        }),
        ('Metadata', {
            'fields': ('file_size', 'mime_type', 'uploaded_at')
        }),
    )

    def get_candidate_name(self, obj):
        """Return the candidate's name."""
        return obj.candidate_data.candidate.name

    get_candidate_name.short_description = 'Candidate'

    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        size_bytes = obj.file_size
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"

    file_size_display.short_description = 'File Size'

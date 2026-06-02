from django.db import models


class Position(models.Model):
    """
    Represents a job position (e.g., Software Engineer, Product Manager).
    Each position has its own table of candidates.
    """
    name = models.CharField(max_length=255, help_text="Job position title")
    description = models.TextField(blank=True, help_text="Job description or notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, help_text="Whether this position is currently hiring")

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Position'
        verbose_name_plural = 'Positions'

    def __str__(self):
        return self.name

    @property
    def candidate_count(self):
        """Returns the number of candidates for this position."""
        return self.candidates.count()


class ColumnDefinition(models.Model):
    """
    Defines a custom column for a position's candidate table.
    Each position can have multiple custom columns of different types.
    """
    COLUMN_TYPES = (
        ('text', 'Text/Feedback'),
        ('date', 'Date'),
        ('file', 'File Upload'),
        ('percentage', 'Percentage'),
        ('status', 'Status/Dropdown'),
    )

    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        related_name='columns',
        help_text="The position this column belongs to"
    )
    column_name = models.CharField(
        max_length=255,
        help_text="Display name for this column (e.g., 'Interview Date', 'Resume')"
    )
    column_type = models.CharField(
        max_length=50,
        choices=COLUMN_TYPES,
        help_text="Data type for this column"
    )
    column_order = models.IntegerField(
        default=0,
        help_text="Display order in the table (lower numbers appear first)"
    )
    is_required = models.BooleanField(
        default=False,
        help_text="Whether this field is required when adding a candidate"
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Column-specific configuration (e.g., status options, file types, validation rules)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'column_order']
        unique_together = ['position', 'column_name']
        verbose_name = 'Column Definition'
        verbose_name_plural = 'Column Definitions'

    def __str__(self):
        return f"{self.position.name} - {self.column_name} ({self.get_column_type_display()})"

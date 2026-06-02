from django.db import models
from apps.positions.models import Position, ColumnDefinition


class Candidate(models.Model):
    """
    Represents a candidate for a job position.
    Each candidate is associated with one position.
    """
    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        related_name='candidates',
        help_text="The job position this candidate applied for"
    )
    name = models.CharField(max_length=255, help_text="Candidate's full name")
    email = models.EmailField(blank=True, help_text="Candidate's email address")
    phone = models.CharField(max_length=50, blank=True, help_text="Candidate's phone number")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Candidate'
        verbose_name_plural = 'Candidates'
        indexes = [
            models.Index(fields=['position', '-created_at']),
        ]

    def __str__(self):
        return f"{self.name} - {self.position.name}"


class CandidateData(models.Model):
    """
    Stores data values for custom columns using EAV (Entity-Attribute-Value) pattern.
    Each row represents one value for one column for one candidate.
    Different value fields are used based on the column type.
    """
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='data_fields',
        help_text="The candidate this data belongs to"
    )
    column_definition = models.ForeignKey(
        ColumnDefinition,
        on_delete=models.CASCADE,
        related_name='candidate_values',
        help_text="The column definition this data corresponds to"
    )

    # Different value fields for different column types
    value_text = models.TextField(
        blank=True,
        null=True,
        help_text="Used for 'text' and 'status' column types"
    )
    value_date = models.DateField(
        blank=True,
        null=True,
        help_text="Used for 'date' column type"
    )
    value_numeric = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Used for 'percentage' column type"
    )
    value_json = models.JSONField(
        blank=True,
        null=True,
        help_text="Used for 'file' column type and complex data structures"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['candidate', 'column_definition']
        verbose_name = 'Candidate Data'
        verbose_name_plural = 'Candidate Data'
        indexes = [
            models.Index(fields=['candidate', 'column_definition']),
        ]

    def __str__(self):
        return f"{self.candidate.name} - {self.column_definition.column_name}"

    def get_value(self):
        """Returns the appropriate value based on the column type."""
        column_type = self.column_definition.column_type
        if column_type == 'text' or column_type == 'status':
            return self.value_text
        elif column_type == 'date':
            return self.value_date
        elif column_type == 'percentage':
            return self.value_numeric
        elif column_type == 'file':
            return self.value_json
        return None


class UploadedFile(models.Model):
    """
    Stores metadata for files uploaded to file-type columns.
    Actual files are stored in the media/uploads directory.
    """
    candidate_data = models.ForeignKey(
        CandidateData,
        on_delete=models.CASCADE,
        related_name='files',
        help_text="The candidate data field this file belongs to"
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename as uploaded by user"
    )
    stored_filename = models.CharField(
        max_length=255,
        help_text="Unique filename used for storage"
    )
    file_path = models.FileField(
        upload_to='uploads/%Y/%m/%d/',
        help_text="Path to the uploaded file"
    )
    file_size = models.BigIntegerField(
        help_text="File size in bytes"
    )
    mime_type = models.CharField(
        max_length=100,
        help_text="MIME type of the file (e.g., application/pdf)"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Uploaded File'
        verbose_name_plural = 'Uploaded Files'

    def __str__(self):
        return f"{self.original_filename} ({self.candidate_data.candidate.name})"

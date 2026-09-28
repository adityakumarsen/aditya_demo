import uuid
from django.db import models
from django.conf import settings

class FeedbackType(models.TextChoices):
    POSITIVE = 'POSITIVE', 'Positive'
    NEGATIVE = 'NEGATIVE', 'Negative'
    CONSTRUCTIVE = 'CONSTRUCTIVE', 'Constructive'
    REWARDS = 'REWARDS', 'Rewards'
    OBSERVATION = 'OBSERVATION', 'Observation'
    PROGRESS = 'PROGRESS', 'Progress'
    TRAINING = 'TRAINING', 'Training'
    SATISFACTORY = 'SATISFACTORY', 'Satisfactory'
    PRAISE = 'PRAISE', 'Praise'
    IMPROVEMENT = 'IMPROVEMENT', 'Improvement'
    WARNING = 'WARNING', 'Warning'
    COACHING = 'COACHING', 'Coaching'
    SUGGESTION = 'SUGGESTION', 'Suggestion'
    GENERAL = 'GENERAL', 'General'

class FeedbackVisibility(models.TextChoices):
    PUBLIC = 'PUBLIC', 'Public'
    MANAGER_ONLY = 'MANAGER_ONLY', 'Manager Only'
    PRIVATE = 'PRIVATE', 'Private'

class FeedbackStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PUBLISHED = 'PUBLISHED', 'Published'


class FeedbackTag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Feedback Tag'
        verbose_name_plural = 'Feedback Tags'
        ordering = ['id']

    def __str__(self):
        return self.name


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_feedbacks',
        db_index=True
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_feedbacks',
        db_index=True
    )
    tag = models.ForeignKey(
        FeedbackTag,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks'
    )
    goal = models.ForeignKey(
        'goals.Goal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks'
    )
    feedback_type = models.CharField(
        max_length=20,
        choices=FeedbackType.choices,
        default=FeedbackType.POSITIVE
    )
    message = models.TextField()
    visibility = models.CharField(
        max_length=20,
        choices=FeedbackVisibility.choices,
        default=FeedbackVisibility.PUBLIC
    )
    is_anonymous = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=FeedbackStatus.choices,
        default=FeedbackStatus.PUBLISHED
    )
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'
        ordering = ['-created_at']

    def __str__(self):
        sender_repr = "Anonymous" if self.is_anonymous else self.sender.username
        return f"{sender_repr} -> {self.recipient.username} ({self.get_feedback_type_display()})"


class FeedbackComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.ForeignKey(
        Feedback,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback_comments'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Feedback Comment'
        verbose_name_plural = 'Feedback Comments'
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on feedback {self.feedback_id}"


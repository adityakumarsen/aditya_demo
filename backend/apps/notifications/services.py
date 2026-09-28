import logging
import threading
import time
from django.db import transaction, connection
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.notifications.models import (
    Notification,
    ScheduledNotification,
    NotificationType,
    AudienceType,
    NotificationStatus,
)

logger = logging.getLogger(__name__)
User = get_user_model()

_scheduler_started = False
_lock = threading.Lock()


def get_audience_queryset(audience_type: str, specific_recipients=None):
    """
    Returns the queryset of active users targeted by the audience type.
    """
    base_users = User.objects.filter(is_active=True)
    if audience_type == AudienceType.EVERYONE:
        return base_users
    elif audience_type == AudienceType.HR:
        return base_users.filter(role='HR')
    elif audience_type == AudienceType.MENTORS:
        # In PerforMax, managers serve as mentors
        return base_users.filter(role='MANAGER')
    elif audience_type == AudienceType.INTERNS:
        return base_users.filter(role='INTERN')
    elif audience_type == AudienceType.SPECIFIC:
        if specific_recipients is not None:
            return specific_recipients.filter(is_active=True)
        return base_users.none()
    return base_users.none()


def dispatch_scheduled_notification(scheduled_notification_id, trigger_time=None) -> bool:
    """
    Atomically delivers a scheduled notification to its intended audience.
    Uses select_for_update to avoid duplicate delivery across concurrent requests or retries.
    """
    now = trigger_time or timezone.now()
    try:
        with transaction.atomic():
            sn = (
                ScheduledNotification.objects.select_for_update(skip_locked=True)
                .filter(id=scheduled_notification_id)
                .first()
            )
            if not sn:
                return False

            if sn.status not in [NotificationStatus.SCHEDULED, NotificationStatus.DRAFT]:
                return False

            recipients = get_audience_queryset(sn.audience_type, sn.specific_recipients)
            notifications_to_create = []

            for recipient in recipients:
                notifications_to_create.append(
                    Notification(
                        recipient=recipient,
                        sender=sn.sender,
                        scheduled_notification=sn,
                        title=sn.title,
                        message=sn.message,
                        notification_type=NotificationType.SYSTEM,
                        delivery_time=now,
                        is_read=False,
                    )
                )

            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)

            sn.status = NotificationStatus.SENT
            sn.sent_at = now
            sn.recipient_count = len(notifications_to_create)
            sn.failure_reason = ''
            sn.save(update_fields=['status', 'sent_at', 'recipient_count', 'failure_reason', 'updated_at'])
            logger.info("Successfully delivered notification '%s' (id: %s) to %d recipients.", sn.title, sn.id, len(notifications_to_create))
            return True

    except Exception as exc:
        logger.exception("Failed to dispatch scheduled notification %s: %s", scheduled_notification_id, exc)
        try:
            ScheduledNotification.objects.filter(id=scheduled_notification_id).update(
                status=NotificationStatus.FAILED,
                failure_reason=str(exc)
            )
        except Exception:
            pass
        return False


def process_due_scheduled_notifications() -> int:
    """
    Checks for all SCHEDULED notifications whose scheduled_for time is <= now,
    and dispatches them. Returns the number of successfully delivered notifications.
    """
    now = timezone.now()
    due_ids = list(
        ScheduledNotification.objects.filter(
            status=NotificationStatus.SCHEDULED,
            scheduled_for__lte=now,
        ).values_list('id', flat=True)
    )

    if not due_ids:
        return 0

    delivered_count = 0
    for sn_id in due_ids:
        if dispatch_scheduled_notification(sn_id, trigger_time=now):
            delivered_count += 1

    return delivered_count


def start_scheduler_thread():
    """
    Starts a background daemon thread that periodically checks and delivers due notifications.
    Safe against multiple calls.
    """
    global _scheduler_started
    with _lock:
        if _scheduler_started:
            return
        _scheduler_started = True

    def _worker():
        logger.info("Started background worker for scheduled notifications.")
        while True:
            try:
                connection.close_if_unusable_or_obsolete()
                process_due_scheduled_notifications()
            except Exception as e:
                logger.error("Error in scheduled notification worker loop: %s", e)
            time.sleep(5)

    thread = threading.Thread(target=_worker, daemon=True, name="ScheduledNotificationDaemon")
    thread.start()

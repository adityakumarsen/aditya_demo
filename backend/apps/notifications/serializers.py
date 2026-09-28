from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.notifications.models import Notification, ScheduledNotification, AudienceType, NotificationStatus

User = get_user_model()


def get_user_display_name(user):
    if not user:
        return "Super Admin"
    try:
        if hasattr(user, 'profile') and user.profile:
            fn = f"{getattr(user.profile, 'first_name', '')} {getattr(user.profile, 'last_name', '')}".strip()
            if fn:
                return fn
    except Exception:
        pass
    return user.username or user.email


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    sender_name = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    delivery_time = serializers.SerializerMethodField()
    deliveryTime = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    isRead = serializers.BooleanField(source='is_read', read_only=True)
    type = serializers.CharField(source='notification_type', read_only=True)
    actionUrl = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            'id', 'title', 'message', 'notification_type', 'type',
            'is_read', 'isRead', 'created_at', 'createdAt',
            'delivery_time', 'deliveryTime', 'sender_name', 'senderName',
            'sender_role', 'actionUrl'
        )
        read_only_fields = ('id', 'title', 'message', 'notification_type', 'created_at')

    def get_sender_name(self, obj):
        return get_user_display_name(obj.sender)

    def get_senderName(self, obj):
        return self.get_sender_name(obj)

    def get_sender_role(self, obj):
        if obj.sender:
            return obj.sender.role
        return "SUPER_ADMIN"

    def get_delivery_time(self, obj):
        dt = obj.delivery_time or obj.created_at
        return dt.isoformat() if dt else None

    def get_deliveryTime(self, obj):
        return self.get_delivery_time(obj)

    def get_actionUrl(self, obj):
        return "/notifications"


class SpecificRecipientDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'name')

    def get_name(self, obj):
        return get_user_display_name(obj)


class ScheduledNotificationSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    sender_name = serializers.SerializerMethodField()
    senderName = serializers.SerializerMethodField()
    specific_recipients = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False
    )
    specific_recipient_details = SpecificRecipientDetailSerializer(
        source='specific_recipients', many=True, read_only=True
    )
    audienceType = serializers.CharField(source='audience_type', read_only=True)
    scheduledFor = serializers.DateTimeField(source='scheduled_for', read_only=True)
    timeZone = serializers.CharField(source='time_zone', read_only=True)
    sentAt = serializers.DateTimeField(source='sent_at', read_only=True)
    recipientCount = serializers.IntegerField(source='recipient_count', read_only=True)
    failureReason = serializers.CharField(source='failure_reason', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = ScheduledNotification
        fields = (
            'id', 'title', 'message', 'audience_type', 'audienceType', 'status',
            'scheduled_for', 'scheduledFor', 'time_zone', 'timeZone',
            'sent_at', 'sentAt', 'recipient_count', 'recipientCount',
            'failure_reason', 'failureReason', 'sender', 'sender_name', 'senderName',
            'specific_recipients', 'specific_recipient_details',
            'created_at', 'createdAt', 'updated_at', 'updatedAt'
        )
        read_only_fields = (
            'id', 'sender', 'sender_name', 'senderName', 'sent_at', 'sentAt',
            'recipient_count', 'recipientCount', 'created_at', 'createdAt',
            'updated_at', 'updatedAt', 'specific_recipient_details'
        )

    def get_sender_name(self, obj):
        return get_user_display_name(obj.sender)

    def get_senderName(self, obj):
        return self.get_sender_name(obj)


class ScheduledNotificationCreateUpdateSerializer(serializers.ModelSerializer):
    specific_recipients = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False
    )
    action = serializers.CharField(required=False, write_only=True, default='')

    class Meta:
        model = ScheduledNotification
        fields = (
            'title', 'message', 'audience_type', 'scheduled_for',
            'time_zone', 'specific_recipients', 'status', 'action'
        )

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    def validate_message(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()

    def validate(self, attrs):
        audience_type = attrs.get('audience_type', self.instance.audience_type if self.instance else AudienceType.EVERYONE)
        specific_recipients = attrs.get('specific_recipients', None)

        if audience_type == AudienceType.SPECIFIC:
            if specific_recipients is not None and len(specific_recipients) == 0:
                raise serializers.ValidationError({"specific_recipients": "At least one specific recipient must be selected."})
            if specific_recipients is None and (not self.instance or not self.instance.specific_recipients.exists()):
                raise serializers.ValidationError({"specific_recipients": "At least one specific recipient must be selected."})

        scheduled_for = attrs.get('scheduled_for', self.instance.scheduled_for if self.instance else None)
        status_val = attrs.get('status', self.instance.status if self.instance else None)
        action_val = attrs.get('action', '')

        # Past time validation
        if action_val == 'SCHEDULE' and not scheduled_for:
            raise serializers.ValidationError({"scheduled_for": "A future date and time is required to schedule a notification."})

        if scheduled_for is not None and scheduled_for <= timezone.now():
            raise serializers.ValidationError({"scheduled_for": "Cannot schedule a notification in the past. Please choose a future time."})

        return attrs

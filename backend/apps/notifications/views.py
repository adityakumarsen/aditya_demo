from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.accounts.permissions import IsSuperAdmin
from apps.notifications.models import Notification, ScheduledNotification, AudienceType, NotificationStatus
from apps.notifications.serializers import (
    NotificationSerializer,
    ScheduledNotificationSerializer,
    ScheduledNotificationCreateUpdateSerializer,
    SpecificRecipientDetailSerializer,
)
from apps.notifications.services import (
    dispatch_scheduled_notification,
    process_due_scheduled_notifications,
    get_audience_queryset,
)

User = get_user_model()


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Process any pending due notifications on demand
        try:
            process_due_scheduled_notifications()
        except Exception:
            pass
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 200,
            'message': 'Success',
            'data': serializer.data,
            'results': serializer.data,
            'count': len(serializer.data),
        })

    @action(detail=True, methods=['post', 'patch'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({
            'code': 200,
            'message': 'Marked as read.',
            'data': {'id': str(notification.id), 'isRead': True}
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post', 'patch'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated_count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({
            'code': 200,
            'message': 'All notifications marked as read.',
            'data': {'updatedCount': updated_count}
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post', 'patch'], url_path='read-all')
    def read_all(self, request):
        return self.mark_all_read(request)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({
            'code': 200,
            'message': 'Success',
            'data': count,
            'unreadCount': count
        }, status=status.HTTP_200_OK)


class ScheduledNotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    queryset = ScheduledNotification.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ScheduledNotificationCreateUpdateSerializer
        return ScheduledNotificationSerializer

    def list(self, request, *args, **kwargs):
        # Refresh any due scheduled notifications
        try:
            process_due_scheduled_notifications()
        except Exception:
            pass

        queryset = self.get_queryset()
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() != 'ALL':
            queryset = queryset.filter(status=status_filter.upper())

        search_query = request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(title__icontains=search_query) | queryset.filter(message__icontains=search_query)

        serializer = ScheduledNotificationSerializer(queryset, many=True)
        return Response({
            'code': 200,
            'message': 'Success',
            'data': serializer.data,
            'results': serializer.data,
            'count': queryset.count()
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ScheduledNotificationSerializer(instance)
        return Response({
            'code': 200,
            'message': 'Success',
            'data': serializer.data
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data.pop('action', '')
        specific_recipients = serializer.validated_data.pop('specific_recipients', [])

        # Determine target status
        target_status = NotificationStatus.DRAFT
        if action_type == 'SEND_NOW':
            target_status = NotificationStatus.DRAFT
        elif action_type == 'SCHEDULE':
            target_status = NotificationStatus.SCHEDULED
        elif action_type == 'SAVE_DRAFT':
            target_status = NotificationStatus.DRAFT
        else:
            if serializer.validated_data.get('scheduled_for'):
                target_status = NotificationStatus.SCHEDULED

        scheduled_notif = ScheduledNotification.objects.create(
            sender=request.user,
            status=target_status,
            **serializer.validated_data
        )

        if specific_recipients:
            scheduled_notif.specific_recipients.set(specific_recipients)

        if action_type == 'SEND_NOW':
            dispatch_scheduled_notification(scheduled_notif.id)
            scheduled_notif.refresh_from_db()
            msg = 'Notification sent immediately.'
        elif target_status == NotificationStatus.SCHEDULED:
            msg = 'Notification scheduled successfully.'
        else:
            msg = 'Notification draft saved.'

        out_serializer = ScheduledNotificationSerializer(scheduled_notif)
        return Response({
            'code': 201,
            'message': msg,
            'data': out_serializer.data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status not in [NotificationStatus.DRAFT, NotificationStatus.SCHEDULED]:
            return Response({
                'code': 400,
                'message': f'Cannot edit notification with status {instance.status}. Only DRAFT and SCHEDULED notifications can be edited.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data.pop('action', '')
        specific_recipients = serializer.validated_data.pop('specific_recipients', None)

        if action_type == 'SEND_NOW':
            serializer.validated_data['status'] = NotificationStatus.DRAFT
        elif action_type == 'SCHEDULE':
            serializer.validated_data['status'] = NotificationStatus.SCHEDULED
        elif action_type == 'SAVE_DRAFT':
            serializer.validated_data['status'] = NotificationStatus.DRAFT

        updated_instance = serializer.save()
        if specific_recipients is not None:
            updated_instance.specific_recipients.set(specific_recipients)

        if action_type == 'SEND_NOW':
            dispatch_scheduled_notification(updated_instance.id)
            updated_instance.refresh_from_db()
            msg = 'Notification sent immediately.'
        else:
            msg = 'Notification updated successfully.'

        out_serializer = ScheduledNotificationSerializer(updated_instance)
        return Response({
            'code': 200,
            'message': msg,
            'data': out_serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == NotificationStatus.SENT:
            return Response({
                'code': 400,
                'message': 'Cannot delete an already SENT notification record to maintain delivery logs.'
            }, status=status.HTTP_400_BAD_REQUEST)

        instance.delete()
        return Response({
            'code': 200,
            'message': 'Notification deleted successfully.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='send')
    def send_now(self, request, pk=None):
        instance = self.get_object()
        if instance.status not in [NotificationStatus.DRAFT, NotificationStatus.SCHEDULED]:
            return Response({
                'code': 400,
                'message': f'Notification has already been {instance.status}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        success = dispatch_scheduled_notification(instance.id)
        instance.refresh_from_db()
        if success:
            return Response({
                'code': 200,
                'message': f'Successfully sent notification to {instance.recipient_count} recipients.',
                'data': ScheduledNotificationSerializer(instance).data
            })
        return Response({
            'code': 500,
            'message': f'Failed to deliver notification: {instance.failure_reason}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_schedule(self, request, pk=None):
        instance = self.get_object()
        if instance.status != NotificationStatus.SCHEDULED and instance.status != NotificationStatus.DRAFT:
            return Response({
                'code': 400,
                'message': f'Cannot cancel notification with status {instance.status}. Only SCHEDULED notifications can be cancelled.'
            }, status=status.HTTP_400_BAD_REQUEST)

        instance.status = NotificationStatus.CANCELLED
        instance.save(update_fields=['status', 'updated_at'])
        return Response({
            'code': 200,
            'message': 'Notification delivery cancelled successfully.',
            'data': ScheduledNotificationSerializer(instance).data
        })

    @action(detail=False, methods=['get'], url_path='audiences')
    def audiences(self, request):
        all_active_users = User.objects.filter(is_active=True).order_by('username')
        everyone_count = all_active_users.count()
        hr_count = all_active_users.filter(role='HR').count()
        mentors_count = all_active_users.filter(role='MANAGER').count()
        interns_count = all_active_users.filter(role='INTERN').count()

        user_list = SpecificRecipientDetailSerializer(all_active_users, many=True).data

        return Response({
            'code': 200,
            'message': 'Success',
            'data': {
                'counts': {
                    'EVERYONE': everyone_count,
                    'HR': hr_count,
                    'MENTORS': mentors_count,
                    'INTERNS': interns_count,
                },
                'users': user_list
            }
        })

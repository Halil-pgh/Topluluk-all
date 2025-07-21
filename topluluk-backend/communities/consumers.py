from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

from communities.models import Notification
from communities.serializers import NotificationSerializer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not self.scope['user'].is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"user_{self.scope['user'].id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # does not return unread notifications
    # returns all notifications lol
    @database_sync_to_async
    def get_unread_notifications(self, user):
        return list(Notification.objects.filter(user=user).order_by('-created_date'))

    @database_sync_to_async
    def get_notification_by_id(self, id):
        try:
            return Notification.objects.get(id=id)
        except Notification.DoesNotExist:
            print('OHOHOHOHOHOOH')
            return None

    @database_sync_to_async
    def mark_notification_as_read(self, notification):
        notification.is_read = True
        notification.save()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json['type']
        message_payload = text_data_json.get('payload', '')
        user = self.scope['user']
        if message_type == 'unread_notifications':
            notifications = await self.get_unread_notifications(user)
            serializer = NotificationSerializer(notifications, many=True)
            await self.channel_layer.group_send(
                f'user_{user.id}',
                {
                    'type': 'unread_notifications',
                    'unread_notifications': serializer.data
                }
            )
        elif message_type == 'read_notification':
            notification = await self.get_notification_by_id(message_payload['id'])
            if notification:
                await self.mark_notification_as_read(notification)

    async def notify(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'payload': event['notification']
        }))

    async def unread_notifications(self, event):
        await self.send(text_data=json.dumps({
            'type': 'unread_notifications',
            'payload': event['unread_notifications']
        }))

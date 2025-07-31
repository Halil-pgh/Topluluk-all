import { formatDate, type NotificationResponse } from "./responseTypes"
import { Box, Card, CardActionArea, CardContent, Typography, Container } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { getWebSocket } from "./websocket"
import apiClient from "./api"

interface NotificationPlaceProp {
    notifications: NotificationResponse[]
}

function NotificationPlace({ notifications }: NotificationPlaceProp) {
    const navigate = useNavigate()

    const handleNotificationClick = async (directUrl: string, notification: NotificationResponse) => {
        const ws = getWebSocket()
        await ws.send(JSON.stringify({
            'type': 'read_notification',
            'payload': notification
        }))

        try {
            const response = await apiClient.get(directUrl)
            // topic notification
            if (response.data.community !== undefined) {
                const topicSlug = response.data.slug
                const raw = response.data.community.split('/')
                const communitySlug = raw[raw.length - 2]
                // ban notification
                if (topicSlug === undefined)
                    navigate(`/communities/${communitySlug}`)
                // topic notification
                else
                    navigate(`/communities/${communitySlug}/${topicSlug}`)
            }
            // comment notification
            else {
                const topicResponse = await apiClient.get(response.data.topic)
                const topicSlug = topicResponse.data.slug
                const raw = topicResponse.data.community.split('/')
                const communitySlug = raw[raw.length - 2]
                navigate(`/communities/${communitySlug}/${topicSlug}`)
            }
        } catch (err) {
            console.error(err)
        }

    }

    return (
        <Container sx={{ py: 2 }}>
            {notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        No notifications yet
                    </Typography>
                </Box>
            ) : (
                notifications.map((notification, index) => (
                    <Card 
                        key={index} 
                        sx={{ 
                            mb: 2, 
                            borderRadius: 2, 
                            boxShadow: notification.is_read ? 1 : 3,
                            opacity: notification.is_read ? 0.7 : 1,
                            '&:hover': {
                                boxShadow: 4,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}
                    >
                        <CardActionArea 
                            onClick={() => handleNotificationClick(notification.direct_url, notification)}
                            sx={{ borderRadius: 2 }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography 
                                        variant="body1" 
                                        sx={{ 
                                            flexGrow: 1, 
                                            mr: 2,
                                            fontWeight: notification.is_read ? 'normal' : 'medium'
                                        }}
                                    >
                                        {notification.information}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{ flexShrink: 0 }}
                                    >
                                        {formatDate(notification.created_date)}
                                    </Typography>
                                </Box>
                                {!notification.is_read && (
                                    <Box 
                                        sx={{ 
                                            width: 8, 
                                            height: 8, 
                                            borderRadius: '50%', 
                                            backgroundColor: 'primary.main',
                                            position: 'absolute',
                                            top: 12,
                                            right: 12
                                        }} 
                                    />
                                )}
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))
            )}
        </Container>
    )
}

export default NotificationPlace
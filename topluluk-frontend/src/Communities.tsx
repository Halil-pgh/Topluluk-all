import { useEffect, useState } from "react";
import apiClient from "./api";
import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Container, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth";

interface Community {
    url: string
    name: string
    image: string | null
    description: string
    slug: string
    subscriber_count: number
    amISubscribed: boolean | null
}

interface CommunitiesProps {
    message?: string
    url?: string
}

function Communities({ message = 'Recent Communities', url = 'community/' }: CommunitiesProps) {
    const [communities, setCommunities] = useState<Community[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await apiClient.get(url)
                let communitiesData = response.data.results
                if (communitiesData === undefined) {
                    communitiesData = response.data
                }
                
                // Fetch subscription status for each community
                const communitiesWithSubscription = await Promise.all(
                    communitiesData.map(async (community: Community) => {
                        try {
                            const subResponse = await apiClient.get(`${community.url}am_i_subscribed/`)
                            return { ...community, amISubscribed: subResponse.data.am_i_subscribed }
                        } catch (error) {
                            console.error(`Failed to fetch subscription status for ${community.name}:`, error)
                            return { ...community, amISubscribed: false }
                        }
                    })
                )
                
                setCommunities(communitiesWithSubscription)
            } catch (err: any) {
                if (err.response?.status === 401) {
                    setError('You have to be authenticated to see your subscriptions.')
                } else {
                    setError('Failed to fetch communities.')
                }
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchCommunities()
    }, [message, url])

    const handleSubscribe = async (community: Community) => {
        try {
            await apiClient.post(`${community.url}subscribe/`)
            setCommunities(prevCommunities =>
                prevCommunities.map(c =>
                    c.slug === community.slug ? { 
                        ...c, 
                        amISubscribed: true,
                        subscriber_count: c.subscriber_count + 1
                    } : c
                )
            )
        } catch (error) {
            console.error('Failed to subscribe:', error)
        }
    }

    const handleUnsubscribe = async (community: Community) => {
        try {
            await apiClient.post(`${community.url}unsubscribe/`)
            setCommunities(prevCommunities =>
                prevCommunities.map(c =>
                    c.slug === community.slug ? { 
                        ...c, 
                        amISubscribed: false,
                        subscriber_count: c.subscriber_count - 1
                    } : c
                )
            )
        } catch (error) {
            console.error('Failed to unsubscribe:', error)
        }
    }

    const truncateDescription = (description: string, maxLength: number = 100) => {
        if (description.length <= maxLength) return description
        return description.substring(0, maxLength) + '...'
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Container sx={{ mt: 12, py: 4 }}>
                <Box sx={{ 
                    mb: 6, 
                    textAlign: 'center',
                    p: 4,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                    border: '1px solid #3a3a3a',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                }}>
                    <Typography 
                        variant="h2" 
                        component="h1" 
                        sx={{
                            fontWeight: 700,
                            color: '#f5f5f5',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2
                        }}
                    >
                        <span style={{ fontSize: '1em' }}>🏘️</span>
                        <span style={{
                            background: 'linear-gradient(45deg, #4fc3f7, #29b6f6)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {message}
                        </span>
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{
                            color: '#b0b0b0',
                            fontWeight: 400
                        }}
                    >
                        Discover and join amazing communities
                    </Typography>
                </Box>

                {loading && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 8,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                        border: '1px solid #3a3a3a',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                    }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: '#9e9e9e',
                                fontWeight: 500
                            }}
                        >
                            Loading communities...
                        </Typography>
                    </Box>
                )}
                
                {error && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 3,
                        px: 4,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #2a1a1a 0%, #3d2d2d 50%, #2f1f1f 100%)',
                        border: '1px solid #4a3a3a',
                        boxShadow: '0 4px 20px rgba(139, 69, 19, 0.3)',
                        mb: 3
                    }}>
                        <Typography 
                            sx={{ 
                                color: '#ff6b6b',
                                fontWeight: 600,
                                fontSize: '1.1rem'
                            }}
                        >
                            {error}
                        </Typography>
                    </Box>
                )}
                <Grid container spacing={3}>
                    {communities.map((community) => (
                        <Grid key={community.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ 
                                display: 'flex', 
                                height: 220, 
                                borderRadius: 4,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease-in-out',
                                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                                border: '1px solid #3a3a3a',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                    borderColor: '#4a4a4a',
                                    background: 'linear-gradient(135deg, #202020 0%, #353535 50%, #252525 100%)'
                                },
                                position: 'relative'
                            }}>
                                <CardActionArea 
                                    component={Link} 
                                    to={`/communities/${community.slug}`} 
                                    sx={{ 
                                        display: 'flex', 
                                        flexGrow: 1,
                                        alignItems: 'stretch',
                                        position: 'relative'
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        sx={{ 
                                            width: 130, 
                                            height: '100%', 
                                            objectFit: 'cover',
                                            borderRadius: '0',
                                            filter: 'brightness(0.9) contrast(1.1)',
                                            transition: 'all 0.3s ease-in-out'
                                        }}
                                        image={community.image || "https://via.placeholder.com/130x220?text=No+Image&color=666&bg=1a1a1a"}
                                        alt={`${community.name} picture`}
                                    />
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        flexGrow: 1,
                                        background: 'rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        borderLeft: '1px solid #3a3a3a'
                                    }}>
                                        <CardContent sx={{ 
                                            flex: '1 0 auto', 
                                            p: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            height: '100%'
                                        }}>
                                            <Box>
                                                <Typography 
                                                    component="div" 
                                                    variant="h6"
                                                    sx={{ 
                                                        fontWeight: 700,
                                                        mb: 1.5,
                                                        color: '#f5f5f5',
                                                        lineHeight: 1.2,
                                                        fontSize: '1.1rem'
                                                    }}
                                                >
                                                    {community.name}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    component="div"
                                                    sx={{ 
                                                        mb: 2.5,
                                                        lineHeight: 1.5,
                                                        fontSize: '0.875rem',
                                                        color: '#b0b0b0',
                                                        display: '-webkit-box',
                                                        WebkitBoxOrient: 'vertical',
                                                        WebkitLineClamp: 3,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {truncateDescription(community.description, 90)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1.5,
                                                pt: 1,
                                                borderTop: '1px solid #3a3a3a'
                                            }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: 'rgba(79, 195, 247, 0.15)',
                                                    borderRadius: 3,
                                                    px: 2,
                                                    py: 0.75,
                                                    border: '1px solid rgba(79, 195, 247, 0.3)'
                                                }}>
                                                    <Typography 
                                                        variant="caption" 
                                                        sx={{ 
                                                            color: '#4fc3f7',
                                                            fontWeight: 600,
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        👥 {community.subscriber_count}
                                                    </Typography>
                                                </Box>
                                                {isAuthenticated && (
                                                    <Button
                                                        variant={community.amISubscribed ? "outlined" : "contained"}
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            community.amISubscribed 
                                                                ? handleUnsubscribe(community)
                                                                : handleSubscribe(community)
                                                        }}
                                                        sx={{ 
                                                            minWidth: 'auto',
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            borderRadius: 3,
                                                            textTransform: 'none',
                                                            ...(community.amISubscribed ? {
                                                                color: '#ff6b6b',
                                                                borderColor: '#ff6b6b',
                                                                background: 'rgba(255, 107, 107, 0.1)',
                                                                '&:hover': {
                                                                    background: 'rgba(255, 107, 107, 0.2)',
                                                                    borderColor: '#ff8a80',
                                                                    transform: 'scale(1.05)'
                                                                }
                                                            } : {
                                                                background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
                                                                border: '1px solid #4fc3f7',
                                                                color: '#ffffff',
                                                                boxShadow: '0 2px 8px rgba(79, 195, 247, 0.3)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)',
                                                                    transform: 'scale(1.05)',
                                                                    boxShadow: '0 4px 12px rgba(79, 195, 247, 0.4)'
                                                                }
                                                            })
                                                        }}
                                                    >
                                                        {community.amISubscribed ? "Unfollow" : "Follow"}
                                                    </Button>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Box>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    )
}

export default Communities
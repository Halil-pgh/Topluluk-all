import { useEffect, useState } from "react";
import ResponsiveAppBar from "./AppBar"
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
            } catch (error) {
                setError('Failed to fetch communities.')
                console.error(error)
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
                    c.slug === community.slug ? { ...c, amISubscribed: true } : c
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
                    c.slug === community.slug ? { ...c, amISubscribed: false } : c
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
        <>
            <ResponsiveAppBar />
            <Container sx={{ mt: 12, py: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {message}
                </Typography>
                {loading && <Typography>Loading communities...</Typography>}
                {error && <Typography color="error">{error}</Typography>}
                <Grid container spacing={2} columns={1}>
                    {communities.map((community) => (
                        <Grid key={community.slug} size={{ xs: 12, sm: 6, md: 4 }} sx={{ mt: 3 }}>
                            <Card sx={{ display: 'flex', height: 150, borderRadius: 5, boxShadow: 5, position: 'relative' }}>
                                <CardActionArea 
                                    component={Link} 
                                    to={`/communities/${community.slug}`} 
                                    sx={{ 
                                        display: 'flex', 
                                        flexGrow: 1,
                                        borderRadius: 5
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        sx={{ width: 150, height: '100%', objectFit: 'cover' }}
                                        image={community.image || ""}
                                        alt={`${community.name} picture`}
                                    />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                        <CardContent sx={{ flex: '1 0 auto' }}>
                                            <Typography component="div" variant="h5">
                                                {community.name}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                                {truncateDescription(community.description)}
                                            </Typography>
                                            <Typography variant="subtitle2" color="info" component='div'>
                                                {community.subscriber_count} subscriber
                                            </Typography>
                                        </CardContent>
                                    </Box>
                                </CardActionArea>
                                {
                                    (isAuthenticated &&
                                    <Button
                                        variant={community.amISubscribed ? "outlined" : "contained"}
                                        color={community.amISubscribed ? "secondary" : "primary"}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            community.amISubscribed 
                                                ? handleUnsubscribe(community)
                                                : handleSubscribe(community)
                                        }}
                                        sx={{ 
                                            px: 2, 
                                            width: '15%',
                                            height: '100%',
                                            borderRadius: 5, boxShadow: 5
                                        }}
                                    >
                                        {community.amISubscribed ? "Unsubscribe" : "Subscribe"}
                                    </Button>
                                    )
                                }
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </>
    )
}

export default Communities
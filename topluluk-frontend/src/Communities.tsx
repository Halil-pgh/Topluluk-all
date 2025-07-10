import { useEffect, useState } from "react";
import ResponsiveAppBar from "./AppBar"
import apiClient from "./api";
import { Box, Card, CardActionArea, CardContent, CardMedia, Container, Grid, Typography } from "@mui/material";
import { Link } from "react-router-dom";

interface Community {
    url: string
    name: string
    image: string | null
    description: string
    slug: string
}

function Communities() {
    const [communities, setCommunities] = useState<Community[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await apiClient.get('community/')
                setCommunities(response.data.results)
            } catch (error) {
                setError('Failed to fetch communities.')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchCommunities()
    }, [])

    return (
        <>
            <ResponsiveAppBar />
            <Container sx={{ mt: 12, py: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Recent Communities
                </Typography>
                {loading && <Typography>Loading communities...</Typography>}
                {error && <Typography color="error">{error}</Typography>}
                <Grid container spacing={2} columns={1}>
                    {communities.map((community) => (
                        <Grid key={community.slug} size={{ xs: 12, sm: 6, md: 4 }} sx={{ mt: 3 }}>
                            <CardActionArea component={Link} to={`/communities/${community.slug}`} sx={{ height: '100%', borderRadius: 5, boxShadow: 5 }}>
                                <Card sx={{ display: 'flex', height: 150, borderRadius: 5, boxShadow: 5 }}>
                                    <CardMedia
                                        component="img"
                                        sx={{ width: 150, objectFit: 'cover' }}
                                        image={community.image || ""}
                                        alt={`${community.name} picture`}
                                    />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                        <CardContent sx={{ flex: '1 0 auto' }}>
                                            <Typography component="div" variant="h5">
                                                {community.name}
                                            </Typography>
                                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                                {community.description}
                                            </Typography>
                                        </CardContent>
                                    </Box>
                                </Card>
                            </CardActionArea>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </>
    )
}

export default Communities
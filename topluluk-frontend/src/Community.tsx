import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import apiClient from "./api"
import { Avatar, Box, Button, Container, Grid, IconButton, Typography } from "@mui/material"

import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from "./useAuth"
import { type TopicResponse } from './responseTypes'
import { topicResponseToTopic, type Topic } from './Topic'
import TopicCard from './TopicCard'

interface Community {
    name: string,
    image: string,
    description: string,
}

function Community() {
    const { slug } = useParams<{ slug: string }>()
    const [topics, setTopics] = useState<Topic[]>([])
    const [community, setCommunity] = useState<Community>()
    const [amIMod, setAmIMod] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [amIBanned, setAmIBanned] = useState<boolean>(false)
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setAmIMod((await apiClient.get(`community/${slug}/am_i_mod/`)).data.am_i_mod)
            } catch (error) {
                console.error(error)
            }

            try {
                setAmIBanned((await apiClient.get(`community/${slug}/am_i_banned/`)).data.am_i_banned)
            } catch (error) {
                console.error(error)
            }

            try {
                const response = await apiClient.get(`community/${slug}/topics/`)
                const topicsResponse = response.data

                const topicPromises = topicsResponse.map(async (topicResponse: TopicResponse) => {
                    return topicResponseToTopic(topicResponse, isAuthenticated)
                })
                const constructedTopics = await Promise.all(topicPromises)
                setTopics(constructedTopics)

                const communityResponse = await apiClient.get(`community/${slug}`)
                setCommunity({
                    name: communityResponse.data.name,
                    image: communityResponse.data.image,
                    description: communityResponse.data.description || '',
                })
            } catch (error) {
                setError('Failed to fetch topics.')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [slug])

    function handleCreateTopic() {
        if (isAuthenticated)
            navigate(`/communities/${slug}/create_topic`)
        else
            navigate('/login')
    }

    function handleTopic(e: any, topicSlug: string) {
        if (!(e.target instanceof HTMLButtonElement)) {
            navigate(`/communities/${slug}/${topicSlug}`)
        }
    }

    function handleEdit() {
        // navigate to edit page
        navigate(`/edit/community/${slug}`)
    }

    function handleVote(topicSlug: string, newVote: number) {
        if (!isAuthenticated || amIBanned)
            return

        const topicIndex = topics.findIndex(t => t.slug === topicSlug)
        if (topicIndex == -1)
            return

        const topic = topics[topicIndex]
        const oldVote = topic.vote

        // handle if the vote is the same as old one
        // that moment we are removing the vote
        const voteAction = newVote === oldVote ? 0 : newVote

        const updatedTopics = [ ...topics ]
        const updatedTopic = { ...updatedTopics[topicIndex] }

        updatedTopic.vote = voteAction
        const voteChange = voteAction - oldVote
        updatedTopic.voteCount += voteChange
        updatedTopics[topicIndex] = updatedTopic
        setTopics(updatedTopics)

        try {
            if (voteAction === 1) {
                apiClient.post(`/topic/${topicSlug}/up_vote/`)
            } else if (voteAction === -1) {
                apiClient.post(`/topic/${topicSlug}/down_vote/`)
            } else {
                apiClient.delete(`/topic/${topicSlug}/remove_vote/`)
            }
        } catch (err) {
            setError('Failed to update votes')
            console.error(err)
        }
    }

    async function handleBan(topicSlug: string, days: number | null) {
        try {
            const topic = topics.find(t => t.slug === topicSlug)
            if (!topic) return

            const expirationDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null
            const user = (await apiClient.get(topic.profile.url)).data.user

            await apiClient.post('/ban/', {
                user: user,
                community: topic.community,
                expires_at: expirationDate
            })
        } catch (error) {
            setError('Failed to ban user')
            console.error(error)
        }
    }

    async function handleRemove(topicSlug: string) {
        try {
            await apiClient.delete(`/topic/${topicSlug}/`)
            setTopics(prev => prev.filter(t => t.slug !== topicSlug))
        } catch (error) {
            setError('Failed to remove topic')
            console.error(error)
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Hero Section */}
            <Box sx={{
                py: 8,
                mt: 8,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none'
                }
            }}>
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
                    {community ? (
                        <Box sx={{ textAlign: 'center', color: 'white' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                                <Avatar
                                    src={community.image}
                                    alt={community.name}
                                    sx={{ 
                                        width: 140, 
                                        height: 140, 
                                        margin: '0 auto',
                                        border: '4px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                                {amIMod && (
                                    <IconButton 
                                        onClick={handleEdit}
                                        aria-label="Edit Community"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: -10,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            width: 40,
                                            height: 40,
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                                transform: 'scale(1.1)'
                                            },
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                            <Typography 
                                variant="h2" 
                                component="h1" 
                                sx={{ 
                                    fontWeight: 700, 
                                    mb: 2,
                                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                    fontSize: { xs: '2rem', md: '3rem' }
                                }}
                            >
                                {community.name}
                            </Typography>
                            {community.description && (
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        opacity: 0.9,
                                        fontWeight: 300,
                                        maxWidth: 700,
                                        mx: 'auto',
                                        mb: 2,
                                        lineHeight: 1.5,
                                        px: 2
                                    }}
                                >
                                    {community.description}
                                </Typography>
                            )}
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    opacity: 0.7,
                                    fontWeight: 300,
                                    maxWidth: 600,
                                    mx: 'auto',
                                    fontSize: '1rem'
                                }}
                            >
                                Welcome to our community hub
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ 
                                width: 140, 
                                height: 140, 
                                borderRadius: '50%', 
                                bgcolor: 'rgba(255,255,255,0.1)',
                                margin: '0 auto 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Typography variant="h4" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Loading...
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {!loading && (
                    <Box sx={{ mb: 4 }}>
                        {topics.length === 0 ? (
                            <Box sx={{ 
                                textAlign: 'center', 
                                py: 8,
                                background: (theme) => theme.palette.mode === 'dark' 
                                    ? 'linear-gradient(135deg, #2a2a3e 0%, #1e1e32 100%)'
                                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography 
                                    variant="h4" 
                                    component="h2" 
                                    gutterBottom
                                    sx={{ 
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        mb: 2
                                    }}
                                >
                                    No topics yet! 🌟
                                </Typography>
                                <Typography 
                                    variant="h6" 
                                    component="p" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        mb: 4,
                                        maxWidth: 500,
                                        mx: 'auto'
                                    }}
                                >
                                    Be the first to start a conversation and bring this community to life
                                </Typography>
                                {!amIBanned && (
                                    <Button 
                                        variant="contained" 
                                        size="large"
                                        onClick={handleCreateTopic}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        Create First Topic
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mb: 3,
                                flexWrap: 'wrap',
                                gap: 2
                            }}>
                                <Typography 
                                    variant="h4" 
                                    component="h2"
                                    sx={{ 
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        position: 'relative',
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: -8,
                                            left: 0,
                                            width: '60px',
                                            height: '4px',
                                            backgroundColor: 'primary.main',
                                            borderRadius: '2px'
                                        }
                                    }}
                                >
                                    Recent Topics
                                </Typography>
                                {!amIBanned && (
                                    <Button 
                                        variant="contained" 
                                        onClick={handleCreateTopic}
                                        sx={{
                                            borderRadius: 3,
                                            px: 3,
                                            py: 1,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        Create Topic
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

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
                            Loading topics...
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
                    {topics.map((topic) => (
                        <TopicCard
                            key={topic.slug}
                            topic={topic}
                            onTopicClick={handleTopic}
                            onVote={handleVote}
                            onBan={handleBan}
                            onRemove={handleRemove}
                            amIBanned={amIBanned}
                            amIMod={amIMod}
                        />
                    ))}
                </Grid>
            </Container>
        </Box>
    )
}

export default Community
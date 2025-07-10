import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import apiClient from "./api"
import ResponsiveAppBar from "./AppBar"
import { Avatar, Box, Button, Card, CardActionArea, CardActions, CardContent, CardMedia, Container, Grid, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment } from "@mui/icons-material"
import { useAuth } from "./useAuth"
import { type TopicResponse } from './responseTypes'
import { topicResponseToTopic, type Topic } from './Topic'

interface Community {
    name: string,
    image: string,
}

function Community() {
    const { slug } = useParams<{ slug: string }>()
    const [topics, setTopics] = useState<Topic[]>([])
    const [community, setCommunity] = useState<Community>()
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get(`/community/${slug}/topics/`)
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

    function handleVote(topicSlug: string, newVote: number) {
        if (!isAuthenticated)
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

    return (
        <Box>
            <ResponsiveAppBar />
            <Container sx={{ mt: 12, py: 2 }}>
                {
                    (community &&
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Avatar
                            src={community.image}
                            alt={community.name}
                            sx={{ width: 120, height: 120, margin: '0 auto 16px' }}
                        />
                        <Typography variant="h3" component="h1">
                            {community.name}
                        </Typography>
                    </Box>
                    )
                }
                {
                    !loading && (
                        topics.length == 0 ? (
                            <>
                                <Typography variant="h4" component='h1' gutterBottom>
                                    No topic here ;(
                                </Typography>
                                <Typography variant="h5" component='h1' gutterBottom>
                                    Ask a question to create a topic
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h4" component="h1" gutterBottom>
                                Recent Topics
                            </Typography>
                        )
                    )
                }
                {loading && <Typography>Loading topics...</Typography>}
                {error && <Typography color="error">{error}</Typography>}
                <Grid container spacing={4} columns={1}>
                    {topics.map((topic) => (
                        <Grid key={topic.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3, height: '100%' }}>
                                <CardActionArea onClick={(e) => { handleTopic(e, topic.slug) }} sx={{ borderRadius: 2, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                                        <Avatar src={topic.profile.image} alt={topic.profile.username} />
                                        <Typography variant="subtitle2" sx={{ ml: 1.5 }}>
                                            {topic.profile.username}
                                        </Typography>
                                        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                                            {topic.createdDate.slice(0, 10)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ px: 2, pb: 1 }}>
                                        <Typography variant="h6" component="h2">
                                            {topic.title}
                                        </Typography>
                                    </Box>

                                    {topic.image ? (
                                        <CardMedia
                                            component="img"
                                            image={topic.image}
                                            alt={`${topic.title} picture`}
                                            sx={{ flexGrow: 1, objectFit: 'contain', height: 400 }}
                                        />
                                    ) : (
                                        <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{
                                                display: '-webkit-box',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {topic.text}
                                            </Typography>
                                        </CardContent>
                                    )} 
                                </CardActionArea>
                                <CardActions sx={{ mt: 'auto', pt: 0 }}>
                                    <ToggleButtonGroup
                                        value={topic.vote}
                                        exclusive
                                        onChange={(e, newVote) => {
                                            handleVote(topic.slug, newVote);
                                        }}
                                        aria-label="text aligment"
                                    >
                                        <ToggleButton value={1} aria-label="upvote">
                                            <ArrowUpward />
                                        </ToggleButton>
                                        <ToggleButton value={-1} aria-label="downvote">
                                            <ArrowDownward />
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                    <Typography variant="body1" sx={{ px: 1 }}>{topic.voteCount}</Typography>
                                    <IconButton onClick={(e) => handleTopic(e, topic.slug)} aria-label="comment">
                                        <Comment />
                                    </IconButton>
                                    <Typography variant="body2"  sx={{ mr: 'auto' }}>{topic.comments.length}</Typography>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                {!loading &&
                    <Button type="button" variant="contained" onClick={handleCreateTopic} sx={{
                        mt:3
                    }}>
                        Ask a question
                    </Button>                
                }
            </Container>
        </Box>
    )
}

export default Community
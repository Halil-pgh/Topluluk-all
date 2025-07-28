import { useEffect, useState } from "react"
import { type TopicResponse } from './responseTypes'
import { useNavigate } from "react-router-dom"
import apiClient from "./api"
import { Box, Container, Grid, Typography } from "@mui/material"
import { topicResponseToTopic, type Topic } from './Topic'
import { useAuth } from "./useAuth"
import TopicCard from './TopicCard'

function urlToSlug(url: string): string {
    const raw = url.split('/')
    return raw[raw.length - 2]
}

interface BannableTopic extends Topic {
    amIBanned: boolean
}

function HotTopics() {
    const [topics, setTopics] = useState<BannableTopic[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('stats/hot_topics/')
                const topicsResponse = response.data

                const topicPromises = topicsResponse.map(async (topicResponse: TopicResponse) => {
                    let amIBanned = false
                    try {
                        if (isAuthenticated)
                            amIBanned = (await apiClient.get(`${topicResponse.url}am_i_banned/`)).data.am_i_banned
                    } catch (err) {
                        console.error('Failed to check ban status: ', err)
                    }

                    return ({
                        ...(await topicResponseToTopic(topicResponse, isAuthenticated)),
                        amIBanned
                    })
                })
                const constructedTopics = await Promise.all(topicPromises)
                setTopics(constructedTopics)
            } catch (error) {
                setError('Failed to fetch hot topics.')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [isAuthenticated])

    function handleTopic(e: any, topicSlug: string, communitySlug: string) {
        if (!(e.target instanceof HTMLButtonElement)) {
            navigate(`/communities/${communitySlug}/${topicSlug}`)
        }
    }

    function handleVote(topicSlug: string, newVote: number, topicBan: boolean) {
        if (!isAuthenticated || topicBan)
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
                            background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        🔥 Hot Topics
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{
                            color: '#b0b0b0',
                            fontWeight: 400
                        }}
                    >
                        Trending discussions across all communities
                    </Typography>
                </Box>

                {loading && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                            Loading hot topics...
                        </Typography>
                    </Box>
                )}
                
                {error && (
                    <Typography 
                        color="error" 
                        sx={{ 
                            textAlign: 'center', 
                            py: 2,
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                            borderRadius: 2,
                            mb: 3
                        }}
                    >
                        {error}
                    </Typography>
                )}
                
                {!loading && topics.length === 0 && (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 8,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                        border: '1px solid #3a3a3a',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                    }}>
                        <Typography 
                            variant="h4" 
                            component='h2' 
                            sx={{
                                color: '#9e9e9e',
                                fontWeight: 500,
                                mb: 1
                            }}
                        >
                            No hot topics right now 🤷‍♂️
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: '#7a7a7a'
                            }}
                        >
                            Check back later for trending discussions!
                        </Typography>
                    </Box>
                )}

                <Grid container spacing={3}>
                    {topics.map((topic) => (
                        <Grid key={topic.slug} size={{ xs: 12 }}>
                            <TopicCard
                                topic={topic}
                                onTopicClick={(e, topicSlug) => handleTopic(e, topicSlug, urlToSlug(topic.community))}
                                onVote={(topicSlug, newVote) => handleVote(topicSlug, newVote, topic.amIBanned)}
                                amIBanned={topic.amIBanned}
                                showCommunityBadge={true}
                                communitySlug={urlToSlug(topic.community)}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    )
}

export default HotTopics
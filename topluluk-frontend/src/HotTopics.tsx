import { useEffect, useState } from "react"
import { formatDate, type TopicResponse } from './responseTypes'
import { useNavigate } from "react-router-dom"
import apiClient from "./api"
import { Avatar, Box, Card, CardActionArea, CardActions, CardContent, CardMedia, Container, Grid, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment } from "@mui/icons-material"
import { calcualteCommentCount, topicResponseToTopic, type Topic } from './Topic'
import { useAuth } from "./useAuth"

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
                            <Card sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                borderRadius: 4,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease-in-out',
                                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                                border: '1px solid #3a3a3a',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                    borderColor: '#4a4a4a',
                                    background: 'linear-gradient(135deg, #202020 0%, #353535 50%, #252525 100%)'
                                },
                                position: 'relative'
                            }}>
                                <CardActionArea 
                                    onClick={(e) => { handleTopic(e, topic.slug, urlToSlug(topic.community)) }} 
                                    sx={{ 
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'stretch'
                                    }}
                                >
                                    {/* Header with User Info */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        p: 3,
                                        pb: 2,
                                        background: 'rgba(0,0,0,0.3)',
                                        borderBottom: '1px solid #3a3a3a'
                                    }}>
                                        <Avatar 
                                            src={topic.profile.image} 
                                            alt={topic.profile.username}
                                            sx={{ 
                                                width: 48,
                                                height: 48,
                                                border: '2px solid #4a4a4a'
                                            }}
                                        />
                                        <Box sx={{ ml: 2, flex: 1 }}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: '#e0e0e0'
                                                }}
                                            >
                                                {topic.profile.username}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: '#9e9e9e',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                {formatDate(topic.createdDate)}
                                            </Typography>
                                        </Box>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                color: '#ff6b35',
                                                fontWeight: 'bold',
                                                background: 'rgba(255, 107, 53, 0.1)',
                                                px: 2,
                                                py: 0.5,
                                                borderRadius: 2,
                                                border: '1px solid rgba(255, 107, 53, 0.3)'
                                            }}
                                        >
                                            /{urlToSlug(topic.community)}
                                        </Typography>
                                    </Box>

                                    {/* Title */}
                                    <Box sx={{ px: 3, pb: 2, pt: 2 }}>
                                        <Typography 
                                            variant="h5" 
                                            component="h3"
                                            sx={{ 
                                                fontWeight: 700,
                                                color: '#f5f5f5',
                                                lineHeight: 1.3,
                                                mb: 1,
                                                px: 0
                                            }}
                                        >
                                            {topic.title}
                                        </Typography>
                                    </Box>

                                    {/* Content */}
                                    {topic.image ? (
                                        <CardMedia
                                            component="img"
                                            image={topic.image}
                                            alt={`${topic.title} picture`}
                                            sx={{ 
                                                height: 300,
                                                objectFit: 'contain',
                                                borderRadius: '12px',
                                                mx: 3,
                                                mb: 2
                                            }}
                                        />
                                    ) : (
                                        <CardContent sx={{ 
                                            pt: 0,
                                            pb: 2,
                                            px: 3,
                                            '&:last-child': { pb: 2 }
                                        }}>
                                            <Typography 
                                                variant="body1" 
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    lineHeight: 1.6,
                                                    color: '#b0b0b0'
                                                }}
                                            >
                                                {topic.text}
                                            </Typography>
                                        </CardContent>
                                    )} 
                                </CardActionArea>

                                {/* Actions Bar */}
                                <CardActions sx={{ 
                                    p: 3,
                                    pt: 2,
                                    background: 'rgba(0,0,0,0.4)',
                                    borderTop: '1px solid #3a3a3a',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ToggleButtonGroup
                                            value={topic.vote}
                                            exclusive
                                            onChange={(_, newVote) => handleVote(topic.slug, newVote, topic.amIBanned)}
                                            disabled={topic.amIBanned}
                                            size="small"
                                            sx={{
                                                '& .MuiToggleButton-root': {
                                                    border: '1px solid #3a3a3a',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    py: 1,
                                                    mx: 0.5,
                                                    backgroundColor: '#2a2a2a',
                                                    color: '#e0e0e0',
                                                    '&:hover': {
                                                        bgcolor: '#404040',
                                                        borderColor: '#4a4a4a'
                                                    },
                                                    '&.Mui-selected': {
                                                        bgcolor: '#4a4a4a',
                                                        color: '#ffffff',
                                                        borderColor: '#5a5a5a',
                                                        '&:hover': {
                                                            bgcolor: '#505050'
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            <ToggleButton value={1} aria-label="upvote">
                                                <ArrowUpward fontSize="small" />
                                            </ToggleButton>
                                            <ToggleButton value={-1} aria-label="downvote">
                                                <ArrowDownward fontSize="small" />
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                        
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontWeight: 600,
                                                minWidth: 32,
                                                textAlign: 'center',
                                                color: topic.voteCount > 0 ? '#66bb6a' : 
                                                       topic.voteCount < 0 ? '#ef5350' : '#9e9e9e'
                                            }}
                                        >
                                            {topic.voteCount > 0 ? '+' : ''}{topic.voteCount}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <IconButton 
                                            onClick={(e) => handleTopic(e, topic.slug, urlToSlug(topic.community))} 
                                            aria-label="comment"
                                            size="small"
                                            sx={{
                                                color: '#9e9e9e',
                                                '&:hover': {
                                                    color: '#e0e0e0',
                                                    bgcolor: 'rgba(255,255,255,0.1)'
                                                }
                                            }}
                                        >
                                            <Comment fontSize="small" />
                                        </IconButton>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: '#9e9e9e',
                                                fontWeight: 500
                                            }}
                                        >
                                            {calcualteCommentCount(topic.comments)}
                                        </Typography>
                                    </Box>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    )
}

export default HotTopics
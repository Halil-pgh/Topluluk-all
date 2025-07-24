import { useEffect, useState } from "react"
import { formatDate, type CommentResponse, type TopicResponse } from "./responseTypes"
import { useParams, useNavigate } from "react-router-dom"
import apiClient from "./api"
import { useAuth } from "./useAuth"
import { Avatar, Box, Button, Card, CardActions, CardContent, CardMedia, Container, Divider, IconButton, ToggleButton, ToggleButtonGroup, Typography, Menu, MenuItem } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment, Delete, Block } from "@mui/icons-material"
import CommentComponent from './Comment'
import CreateCommentForm from "./CreateCommentForm"

export interface Profile {
    url: string,
    username: string,
    image: string,
}

export interface Topic {
    url: string,
    community: string, // community url
    title: string,
    text: string,
    image: string,
    createdDate: any,
    profile: Profile,
    voteCount: number,
    viewCount: number,
    slug: string,
    comments: CommentResponse[],
    vote: number, // users vote that is to handle frontend rendering
}

export const topicResponseToTopic = async (topicResponse: TopicResponse, isAuthenticated: boolean) => {
    const userResponse = await apiClient.get(topicResponse.user)
    const profileResponse = await apiClient.get(`${topicResponse.user}profile/`)
    const voteResponse = isAuthenticated ? await apiClient.get(`${topicResponse.url}my_vote/`) : { data: { value: 0 }}
    const topic: Topic = {
        url: topicResponse.url,
        community: topicResponse.community,
        title: topicResponse.title,
        text: topicResponse.text,
        image: topicResponse.image,
        createdDate: topicResponse.created_date,
        profile: {
            url: profileResponse.data.profile.url,
            username: userResponse.data.username,
            image: profileResponse.data.profile.image,
        },
        voteCount: topicResponse.vote_count,
        viewCount: topicResponse.view_count,
        slug: topicResponse.slug,
        comments: topicResponse.comments,
        vote: voteResponse.data.value,
    }
    return topic
}

export function calcualteCommentCount(comments: CommentResponse[]): number {
    if (comments.length === 0)
        return 0

    let total = 0
    comments.map((comment: CommentResponse) => {
        total += calcualteCommentCount(comment.replies) + 1
    })
    return total
}

function Topic() {
    const { isAuthenticated } = useAuth()
    const { communitySlug, topicSlug } = useParams()
    const navigate = useNavigate()
    const [topic, setTopic] = useState<Topic>()
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [amIBanned, setAmIBanned] = useState<boolean>(false)
    const [amIMod, setAmIMod] = useState<boolean>(false)
    const [banMenuAnchor, setBanMenuAnchor] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = (await apiClient.get(`topic/${topicSlug}`))
                setTopic(await topicResponseToTopic(response.data, isAuthenticated))

                // Check if user is banned and if user is mod
                if (isAuthenticated && communitySlug) {
                    try {
                        const banResponse = await apiClient.get(`community/${communitySlug}/am_i_banned/`)
                        setAmIBanned(banResponse.data.am_i_banned)
                        
                        const modResponse = await apiClient.get(`community/${communitySlug}/am_i_mod/`)
                        setAmIMod(modResponse.data.am_i_mod)
                    } catch (error) {
                        console.error('Failed to check ban/mod status:', error)
                    }
                }
            } catch (err) {
                setError('Failed to fetch topic.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [topicSlug, communitySlug, isAuthenticated])

    const handleTopicVote = (newVote: number) => {
        if (!isAuthenticated || !topic || amIBanned) return

        const oldVote = topic.vote
        const voteAction = newVote === oldVote ? 0 : newVote

        const updatedTopic = { ...topic }
        updatedTopic.vote = voteAction
        const voteChange = voteAction - oldVote
        updatedTopic.voteCount += voteChange
        setTopic(updatedTopic)

        try {
            if (voteAction === 1) {
                apiClient.post(`/topic/${topicSlug}/up_vote/`)
            } else if (voteAction === -1) {
                apiClient.post(`/topic/${topicSlug}/down_vote/`)
            } else {
                apiClient.delete(`/topic/${topicSlug}/remove_vote/`)
            }
        } catch (err) {
            setError('Failed to update vote')
            console.error(err)
        }
    }

    const handleCreateComment = () => {
        if (amIBanned) return
        setShowReplyForm(true)
    }

    const handleReplyCreated = () => {
        setShowReplyForm(false)

        // TODO: NOT do this
        // instead, should look for what is being changed
        window.location.reload()
    }

    const handleCommentVote = async (commentUrl: string, newVote: number) => {
        if (!isAuthenticated || !topic || amIBanned) return

        function findRecursivly(comments: CommentResponse[], func: Function): CommentResponse | null {
            if (comments.length === 0)
                return null

            for (let i = 0; i < comments.length; i++) {
                if (func(comments[i]))
                    return comments[i]
                const found: CommentResponse | null = findRecursivly(comments[i].replies, func)
                if (found !== null) {
                    return found
                }
            }
            return null
        }

        const comment = findRecursivly(topic.comments, (c: CommentResponse) => c.url === commentUrl)
        if (comment === null) {
            setError('Unexpected bug happend')
            console.error('Unexpected bug happend')
            return
        }

        const oldVote = comment.vote ? comment.vote : 0
        const voteAction = newVote === oldVote ? 0 : newVote

        const updatedTopic = { ...topic }

        let updatedComment = findRecursivly(updatedTopic.comments, (c: CommentResponse) => c.url === commentUrl)
        if (updatedComment === null) {
            setError('Unexpected bug happend')
            console.error('Unexpected bug happend')
            return
        }

        updatedComment.vote = voteAction
        const voteChange = voteAction - oldVote
        updatedComment.vote_count += voteChange
        setTopic(updatedTopic)

        try {
            if (voteAction === 1) {
                apiClient.post(`comment/${comment.id}/up_vote/`)
            } else if (voteAction === -1) {
                apiClient.post(`comment/${comment.id}/down_vote/`)
            } else {
                apiClient.delete(`comment/${comment.id}/remove_vote/`)
            }
        } catch (err) {
            setError('Failed to update vote')
            console.error(err)
        }
    }

    const banOptions = [
        { label: 'Permanent Ban', days: null },
        { label: '1 Year Ban', days: 365 },
        { label: '1 Month Ban', days: 30 },
        { label: '1 Day Ban', days: 1 }
    ]

    function handleBanMenuOpen(event: React.MouseEvent<HTMLElement>) {
        setBanMenuAnchor(event.currentTarget)
    }

    function handleBanMenuClose() {
        setBanMenuAnchor(null)
    }

    async function handleBan(days: number | null) {
        if (!topic) return

        try {
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
        } finally {
            handleBanMenuClose()
        }
    }

    async function handleRemove() {
        if (!topic || !topicSlug) return

        try {
            await apiClient.delete(`/topic/${topicSlug}/`)
            // Navigate back to community page after successful deletion
            navigate(`/communities/${communitySlug}`)
        } catch (error) {
            setError('Failed to remove topic')
            console.error(error)
        }
    }

    if (loading) {
        return (
            <>
                <Container sx={{ mt: 12, py: 2 }}>
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
                            Loading topic...
                        </Typography>
                    </Box>
                </Container>
            </>
        )
    }

    if (error || !topic) {
        return (
            <>
                <Container sx={{ mt: 12, py: 2 }}>
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 8,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #2a1a1a 0%, #3d2d2d 50%, #2f1f1f 100%)',
                        border: '1px solid #4a3a3a',
                        boxShadow: '0 4px 20px rgba(139, 69, 19, 0.3)'
                    }}>
                        <Typography 
                            variant="h6"
                            sx={{ 
                                color: '#ff6b6b',
                                fontWeight: 600,
                                mb: 1
                            }}
                        >
                            {error || 'Topic not found'}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#9e9e9e'
                            }}
                        >
                            The topic you're looking for doesn't exist or has been removed.
                        </Typography>
                    </Box>
                </Container>
            </>
        )
    }

    return (
        <>
            <Container sx={{ mt: 12, py: 2 }}>
                <Card sx={{ 
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)',
                    border: '1px solid #3a3a3a',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    mb: 4
                }}>
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
                                width: 56,
                                height: 56,
                                border: '2px solid #4a4a4a'
                            }}
                        />
                        <Box sx={{ ml: 2, flex: 1 }}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 600,
                                    color: '#e0e0e0'
                                }}
                            >
                                {topic.profile.username}
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: '#9e9e9e',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {formatDate(topic.createdDate)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Title */}
                    <Box sx={{ px: 3, py: 3 }}>
                        <Typography 
                            variant="h3" 
                            component="h1" 
                            sx={{ 
                                fontWeight: 700,
                                color: '#f5f5f5',
                                lineHeight: 1.2,
                                mb: 0
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
                                objectFit: 'contain', 
                                maxHeight: 600,
                                borderRadius: '12px',
                                mx: 3,
                                mb: 3
                            }}
                        />
                    ) : (
                        <CardContent sx={{ 
                            pt: 0,
                            pb: 3,
                            px: 3,
                            '&:last-child': { pb: 3 }
                        }}>
                            <Typography 
                                variant="body1" 
                                sx={{
                                    lineHeight: 1.7,
                                    color: '#d0d0d0',
                                    fontSize: '1.1rem'
                                }}
                            >
                                {topic.text}
                            </Typography>
                        </CardContent>
                    )}

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
                                onChange={(_, newVote) => {
                                    if (!amIBanned) {
                                        handleTopicVote(newVote);
                                    }
                                }}
                                disabled={amIBanned}
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

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton 
                                    aria-label="comment"
                                    disabled={amIBanned}
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
                            
                            {amIMod && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton 
                                        onClick={handleBanMenuOpen} 
                                        aria-label="ban user"
                                        size="small"
                                        sx={{
                                            color: '#ff9800',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 152, 0, 0.1)',
                                                color: '#ffb74d'
                                            }
                                        }}
                                    >
                                        <Block fontSize="small" />
                                    </IconButton>
                                    <Menu
                                        anchorEl={banMenuAnchor}
                                        open={Boolean(banMenuAnchor)}
                                        onClose={handleBanMenuClose}
                                        PaperProps={{
                                            sx: {
                                                borderRadius: 2,
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                                backgroundColor: '#2a2a2a',
                                                border: '1px solid #3a3a3a'
                                            }
                                        }}
                                    >
                                        {banOptions.map((option, index) => (
                                            <MenuItem 
                                                key={index} 
                                                onClick={() => handleBan(option.days)}
                                                sx={{
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255, 152, 0, 0.1)'
                                                    }
                                                }}
                                            >
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                    <IconButton 
                                        onClick={handleRemove} 
                                        aria-label="remove topic"
                                        size="small"
                                        sx={{
                                            color: '#f44336',
                                            '&:hover': {
                                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                                                color: '#ef5350'
                                            }
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    </CardActions>
                </Card>

                <Divider sx={{ 
                    mb: 4, 
                    borderColor: '#3a3a3a',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.05)'
                }} />
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 4,
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
                    border: '1px solid #3a3a3a'
                }}>
                    <Typography 
                        variant="h4" 
                        component="h2"
                        sx={{
                            fontWeight: 600,
                            color: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        💬 Comments ({calcualteCommentCount(topic.comments)})
                    </Typography>
                    {isAuthenticated && !amIBanned && (
                        <Button 
                            variant="contained" 
                            onClick={handleCreateComment}
                            sx={{ 
                                borderRadius: 3,
                                px: 3,
                                py: 1.5,
                                fontWeight: 600,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #4a4a4a 0%, #5a5a5a 100%)',
                                border: '1px solid #6a6a6a',
                                color: '#ffffff',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a5a5a 0%, #6a6a6a 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }
                            }}
                        >
                            Add Comment
                        </Button>
                    )}
                </Box>

                {showReplyForm && (
                    <Box sx={{ mb: 3 }}>
                        <CreateCommentForm
                            topicUrl={topic.url}
                            onCommentCreated={handleReplyCreated}
                            onCancel={() => setShowReplyForm(false)}
                        />
                    </Box>
                )}

                {topic.comments.length === 0 ? (
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
                                fontWeight: 500,
                                mb: 1
                            }}
                        >
                            No comments yet
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#7a7a7a'
                            }}
                        >
                            Be the first to share your thoughts!
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {topic.comments.map((comment, index) => (
                            <CommentComponent
                                topicUrl={topic.url}
                                key={index}
                                commentResponse={comment}
                                onVote={handleCommentVote}
                                amIBanned={amIBanned}
                                amIMod={amIMod}
                            />
                        ))}
                    </Box>
                )}
            </Container>
        </>
    )
}

export default Topic
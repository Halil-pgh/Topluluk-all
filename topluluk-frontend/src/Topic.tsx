import { useEffect, useState } from "react"
import { formatDate, type CommentResponse, type TopicResponse } from "./responseTypes"
import { useParams, useNavigate } from "react-router-dom"
import apiClient from "./api"
import { useAuth } from "./useAuth"
import { Avatar, Box, Button, Card, CardActions, CardContent, CardMedia, Container, Divider, IconButton, ToggleButton, ToggleButtonGroup, Typography, Menu, MenuItem } from "@mui/material"
import ResponsiveAppBar from "./AppBar"
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
                <ResponsiveAppBar />
                <Container sx={{ mt: 12, py: 2 }}>
                    <Typography>Loading topic...</Typography>
                </Container>
            </>
        )
    }

    if (error || !topic) {
        return (
            <>
                <ResponsiveAppBar />
                <Container sx={{ mt: 12, py: 2 }}>
                    <Typography color="error">{error || 'Topic not found'}</Typography>
                </Container>
            </>
        )
    }

    return (
        <>
            <ResponsiveAppBar />
            <Container sx={{ mt: 12, py: 2 }}>
                <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                        <Avatar src={topic.profile.image} alt={topic.profile.username} />
                        <Typography variant="subtitle2" sx={{ ml: 1.5 }}>
                            {topic.profile.username}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                            {formatDate(topic.createdDate)}
                        </Typography>
                    </Box>

                    <Box sx={{ px: 2, pb: 1 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {topic.title}
                        </Typography>
                    </Box>

                    {topic.image && (
                        <CardMedia
                            component="img"
                            image={topic.image}
                            alt={`${topic.title} picture`}
                            sx={{ objectFit: 'contain', maxHeight: 600 }}
                        />
                    )}
                    <CardContent>
                        <Typography variant="body1">
                            {topic.text}
                        </Typography>
                    </CardContent>

                    <CardActions>
                        <ToggleButtonGroup
                            value={topic.vote}
                            exclusive
                            onChange={(e, newVote) => {
                                if (!amIBanned) {
                                    handleTopicVote(newVote);
                                }
                            }}
                            disabled={amIBanned}
                            aria-label="topic voting"
                        >
                            <ToggleButton value={1} aria-label="upvote">
                                <ArrowUpward />
                            </ToggleButton>
                            <ToggleButton value={-1} aria-label="downvote">
                                <ArrowDownward />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <Typography variant="body1" sx={{ px: 1 }}>{topic.voteCount}</Typography>
                        <IconButton 
                            aria-label="comment"
                            disabled={amIBanned}
                        >
                            <Comment />
                        </IconButton>
                        <Typography variant="body2" sx={{ mr: 'auto' }}>{calcualteCommentCount(topic.comments)}</Typography>

                        {amIMod && (
                            <>
                                <IconButton 
                                    onClick={handleBanMenuOpen} 
                                    aria-label="ban user"
                                    color="warning"
                                >
                                    <Block />
                                </IconButton>
                                <Menu
                                    anchorEl={banMenuAnchor}
                                    open={Boolean(banMenuAnchor)}
                                    onClose={handleBanMenuClose}
                                >
                                    {banOptions.map((option, index) => (
                                        <MenuItem 
                                            key={index} 
                                            onClick={() => handleBan(option.days)}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Menu>
                                <IconButton 
                                    onClick={handleRemove} 
                                    aria-label="remove topic"
                                    color="error"
                                >
                                    <Delete />
                                </IconButton>
                            </>
                        )}
                    </CardActions>
                </Card>

                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                        Comments ({calcualteCommentCount(topic.comments)})
                    </Typography>
                    {isAuthenticated && !amIBanned && (
                        <Button 
                            variant="contained" 
                            onClick={handleCreateComment}
                            sx={{ ml: 2 }}
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
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No comments yet. Be the first to comment!
                    </Typography>
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
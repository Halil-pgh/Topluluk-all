import { useEffect, useState } from "react"
import { formatDate, type CommentResponse } from "./responseTypes"
import apiClient from "./api"
import { Avatar, Box, Button, Card, CardActions, CardContent, IconButton, ToggleButton, ToggleButtonGroup, Typography, Menu, MenuItem } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment, ExpandLess, ExpandMore, Delete, Block } from "@mui/icons-material"
import { calcualteCommentCount } from "./Topic"
import CreateCommentForm from "./CreateCommentForm"
import { useAuth } from "./useAuth"
import { useParams } from "react-router-dom"

interface CommentProps {
    topicUrl: string
    commentResponse: CommentResponse
    depth?: number
    onVote: (commentUrl: string, newVote: number) => void
    amIBanned: boolean
    amIMod?: boolean
    onCommentDeleted?: (commentId: number) => void
}

function CommentComponent({ topicUrl, commentResponse, depth = 0, onVote, amIBanned, amIMod = false, onCommentDeleted }: CommentProps) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [userProfile, setUserProfile] = useState<{ username: string, image: string, url: string } | null>(null)
    const [comment, setComment] = useState<CommentResponse>(commentResponse)
    const [banMenuAnchor, setBanMenuAnchor] = useState<HTMLElement | null>(null)
    const [error, setError] = useState<string>('')
    const { isAuthenticated } = useAuth()
    const { communitySlug } = useParams()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await apiClient.get(comment.user)
                const profileResponse = await apiClient.get(`${comment.user}profile/`)
                setUserProfile({
                    username: userResponse.data.username,
                    image: profileResponse.data.profile.image,
                    url: profileResponse.data.profile.url
                })
                if (isAuthenticated) {
                    const commentVote = await apiClient.get(`${comment.url}my_vote/`)
                    let updatedComment = { ...comment }
                    updatedComment.vote = commentVote.data.value
                    setComment(updatedComment)
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error)
            }
        }
        fetchData()
    }, [])

    const handleToggleExpand = () => {
        setExpanded(!expanded)
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
        if (!userProfile) return

        try {
            const expirationDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null
            const user = (await apiClient.get(userProfile.url)).data.user

            // Get community URL from topic
            const topicResponse = await apiClient.get(topicUrl)
            const communityUrl = topicResponse.data.community

            await apiClient.post('/ban/', {
                user: user,
                community: communityUrl,
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
        try {
            await apiClient.delete(`comment/${comment.id}/`)
            if (onCommentDeleted) {
                onCommentDeleted(comment.id)
            }
            // For now, reload the page - TODO: implement proper state management
            window.location.reload()
        } catch (error) {
            setError('Failed to remove comment')
            console.error(error)
        }
    }

    return (
        <>
        <Box sx={{ ml: depth * 5, mb: 2 }}>
            <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                            src={userProfile?.image} 
                            alt={userProfile?.username}
                            sx={{ width: 32, height: 32 }}
                        />
                        <Typography variant="subtitle2" sx={{ ml: 1.5 }}>
                            {userProfile?.username}
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                            {formatDate(comment.created_date)}
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {comment.text}
                    </Typography>
                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                            {error}
                        </Typography>
                    )}
                </CardContent>
                <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ToggleButtonGroup
                            value={comment.vote}
                            exclusive
                            size="small"
                            onChange={(e, newVote) => {
                                if (!amIBanned) {
                                    onVote(comment.url, newVote);
                                }
                            }}
                            disabled={amIBanned}
                            aria-label="comment voting"
                        >
                            <ToggleButton value={1} aria-label="upvote">
                                <ArrowUpward fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value={-1} aria-label="downvote">
                                <ArrowDownward fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <Typography variant="body2" sx={{ px: 1 }}>{comment.vote_count}</Typography>
                        <IconButton 
                            aria-label="comment"
                            disabled={amIBanned}
                        >
                            <Comment />
                        </IconButton>
                        <Typography variant="body2" sx={{ mr: 'auto' }}>{calcualteCommentCount(comment.replies)}</Typography>

                        {isAuthenticated && !amIBanned && (
                            <Button onClick={handleCreateComment} sx={{ ml: 2 }}>Reply</Button>
                        )}

                        {amIMod && (
                            <>
                                <IconButton 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBanMenuOpen(e);
                                    }} 
                                    aria-label="ban user"
                                    color="warning"
                                    size="small"
                                    sx={{ ml: 4 }}
                                >
                                    <Block fontSize="small" />
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }} 
                                    aria-label="remove comment"
                                    color="error"
                                    size="small"
                                    sx={{ ml: 4 }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </Box>
                    {comment.replies.length > 0 && (
                        <Button
                            size="small"
                            onClick={handleToggleExpand}
                            startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                        >
                            {expanded ? 'Hide' : 'Show'} {comment.replies.length} replies
                        </Button>
                    )}
                </CardActions>
            </Card>

            {showReplyForm && (
                <Box sx={{ mt: 3 }}>
                    <CreateCommentForm
                        topicUrl={topicUrl}
                        parentCommentUrl={comment.url}
                        onCommentCreated={handleReplyCreated}
                        onCancel={() => setShowReplyForm(false)}
                    />
                </Box>
            )}
            
        </Box>

        {expanded && comment.replies.map((reply) => (
            <CommentComponent
                key={reply.id}
                topicUrl={topicUrl}
                commentResponse={reply}
                depth={depth + 1}
                onVote={onVote}
                amIBanned={amIBanned}
                amIMod={amIMod}
                onCommentDeleted={onCommentDeleted}
            />
        ))}
        </>
    )
}

export default CommentComponent
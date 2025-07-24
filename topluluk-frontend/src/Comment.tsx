import { useEffect, useState } from "react"
import { formatDate, type CommentResponse } from "./responseTypes"
import apiClient from "./api"
import { Avatar, Box, Button, Card, CardActions, CardContent, IconButton, ToggleButton, ToggleButtonGroup, Typography, Menu, MenuItem } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment, ExpandLess, ExpandMore, Delete, Block } from "@mui/icons-material"
import { calcualteCommentCount } from "./Topic"
import CreateCommentForm from "./CreateCommentForm"
import { useAuth } from "./useAuth"

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
        <Box sx={{ ml: depth * 3, mb: 3 }}>
            <Card sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                background: depth === 0 
                    ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1f1f1f 100%)'
                    : 'linear-gradient(135deg, #151515 0%, #252525 50%, #1a1a1a 100%)',
                border: `1px solid ${depth === 0 ? '#3a3a3a' : '#2a2a2a'}`,
                boxShadow: depth === 0 
                    ? '0 4px 20px rgba(0,0,0,0.4)'
                    : '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    borderColor: depth === 0 ? '#4a4a4a' : '#3a3a3a',
                    boxShadow: depth === 0 
                        ? '0 6px 25px rgba(0,0,0,0.5)'
                        : '0 3px 15px rgba(0,0,0,0.4)'
                }
            }}>
                <CardContent sx={{ pb: 1 }}>
                    {/* Header with User Info */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        pb: 1.5,
                        borderBottom: `1px solid ${depth === 0 ? '#3a3a3a' : '#2a2a2a'}`
                    }}>
                        <Avatar 
                            src={userProfile?.image} 
                            alt={userProfile?.username}
                            sx={{ 
                                width: depth === 0 ? 40 : 36, 
                                height: depth === 0 ? 40 : 36,
                                border: '2px solid #4a4a4a'
                            }}
                        />
                        <Box sx={{ ml: 1.5, flex: 1 }}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    fontWeight: 600,
                                    color: '#e0e0e0',
                                    fontSize: depth === 0 ? '0.95rem' : '0.9rem'
                                }}
                            >
                                {userProfile?.username}
                            </Typography>
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: '#9e9e9e',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {formatDate(comment.created_date)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Comment Text */}
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            mb: 2,
                            lineHeight: 1.6,
                            color: '#d0d0d0',
                            fontSize: depth === 0 ? '0.95rem' : '0.9rem'
                        }}
                    >
                        {comment.text}
                    </Typography>

                    {error && (
                        <Typography 
                            color="error" 
                            variant="body2" 
                            sx={{ 
                                mt: 1,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                                border: '1px solid rgba(244, 67, 54, 0.3)'
                            }}
                        >
                            {error}
                        </Typography>
                    )}
                </CardContent>

                {/* Actions Bar */}
                <CardActions sx={{ 
                    pt: 2, 
                    px: 2,
                    pb: 2,
                    justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.2)',
                    borderTop: `1px solid ${depth === 0 ? '#3a3a3a' : '#2a2a2a'}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ToggleButtonGroup
                            value={comment.vote}
                            exclusive
                            size="small"
                            onChange={(_, newVote) => {
                                if (!amIBanned) {
                                    onVote(comment.url, newVote);
                                }
                            }}
                            disabled={amIBanned}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    border: '1px solid #3a3a3a',
                                    borderRadius: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    mx: 0.25,
                                    backgroundColor: '#2a2a2a',
                                    color: '#e0e0e0',
                                    minWidth: 32,
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
                                minWidth: 24,
                                textAlign: 'center',
                                color: comment.vote_count > 0 ? '#66bb6a' : 
                                       comment.vote_count < 0 ? '#ef5350' : '#9e9e9e',
                                fontSize: '0.875rem'
                            }}
                        >
                            {comment.vote_count > 0 ? '+' : ''}{comment.vote_count}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
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
                                    fontWeight: 500,
                                    fontSize: '0.8rem'
                                }}
                            >
                                {calcualteCommentCount(comment.replies)}
                            </Typography>
                        </Box>

                        {isAuthenticated && !amIBanned && (
                            <Button 
                                onClick={handleCreateComment} 
                                size="small"
                                sx={{ 
                                    ml: 2,
                                    borderRadius: 2,
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    color: '#e0e0e0',
                                    border: '1px solid #3a3a3a',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        borderColor: '#4a4a4a'
                                    }
                                }}
                            >
                                Reply
                            </Button>
                        )}

                        {amIMod && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                <IconButton 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBanMenuOpen(e);
                                    }} 
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }} 
                                    aria-label="remove comment"
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
                    
                    {comment.replies.length > 0 && (
                        <Button
                            size="small"
                            onClick={handleToggleExpand}
                            startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                            sx={{
                                borderRadius: 2,
                                px: 2,
                                py: 0.5,
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                textTransform: 'none',
                                color: '#b0b0b0',
                                border: '1px solid #3a3a3a',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    borderColor: '#4a4a4a',
                                    color: '#e0e0e0'
                                }
                            }}
                        >
                            {expanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </Button>
                    )}
                </CardActions>
            </Card>

            {showReplyForm && (
                <Box sx={{ 
                    mt: 3,
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #151515 0%, #252525 50%, #1a1a1a 100%)',
                    border: '1px solid #2a2a2a',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}>
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
import { useEffect, useState } from "react"
import { formatDate, type CommentResponse } from "./responseTypes"
import apiClient from "./api"
import { Avatar, Box, Button, Card, CardActions, CardContent, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment, ExpandLess, ExpandMore } from "@mui/icons-material"
import { calcualteCommentCount } from "./Topic"
import CreateCommentForm from "./CreateCommentForm"
import { useAuth } from "./useAuth"

interface CommentProps {
    topicUrl: string
    commentResponse: CommentResponse
    depth?: number
    onVote: (commentUrl: string, newVote: number) => void
}

function CommentComponent({ topicUrl, commentResponse, depth = 0, onVote }: CommentProps) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [userProfile, setUserProfile] = useState<{ username: string, image: string } | null>(null)
    const [comment, setComment] = useState<CommentResponse>(commentResponse)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userResponse = await apiClient.get(comment.user)
                const profileResponse = await apiClient.get(`${comment.user}profile/`)
                setUserProfile({
                    username: userResponse.data.username,
                    image: profileResponse.data.profile.image
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
        setShowReplyForm(true)
    }

    const handleReplyCreated = () => {
        setShowReplyForm(false)

        // TODO: NOT do this
        // instead, should look for what is being changed
        window.location.reload()
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
                </CardContent>
                <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ToggleButtonGroup
                            value={comment.vote}
                            exclusive
                            size="small"
                            onChange={(e, newVote) => {
                                onVote(comment.url, newVote);
                            }}
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
                        <IconButton aria-label="comment">
                            <Comment />
                        </IconButton>
                        <Typography variant="body2" sx={{ mr: 'auto' }}>{calcualteCommentCount(comment.replies)}</Typography>

                        <Button onClick={handleCreateComment} sx={{ ml: 2 }}>Reply</Button>
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
                topicUrl={topicUrl}
                commentResponse={reply}
                depth={depth + 1}
                onVote={onVote}
            />
        ))}
        </>
    )
}

export default CommentComponent
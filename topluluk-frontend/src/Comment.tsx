import { useEffect, useState } from "react"
import type { CommentResponse } from "./responseTypes"
import apiClient from "./api"
import { Avatar, Box, Button, Card, CardActions, CardContent, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { ArrowDownward, ArrowUpward, Comment, ExpandLess, ExpandMore } from "@mui/icons-material"
import { calcualteCommentCount } from "./Topic"
import CreateCommentForm from "./CreateCommentForm"

interface CommentProps {
    topicUrl: string
    comment: CommentResponse
    depth?: number
    onVote: (commentUrl: string, newVote: number) => void
}

function CommentComponent({ topicUrl, comment, depth = 0, onVote }: CommentProps) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [userProfile, setUserProfile] = useState<{ username: string, image: string } | null>(null)

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userResponse = await apiClient.get(comment.user)
                const profileResponse = await apiClient.get(`${comment.user}profile/`)
                setUserProfile({
                    username: userResponse.data.username,
                    image: profileResponse.data.profile.image
                })
            } catch (error) {
                console.error('Failed to fetch user profile:', error)
            }
        }
        fetchUserProfile()
    }, [comment.user])

    const handleToggleExpand = () => {
        setExpanded(!expanded)
    }

    const handleCreateComment = () => {
        console.log('create brooo')
        setShowReplyForm(true)
    }

    const handleReplyCreated = () => {
        setShowReplyForm(false)

        // TODO: show it in frontend
        // easy way is to refresh the page lol
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
                            {comment.created_date.slice(0, 10)}
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
                comment={reply}
                depth={depth + 1}
                onVote={onVote}
            />
        ))}
        </>
    )
}

export default CommentComponent
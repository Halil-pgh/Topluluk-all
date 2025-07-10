import { useEffect, useState } from "react"
import type { CommentResponse } from "./responseTypes"
import apiClient from "./api"
import { Avatar, Box, Button, Card, CardActions, CardContent, Collapse, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import { ArrowDownward, ArrowUpward, ExpandLess, ExpandMore } from "@mui/icons-material"
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
        setShowReplyForm(true)
    }

    const handleReplyCreated = () => {
        setShowReplyForm(false)

        // TODO: create
    }

    return (
        <Box sx={{ ml: depth * 3, mb: 2 }}>
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
                        <Button onClick={handleCreateComment}>Reply</Button>
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
            
            <Collapse in={expanded}>
                {showReplyForm && (
                <Box sx={{ mt: 2 }}>
                    <CreateCommentForm
                        topicUrl={topicUrl}
                        parentCommentUrl={comment.url}
                        onCommentCreated={handleReplyCreated}
                        onCancel={() => setShowReplyForm(false)}
                    />
                </Box>
                )}
            </Collapse>
        </Box>
    )
}

export default CommentComponent
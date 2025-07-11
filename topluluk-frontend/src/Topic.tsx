import { useEffect, useState } from "react"
import { type CommentResponse, type TopicResponse } from "./responseTypes"
import { useParams, useNavigate } from "react-router-dom"
import apiClient from "./api"
import { useAuth } from "./useAuth"
import { Avatar, Box, Button, Card, CardActions, CardContent, CardMedia, Container, Divider, IconButton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material"
import ResponsiveAppBar from "./AppBar"
import { ArrowDownward, ArrowUpward, Comment } from "@mui/icons-material"
import CommentComponent from './Comment'
import CreateCommentForm from "./CreateCommentForm"

export interface Profile {
    url: string,
    username: string,
    image: string,
}

export interface Topic {
    url: string,
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
    const [topic, setTopic] = useState<Topic>()
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = (await apiClient.get(`topic/${topicSlug}`))
                setTopic(await topicResponseToTopic(response.data, isAuthenticated))
            } catch (err) {
                setError('Failed to fetch topic.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [topicSlug, communitySlug])

    const handleTopicVote = (newVote: number) => {
        if (!isAuthenticated || !topic) return

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
        setShowReplyForm(true)
    }

    const handleReplyCreated = () => {
        setShowReplyForm(false)

        // TODO: NOT do this
        // instead, should look for what is being changed
        window.location.reload()
    }

    const handleCommentVote = async (commentUrl: string, newVote: number) => {
        if (!isAuthenticated || !topic) return

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
                            {topic.createdDate.slice(0, 10)}
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
                                handleTopicVote(newVote);
                            }}
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
                        <IconButton aria-label="comment">
                            <Comment />
                        </IconButton>
                        <Typography variant="body2" sx={{ mr: 'auto' }}>{calcualteCommentCount(topic.comments)}</Typography>
                    </CardActions>
                </Card>

                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                        Comments ({calcualteCommentCount(topic.comments)})
                    </Typography>
                    {isAuthenticated && (
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
                            />
                        ))}
                    </Box>
                )}
            </Container>
        </>
    )
}

export default Topic
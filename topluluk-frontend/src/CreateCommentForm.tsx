import { useAuth } from "./useAuth"
import { useState } from "react"
import apiClient from "./api"
import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material"

interface CreateCommentFormProps {
    topicUrl: string
    parentCommentUrl?: string
    onCommentCreated: () => void
    onCancel?: () => void
}

function CreateCommentForm({ topicUrl, parentCommentUrl, onCommentCreated, onCancel}: CreateCommentFormProps) {
    const { isAuthenticated } = useAuth()
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isReply = parentCommentUrl !== undefined

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim() || !isAuthenticated) return

        setLoading(true)
        setError('')

        try {
            const payload = {
                topic: topicUrl,
                text: text.trim(),
                ...(isReply && { upper_comment: parentCommentUrl })
            }

            await apiClient.post('comment/', payload)
            
            setText('')
            onCommentCreated()
        } catch (err) {
            setError('Failed to create comment')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <Card>
                <CardContent>
                    <Typography>Please log in to comment.</Typography>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {isReply ? 'Reply to Comment' : 'Add Comment'}
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isReply ? "Write your reply..." : "Write your comment..."}
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    {error && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !text.trim()}
                        >
                            {loading ? 'Posting...' : (isReply ? 'Reply' : 'Comment')}
                        </Button>
                        {onCancel && (
                            <Button onClick={onCancel} variant="outlined">
                                Cancel
                            </Button>
                        )}
                    </Box>
                </form>
            </CardContent>
        </Card>
    )
}

export default CreateCommentForm
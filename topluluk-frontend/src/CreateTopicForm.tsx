import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import apiClient from "./api"
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material"
import ResponsiveAppBar from "./AppBar"

function CreateTopicForm() {
    const { slug } = useParams<{ slug: string }>()
    const [title, setTitle] = useState<string>('')
    const [text, setText] = useState<string>('')
    const [image, setImage] = useState<File | null>(null)
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState<string>('')
    const navigate = useNavigate()

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImage(event.target.files[0])
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError('')
        setSuccess('')

        if (!title || !text) {
            setError("Title and text are required.")
            return
        }

        const formData = new FormData()
        formData.append('title', title)
        formData.append('text', text)
        if (image) {
            formData.append('image', image)
        }
        // The backend expects the community URL
        formData.append('community', `${apiClient.defaults.baseURL}community/${slug}/`)

        try {
            console.log(formData.values())
            const response = await apiClient.post('/topic/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            setSuccess('Topic created successfully!')
            // Navigate to the new topic page after a short delay
            setTimeout(() => {
                navigate(`/communities/${slug}/${response.data.slug}`)
            }, 1500)
        } catch (err: any) {
            setError('Failed to create topic. ' + err.message)
            console.error(err)
        }
    }

    return (
        <>
            <ResponsiveAppBar />
            <Box component='main'
                sx={{
                    margin: 'auto',
                    mt: 12,
                    px: 2,
                    maxWidth: '800px'
                }}>
                <Card sx={{ width: '100%', p: 2 }}>
                    <CardContent>
                        <Typography component='h1' variant="h5" align="center">
                            Create a New Topic in c/{slug}
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="title"
                                label="Title"
                                name="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="text"
                                label="Text"
                                id="text"
                                multiline
                                rows={8}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                component="label"
                                sx={{ mt: 2 }}
                            >
                                Upload Image
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            {image && <Typography sx={{ mt: 1, ml: 1 }} display="inline">{image.name}</Typography>}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                >
                                    Create Topic
                                </Button>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={() => navigate(`/communities/${slug}`)}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </>
    )
}

export default CreateTopicForm
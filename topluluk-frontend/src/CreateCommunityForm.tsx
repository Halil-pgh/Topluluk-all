import { useRef, useState } from "react"
import apiClient from "./api"
import { useNavigate } from "react-router-dom"
import { Alert, Avatar, Box, Button, Card, CardContent, IconButton, TextField, Typography } from "@mui/material"

function CreateCommunityForm() {
    const [name, setName] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [picture, setPicture] = useState<string>('')
    const [pictureFile, setPictureFile] = useState<File | null>(null)
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState<string>('')
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleMainMenu() {
        navigate('/')
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0]
            setPictureFile(file)
            setPicture(URL.createObjectURL(file))
        }
    }

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError('')
        setSuccess('')
        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('description', description)
            if (pictureFile) {
                formData.append('image', pictureFile)
            }

            await apiClient.post('community/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            setSuccess('Community created successfully')

            navigate('/communities'); 
        } catch (error: any) {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                const errorMessages = Object.keys(errorData).map(key => `${key}: ${errorData[key]}`).join(' ');
                setError(`Failed to create community. ${errorMessages}`);
            } else {
                setError('Failed to create community')
            }
            console.error(error)
        }
    }

    return (
        <Box component='main'
            sx={{
                margin: 'auto',
                mt: 8,
                px: 2
            }}>
            <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
                <CardContent>
                    <Typography component='h1' variant="h5" align="center">
                        Create a New Community
                    </Typography>
                    <Box component="form" onSubmit={onSubmit} sx={{ mt: 1 }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <IconButton onClick={() => fileInputRef.current?.click()}>
                                <Avatar
                                    src={picture}
                                    sx={{ width: 120, height: 120 }}
                                />
                            </IconButton>
                        </Box>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="Community Name"
                            name="name"
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            name="description"
                            label="Description"
                            id="description"
                            multiline
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                            >
                                Create Community
                            </Button>
                            <Button
                                type="button"
                                variant="contained"
                                onClick={handleMainMenu}
                            >
                                Back To Main Menu
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default CreateCommunityForm
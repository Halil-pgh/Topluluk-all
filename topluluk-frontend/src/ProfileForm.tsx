import { useEffect, useRef, useState } from "react"
import apiClient from "./api"
import { useNavigate } from "react-router-dom"
import { Alert, Avatar, Box, Button, Card, CardContent, IconButton, TextField, Typography } from "@mui/material"
import { useAuth } from "./useAuth"

function ProfileForm() {
    const [username, setUsername] = useState<string>('')
    const [picture, setPicture] = useState<string>('')
    const [pictureFile, setPictureFile] = useState<File | null>(null)
    const [description, setDescription] = useState<string>('')
    const [links, setLinks] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState<string>('')
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isAuthenticated)
            return

        const requestProfile = async () => {
            try {
                const response = await apiClient.get('my_profile/')
                const profile = response.data
                setPicture(profile.image || '')
                setDescription(profile.description || '')
                setLinks(profile.links || '')
                
                const userResponse = await apiClient.get(profile.user)
                setUsername(userResponse.data.username)
            } catch (error) {
                setError('Failed to load profile data.')
                console.error(error)
            }
        }
        requestProfile()
    }, [isAuthenticated])

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
            if (pictureFile) {
                formData.append('image', pictureFile)
            }
            formData.append('description', description)
            formData.append('links', links)

            await apiClient.patch('my_profile/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            setSuccess('Profile updated successfully')
        } catch (error) {
            setError('Failed to update profile')
            console.error(error)
        }
    }

    if (!isAuthenticated) {
        return (
            <Box></Box>
        )
    }

    return (
        <Box component='main'
            sx={{
                margin: 'auto',
                mt: 8,
                px:2
            }}>
            <Card sx={{ width: '100%', p: 2 }}>
                <CardContent>
                    <Typography component='h1' variant="h5" align="center">
                        My Profile
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
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            value={username}
                            disabled // username cannot be changed
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
                        <TextField
                            margin="normal"
                            fullWidth
                            name="links"
                            label="Links"
                            id="links"
                            value={links}
                            onChange={(e) => setLinks(e.target.value)}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2}}>
                            <Button
                                type="submit"
                                variant="contained"
                            >
                                Save Changes
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

export default ProfileForm
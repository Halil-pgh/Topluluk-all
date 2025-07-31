import { useRef, useState, useEffect } from "react"
import apiClient from "./api"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Avatar, Box, Button, Card, CardContent, IconButton, TextField, Typography } from "@mui/material"
import ResponsiveAppBar from "./AppBar"
import { useAuth } from "./useAuth"

interface Community {
    name: string,
    description: string,
    image: string,
}

function EditCommunity() {
    const { slug } = useParams<{ slug: string }>()
    const [community, setCommunity] = useState<Community>()
    const [description, setDescription] = useState<string>('')
    const [picture, setPicture] = useState<string>('')
    const [pictureFile, setPictureFile] = useState<File | null>(null)
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [amIMod, setAmIMod] = useState<boolean>(false)
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if user is moderator
                const modResponse = await apiClient.get(`community/${slug}/am_i_mod/`)
                setAmIMod(modResponse.data.am_i_mod)

                if (!modResponse.data.am_i_mod) {
                    setLoading(false)
                    return
                }

                // Fetch community data
                const communityResponse = await apiClient.get(`community/${slug}`)
                const communityData = {
                    name: communityResponse.data.name,
                    description: communityResponse.data.description || '',
                    image: communityResponse.data.image,
                }
                setCommunity(communityData)
                setDescription(communityData.description)
                setPicture(communityData.image)
            } catch (error) {
                setError('Failed to fetch community data.')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        if (isAuthenticated) {
            fetchData()
        } else {
            navigate('/login')
        }
    }, [slug, isAuthenticated, navigate])

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
            formData.append('description', description)
            if (pictureFile) {
                formData.append('image', pictureFile)
            }

            await apiClient.patch(`community/${slug}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            setSuccess('Community updated successfully')
            
            // Navigate back to community after a short delay
            setTimeout(() => {
                navigate(`/communities/${slug}`)
            }, 1500)
        } catch (error: any) {
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                const errorMessages = Object.keys(errorData).map(key => `${key}: ${errorData[key]}`).join(' ');
                setError(`Failed to update community. ${errorMessages}`);
            } else {
                setError('Failed to update community')
            }
            console.error(error)
        }
    }

    const handleBack = () => {
        navigate(`/communities/${slug}`)
    }

    if (loading) {
        return (
            <Box>
                <ResponsiveAppBar />
                <Box sx={{ mt: 12, textAlign: 'center' }}>
                    <Typography>Loading...</Typography>
                </Box>
            </Box>
        )
    }

    if (!amIMod) {
        return (
            <Box>
                <ResponsiveAppBar />
                <Box sx={{ mt: 12, textAlign: 'center' }}>
                    <Typography variant="h5" color="error">
                        Access Denied
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        You must be a moderator to edit this community.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={handleBack}
                        sx={{ mt: 2 }}
                    >
                        Back to Community
                    </Button>
                </Box>
            </Box>
        )
    }

    return (
        <Box>
            <ResponsiveAppBar />
            <Box component='main'
                sx={{
                    margin: 'auto',
                    mt: 12,
                    px: 2
                }}>
                <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto', p: 2 }}>
                    <CardContent>
                        <Typography component='h1' variant="h5" align="center">
                            Edit Community
                        </Typography>
                        {community && (
                            <Typography component='h2' variant="h6" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
                                {community.name}
                            </Typography>
                        )}
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
                            <Typography variant="caption" display="block" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
                                Click on the image to change it
                            </Typography>
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
                                    Update Community
                                </Button>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={handleBack}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    )
}

export default EditCommunity
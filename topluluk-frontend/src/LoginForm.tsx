import { Box, Card, CardContent, Button, TextField, Typography, Alert } from "@mui/material"
import { useState } from "react"
import { useAuth } from './useAuth'
import apiClient from "./api"
import { useNavigate } from "react-router-dom"

function LoginForm() {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [error, setError] = useState<string>('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError('')
        try {
            await apiClient.post('api/login/', { username, password })
            login()

            // return to main menu
            navigate('/')
        } catch(error) {
            setError('Invalid username or password')
            console.log('Login error: ', error)
        }
    }

    return (
        <Box component='main' maxWidth='xs'
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        borderRadius: 2,
                    }}>
            <Card sx={{ width: '100%', p: 2 }}>
                <CardContent>
                    <Typography component='h1' variant="h5" align="center">
                        Sign In
                    </Typography>
                    <Box component="form" onSubmit={onSubmit} sx={{ mt:1 }}>
                        {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="password"
                            label="Password"
                            name="password"
                            autoComplete="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt:3, mb:2 }}
                        >
                            Sign In
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default LoginForm

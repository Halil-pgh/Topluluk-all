import { useState } from "react"
import apiClient from "./api"
import { useAuth } from "./useAuth"
import { useNavigate } from "react-router-dom"
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material"

function SignUpForm() {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [verifyPassword, setVerifyPassword] = useState<string>('')
    const [error, setError] = useState<string>('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError('')

        if (password != verifyPassword) {
            setError('Passwords do not match')
            return
        }

        try {
            await apiClient.post('user/', { username, password })

            // login the user after sign in
            await apiClient.post('api/login/', { username, password })
            login()

            navigate('/')
        } catch (error) {
            setError('Username is already being used')
            console.log('Sign in error: ', error)
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
                        Sign Up
                    </Typography>
                    <Box component="form" onSubmit={onSubmit} sx={{ mt: 1 }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="verifyPassword"
                            label="Verify Password"
                            type="password"
                            id="verifyPassword"
                            autoComplete="new-password"
                            value={verifyPassword}
                            onChange={(e) => setVerifyPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign Up
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default SignUpForm
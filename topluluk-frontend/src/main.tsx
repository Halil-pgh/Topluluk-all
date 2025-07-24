import { createRoot } from 'react-dom/client'
import { AuthProvider } from './AuthContext.tsx'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme.tsx'
import App from './App.tsx'


createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
  <CssBaseline />
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
)

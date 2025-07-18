import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LoginForm from './LoginForm.tsx'
import { AuthProvider } from './AuthContext.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SignUpForm from './SignUpForm.tsx'
import ProfileForm from './ProfileForm.tsx'
import { CssBaseline, ThemeProvider } from '@mui/material'
import theme from './theme.tsx'
import CreateCommunityForm from './CreateCommunityForm.tsx'
import App from './App.tsx'
import Communities from './Communities.tsx'
import Community from './Community.tsx'
import CreateTopicForm from './CreateTopicForm.tsx'
import Topic from './Topic.tsx'
import EditCommunity from './EditCommunity.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
  <CssBaseline />
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path='/sign_up' element={<SignUpForm />} />
          <Route path='/profile' element={<ProfileForm />} />
          <Route path='/create_community' element={<CreateCommunityForm />} />
          <Route path='/communities' element={<Communities />} />
          <Route path='/subscriptions' element={<Communities message='Subscribed Communities' url='subscriptions/' />} />
          <Route path='/communities/:slug' element={<Community />} />
          <Route path='/communities/:slug/create_topic' element={<CreateTopicForm />} />
          <Route path='/communities/:communitySlug/:topicSlug' element={<Topic />} />
          <Route path='/edit/community/:slug' element={<EditCommunity />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>,
)

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import ResponsiveAppBar from "./AppBar"
import LoginForm from "./LoginForm"
import SignUpForm from "./SignUpForm"
import ProfileForm from "./ProfileForm"
import CreateCommunityForm from "./CreateCommunityForm"
import Communities from "./Communities"
import Community from "./Community"
import CreateTopicForm from "./CreateTopicForm"
import Topic from "./Topic"
import EditCommunity from "./EditCommunity"
import HotTopics from "./HotTopics"
import { Box } from "@mui/material"
import Footer from "./Footer"
import Index from "./Index"
import ForYou from "./ForYou"

function AppContent() {
    const location = useLocation();
    const hideNavAndFooter = ['/login', '/sign_up', '/profile', '/create_community'].includes(location.pathname);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
        }}>

            {!hideNavAndFooter && <ResponsiveAppBar />}

            <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Routes>
                    <Route path="/" element={<Index />} />
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
                    <Route path='/for_you' element={<ForYou />} />
                    <Route path='/hot_topics' element={<HotTopics />} />
                </Routes>
            </Box>

            {!hideNavAndFooter && <Footer />}
        </Box>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    )
}

export default App
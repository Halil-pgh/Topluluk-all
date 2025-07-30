import { Box } from "@mui/material"
import MostKarmaProfilesChart from "./MostKarmaProfilesChart"
import MostSubedCommunityChart from "./MostSubedCommunityChart"
import CommunityChart from "./CommunityChart"
import { useAuth } from "./useAuth"
import ForYou from "./ForYou"
import HotTopics from "./HotTopics"

function Index() {
    const { isAuthenticated } = useAuth()

    const stats = (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <MostKarmaProfilesChart />
            <MostSubedCommunityChart />
            <CommunityChart />
        </Box>
    )

    return (
        isAuthenticated ? <ForYou /> : <HotTopics />
    )
}

export default Index
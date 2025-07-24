import { Box } from "@mui/material"
import MostKarmaProfilesChart from "./MostKarmaProfilesChart"
import MostSubedCommunityChart from "./MostSubedCommunityChart"

function Index() {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <MostKarmaProfilesChart />
            <MostSubedCommunityChart />
        </Box>
    )
}

export default Index
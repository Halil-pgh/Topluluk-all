import { Box, Grid } from "@mui/material"
import CommunityChart from "./CommunityChart"
import MostKarmaProfilesChart from "./MostKarmaProfilesChart"
import MostSubedCommunityChart from "./MostSubedCommunityChart"
import WebsiteActivityChart from "./WebsiteActivityChart"

function Status() {

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
            <Grid container spacing={3}>
                {/* Empty left column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* First row - middle columns */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <MostKarmaProfilesChart message="🏆 Hall of Fame - All-Time Karma Champions"/>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <MostKarmaProfilesChart time={24} message="🔥 Top Contributors Today - Karma Leaders" />
                </Grid>
                
                {/* Empty right column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* Empty left column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* Second row - middle columns */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <MostSubedCommunityChart message="🏘️ Most Subscribed Communities - All Time" />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <MostSubedCommunityChart time={24} message="📈 Today's Rising Communities - New Subscribers" />
                </Grid>
                
                {/* Empty right column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* Empty left column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* Third row - middle columns */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <CommunityChart message="👁️ Most Viewed Communities - All Time" />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <CommunityChart time={24} message="🔥 Today's Hot Communities - Most Views" />
                </Grid>
                
                {/* Empty right column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* Empty left column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
                
                {/* Fourth row - Website Activity Chart (centered, full width) */}
                <Grid size={{ xs: 12, md: 10 }}>
                    <WebsiteActivityChart days={10} message="📊 Website Activity Trend - Last 10 Days" />
                </Grid>
                
                {/* Empty right column for centering */}
                <Grid size={{ xs: 0, md: 1 }} />
            </Grid>
        </Box>
    )

}

export default Status
import ResponsiveAppBar from "./AppBar"
import CommunityChart from "./CommunityChart"
import MostKarmaProfilesChart from "./MostKarmaProfilesChart"
import MostSubedCommunityChart from "./MostSubedCommunityChart"

function App() {
    return (
        <>
            <MostSubedCommunityChart />
            <MostKarmaProfilesChart />
            <CommunityChart />
            <ResponsiveAppBar />
        </>
    )
}

export default App
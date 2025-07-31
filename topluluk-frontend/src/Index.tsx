import { useAuth } from "./useAuth"
import ForYou from "./ForYou"
import HotTopics from "./HotTopics"

function Index() {
    const { isAuthenticated } = useAuth()

    return (
        isAuthenticated ? <ForYou /> : <HotTopics />
    )
}

export default Index
export interface TopicResponse {
    url: string, // its own url
    community: string, // url to the community
    title: string,
    text: string,
    image: string,
    created_date: any,
    user: string,
    vote_count: number,
    view_count: number,
    comments: CommentResponse[],
    slug: string,
}

export interface CommentResponse {
    url: string,
    id: number,
    topic: string,
    text: string,
    created_date: any,
    user: string,
    vote_count: number,
    replies: CommentResponse[],
    vote: number, // users vote tha is to handle frontend rendering
    // it is not coming from the backend
}

export interface NotificationResponse {
    id: number,
    information: string,
    direct_url: string,
    created_date: string,
    is_read: boolean,
}

export const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
let socket: WebSocket | null = null

export const getWebSocket = ():WebSocket => {
    if (!socket || socket.readyState === WebSocket.CLOSED) {
        socket = new WebSocket('ws://localhost:8000/ws/notifications/')
    }
    return socket
}

export const closeWebSocket = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
    }
    socket = null
}
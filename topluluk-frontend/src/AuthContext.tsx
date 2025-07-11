import { createContext, useEffect, useState, type ReactNode } from "react";
import apiClient from "./api";

interface AuthContextType {
    isAuthenticated: boolean
    login: () => void
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children } : { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await apiClient.get('user/am_i_authenticated/')
                setIsAuthenticated(response.data.is_authenticated)
            } catch (error) {
                console.error('Authentication check failed: ', error)
                setIsAuthenticated(false)
            } finally {
                setIsLoading(false)
            }
        }
        verifyAuth()
    }, [])

    const login = () => {
        setIsAuthenticated(true)
    }

    const logout = async () => {
        try {
            await apiClient.post('api/logout/')
        } catch (error) {
            console.error('Logout error: ', error)
        } finally {
            setIsAuthenticated(false)
            window.location.reload()
        }
    }

    if (isLoading)
        return null

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

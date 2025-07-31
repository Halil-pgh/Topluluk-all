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
        
        // Add a timeout to ensure loading state is cleared even if request hangs
        const timeoutId = setTimeout(() => {
            console.warn('Authentication check timed out')
            setIsAuthenticated(false)
            setIsLoading(false)
        }, 5000) // 5 second timeout

        verifyAuth().finally(() => {
            clearTimeout(timeoutId)
        })

        return () => {
            clearTimeout(timeoutId)
        }
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

    if (isLoading) {
        // Instead of returning null (which prevents the app from rendering),
        // we'll render the children with authentication set to false
        // This ensures the app loads even if auth check is slow/failing
        return (
            <AuthContext.Provider value={{ isAuthenticated: false, login, logout }}>
                {children}
            </AuthContext.Provider>
        )
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

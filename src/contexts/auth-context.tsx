"use client"

import type React from "react"

import { createContext, useState, useContext, useEffect } from "react"

interface User {
    userId: number
    token: string
}

interface AuthContextType {
    user: User | null
    login: (userData: User) => void
    logout: () => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Check for existing user data in localStorage on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (error) {
                console.error("Failed to parse stored user data:", error)
                localStorage.removeItem("user")
            }
        }
        setIsLoading(false)
    }, [])

    const login = (userData: User) => {
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
    }

    const logout = async () => {
        try {
            // Only make the API call if we have a user and token
            if (user && user.token) {
                const response = await fetch("http://localhost:4941/api/v1/users/logout", {
                    method: "POST",
                    headers: {
                        "X-Authorization": user.token,
                    },
                })

                if (!response.ok) {
                    console.error("Logout failed on server:", response.status)
                }
            }
        } catch (error) {
            console.error("Error during logout:", error)
        } finally {
            // Always clear local state regardless of API success/failure
            setUser(null)
            localStorage.removeItem("user")
        }
    }

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

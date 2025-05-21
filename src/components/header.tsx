"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import "./css/Header.css"

export function Header() {
    const location = useLocation()
    const navigate = useNavigate()
    const { isAuthenticated, logout } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await logout()
            navigate("/")
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <header className="app-header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    Game Search
                </Link>

                <nav className="header-nav">
                    <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>
                        Home
                    </Link>

                    {isAuthenticated ? (
                        <>
                            <Link to="/create-game" className={location.pathname === "/create-game" ? "nav-link active" : "nav-link"}>
                                Create Game
                            </Link>
                            <Link to="/my-games" className={location.pathname === "/my-games" ? "nav-link active" : "nav-link"}>
                                My Games
                            </Link>
                            <Link to="/profile" className={location.pathname === "/profile" ? "nav-link active" : "nav-link"}>
                                My Profile
                            </Link>
                            <button onClick={handleLogout} className="nav-link logout-button" disabled={isLoggingOut}>
                                {isLoggingOut ? "Logging out..." : "Logout"}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={location.pathname === "/login" ? "nav-link active" : "nav-link"}>
                                Login
                            </Link>
                            <Link to="/register" className={location.pathname === "/register" ? "nav-link active" : "nav-link"}>
                                Register
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}

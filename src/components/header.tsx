"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import "./css/Header.css"

export function Header() {
    const location = useLocation()
    const navigate = useNavigate()
    const { isAuthenticated, logout, user } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await logout()
            navigate("/")
        } catch (error) {
            console.error("Logout error:", error)
        } finally {
            setIsLoggingOut(false)
            setDropdownOpen(false)
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [dropdownOpen])

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
                            {/* Profile image dropdown */}
                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <button
                                    className="profile-image-btn"
                                    onClick={() => setDropdownOpen((open) => !open)}
                                    aria-label="Open profile menu"
                                >
                                    <img
                                        src={
                                            user?.userId
                                                ? `http://localhost:4941/api/v1/users/${user.userId}/image`
                                                : "/PlaceholderIcon.png"
                                        }
                                        alt="Profile"
                                        className="profile-image"
                                        style={{ width: 28, height: 28 }} // override size
                                        onError={e => {
                                            const target = e.target as HTMLImageElement
                                            target.src = "/PlaceholderIcon.png"
                                        }}
                                    />
                                </button>
                                {dropdownOpen && (
                                    <div className="profile-dropdown-menu">
                                        <Link
                                            to="/profile"
                                            className="dropdown-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            My Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="dropdown-item"
                                            disabled={isLoggingOut}
                                        >
                                            {isLoggingOut ? "Logging out..." : "Logout"}
                                        </button>
                                    </div>
                                )}
                            </div>
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

"use client"

import { useState, useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { Header } from "../components/header"
import "../components/css/ProfilePage.css"

interface UserProfile {
    firstName: string
    lastName: string
    email: string
}

export function ProfilePage() {
    const { user, isAuthenticated } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [imageError, setImageError] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return

            setLoading(true)
            setError(null)

            try {
                // Fetch user profile data
                const response = await fetch(`http://localhost:4941/api/v1/users/${user.userId}`, {
                    headers: {
                        "X-Authorization": user.token,
                    },
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("You are not authorized to view this profile")
                    } else {
                        throw new Error("Failed to load profile data")
                    }
                }

                const profileData = await response.json()
                setProfile(profileData)
            } catch (err) {
                console.error("Error fetching profile:", err)
                setError(err instanceof Error ? err.message : "An unexpected error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchUserProfile()
    }, [user])

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <>
            <Header />
            <div className="profile-container">
                <div className="profile-card">
                    <h1 className="profile-title">My Profile</h1>

                    {loading ? (
                        <div className="profile-loading">Loading profile information...</div>
                    ) : error ? (
                        <div className="profile-error">{error}</div>
                    ) : profile ? (
                        <div className="profile-content">
                            <div className="profile-image-container">
                                <img className="profile-page-image"
                                    src={`http://localhost:4941/api/v1/users/${user?.userId}/image`}
                                    alt="Reviewer"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/PlaceholderIcon.png" // Using the public folder
                                    }}
                                />
                            </div>

                            <div className="profile-details">
                                <div className="profile-field">
                                    <label>First Name</label>
                                    <div className="profile-value">{profile.firstName}</div>
                                </div>

                                <div className="profile-field">
                                    <label>Last Name</label>
                                    <div className="profile-value">{profile.lastName}</div>
                                </div>

                                <div className="profile-field">
                                    <label>Email</label>
                                    <div className="profile-value">{profile.email}</div>
                                </div>
                            </div>
                            <div className="profile-actions">
                                <button className="edit-profile-button" onClick={() => navigate("/edit-profile")}>
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-error">No profile data available</div>
                    )}
                </div>
            </div>
        </>
    )
}

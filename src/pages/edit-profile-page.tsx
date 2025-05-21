"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { Header } from "../components/header"
import "../components/css/EditProfilePage.css"

interface UserProfile {
    firstName: string
    lastName: string
    email: string
}

export function EditProfilePage() {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuth()

    // Form state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [hasExistingImage, setHasExistingImage] = useState(false)
    const [removeImage, setRemoveImage] = useState(false)

    // Loading states
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Validation state
    const [errors, setErrors] = useState<{
        firstName?: string
        lastName?: string
        email?: string
        currentPassword?: string
        newPassword?: string
        image?: string
        general?: string
    }>({})

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch user profile data when component mounts
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return

            setIsLoading(true)
            setErrors({})

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

                // Set form data
                setFirstName(profileData.firstName)
                setLastName(profileData.lastName)
                setEmail(profileData.email)

                // Check if user has a profile image
                try {
                    const imageResponse = await fetch(`http://localhost:4941/api/v1/users/${user.userId}/image`)
                    if (imageResponse.ok) {
                        setHasExistingImage(true)
                        setImagePreview(`http://localhost:4941/api/v1/users/${user.userId}/image?${Date.now()}`)
                    }
                } catch (err) {
                    console.error("Error checking profile image:", err)
                }
            } catch (err) {
                console.error("Error fetching profile:", err)
                setErrors({
                    general: err instanceof Error ? err.message : "An unexpected error occurred",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserProfile()
    }, [user])

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // Check file type
            if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
                setErrors((prev) => ({
                    ...prev,
                    image: "Please select a valid image file (JPEG, PNG, or GIF)",
                }))
                return
            }

            setProfileImage(file)
            setRemoveImage(false)
            setErrors((prev) => ({ ...prev, image: undefined }))

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Remove selected image
    const handleRemoveImage = () => {
        setProfileImage(null)
        setImagePreview(null)
        setRemoveImage(true)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Cancel image removal
    const handleCancelRemoveImage = () => {
        setRemoveImage(false)
        if (hasExistingImage) {
            setImagePreview(`http://localhost:4941/api/v1/users/${user?.userId}/image?${Date.now()}`)
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors: {
            firstName?: string
            lastName?: string
            email?: string
            currentPassword?: string
            newPassword?: string
        } = {}

        // Validate first name
        if (!firstName.trim()) {
            newErrors.firstName = "First name is required"
        }

        // Validate last name
        if (!lastName.trim()) {
            newErrors.lastName = "Last name is required"
        }

        // Validate email
        if (!email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email address"
        }

        // Validate password if being changed
        if (newPassword) {
            if (!currentPassword) {
                newErrors.currentPassword = "Current password is required to change password"
            }

            if (newPassword.length < 6) {
                newErrors.newPassword = "Password must be at least 6 characters"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate form
        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        setErrors({})

        try {
            // Prepare update data
            const updateData: {
                firstName?: string
                lastName?: string
                email?: string
                password?: string
                currentPassword?: string
            } = {}

            // Only include fields that have changed
            if (firstName) updateData.firstName = firstName
            if (lastName) updateData.lastName = lastName
            if (email) updateData.email = email

            // Include password fields if new password is provided
            if (newPassword) {
                updateData.password = newPassword
                updateData.currentPassword = currentPassword
            }

            // Update user profile
            const updateResponse = await fetch(`http://localhost:4941/api/v1/users/${user?.userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": user?.token || "",
                },
                body: JSON.stringify(updateData),
            })

            if (!updateResponse.ok) {
                // Handle specific error cases
                if (updateResponse.status === 400) {
                    const errorData = await updateResponse.json()
                    setErrors({
                        general: errorData.message || "Invalid data provided. Please check your information.",
                    })
                } else if (updateResponse.status === 401) {
                    setErrors({
                        general: "You must be logged in to update your profile.",
                    })
                } else if (updateResponse.status === 403) {
                    setErrors({
                        email: "This email address is already in use.",
                        general: "This email address is already in use.",
                    })
                } else if (updateResponse.status === 404) {
                    setErrors({
                        general: "User not found.",
                    })
                } else {
                    setErrors({
                        general: "Failed to update profile. Please try again.",
                    })
                }
                setIsSubmitting(false)
                return
            }

            // Handle profile image update if needed
            if (profileImage) {
                const imageResponse = await fetch(`http://localhost:4941/api/v1/users/${user?.userId}/image`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": profileImage.type,
                        "X-Authorization": user?.token || "",
                    },
                    body: profileImage,
                })

                if (!imageResponse.ok) {
                    console.error("Failed to upload profile image")
                    // Continue anyway since the profile is updated
                }
            } else if (removeImage && hasExistingImage) {
                // Delete profile image if remove flag is set
                const deleteImageResponse = await fetch(`http://localhost:4941/api/v1/users/${user?.userId}/image`, {
                    method: "DELETE",
                    headers: {
                        "X-Authorization": user?.token || "",
                    },
                })

                if (!deleteImageResponse.ok) {
                    console.error("Failed to delete profile image")
                    // Continue anyway since the profile is updated
                }
            }

            // Navigate back to profile page
            navigate("/profile")
        } catch (error) {
            console.error("Profile update error:", error)
            setErrors({
                general: "An unexpected error occurred. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <>
            <Header />
            <div className="edit-profile-container">
                <div className="edit-profile-card">
                    <h1 className="edit-profile-title">Edit Profile</h1>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    {isLoading ? (
                        <div className="loading-message">Loading profile information...</div>
                    ) : (
                        <form onSubmit={handleSubmit} className="edit-profile-form">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={errors.firstName ? "input-error" : ""}
                                    disabled={isSubmitting}
                                />
                                {errors.firstName && <div className="field-error">{errors.firstName}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={errors.lastName ? "input-error" : ""}
                                    disabled={isSubmitting}
                                />
                                {errors.lastName && <div className="field-error">{errors.lastName}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address *</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={errors.email ? "input-error" : ""}
                                    disabled={isSubmitting}
                                />
                                {errors.email && <div className="field-error">{errors.email}</div>}
                            </div>

                            <div className="password-section">
                                <h3>Change Password</h3>
                                <p className="password-hint">Leave blank if you don't want to change your password</p>

                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password</label>
                                    <div className="password-input-container">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            id="currentPassword"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className={errors.currentPassword ? "input-error" : ""}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            disabled={isSubmitting}
                                        >
                                            {showCurrentPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    {errors.currentPassword && <div className="field-error">{errors.currentPassword}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <div className="password-input-container">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={errors.newPassword ? "input-error" : ""}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            disabled={isSubmitting}
                                        >
                                            {showNewPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    {errors.newPassword && <div className="field-error">{errors.newPassword}</div>}
                                </div>
                            </div>

                            <div className="profile-image-section">
                                <h3>Profile Picture</h3>

                                {hasExistingImage && !removeImage && (
                                    <div className="current-image-container">
                                        <p>Current Profile Picture:</p>
                                        <img
                                            src={imagePreview || `http://localhost:4941/api/v1/users/${user?.userId}/image?${Date.now()}`}
                                            alt="Current profile"
                                            className="current-profile-image"
                                        />
                                        <button
                                            type="button"
                                            className="remove-image-button"
                                            onClick={handleRemoveImage}
                                            disabled={isSubmitting}
                                        >
                                            Remove Profile Picture
                                        </button>
                                    </div>
                                )}

                                {removeImage && hasExistingImage && (
                                    <div className="remove-image-message">
                                        <p>Your profile picture will be removed when you save changes.</p>
                                        <button
                                            type="button"
                                            className="cancel-remove-button"
                                            onClick={handleCancelRemoveImage}
                                            disabled={isSubmitting}
                                        >
                                            Cancel Removal
                                        </button>
                                    </div>
                                )}

                                {(!hasExistingImage || profileImage || removeImage) && (
                                    <div className="form-group">
                                        <label htmlFor="profileImage">Upload New Profile Picture</label>
                                        <input
                                            type="file"
                                            id="profileImage"
                                            onChange={handleImageChange}
                                            accept="image/jpeg,image/png,image/gif"
                                            ref={fileInputRef}
                                            disabled={isSubmitting}
                                            className="file-input"
                                        />
                                        <div className="file-input-wrapper">
                                            <button
                                                type="button"
                                                className="file-input-button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isSubmitting}
                                            >
                                                Choose File
                                            </button>
                                            <span className="file-name">{profileImage ? profileImage.name : "No file chosen"}</span>
                                        </div>

                                        {profileImage && (
                                            <div className="image-preview-container">
                                                <img src={imagePreview || ""} alt="Profile preview" className="image-preview" />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={handleRemoveImage}
                                                    disabled={isSubmitting}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}

                                        {errors.image && <div className="field-error">{errors.image}</div>}
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-button" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving Changes..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => navigate("/profile")}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    )
}

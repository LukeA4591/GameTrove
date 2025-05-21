"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { Header } from "../components/header"
import "../components/css/RegisterPage.css"

export function RegisterPage() {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAuth()

    // Form state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Validation state
    const [errors, setErrors] = useState<{
        firstName?: string
        lastName?: string
        email?: string
        password?: string
        general?: string
    }>({})

    // Loading state
    const [isSubmitting, setIsSubmitting] = useState(false)

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null)

    // If user is already logged in, redirect to home page
    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // Check file type
            if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
                setErrors((prev) => ({
                    ...prev,
                    general: "Please select a valid image file (JPEG, PNG, or GIF)",
                }))
                return
            }

            setProfileImage(file)

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
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors: {
            firstName?: string
            lastName?: string
            email?: string
            password?: string
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

        // Validate password
        if (!password) {
            newErrors.password = "Password is required"
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters"
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
            // Register user
            const registerResponse = await fetch("http://localhost:4941/api/v1/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                }),
            })

            const registerData = await registerResponse.json()

            if (!registerResponse.ok) {
                // Handle registration errors
                if (registerResponse.status === 400) {
                    setErrors({
                        general: "Invalid registration details. Please check your information.",
                    })
                } else if (registerResponse.status === 403) {
                    setErrors({
                        email: "This email address is already in use.",
                    })
                } else {
                    setErrors({
                        general: registerData.message || "Registration failed. Please try again.",
                    })
                }
                setIsSubmitting(false)
                return
            }

            const userId = registerData.userId

            // Upload profile image if provided
            if (profileImage) {
                const imageResponse = await fetch(`http://localhost:4941/api/v1/users/${userId}/image`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": profileImage.type,
                    },
                    body: profileImage,
                })

                if (!imageResponse.ok) {
                    console.error("Failed to upload profile image")
                    // Continue anyway since the user is registered
                }
            }

            // Auto-login the user
            const loginResponse = await fetch("http://localhost:4941/api/v1/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            if (loginResponse.ok) {
                const userData = await loginResponse.json()
                login(userData)
            }

            // Redirect to home page
            navigate("/")
        } catch (error) {
            console.error("Registration error:", error)
            setErrors({
                general: "An unexpected error occurred. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Header />
            <div className="register-container">
                <div className="register-card">
                    <h1 className="register-title">Create an Account</h1>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <form onSubmit={handleSubmit} className="register-form">
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

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={errors.password ? "input-error" : ""}
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            {errors.password && <div className="field-error">{errors.password}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="profileImage">Profile Picture (Optional)</label>
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

                            {imagePreview && (
                                <div className="image-preview-container">
                                    <img src={imagePreview || "/placeholder.svg"} alt="Profile preview" className="image-preview" />
                                    <button type="button" className="remove-image" onClick={handleRemoveImage} disabled={isSubmitting}>
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="register-button" disabled={isSubmitting}>
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="login-link">
                        Already have an account?{" "}
                        <a href="#" onClick={() => navigate("/login")}>
                            Log in
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}

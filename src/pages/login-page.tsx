"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { Header } from "../components/header"
import "../components/css/LoginPage.css"

export function LoginPage() {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAuth()

    // Form state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    // Validation state
    const [errors, setErrors] = useState<{
        email?: string
        password?: string
        general?: string
    }>({})

    // Loading state
    const [isSubmitting, setIsSubmitting] = useState(false)

    // If user is already logged in, redirect to home page
    if (isAuthenticated) {
        return <Navigate to="/" replace />
    }

    // Validate form
    const validateForm = () => {
        const newErrors: {
            email?: string
            password?: string
        } = {}

        // Validate email
        if (!email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email address"
        }

        // Validate password
        if (!password) {
            newErrors.password = "Password is required"
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
            // Login user
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

            if (!loginResponse.ok) {
                // Handle login errors
                if (loginResponse.status === 400) {
                    setErrors({
                        general: "Invalid login details. Please check your information.",
                    })
                } else if (loginResponse.status === 401) {
                    setErrors({
                        general: "Incorrect email or password.",
                    })
                } else {
                    const errorData = await loginResponse.json()
                    setErrors({
                        general: errorData.message || "Login failed. Please try again.",
                    })
                }
                setIsSubmitting(false)
                return
            }

            const userData = await loginResponse.json()

            // Store user data in context
            login(userData)

            // Redirect to home page
            navigate("/")
        } catch (error) {
            console.error("Login error:", error)
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
            <div className="login-container">
                <div className="login-card">
                    <h1 className="login-title">Log In</h1>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
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
                            <label htmlFor="password">Password</label>
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

                        <button type="submit" className="login-button" disabled={isSubmitting}>
                            {isSubmitting ? "Logging in..." : "Log In"}
                        </button>
                    </form>

                    <div className="register-link">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            className="register-link"
                            onClick={() => navigate("/register")}
                            disabled={isSubmitting}
                        >
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

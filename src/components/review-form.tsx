"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import "./css/ReviewForm.css"

interface ReviewFormProps {
    gameId: number
    creatorId: number
    onReviewSubmitted: () => void
}

export function ReviewForm({ gameId, creatorId, onReviewSubmitted }: ReviewFormProps) {
    const { user, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    // Form state
    const [rating, setRating] = useState<number>(5)
    const [review, setReview] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)

    // Check if user is the creator of the game
    const isCreator = user && user.userId === creatorId

    // Handle rating change
    const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number.parseInt(e.target.value, 10)
        setRating(value)
    }

    // Handle review text change
    const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReview(e.target.value)
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            // Validate rating
            if (rating < 1 || rating > 10) {
                setError("Rating must be between 1 and 10")
                setIsSubmitting(false)
                return
            }

            // Prepare review data
            const reviewData: {
                rating: number
                review?: string
            } = {
                rating,
            }

            // Add review text if provided
            if (review.trim()) {
                reviewData.review = review.trim()
            }

            // Submit review
            const response = await fetch(`http://localhost:4941/api/v1/games/${gameId}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": user?.token || "",
                },
                body: JSON.stringify(reviewData),
            })

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    setError("You must be logged in to leave a review")
                } else if (response.status === 403) {
                    setError("You cannot review your own game")
                } else if (response.status === 400) {
                    setError("Invalid review data. Rating must be between 1 and 10")
                } else if (response.status === 404) {
                    setError("Game not found")
                } else {
                    const errorData = await response.json()
                    setError(errorData.message || "Failed to submit review")
                }
                setIsSubmitting(false)
                return
            }

            // Reset form
            setRating(5)
            setReview("")
            setShowForm(false)

            // Notify parent component that review was submitted
            onReviewSubmitted()
        } catch (err) {
            console.error("Error submitting review:", err)
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle login redirect
    const handleLoginRedirect = () => {
        navigate("/login")
    }

    // If user is not authenticated, show login prompt
    if (!isAuthenticated) {
        return (
            <div className="review-login-prompt">
                <h3>Want to leave a review?</h3>
                <p>Please log in or register to review this game.</p>
                <button className="login-button" onClick={handleLoginRedirect}>
                    Log In / Register
                </button>
            </div>
        )
    }

    // If user is the creator, show message
    if (isCreator) {
        return (
            <div className="creator-message">
                <p>As the creator of this game, you cannot leave a review.</p>
            </div>
        )
    }

    return (
        <div className="review-form-container">
            {!showForm ? (
                <button className="write-review-button" onClick={() => setShowForm(true)}>
                    Write a Review
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="review-form">
                    <h3>Write Your Review</h3>

                    {error && <div className="review-error">{error}</div>}

                    <div className="rating-container">
                        <label htmlFor="rating">Rating (1-10):</label>
                        <div className="rating-input-group">
                            <input
                                type="range"
                                id="rating"
                                min="1"
                                max="10"
                                value={rating}
                                onChange={handleRatingChange}
                                disabled={isSubmitting}
                            />
                            <span className="rating-value">{rating}</span>
                        </div>
                    </div>

                    <div className="review-text-container">
                        <label htmlFor="review">Review (Optional):</label>
                        <textarea
                            id="review"
                            value={review}
                            onChange={handleReviewChange}
                            placeholder="Share your thoughts about this game..."
                            rows={4}
                            disabled={isSubmitting}
                        ></textarea>
                    </div>

                    <div className="review-form-actions">
                        <button type="button" className="cancel-button" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

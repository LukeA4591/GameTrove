"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { Header } from "../components/header"
import type { Genre, Platform } from "../types/game"
import "../components/css/EditGamePage.css"

export function EditGamePage() {
    const { gameId } = useParams<{ gameId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
    const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([])
    const [price, setPrice] = useState("")

    // Data from server
    const [genres, setGenres] = useState<Genre[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])

    // Loading states
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dataLoaded, setDataLoaded] = useState(false)

    // Validation state
    const [errors, setErrors] = useState<{
        title?: string
        description?: string
        genre?: string
        platforms?: string
        price?: string
        general?: string
        authorization?: string
    }>({})

    const TITLE_MAX_LENGTH = 128
    const DESCRIPTION_MAX_LENGTH = 1024

    // Fetch game data, genres, and platforms when component mounts
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch genres
                const genresResponse = await fetch("http://localhost:4941/api/v1/games/genres")
                if (!genresResponse.ok) {
                    throw new Error("Failed to fetch genres")
                }
                const genresData: Genre[] = await genresResponse.json()
                setGenres(genresData)

                // Fetch platforms
                const platformsResponse = await fetch("http://localhost:4941/api/v1/games/platforms")
                if (!platformsResponse.ok) {
                    throw new Error("Failed to fetch platforms")
                }
                const platformsData: Platform[] = await platformsResponse.json()
                setPlatforms(platformsData)

                // Fetch game details
                const gameResponse = await fetch(`http://localhost:4941/api/v1/games/${gameId}`)
                if (!gameResponse.ok) {
                    throw new Error("Failed to fetch game details")
                }
                const gameData = await gameResponse.json()

                // Check if the current user is the creator
                if (user?.userId !== gameData.creatorId) {
                    setErrors({
                        authorization: "You do not have permission to edit this game",
                    })
                    return
                }

                // Set form data
                setTitle(gameData.title)
                setDescription(gameData.description)
                setSelectedGenre(gameData.genreId)
                setSelectedPlatforms(gameData.platformIds || [])
                setPrice((gameData.price / 100).toFixed(2)) // Convert cents to dollars

                setDataLoaded(true)
            } catch (err) {
                console.error("Error fetching data:", err)
                setErrors({
                    general: "Failed to load required data. Please try again.",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [gameId, user?.userId])

    // Handle platform selection
    const handlePlatformChange = (platformId: number) => {
        setSelectedPlatforms((prev) => {
            if (prev.includes(platformId)) {
                return prev.filter((id) => id !== platformId)
            } else {
                return [...prev, platformId]
            }
        })
        setErrors((prev) => ({ ...prev, platforms: undefined }))
    }

    // Handle price input
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        // Allow empty string or valid decimal number
        if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
            setPrice(value)
            setErrors((prev) => ({ ...prev, price: undefined }))
        }
    }

    // Validate form
    const validateForm = () => {
        const newErrors: {
            title?: string
            description?: string
            genre?: string
            platforms?: string
            price?: string
        } = {}

        // Validate title
        if (!title.trim()) {
            newErrors.title = "Title is required"
        }

        // Validate description
        if (!description.trim()) {
            newErrors.description = "Description is required"
        }

        // Validate genre
        if (selectedGenre === null) {
            newErrors.genre = "Please select a genre"
        }

        // Validate platforms
        if (selectedPlatforms.length === 0) {
            newErrors.platforms = "Please select at least one platform"
        }

        // Validate price
        if (price === "") {
            newErrors.price = "Price is required"
        } else {
            const priceValue = Number.parseFloat(price)
            if (isNaN(priceValue) || priceValue < 0) {
                newErrors.price = "Price must be a positive number or zero"
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

        try {
            // Convert price from dollars to cents
            const priceInCents = Math.round(Number.parseFloat(price) * 100)

            // Update game
            const updateGameResponse = await fetch(`http://localhost:4941/api/v1/games/${gameId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": user?.token || "",
                },
                body: JSON.stringify({
                    title,
                    description,
                    genreId: selectedGenre,
                    price: priceInCents,
                    platforms: selectedPlatforms,
                }),
            })

            if (!updateGameResponse.ok) {
                // Handle specific error cases
                if (updateGameResponse.status === 403) {
                    setErrors({
                        title: "A game with this title already exists",
                    })
                } else if (updateGameResponse.status === 401) {
                    setErrors({
                        general: "You must be logged in to edit this game",
                    })
                } else if (updateGameResponse.status === 403) {
                    setErrors({
                        authorization: "You do not have permission to edit this game",
                    })
                } else {
                    const errorData = await updateGameResponse.json()
                    setErrors({
                        general: errorData.message || "Failed to update game. Please try again.",
                    })
                }
                setIsSubmitting(false)
                return
            }

            // Navigate to the game details page
            navigate(`/games/${gameId}`)
        } catch (error) {
            console.error("Error updating game:", error)
            setErrors({
                general: "An unexpected error occurred. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (errors.authorization) {
        return (
            <>
                <Header />
                <div className="edit-game-container">
                    <div className="edit-game-card">
                        <div className="error-message">{errors.authorization}</div>
                        <button className="back-button" onClick={() => navigate(`/games/${gameId}`)}>
                            Back to Game
                        </button>
                    </div>
                </div>
            </>
        )
    }

    if (isLoading && !dataLoaded) {
        return (
            <>
                <Header />
                <div className="edit-game-container">
                    <div className="loading-message">Loading game data...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="edit-game-container">
                <div className="edit-game-card">
                    <h1 className="edit-game-title">Edit Game</h1>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <form onSubmit={handleSubmit} className="edit-game-form">
                        <div className="form-group">
                            <label htmlFor="title">Title *</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                maxLength={TITLE_MAX_LENGTH}
                                onChange={(e) => {
                                    setTitle(e.target.value)
                                    setErrors((prev) => ({ ...prev, title: undefined }))
                                }}
                                className={errors.title ? "input-error" : ""}
                                disabled={isSubmitting}
                            />
                            <div className="char-counter faded">
                                {title.length}/{TITLE_MAX_LENGTH}
                            </div>
                            {errors.title && <div className="field-error">{errors.title}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                value={description}
                                maxLength={DESCRIPTION_MAX_LENGTH}
                                onChange={(e) => {
                                    setDescription(e.target.value)
                                    setErrors((prev) => ({ ...prev, description: undefined }))
                                }}
                                className={errors.description ? "input-error" : ""}
                                disabled={isSubmitting}
                                rows={5}
                            />
                            <div className="char-counter faded">
                                {description.length}/{DESCRIPTION_MAX_LENGTH}
                            </div>
                            {errors.description && <div className="field-error">{errors.description}</div>}
                        </div>

                        <div className="form-group">
                            <label>Genre *</label>
                            <div className="genre-options">
                                {genres.map((genre) => (
                                    <label key={genre.genreId} className="genre-option">
                                        <input
                                            type="radio"
                                            name="genre"
                                            checked={selectedGenre === genre.genreId}
                                            onChange={() => {
                                                setSelectedGenre(genre.genreId)
                                                setErrors((prev) => ({ ...prev, genre: undefined }))
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        <span>{genre.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.genre && <div className="field-error">{errors.genre}</div>}
                        </div>

                        <div className="form-group">
                            <label>Platforms *</label>
                            <div className="platform-options">
                                {platforms.map((platform) => (
                                    <label key={platform.platformId} className="platform-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlatforms.includes(platform.platformId)}
                                            onChange={() => handlePlatformChange(platform.platformId)}
                                            disabled={isSubmitting}
                                        />
                                        <span>{platform.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.platforms && <div className="field-error">{errors.platforms}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="price">Price * ($)</label>
                            <input
                                type="text"
                                id="price"
                                value={price}
                                onChange={handlePriceChange}
                                className={errors.price ? "input-error" : ""}
                                disabled={isSubmitting}
                                placeholder="0.00"
                            />
                            <div className="price-hint">Enter 0.00 for free games</div>
                            {errors.price && <div className="field-error">{errors.price}</div>}
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-button" disabled={isSubmitting}>
                                {isSubmitting ? "Saving Changes..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => navigate(`/games/${gameId}`)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

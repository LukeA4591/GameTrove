"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/auth-context"
import { Header } from "../components/header"
import type { Genre, Platform } from "../types/game"
import "../components/css/CreateGamePage.css"

export function CreateGamePage() {
    const navigate = useNavigate()
    const { user } = useAuth()

    // Form state
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
    const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([])
    const [price, setPrice] = useState("")
    const [gameImage, setGameImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const TITLE_MAX_LENGTH = 128
    const DESCRIPTION_MAX_LENGTH = 1024

    // Data from server
    const [genres, setGenres] = useState<Genre[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])

    // Loading states
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dataLoaded, setDataLoaded] = useState(false)

    // Validation state
    const [errors, setErrors] = useState<{
        title?: string
        description?: string
        genre?: string
        platforms?: string
        price?: string
        image?: string
        general?: string
    }>({})

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch genres and platforms when component mounts
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

                setDataLoaded(true)
            } catch (err) {
                console.error("Error fetching data:", err)
                setErrors({
                    general: "Failed to load required data. Please refresh the page.",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // Check file type
            const validTypes = ["image/jpeg", "image/png", "image/gif"]
            if (!validTypes.includes(file.type)) {
                setErrors((prev) => ({
                    ...prev,
                    image: "Please select a valid image file (JPEG, PNG, or GIF)",
                }))
                return
            }

            setGameImage(file)
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
        setGameImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

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
            image?: string
        } = {}

        // Validate title
        if (!title.trim()) {
            newErrors.title = "Title is required"
        } else if (title.length > TITLE_MAX_LENGTH) {
            newErrors.title = `Title must be no more than ${TITLE_MAX_LENGTH} characters`
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

        // Validate image
        if (!gameImage) {
            newErrors.image = "Please upload a game image"
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

            // Create game
            const createGameResponse = await fetch("http://localhost:4941/api/v1/games", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Authorization": user?.token || "",
                },
                body: JSON.stringify({
                    title,
                    description,
                    genreId: selectedGenre,
                    price: priceInCents,
                    platformIds: selectedPlatforms,
                }),
            })

            if (!createGameResponse.ok) {
                // Handle specific error cases
                if (createGameResponse.status === 403) {
                    setErrors({
                        title: "A game with this title already exists",
                    })
                } else if (createGameResponse.status === 401) {
                    setErrors({
                        general: "You must be logged in to create a game",
                    })
                } else {
                    const errorData = await createGameResponse.json()
                    setErrors({
                        general: errorData.message || "Failed to create game. Please try again.",
                    })
                }
                setIsSubmitting(false)
                return
            }

            const gameData = await createGameResponse.json()
            const gameId = gameData.gameId

            // Upload game image
            if (gameImage) {
                const imageResponse = await fetch(`http://localhost:4941/api/v1/games/${gameId}/image`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": gameImage.type,
                        "X-Authorization": user?.token || "",
                    },
                    body: gameImage,
                })

                if (!imageResponse.ok) {
                    console.error("Failed to upload game image")
                    // Continue anyway since the game is created
                }
            }

            // Navigate to the game details page
            navigate(`/games/${gameId}`)
        } catch (error) {
            console.error("Error creating game:", error)
            setErrors({
                general: "An unexpected error occurred. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading && !dataLoaded) {
        return (
            <>
                <Header />
                <div className="create-game-container">
                    <div className="loading-message">Loading required data...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="create-game-container">
                <div className="create-game-card">
                    <h1 className="create-game-title">Create New Game</h1>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <form onSubmit={handleSubmit} className="create-game-form">
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

                        <div className="form-group">
                            <label htmlFor="gameImage">Game Image *</label>
                            <input
                                type="file"
                                id="gameImage"
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
                                <span className="file-name">{gameImage ? gameImage.name : "No file chosen"}</span>
                            </div>
                            <div className="image-hint">Accepted formats: JPEG, PNG, GIF</div>

                            {imagePreview && (
                                <div className="image-preview-container">
                                    <img src={imagePreview || "/placeholder.svg"} alt="Game preview" className="create-game-image-preview" />
                                    <button type="button" className="remove-image" onClick={handleRemoveImage} disabled={isSubmitting}>
                                        Remove
                                    </button>
                                </div>
                            )}

                            {errors.image && <div className="field-error">{errors.image}</div>}
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="create-button" disabled={isSubmitting}>
                                {isSubmitting ? "Creating Game..." : "Create Game"}
                            </button>
                            <button type="button" className="cancel-button" onClick={() => navigate("/")} disabled={isSubmitting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { Game, Genre, Platform } from "../types/game"
import { formatPrice } from "../utils/format"
import { GameCard } from "./game-card"
import "./css/GameDetails.css"

// Try different path approaches for the placeholder image
const PLACEHOLDER_PATHS = [
    // Try multiple possible paths to find the one that works
    "./src/images/PlaceholderIcon.png",
    "../src/images/PlaceholderIcon.png",
    "/src/images/PlaceholderIcon.png",
    "src/images/PlaceholderIcon.png",
    "/images/PlaceholderIcon.png",
    "./images/PlaceholderIcon.png",
]

interface GameDetailsProps {
    gameId: number
    genres: Genre[]
    platforms: Platform[]
    onClose: () => void
}

interface GameDetail {
    gameId: number
    title: string
    description: string
    genreId: number
    creatorId: number
    creatorFirstName: string
    creatorLastName: string
    creationDate: string
    price: number
    platformIds: number[]
    numWishlisted: number
    numOwned: number
    rating: number
    numReviews: number
}

interface Review {
    reviewId: number
    gameId: number
    reviewerId: number
    reviewerFirstName: string
    reviewerLastName: string
    rating: number
    review: string | null
    timestamp: string
}

export function GameDetails({ gameId, genres, platforms, onClose }: GameDetailsProps) {
    const [game, setGame] = useState<GameDetail | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [similarGames, setSimilarGames] = useState<Game[]>([])
    const [loadingSimilar, setLoadingSimilar] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAllReviews, setShowAllReviews] = useState(false)
    const [gameImageError, setGameImageError] = useState(false)
    const [creatorImageError, setCreatorImageError] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [placeholderPath, setPlaceholderPath] = useState<string>("https://via.placeholder.com/100x100?text=User")
    const modalRef = useRef<HTMLDivElement>(null)

    // Use a ref to track reviewer image errors
    const [reviewerImageErrors, setReviewerImageErrors] = useState<Record<number, boolean>>({})

    // Try to find a working placeholder path
    useEffect(() => {
        const testImage = new Image()
        let pathIndex = 0

        const tryNextPath = () => {
            if (pathIndex >= PLACEHOLDER_PATHS.length) {
                console.log("None of the placeholder paths worked, using fallback")
                return
            }

            testImage.onload = () => {
                console.log(`Found working path: ${PLACEHOLDER_PATHS[pathIndex]}`)
                setPlaceholderPath(PLACEHOLDER_PATHS[pathIndex])
            }

            testImage.onerror = () => {
                pathIndex++
                tryNextPath()
            }

            testImage.src = PLACEHOLDER_PATHS[pathIndex]
        }

        tryNextPath()
    }, [])

    useEffect(() => {
        const fetchGameDetails = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetch game details
                const gameResponse = await fetch(`http://localhost:4941/api/v1/games/${gameId}`)
                if (!gameResponse.ok) {
                    throw new Error("Failed to fetch game details")
                }
                const gameData = await gameResponse.json()
                setGame(gameData)

                // Fetch reviews
                const reviewsResponse = await fetch(`http://localhost:4941/api/v1/games/${gameId}/reviews`)
                if (!reviewsResponse.ok) {
                    throw new Error("Failed to fetch game reviews")
                }
                const reviewsData = await reviewsResponse.json()
                setReviews(reviewsData)
            } catch (err) {
                console.error("Error fetching game details:", err)
                setError("Failed to load game details. Please try again.")
            } finally {
                setLoading(false)
            }
        }

        fetchGameDetails()

        // Add event listener to close modal on escape key
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose()
            }
        }

        document.addEventListener("keydown", handleEscapeKey)

        // Prevent body scrolling while modal is open
        document.body.style.overflow = "hidden"

        return () => {
            document.removeEventListener("keydown", handleEscapeKey)
            document.body.style.overflow = "auto"
        }
    }, [gameId])

    // Fetch similar games when game data is loaded
    useEffect(() => {
        const fetchSimilarGames = async () => {
            if (!game) return

            setLoadingSimilar(true)
            try {
                // Build query for similar games (same genre OR same creator)
                const params = new URLSearchParams()

                // We'll fetch more than we need and filter client-side to ensure we get enough results
                params.append("count", "20")

                // Fetch games with the same genre or creator
                const response = await fetch(`http://localhost:4941/api/v1/games?${params.toString()}`)

                if (!response.ok) {
                    throw new Error("Failed to fetch similar games")
                }

                const data = await response.json()

                // Filter games that have the same genre OR same creator, but exclude the current game
                const filtered = data.games.filter((similarGame: Game) => {
                    return (
                        similarGame.gameId !== game.gameId &&
                        (similarGame.genreId === game.genreId || similarGame.creatorId === game.creatorId)
                    )
                })

                // Limit to 6 similar games
                setSimilarGames(filtered.slice(0, 6))
            } catch (err) {
                console.error("Error fetching similar games:", err)
            } finally {
                setLoadingSimilar(false)
            }
        }

        fetchSimilarGames()
    }, [game])

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            onClose()
        }, 300)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            handleClose()
        }
    }

    // Handle reviewer image error
    const handleReviewerImageError = (reviewerId: number) => {
        setReviewerImageErrors((prev) => ({
            ...prev,
            [reviewerId]: true,
        }))
    }

    // Handle similar game selection
    const handleSimilarGameSelect = (similarGameId: number) => {
        // Close current modal and open the new game details
        onClose()
        // Small timeout to ensure the current modal is closed before opening the new one
        setTimeout(() => {
            const event = new CustomEvent("openGameDetails", { detail: { gameId: similarGameId } })
            window.dispatchEvent(event)
        }, 300)
    }

    if (loading) {
        return (
            <div className="game-details-modal" onClick={handleBackdropClick}>
                <div className="game-details-content" ref={modalRef}>
                    <div className="loading-spinner">Loading game details...</div>
                </div>
            </div>
        )
    }

    if (error || !game) {
        return (
            <div className="game-details-modal" onClick={handleBackdropClick}>
                <div className="game-details-content" ref={modalRef}>
                    <div className="error-message">{error || "Failed to load game details"}</div>
                    <button className="close-button" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
        )
    }

    const genre = genres.find((g) => g.genreId === game.genreId)
    const gamePlatforms = platforms.filter((p) => game.platformIds.includes(p.platformId))
    const formattedDate = new Date(game.creationDate).toLocaleDateString()

    // Limit reviews for initial display
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)
    const hasMoreReviews = reviews.length > 3

    return (
        <div
            className={`game-details-modal ${isClosing ? "closing" : ""}`}
            onClick={handleBackdropClick}
            style={{
                animation: isClosing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease forwards",
            }}
        >
            <div
                className="game-details-content"
                ref={modalRef}
                style={{
                    animation: isClosing ? "modalDisappear 0.3s ease forwards" : "modalAppear 0.4s ease 0.1s forwards",
                }}
            >
                <button className="close-button" onClick={handleClose}>
                    &times;
                </button>

                <div className="game-header">
                    <div className="game-hero-image">
                        <img
                            src={
                                gameImageError
                                    ? "https://via.placeholder.com/800x450?text=No+Image"
                                    : `http://localhost:4941/api/v1/games/${gameId}/image`
                            }
                            alt={game.title}
                            onError={() => setGameImageError(true)}
                        />
                    </div>
                    <div className="game-title-section">
                        <h1>{game.title}</h1>
                        <div className="game-meta">
                            <span className="game-price">{formatPrice(game.price)}</span>
                            <span className="game-rating">
                {game.rating > 0 ? (
                    <span>{game.rating.toFixed(1)}/10</span>
                ) : (
                    <span className="not-rated">Not rated</span>
                )}
              </span>
                            <span className="game-date">Released: {formattedDate}</span>
                        </div>
                    </div>
                </div>

                <div className="game-details-grid">
                    <div className="game-info-section">
                        <h2>About this game</h2>
                        <p className="game-description">{game.description}</p>

                        <div className="game-attributes">
                            <div className="attribute">
                                <span className="attribute-label">Genre:</span>
                                <span className="attribute-value">{genre ? genre.name : "Unknown"}</span>
                            </div>
                            <div className="attribute">
                                <span className="attribute-label">Platforms:</span>
                                <span className="attribute-value">
                  {gamePlatforms.length > 0 ? gamePlatforms.map((p) => p.name).join(", ") : "Unknown"}
                </span>
                            </div>
                            <div className="attribute">
                                <span className="attribute-label">Wishlisted by:</span>
                                <span className="attribute-value">{game.numWishlisted} users</span>
                            </div>
                            <div className="attribute">
                                <span className="attribute-label">Owned by:</span>
                                <span className="attribute-value">{game.numOwned} users</span>
                            </div>
                        </div>
                    </div>

                    <div className="creator-section">
                        <h2>Creator</h2>
                        <div className="creator-info">
                            <div className="creator-image">
                                {creatorImageError ? (
                                    <img
                                        src={placeholderPath || "/placeholder.svg"}
                                        alt={`${game.creatorFirstName} ${game.creatorLastName}`}
                                    />
                                ) : (
                                    <img
                                        src={`http://localhost:4941/api/v1/users/${game.creatorId}/image`}
                                        alt={`${game.creatorFirstName} ${game.creatorLastName}`}
                                        onError={() => setCreatorImageError(true)}
                                    />
                                )}
                            </div>
                            <div className="creator-details">
                                <div className="creator-name">
                                    {game.creatorFirstName} {game.creatorLastName}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="reviews-section">
                    <h2>Reviews ({game.numReviews})</h2>

                    {reviews.length === 0 ? (
                        <p className="no-reviews">No reviews yet.</p>
                    ) : (
                        <>
                            <div className="reviews-list">
                                {displayedReviews.map((review, index) => (
                                    <div
                                        key={review.reviewId}
                                        className="review-item"
                                        style={{
                                            animationDelay: `${0.2 + index * 0.1}s`,
                                        }}
                                    >
                                        <div className="review-header">
                                            <div className="reviewer-image">
                                                {reviewerImageErrors[review.reviewerId] ? (
                                                    <img
                                                        src={placeholderPath || "/placeholder.svg"}
                                                        alt={`${review.reviewerFirstName} ${review.reviewerLastName}`}
                                                    />
                                                ) : (
                                                    <img
                                                        src={`http://localhost:4941/api/v1/users/${review.reviewerId}/image`}
                                                        alt={`${review.reviewerFirstName} ${review.reviewerLastName}`}
                                                        onError={() => handleReviewerImageError(review.reviewerId)}
                                                    />
                                                )}
                                            </div>
                                            <div className="reviewer-info">
                                                <div className="reviewer-name">
                                                    {review.reviewerFirstName} {review.reviewerLastName}
                                                </div>
                                                <div className="review-date">
                                                    {new Date(review.timestamp).toLocaleDateString()} at{" "}
                                                    {new Date(review.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <div className="review-rating">{review.rating}/10</div>
                                        </div>
                                        {review.review && <div className="review-text">{review.review}</div>}
                                    </div>
                                ))}
                            </div>

                            {hasMoreReviews && (
                                <button className="show-more-reviews" onClick={() => setShowAllReviews(!showAllReviews)}>
                                    {showAllReviews ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Similar Games Section */}
                <div className="similar-games-section">
                    <h2>Similar Games</h2>

                    {loadingSimilar ? (
                        <div className="loading-similar">Loading similar games...</div>
                    ) : similarGames.length > 0 ? (
                        <div className="similar-games-grid">
                            {similarGames.map((similarGame) => (
                                <div key={similarGame.gameId} className="similar-game-card">
                                    <GameCard
                                        game={similarGame}
                                        genre={genres.find((g) => g.genreId === similarGame.genreId)}
                                        platforms={platforms.filter((p) => similarGame.platformIds.includes(p.platformId))}
                                        onGameSelect={handleSimilarGameSelect}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-similar-games">No similar games found.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

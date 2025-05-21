"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { formatPrice } from "../utils/format"
import type { Game, Genre, Platform } from "../types/game"
import "../components/css/GameDetailsPage.css"

// Define interfaces for the data we'll be working with
interface GameDetail {
    gameId: number
    title: string
    description: string
    genreId: number
    creationDate: string
    creatorId: number
    price: number
    creatorFirstName: string
    creatorLastName: string
    rating: number
    platformIds: number[]
    numberOfWishlists?: number
    numberOfOwners?: number
    numWishlisted?: number
    numOwned?: number
    numReviews?: number
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

export function GameDetailsPage() {
    const { gameId } = useParams<{ gameId: string }>()
    const navigate = useNavigate()

    // State
    const [game, setGame] = useState<GameDetail | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [similarGames, setSimilarGames] = useState<Game[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAllReviews, setShowAllReviews] = useState(false)

    // Fetch game details
    useEffect(() => {
        async function fetchData() {
            if (!gameId) return

            setLoading(true)
            try {
                // Fetch genres
                const genresRes = await fetch("http://localhost:4941/api/v1/games/genres")
                if (!genresRes.ok) throw new Error("Failed to fetch genres")
                const genresData = await genresRes.json()
                setGenres(genresData)

                // Fetch platforms
                const platformsRes = await fetch("http://localhost:4941/api/v1/games/platforms")
                if (!platformsRes.ok) throw new Error("Failed to fetch platforms")
                const platformsData = await platformsRes.json()
                setPlatforms(platformsData)

                // Fetch game details
                const gameRes = await fetch(`http://localhost:4941/api/v1/games/${gameId}`)
                if (!gameRes.ok) throw new Error("Failed to fetch game details")
                const gameData = await gameRes.json()
                setGame(gameData)

                // Fetch reviews
                const reviewsRes = await fetch(`http://localhost:4941/api/v1/games/${gameId}/reviews`)
                if (!reviewsRes.ok) throw new Error("Failed to fetch reviews")
                const reviewsData = await reviewsRes.json()
                setReviews(reviewsData)
            } catch (err) {
                console.error("Error fetching data:", err)
                setError("Failed to load game data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [gameId])

    // Fetch similar games
    useEffect(() => {
        async function fetchSimilarGames() {
            if (!game) return

            try {
                const res = await fetch("http://localhost:4941/api/v1/games?count=20")
                if (!res.ok) throw new Error("Failed to fetch similar games")
                const data = await res.json()

                // Filter for games with same genre or creator
                const filtered = data.games.filter(
                    (similarGame: Game) =>
                        similarGame.gameId !== game.gameId &&
                        (similarGame.genreId === game.genreId || similarGame.creatorId === game.creatorId),
                )

                setSimilarGames(filtered.slice(0, 6)) // Limit to 6 games
            } catch (err) {
                console.error("Error fetching similar games:", err)
            }
        }

        fetchSimilarGames()
    }, [game])

    // Handle back button
    const handleBackClick = () => {
        navigate("/")
    }

    // Handle similar game click
    const handleSimilarGameClick = (id: number) => {
        navigate(`/games/${id}`)
        window.scrollTo(0, 0)
    }

    if (loading) {
        return <div className="game-details-container">Loading...</div>
    }

    if (error || !game) {
        return (
            <div className="game-details-container">
                <div className="error">{error || "Game not found"}</div>
                <button className="back-button" onClick={handleBackClick}>
                    ← Back to Games
                </button>
            </div>
        )
    }

    // Find genre and platforms
    const genre = genres.find((g) => g.genreId === game.genreId)
    const gamePlatforms = platforms.filter((p) => game.platformIds.includes(p.platformId))

    // Format date
    const formattedDate = new Date(game.creationDate).toLocaleDateString()

    // Get wishlist and owned counts
    const wishlistCount = game.numberOfWishlists || game.numWishlisted || 0
    const ownedCount = game.numberOfOwners || game.numOwned || 0

    // Limit reviews for initial display
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

    return (
        <div className="game-details-container">
            <button className="back-button" onClick={handleBackClick}>
                ← Back to Games
            </button>

            {/* Completely redesigned header using table layout */}
            <div className="game-header">
                <div className="game-header-row">
                    <div className="game-header-info">
                        <h1 className="game-title">{game.title}</h1>

                        <div className="game-meta">
                            <div className="meta-item">
                                <span className="meta-label">Released:</span>
                                <span className="meta-value">{formattedDate}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Price:</span>
                                <span className="meta-value">{formatPrice(game.price)}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Rating:</span>
                                <span className="meta-value">{game.rating > 0 ? `${game.rating}/10` : "Not rated"}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Genre:</span>
                                <span className="meta-value">{genre ? genre.name : "Unknown"}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Platforms:</span>
                                <span className="meta-value">{gamePlatforms.map((p) => p.name).join(", ")}</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Wishlisted by:</span>
                                <span className="meta-value">{wishlistCount} users</span>
                            </div>

                            <div className="meta-item">
                                <span className="meta-label">Owned by:</span>
                                <span className="meta-value">{ownedCount} users</span>
                            </div>
                        </div>
                    </div>

                    <div className="game-image-cell">
                        <div className="game-image-container">
                            <img
                                src={`http://localhost:4941/api/v1/games/${gameId}/image`}
                                alt={game.title}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "https://via.placeholder.com/250x250?text=No+Image"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Description */}
            <div className="game-section">
                <h2>About this game</h2>
                <p className="game-description">{game.description}</p>
            </div>

            <div className="game-info-grid">
                {/* Creator Info */}
                <div className="game-section">
                    <h2>Creator</h2>
                    <div className="creator-info">
                        <img
                            src={`http://localhost:4941/api/v1/users/${game.creatorId}/image`}
                            alt="Creator"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/PlaceholderIcon.png" // Using the public folder
                            }}
                        />
                        <div>
                            <div className="creator-name">
                                {game.creatorFirstName} {game.creatorLastName}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews */}
            <div className="game-section">
                <h2>Reviews ({reviews.length})</h2>
                {reviews.length === 0 ? (
                    <p>No reviews yet.</p>
                ) : (
                    <>
                        <div className="reviews-list">
                            {displayedReviews.map((review) => (
                                <div key={review.reviewId} className="review-item">
                                    <div className="review-header">
                                        <img
                                            src={`http://localhost:4941/api/v1/users/${review.reviewerId}/image`}
                                            alt="Reviewer"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = "/PlaceholderIcon.png" // Using the public folder
                                            }}
                                        />
                                        <div>
                                            <div className="reviewer-name">
                                                {review.reviewerFirstName} {review.reviewerLastName}
                                            </div>
                                            <div className="review-date">{new Date(review.timestamp).toLocaleString()}</div>
                                        </div>
                                        <div className="review-rating">{review.rating}/10</div>
                                    </div>
                                    {review.review && <p className="review-text">{review.review}</p>}
                                </div>
                            ))}
                        </div>

                        {reviews.length > 3 && (
                            <button className="show-more-button" onClick={() => setShowAllReviews(!showAllReviews)}>
                                {showAllReviews ? "Show Less" : `Show All (${reviews.length})`}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Similar Games */}
            <div className="game-section">
                <h2>Similar Games</h2>
                {similarGames.length === 0 ? (
                    <p>No similar games found.</p>
                ) : (
                    <div className="similar-games-grid">
                        {similarGames.map((game) => (
                            <div key={game.gameId} className="similar-game-card" onClick={() => handleSimilarGameClick(game.gameId)}>
                                <img
                                    src={`http://localhost:4941/api/v1/games/${game.gameId}/image`}
                                    alt={game.title}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "https://via.placeholder.com/150x150?text=Game"
                                    }}
                                />
                                <div className="similar-game-info">
                                    <h3>{game.title}</h3>
                                    <div>
                                        <span>{genres.find((g) => g.genreId === game.genreId)?.name}</span>
                                        <span>{formatPrice(game.price)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

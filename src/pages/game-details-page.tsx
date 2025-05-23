"use client"

import {useState, useEffect} from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import {formatPrice} from "../utils/format"
import type {Game, Genre, Platform} from "../types/game"
import {Header} from "../components/header"
import {useAuth} from "../contexts/auth-context"
import {ConfirmationModal} from "../components/confirmation-modal"
import { ReviewForm } from "../components/review-form"
import "../components/css/GameDetailsPage.css"
import { GameCard } from "../components/game-card"

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
    const {gameId} = useParams<{ gameId: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const {user} = useAuth()

    // State
    const [game, setGame] = useState<GameDetail | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [similarGames, setSimilarGames] = useState<Game[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAllReviews, setShowAllReviews] = useState(false)

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // Wishlisting state
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [isOwned, setIsOwned] = useState(false)
    const [isWishlistLoading, setIsWishlistLoading] = useState(false)
    const [isOwnLoading, setIsOwnLoading] = useState(false)

    // Check if the current user is the creator of the game
    const isCreator = user && game && user.userId === game.creatorId

    // Check if the game has reviews
    const hasReviews = reviews.length > 0

    // Check if the current user has already reviewed this game
    const hasUserReviewed = user && reviews.some((review) => review.reviewerId === user.userId)

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

                // Check if game is wishlisted or owned by current user
                if (user) {
                    try {
                        // Check if game is wishlisted by fetching all wishlisted games
                        const wishlistRes = await fetch("http://localhost:4941/api/v1/games?wishlistedByMe=true", {
                            headers: {
                                "X-Authorization": user.token,
                            },
                        })

                        if (wishlistRes.ok) {
                            const wishlistData = await wishlistRes.json()
                            // Check if current game is in the wishlisted games list
                            const isGameWishlisted = wishlistData.games.some((g: Game) => g.gameId === Number(gameId))
                            setIsWishlisted(isGameWishlisted)
                        } else {
                            console.error("Failed to fetch wishlisted games:", await wishlistRes.text())
                        }

                        // Check if game is owned by fetching all owned games
                        const ownedRes = await fetch("http://localhost:4941/api/v1/games?ownedByMe=true", {
                            headers: {
                                "X-Authorization": user.token,
                            },
                        })

                        if (ownedRes.ok) {
                            const ownedData = await ownedRes.json()
                            // Check if current game is in the owned games list
                            const isGameOwned = ownedData.games.some((g: Game) => g.gameId === Number(gameId))
                            setIsOwned(isGameOwned)
                        } else {
                            console.error("Failed to fetch owned games:", await ownedRes.text())
                        }
                    } catch (err) {
                        console.error("Error checking wishlist/owned status:", err)
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err)
                setError("Failed to load game data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [gameId, user])

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
        // Check if we have location state with a 'from' property
        const state = location.state as { from?: string; category?: string } | null

        if (state && state.from === "my-games") {
            // If coming from my-games, navigate back to my-games with the active category
            navigate("/my-games", { state: { activeCategory: state.category } })
        } else {
            // Otherwise, navigate to the home page
            navigate("/")
        }
    }

    // Handle edit button
    const handleEditClick = () => {
        navigate(`/games/${gameId}/edit`)
    }

    // Handle delete button
    const handleDeleteClick = () => {
        setShowDeleteModal(true)
        setDeleteError(null)
    }

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!gameId || !user) return

        setIsDeleting(true)
        setDeleteError(null)

        try {
            const response = await fetch(`http://localhost:4941/api/v1/games/${gameId}`, {
                method: "DELETE",
                headers: {
                    "X-Authorization": user.token,
                },
            })

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 403) {
                    if (hasReviews) {
                        setDeleteError("This game cannot be deleted because it has reviews.")
                    } else {
                        setDeleteError("You do not have permission to delete this game.")
                    }
                } else if (response.status === 401) {
                    setDeleteError("You must be logged in to delete this game.")
                } else if (response.status === 404) {
                    setDeleteError("Game not found.")
                } else {
                    setDeleteError("An error occurred while deleting the game.")
                }
                return
            }

            // Redirect to home page after successful deletion
            navigate("/", {replace: true})
        } catch (error) {
            console.error("Error deleting game:", error)
            setDeleteError("An unexpected error occurred. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    // Handle delete cancellation
    const handleDeleteCancel = () => {
        setShowDeleteModal(false)
        setDeleteError(null)
    }

    // Handle similar game click
    const handleSimilarGameClick = (gameId: number) => {
        navigate(`/games/${gameId}`)
        window.scrollTo(0, 0)
    }


    // Handle review submission
    const handleReviewSubmitted = async () => {
        if (!gameId) return

        try {
            // Refresh reviews
            const reviewsRes = await fetch(`http://localhost:4941/api/v1/games/${gameId}/reviews`)
            if (!reviewsRes.ok) throw new Error("Failed to fetch reviews")
            const reviewsData = await reviewsRes.json()
            setReviews(reviewsData)

            // Refresh game details to get updated rating
            const gameRes = await fetch(`http://localhost:4941/api/v1/games/${gameId}`)
            if (!gameRes.ok) throw new Error("Failed to fetch game details")
            const gameData = await gameRes.json()
            setGame(gameData)
        } catch (err) {
            console.error("Error refreshing data after review:", err)
        }
    }

    // Handle wishlist toggle
    const handleWishlistToggle = async () => {
        if (!user || !gameId) return

        setIsWishlistLoading(true)

        try {
            const method = isWishlisted ? "DELETE" : "POST"

            console.log(
                `Sending ${method} request to toggle wishlist status. Current status: ${isWishlisted ? "wishlisted" : "not wishlisted"}`,
            )

            const response = await fetch(`http://localhost:4941/api/v1/games/${gameId}/wishlist`, {
                method,
                headers: {
                    "X-Authorization": user.token,
                },
            })

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    console.error("You must be logged in to wishlist a game")
                } else if (response.status === 403) {
                    console.error("You cannot wishlist your own game or a game you already own")
                } else if (response.status === 404) {
                    console.error("Game not found")
                } else {
                    console.error("Failed to update wishlist status:", response.status, await response.text())
                }
                return
            }

            // Toggle wishlist state
            const newWishlistState = !isWishlisted
            console.log(`Wishlist status toggled to: ${newWishlistState ? "wishlisted" : "not wishlisted"}`)
            setIsWishlisted(newWishlistState)

            // Refresh game details to update counts
            const gameRes = await fetch(`http://localhost:4941/api/v1/games/${gameId}`)
            if (gameRes.ok) {
                const gameData = await gameRes.json()
                setGame(gameData)
            }
        } catch (err) {
            console.error("Error updating wishlist:", err)
        } finally {
            setIsWishlistLoading(false)
        }
    }


    // Handle own toggle
    const handleOwnToggle = async () => {
        if (!user || !gameId) return

        setIsOwnLoading(true)

        try {
            // Use DELETE method when removing from owned, POST when adding to owned
            const method = isOwned ? "DELETE" : "POST"

            console.log(
                `Sending ${method} request to toggle owned status. Current status: ${isOwned ? "owned" : "not owned"}`,
            )

            const response = await fetch(`http://localhost:4941/api/v1/games/${gameId}/owned`, {
                method,
                headers: {
                    "X-Authorization": user.token,
                },
            })

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    console.error("You must be logged in to mark a game as owned")
                } else if (response.status === 403) {
                    console.error("You cannot mark your own game as owned")
                } else if (response.status === 404) {
                    console.error("Game not found")
                } else {
                    console.error("Failed to update owned status:", response.status, await response.text())
                }
                return
            }

            // Toggle owned state
            const newOwnedState = !isOwned
            console.log(`Owned status toggled to: ${newOwnedState ? "owned" : "not owned"}`)
            setIsOwned(newOwnedState)

            // If the game was wishlisted and is now owned, it should be removed from wishlist
            if (newOwnedState && isWishlisted) {
                setIsWishlisted(false)
            }

            // Refresh game details to update counts
            const gameRes = await fetch(`http://localhost:4941/api/v1/games/${gameId}`)
            if (gameRes.ok) {
                const gameData = await gameRes.json()
                setGame(gameData)
            }
        } catch (err) {
            console.error("Error updating owned status:", err)
        } finally {
            setIsOwnLoading(false)
        }
    }

// Function to refresh wishlist status
    const refreshWishlistStatus = async () => {
        if (!user || !gameId) return

        try {
            // Fetch all wishlisted games
            const wishlistRes = await fetch("http://localhost:4941/api/v1/games?wishlistedByMe=true", {
                headers: {
                    "X-Authorization": user.token,
                },
            })

            if (wishlistRes.ok) {
                const wishlistData = await wishlistRes.json()
                // Check if current game is in the wishlisted games list
                const isGameWishlisted = wishlistData.games.some((g: Game) => g.gameId === Number(gameId))
                console.log("Refreshed wishlist status:", isGameWishlisted)
                setIsWishlisted(isGameWishlisted)
            } else {
                console.error("Failed to refresh wishlisted games:", await wishlistRes.text())
            }

            // Fetch all owned games
            const ownedRes = await fetch("http://localhost:4941/api/v1/games?ownedByMe=true", {
                headers: {
                    "X-Authorization": user.token,
                },
            })

            if (ownedRes.ok) {
                const ownedData = await ownedRes.json()
                // Check if current game is in the owned games list
                const isGameOwned = ownedData.games.some((g: Game) => g.gameId === Number(gameId))
                setIsOwned(isGameOwned)
            } else {
                console.error("Failed to refresh owned games:", await ownedRes.text())
            }
        } catch (err) {
            console.error("Error refreshing wishlist/owned status:", err)
        }
    }

    // Add effect to refresh wishlist status when component mounts or when user changes
    useEffect(() => {
        if (user && gameId) {
            refreshWishlistStatus()
        }
    }, [user, gameId])

    if (loading) {
        return (
            <>
                <Header/>
                <div className="game-details-container">Loading...</div>
            </>
        )
    }

    if (error || !game) {
        return (
            <>
                <Header/>
                <div className="game-details-container">
                    <div className="error">{error || "Game not found"}</div>
                    <button className="back-button" onClick={handleBackClick}>
                        ← Back to Games
                    </button>
                </div>
            </>
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
        <>
            <Header/>
            <div className="game-details-container">
                <div className="game-header-actions">
                    <button className="back-button" onClick={handleBackClick}>
                        ← Back
                    </button>
                    {isCreator && (
                        <div className="creator-actions">
                            <button className="edit-button" onClick={handleEditClick}>
                                Edit Game
                            </button>
                            <button
                                className="delete-button"
                                onClick={handleDeleteClick}
                                disabled={hasReviews || wishlistCount !== 0 || ownedCount !== 0}
                                title={
                                    hasReviews
                                        ? "Games with reviews cannot be deleted"
                                        : wishlistCount !== 0 || ownedCount !== 0
                                            ? "Games wishlisted or owned by users cannot be deleted"
                                            : "Delete this game"
                                }
                            >
                                Delete Game
                            </button>
                        </div>
                    )}
                </div>

                {/* Game Header with Image and Details Side by Side */}
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
                                    <span
                                        className="meta-value">{game.rating > 0 ? `${game.rating}/10` : "Not rated"}</span>
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
                            {user && !isCreator && (
                                <div className="game-actions">
                                    {!isOwned ? (
                                        <>
                                            <button
                                                className="own-button"
                                                onClick={handleOwnToggle}
                                                disabled={isOwnLoading}
                                                title="Mark as owned"
                                            >
                                                {isOwnLoading ? "Updating..." : "Mark as Owned"}
                                            </button>

                                            <button
                                                className={`wishlist-button ${isWishlisted ? "wishlisted" : ""}`}
                                                onClick={handleWishlistToggle}
                                                disabled={isWishlistLoading}
                                                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                                            >
                                                {isWishlistLoading ? "Updating..." : isWishlisted ? "Wishlisted ★" : "Add to Wishlist ☆"}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="owned-badge">
                                            You own this game
                                            <button className="remove-owned-button" onClick={handleOwnToggle} disabled={isOwnLoading}>
                                                {isOwnLoading ? "Updating..." : "Remove from Owned"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!user && (
                                <div className="game-actions">
                                    <button className="login-to-wishlist" onClick={() => navigate("/login")}>
                                        Log in to Wishlist/Own
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Game Description */}
                <div className="game-section">
                    <h2>About this game</h2>
                    <p className="game-description">{game.description}</p>
                </div>

                {/* Review Form - only show if user hasn't already reviewed */}
                {!hasUserReviewed && (
                    <ReviewForm
                        gameId={Number.parseInt(gameId || "0", 10)}
                        creatorId={game.creatorId}
                        onReviewSubmitted={handleReviewSubmitted}
                    />
                )}

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
                                                <div
                                                    className="review-date">{new Date(review.timestamp).toLocaleString()}</div>
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
                                <GameCard
                                    key={game.gameId}
                                    game={game}
                                    genre={genres.find((g) => g.genreId === game.genreId)}
                                    platforms={platforms.filter((p) => game.platformIds.includes(p.platformId))}
                                    onGameSelect={handleSimilarGameClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    title="Delete Game"
                    message={`Are you sure you want to delete "${game.title}"? This action cannot be undone.`}
                    confirmText="Delete Game"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={handleDeleteCancel}
                    isLoading={isDeleting}
                    error={deleteError}
                />
            </div>
        </>
    )
}

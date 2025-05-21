"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Header } from "../components/header"
import { GameCard } from "../components/game-card"
import { useAuth } from "../contexts/auth-context"
import type { Game, Genre, Platform } from "../types/game"
import "../components/css/MyGamesPage.css"

type GameCategory = "created" | "reviewed" | "wishlisted" | "owned"

export function MyGamesPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, isAuthenticated } = useAuth()

    // State for games in different categories
    const [createdGames, setCreatedGames] = useState<Game[]>([])
    const [reviewedGames, setReviewedGames] = useState<Game[]>([])
    const [wishlistedGames, setWishlistedGames] = useState<Game[]>([])
    const [ownedGames, setOwnedGames] = useState<Game[]>([])

    // State for genres and platforms (needed for GameCard)
    const [genres, setGenres] = useState<Genre[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])

    // Loading and error states
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Active category tab
    const [activeCategory, setActiveCategory] = useState<GameCategory>("created")

    // Fetch genres and platforms (needed for GameCard)
    useEffect(() => {
        const fetchGenresAndPlatforms = async () => {
            try {
                // Fetch genres
                const genresResponse = await fetch("http://localhost:4941/api/v1/games/genres")
                if (!genresResponse.ok) throw new Error("Failed to fetch genres")
                const genresData = await genresResponse.json()
                setGenres(genresData)

                // Fetch platforms
                const platformsResponse = await fetch("http://localhost:4941/api/v1/games/platforms")
                if (!platformsResponse.ok) throw new Error("Failed to fetch platforms")
                const platformsData = await platformsResponse.json()
                setPlatforms(platformsData)
            } catch (err) {
                console.error("Error fetching genres and platforms:", err)
                setError("Failed to load game categories")
            }
        }

        fetchGenresAndPlatforms()
    }, [])

    // Fetch games for all categories
    const fetchAllGames = async () => {
        if (!isAuthenticated || !user) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Fetch games created by the user
            const createdResponse = await fetch(`http://localhost:4941/api/v1/games?creatorId=${user.userId}`)
            if (!createdResponse.ok) throw new Error("Failed to fetch created games")
            const createdData = await createdResponse.json()
            setCreatedGames(createdData.games || [])

            // Fetch games reviewed by the user
            const reviewedResponse = await fetch(`http://localhost:4941/api/v1/games?reviewerId=${user.userId}`)
            if (!reviewedResponse.ok) throw new Error("Failed to fetch reviewed games")
            const reviewedData = await reviewedResponse.json()
            setReviewedGames(reviewedData.games || [])

            // Fetch wishlisted games
            const wishlistedResponse = await fetch("http://localhost:4941/api/v1/games?wishlistedByMe=true", {
                headers: {
                    "X-Authorization": user.token,
                },
            })
            if (!wishlistedResponse.ok) throw new Error("Failed to fetch wishlisted games")
            const wishlistedData = await wishlistedResponse.json()
            setWishlistedGames(wishlistedData.games || [])

            // Fetch owned games
            const ownedResponse = await fetch("http://localhost:4941/api/v1/games?ownedByMe=true", {
                headers: {
                    "X-Authorization": user.token,
                },
            })
            if (!ownedResponse.ok) throw new Error("Failed to fetch owned games")
            const ownedData = await ownedResponse.json()
            setOwnedGames(ownedData.games || [])
        } catch (err) {
            console.error("Error fetching games:", err)
            setError("Failed to load your games. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Fetch games when component mounts or when user changes
    useEffect(() => {
        fetchAllGames()
    }, [isAuthenticated, user])

    // Also fetch games when location changes (to refresh after navigating back from game details)
    useEffect(() => {
        fetchAllGames()
    }, [location])

    // Handle category change
    const handleCategoryChange = (category: GameCategory) => {
        setActiveCategory(category)
    }

    // Get active games based on selected category
    const getActiveGames = () => {
        switch (activeCategory) {
            case "created":
                return createdGames
            case "reviewed":
                return reviewedGames
            case "wishlisted":
                return wishlistedGames
            case "owned":
                return ownedGames
            default:
                return []
        }
    }

    // Get count for each category
    const getCategoryCount = (category: GameCategory) => {
        switch (category) {
            case "created":
                return createdGames.length
            case "reviewed":
                return reviewedGames.length
            case "wishlisted":
                return wishlistedGames.length
            case "owned":
                return ownedGames.length
            default:
                return 0
        }
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return (
            <>
                <Header />
                <div className="my-games-container">
                    <div className="not-authenticated">
                        <h2>Please log in to view your games</h2>
                        <button className="login-button" onClick={() => navigate("/login")}>
                            Log In
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="my-games-container">
                <h1 className="page-title">My Games</h1>

                {/* Category tabs */}
                <div className="category-tabs">
                    <button
                        className={`category-tab ${activeCategory === "created" ? "active" : ""}`}
                        onClick={() => handleCategoryChange("created")}
                    >
                        Created ({getCategoryCount("created")})
                    </button>
                    <button
                        className={`category-tab ${activeCategory === "reviewed" ? "active" : ""}`}
                        onClick={() => handleCategoryChange("reviewed")}
                    >
                        Reviewed ({getCategoryCount("reviewed")})
                    </button>
                    <button
                        className={`category-tab ${activeCategory === "wishlisted" ? "active" : ""}`}
                        onClick={() => handleCategoryChange("wishlisted")}
                    >
                        Wishlisted ({getCategoryCount("wishlisted")})
                    </button>
                    <button
                        className={`category-tab ${activeCategory === "owned" ? "active" : ""}`}
                        onClick={() => handleCategoryChange("owned")}
                    >
                        Owned ({getCategoryCount("owned")})
                    </button>
                </div>

                {/* Games display */}
                <div className="games-section">
                    {loading ? (
                        <div className="loading-message">Loading your games...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <>
                            <h2 className="category-title">
                                {activeCategory === "created" && "Games You Created"}
                                {activeCategory === "reviewed" && "Games You Reviewed"}
                                {activeCategory === "wishlisted" && "Games You Wishlisted"}
                                {activeCategory === "owned" && "Games You Own"}
                            </h2>

                            {getActiveGames().length === 0 ? (
                                <div className="no-games-message">
                                    {activeCategory === "created" && "You haven't created any games yet."}
                                    {activeCategory === "reviewed" && "You haven't reviewed any games yet."}
                                    {activeCategory === "wishlisted" && "You haven't wishlisted any games yet."}
                                    {activeCategory === "owned" && "You don't own any games yet."}
                                </div>
                            ) : (
                                <div className="games-grid">
                                    {getActiveGames().map((game) => (
                                        <GameCard
                                            key={game.gameId}
                                            game={game}
                                            genre={genres.find((g) => g.genreId === game.genreId)}
                                            platforms={platforms.filter((p) => game.platformIds.includes(p.platformId))}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

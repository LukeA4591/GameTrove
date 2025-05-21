"use client"

import type { Game, Genre, Platform } from "../types/game"
import { GameCard } from "./game-card"
import type { FilterOptions } from "./game-filters"
import "./css/GamesList.css"

interface GamesListProps {
    games: Game[]
    genres: Genre[]
    platforms: Platform[]
    isLoading: boolean
    error: string | null
    searchQuery: string
    filters: FilterOptions
    currentPage: number
    pageSize: number
    totalGames: number
}

export function GamesList({
                              games,
                              genres,
                              platforms,
                              isLoading,
                              error,
                              searchQuery,
                              filters,
                              currentPage,
                              pageSize,
                              totalGames,
                          }: GamesListProps) {
    if (isLoading) {
        return (
            <div className="loading-message">
                <p>Loading games...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-message">
                <p>{error}</p>
            </div>
        )
    }

    // Check if any filters are active
    const hasActiveFilters =
        filters.selectedGenres.length > 0 || filters.selectedPlatforms.length > 0 || filters.maxPrice !== null

    // No results message based on search or filters
    if (totalGames === 0) {
        if (searchQuery.length > 0 || hasActiveFilters) {
            return (
                <div className="no-results">
                    <p>
                        No games found matching your {searchQuery ? "search" : ""}
                        {searchQuery && hasActiveFilters ? " and " : ""}
                        {hasActiveFilters ? "filters" : ""}
                    </p>
                </div>
            )
        }
        return (
            <div className="loading-message">
                <p>No games available</p>
            </div>
        )
    }

    // Create filter description text
    let filterDescription = ""
    if (hasActiveFilters) {
        const parts = []

        if (filters.selectedGenres.length > 0) {
            const genreNames = filters.selectedGenres
                .map((id) => genres.find((g) => g.genreId === id)?.name || "")
                .filter(Boolean)
            parts.push(`genres: ${genreNames.join(", ")}`)
        }

        if (filters.selectedPlatforms.length > 0) {
            const platformNames = filters.selectedPlatforms
                .map((id) => platforms.find((p) => p.platformId === id)?.name || "")
                .filter(Boolean)
            parts.push(`platforms: ${platformNames.join(", ")}`)
        }

        if (filters.maxPrice !== null) {
            parts.push(`max price: $${(filters.maxPrice / 100).toFixed(2)}`)
        }

        filterDescription = parts.join(", ")
    }

    // Calculate the range of games being displayed
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalGames)

    return (
        <div>
            <p className="results-info">
                {searchQuery || hasActiveFilters ? (
                    <>
                        Found {totalGames} game{totalGames !== 1 ? "s" : ""}
                        {searchQuery && (
                            <span>
                {" "}
                                matching "<span className="highlight">{searchQuery}</span>"
              </span>
                        )}
                        {hasActiveFilters && <span> with {filterDescription}</span>}
                    </>
                ) : (
                    <>All games</>
                )}
                <span className="results-range">
          {" "}
                    (showing {startItem}-{endItem} of {totalGames})
        </span>
            </p>
            <div className="games-grid">
                {games.map((game) => (
                    <GameCard
                        key={game.gameId}
                        game={game}
                        genre={genres.find((g) => g.genreId === game.genreId)}
                        platforms={platforms.filter((p) => game.platformIds.includes(p.platformId))}
                    />
                ))}
            </div>
        </div>
    )
}

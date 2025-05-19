import type React from "react"

import { useState } from "react"
import type { Genre, Platform } from "../types/game"
import "./css/GameFilters.css"

export interface FilterOptions {
    selectedGenres: number[]
    selectedPlatforms: number[]
    maxPrice: number | null // in cents
}

interface GameFiltersProps {
    genres: Genre[]
    platforms: Platform[]
    initialFilters: FilterOptions
    onApplyFilters: (filters: FilterOptions) => void
}

export function GameFilters({ genres, platforms, initialFilters, onApplyFilters }: GameFiltersProps) {
    // Local state for filter UI
    const [selectedGenres, setSelectedGenres] = useState<number[]>(initialFilters.selectedGenres)
    const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>(initialFilters.selectedPlatforms)
    const [maxPrice, setMaxPrice] = useState<number | null>(initialFilters.maxPrice)
    const [priceInput, setPriceInput] = useState<string>(
        initialFilters.maxPrice !== null ? (initialFilters.maxPrice / 100).toFixed(2) : "",
    )

    const handleGenreChange = (genreId: number) => {
        setSelectedGenres((prev) => (prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]))
    }

    const handlePlatformChange = (platformId: number) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId],
        )
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPriceInput(value)

        if (value === "") {
            setMaxPrice(null)
        } else {
            // Convert dollars to cents
            const priceInCents = Math.round(Number.parseFloat(value) * 100)
            setMaxPrice(priceInCents)
        }
    }

    const handleApplyFilters = () => {
        onApplyFilters({
            selectedGenres,
            selectedPlatforms,
            maxPrice,
        })
    }

    const clearFilters = () => {
        setSelectedGenres([])
        setSelectedPlatforms([])
        setMaxPrice(null)
        setPriceInput("")

        // Also apply the cleared filters immediately
        onApplyFilters({
            selectedGenres: [],
            selectedPlatforms: [],
            maxPrice: null,
        })
    }

    // Check if current filters differ from applied filters
    const hasChanges =
        JSON.stringify([selectedGenres, selectedPlatforms, maxPrice]) !==
        JSON.stringify([initialFilters.selectedGenres, initialFilters.selectedPlatforms, initialFilters.maxPrice])

    return (
        <div className="filters-container">
            <h2 className="filters-title">Filter Games</h2>

            <div className="filter-section">
                <h3 className="filter-section-title">Genres</h3>
                <div className="filter-options">
                    {genres.map((genre) => (
                        <label key={genre.genreId} className="filter-option">
                            <input
                                type="checkbox"
                                checked={selectedGenres.includes(genre.genreId)}
                                onChange={() => handleGenreChange(genre.genreId)}
                            />
                            <span>{genre.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3 className="filter-section-title">Platforms</h3>
                <div className="filter-options">
                    {platforms.map((platform) => (
                        <label key={platform.platformId} className="filter-option">
                            <input
                                type="checkbox"
                                checked={selectedPlatforms.includes(platform.platformId)}
                                onChange={() => handlePlatformChange(platform.platformId)}
                            />
                            <span>{platform.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h3 className="filter-section-title">Max Price</h3>
                <div className="price-input-container">
                    <span className="price-symbol">$</span>
                    <input
                        type="number"
                        value={priceInput}
                        onChange={handlePriceChange}
                        placeholder="Any price"
                        min="0"
                        step="0.01"
                        className="price-input"
                    />
                </div>
            </div>

            <div className="filter-actions">
                <button onClick={handleApplyFilters} className="apply-filters-button" disabled={!hasChanges}>
                    Apply Filters
                </button>
                <button onClick={clearFilters} className="clear-filters-button">
                    Clear All
                </button>
            </div>
        </div>
    )
}


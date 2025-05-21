"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { Game, GamesResponse, Genre, Platform } from "../types/game"
import { SearchInput } from "../components/search-input"
import { GamesList } from "../components/games-list"
import { GameFilters, type FilterOptions } from "../components/game-filters"
import { GameSort, type SortOption } from "../components/game-sort"
import { GamePagination } from "../components/game-pagination"
import { Header } from "../components/header"
import "../components/css/Home.css"

function Home() {
    const [searchQuery, setSearchQuery] = useState("")
    const [currentSearch, setCurrentSearch] = useState("")
    const [games, setGames] = useState<Game[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>("CREATED_ASC") // Default sort as specified

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10) // Default page size
    const [totalGames, setTotalGames] = useState(0)
    const totalPages = Math.ceil(totalGames / pageSize)

    // This is the filter state that's actually applied to the API
    const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({
        selectedGenres: [],
        selectedPlatforms: [],
        maxPrice: null,
    })

    const buildQueryString = useCallback(
        (query: string, filterOptions: FilterOptions, sort: SortOption, page: number, size: number) => {
            const params = new URLSearchParams()

            // Add search query if present
            if (query.trim()) {
                params.append("q", query.trim())
            }

            // Add genre filters
            filterOptions.selectedGenres.forEach((genreId) => {
                params.append("genreIds", genreId.toString())
            })

            // Add platform filters
            filterOptions.selectedPlatforms.forEach((platformId) => {
                params.append("platformIds", platformId.toString())
            })

            // Add price filter
            if (filterOptions.maxPrice !== null) {
                params.append("price", filterOptions.maxPrice.toString())
            }

            // Add sort parameter
            params.append("sortBy", sort)

            // Add pagination parameters
            const startIndex = (page - 1) * size
            params.append("startIndex", startIndex.toString())
            params.append("count", size.toString())

            return params.toString()
        },
        [],
    )

    const fetchGames = useCallback(
        async (query: string, filterOptions: FilterOptions, sort: SortOption, page: number, size: number) => {
            setIsLoading(true)
            setError(null)

            try {
                const queryString = buildQueryString(query, filterOptions, sort, page, size)
                const url = `http://localhost:4941/api/v1/games${queryString ? `?${queryString}` : ""}`

                const response = await fetch(url)

                if (!response.ok) {
                    throw new Error("Failed to fetch games")
                }

                const data: GamesResponse = await response.json()
                setGames(data.games)
                setTotalGames(data.count)
            } catch (err) {
                setError("Error fetching games. Please try again.")
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        },
        [buildQueryString],
    )

    // Fetch genres and platforms when component mounts
    useEffect(() => {
        const fetchInitialData = async () => {
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

                // Fetch initial games
                await fetchGames(
                    "",
                    {
                        selectedGenres: [],
                        selectedPlatforms: [],
                        maxPrice: null,
                    },
                    "CREATED_ASC",
                    1,
                    pageSize,
                )
            } catch (err) {
                console.error("Error fetching initial data:", err)
                setError("Error loading game data. Please refresh the page.")
            }
        }

        fetchInitialData()
    }, [fetchGames, pageSize])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentSearch(searchQuery)
        setCurrentPage(1) // Reset to first page on new search
        fetchGames(searchQuery, appliedFilters, sortBy, 1, pageSize)
    }

    const handleApplyFilters = (newFilters: FilterOptions) => {
        setAppliedFilters(newFilters)
        setCurrentPage(1) // Reset to first page on filter change
        fetchGames(currentSearch, newFilters, sortBy, 1, pageSize)
    }

    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort)
        fetchGames(currentSearch, appliedFilters, newSort, currentPage, pageSize)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchGames(currentSearch, appliedFilters, sortBy, page, pageSize)
    }

    const handlePageSizeChange = (size: number) => {
        const newPage = Math.floor(((currentPage - 1) * pageSize) / size) + 1
        setPageSize(size)
        setCurrentPage(newPage)
        fetchGames(currentSearch, appliedFilters, sortBy, newPage, size)
    }

    return (
        <div className="page-container">
            <Header />
            <div className="container">
                <header className="header">
                    <h1>Game Search</h1>
                    <p>Find your next favorite game</p>
                </header>

                <div className="search-wrapper">
                    <SearchInput value={searchQuery} onChange={handleSearchChange} onSubmit={handleSubmit} />
                </div>

                <div className="content-layout">
                    <aside className="filters-sidebar">
                        <GameFilters
                            genres={genres}
                            platforms={platforms}
                            initialFilters={appliedFilters}
                            onApplyFilters={handleApplyFilters}
                        />
                    </aside>

                    <main className="results-container">
                        <GameSort currentSort={sortBy} onSortChange={handleSortChange} />

                        <GamesList
                            games={games}
                            genres={genres}
                            platforms={platforms}
                            isLoading={isLoading}
                            error={error}
                            searchQuery={currentSearch}
                            filters={appliedFilters}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalGames={totalGames}
                        />

                        {totalGames > 0 && (
                            <GamePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                pageSize={pageSize}
                                onPageSizeChange={handlePageSizeChange}
                            />
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default Home

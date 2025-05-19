"use client"

import type React from "react"

import "./css/GameSort.css"

export type SortOption =
    | "ALPHABETICAL_ASC"
    | "ALPHABETICAL_DESC"
    | "PRICE_ASC"
    | "PRICE_DESC"
    | "CREATED_ASC"
    | "CREATED_DESC"
    | "RATING_ASC"
    | "RATING_DESC"

interface SortOptionInfo {
    value: SortOption
    label: string
}

const sortOptions: SortOptionInfo[] = [
    { value: "CREATED_ASC", label: "Oldest to Newest" },
    { value: "CREATED_DESC", label: "Newest to Oldest" },
    { value: "ALPHABETICAL_ASC", label: "Title (A-Z)" },
    { value: "ALPHABETICAL_DESC", label: "Title (Z-A)" },
    { value: "PRICE_ASC", label: "Price (Low to High)" },
    { value: "PRICE_DESC", label: "Price (High to Low)" },
    { value: "RATING_ASC", label: "Rating (Low to High)" },
    { value: "RATING_DESC", label: "Rating (High to Low)" },
]

interface GameSortProps {
    currentSort: SortOption
    onSortChange: (sort: SortOption) => void
}

export function GameSort({ currentSort, onSortChange }: GameSortProps) {
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSortChange(e.target.value as SortOption)
    }

    return (
        <div className="sort-container">
            <label htmlFor="sort-select" className="sort-label">
                Sort by:
            </label>
            <select id="sort-select" value={currentSort} onChange={handleSortChange} className="sort-select">
                {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

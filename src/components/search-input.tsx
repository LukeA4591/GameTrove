import type React from "react"
import './css/SearchInput.css'

interface SearchInputProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: (e: React.FormEvent) => void
}

export function SearchInput({ value, onChange, onSubmit }: SearchInputProps) {
    return (
        <form onSubmit={onSubmit} className="search-form">
            <div className="search-container">
                <input type="text" placeholder="Search games" value={value} onChange={onChange} className="search-input" />
                <button type="submit" className="search-button">
                    Search
                </button>
            </div>
        </form>
    )
}

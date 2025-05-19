import './css/GameCard.css'
import type { Game, Genre, Platform } from "../types/game"
import { formatPrice } from "../utils/format"
import {useState} from "react";

interface GameCardProps {
    game: Game
    genre?: Genre
    platforms: Platform[]
    onGameSelect: (gameId: number) => void
}

export function GameCard({ game, genre, platforms, onGameSelect }: GameCardProps) {
    const [imageError, setImageError] = useState(false)

    return (
        <div className="game-card" onClick={() => onGameSelect(game.gameId)}>
            <div className="game-image-container">
                <img
                    src={
                        imageError
                            ? "https://via.placeholder.com/600x400?text=No+Image"
                            : `http://localhost:4941/api/v1/games/${game.gameId}/image`
                    }
                    alt={`${game.title} cover`}
                    className="game-image"
                    onError={() => setImageError(true)}
                />
            </div>
            <h2 className="game-title">{game.title}</h2>
            <div className="game-details">
                <div className="game-info-grid">
                    <p className="game-info">
                        <span>Genre:</span> {genre ? genre.name : "Unknown"}
                    </p>
                    <p className="game-info">
                        <span>Price:</span> <span className={game.price === 0 ? "free-price" : ""}>{formatPrice(game.price)}</span>
                    </p>
                    <p className="game-info">
                        <span>Released:</span> {new Date(game.creationDate).toLocaleDateString()}
                    </p>
                    <p className="game-info">
                        <span>Rating:</span>{" "}
                        {game.rating > 0 ? (
                            <span className="rating">{game.rating}/10</span>
                        ) : (
                            <span className="not-rated">Not rated</span>
                        )}
                    </p>
                </div>

                <p className="game-info" style={{ marginTop: "8px" }}>
                    <span>Creator:</span> {game.creatorFirstName} {game.creatorLastName}
                </p>
                <p className="game-info">
                    <span>Platforms:</span>{" "}
                    <span className="platforms">
            {platforms.length > 0 ? platforms.map((p) => p.name).join(", ") : "Unknown"}
          </span>
                </p>
            </div>
            <div className="view-details-button">View Details</div>
        </div>
    )
}
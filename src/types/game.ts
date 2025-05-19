export interface Game {
    gameId: number
    title: string
    genreId: number
    creationDate: string
    creatorId: number
    price: number
    creatorFirstName: string
    creatorLastName: string
    rating: number
    platformIds: number[]
}

export interface GamesResponse {
    games: Game[]
    count: number
}

export interface Genre {
    genreId: number
    name: string
}

export interface Platform {
    platformId: number
    name: string
}

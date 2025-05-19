// Format price from cents to dollars/currency
export const formatPrice = (priceInCents: number): string => {
    if (priceInCents === 0) return "Free"
    return `$${(priceInCents / 100).toFixed(2)}`
}

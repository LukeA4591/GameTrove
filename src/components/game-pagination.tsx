import type React from "react"
import "./css/GamePagination.css"

interface GamePaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    pageSize: number
    onPageSizeChange: (size: number) => void
}

export function GamePagination({
                                   currentPage,
                                   totalPages,
                                   onPageChange,
                                   pageSize,
                                   onPageSizeChange,
                               }: GamePaginationProps) {
    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onPageSizeChange(Number(e.target.value))
    }

    return (
        <div className="pagination-container">
            <div className="pagination-controls">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                    aria-label="Go to first page"
                    title="First Page"
                >
                    &laquo;
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                    aria-label="Go to previous page"
                    title="Previous Page"
                >
                    &lsaquo;
                </button>

                <span className="pagination-info">
          Page {currentPage} of {totalPages || 1}
        </span>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="pagination-button"
                    aria-label="Go to next page"
                    title="Next Page"
                >
                    &rsaquo;
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="pagination-button"
                    aria-label="Go to last page"
                    title="Last Page"
                >
                    &raquo;
                </button>
            </div>

            <div className="page-size-container">
                <label htmlFor="page-size" className="page-size-label">
                    Games per page:
                </label>
                <select id="page-size" value={pageSize} onChange={handlePageSizeChange} className="page-size-select">
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>
        </div>
    )
}

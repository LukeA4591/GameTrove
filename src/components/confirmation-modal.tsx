"use client"
import "./css/ConfirmationModal.css"

interface ConfirmationModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
    error?: string | null
}

export function ConfirmationModal({
                                      isOpen,
                                      title,
                                      message,
                                      confirmText,
                                      cancelText,
                                      onConfirm,
                                      onCancel,
                                      isLoading = false,
                                      error = null,
                                  }: ConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">{title}</h2>
                <p className="modal-message">{message}</p>

                {error && <div className="modal-error">{error}</div>}

                <div className="modal-actions">
                    <button className="modal-cancel-button" onClick={onCancel} disabled={isLoading} aria-label="Cancel action">
                        {cancelText}
                    </button>
                    <button className="modal-confirm-button" onClick={onConfirm} disabled={isLoading} aria-label="Confirm action">
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

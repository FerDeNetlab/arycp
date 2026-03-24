/**
 * Security utilities for input sanitization and file validation
 */

// --- HTML Escape (prevents XSS in email templates) ---
const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
}

export function escapeHtml(str: string): string {
    return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char)
}

// --- File Upload Validation ---
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    document: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
        "application/vnd.ms-excel", // xls
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
        "application/msword", // doc
        "text/csv",
        "text/plain",
    ],
    image: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ],
    certificate: [
        "application/x-x509-ca-cert",
        "application/pkix-cert",
        "application/octet-stream", // .cer and .key files
    ],
}

const ALLOWED_EXTENSIONS = [
    ".pdf", ".xlsx", ".xls", ".docx", ".doc", ".csv", ".txt",
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".cer", ".key", ".xml",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface FileValidationResult {
    valid: boolean
    error?: string
}

export function validateFileUpload(
    file: File,
    options?: { maxSize?: number; allowedExtensions?: string[] }
): FileValidationResult {
    const maxSize = options?.maxSize || MAX_FILE_SIZE
    const extensions = options?.allowedExtensions || ALLOWED_EXTENSIONS

    // Check file size
    if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(0)
        return { valid: false, error: `El archivo excede el tamaño máximo de ${maxMB}MB` }
    }

    // Check file size > 0
    if (file.size === 0) {
        return { valid: false, error: "El archivo está vacío" }
    }

    // Check extension
    const fileName = file.name.toLowerCase()
    const ext = fileName.substring(fileName.lastIndexOf("."))
    if (!extensions.includes(ext)) {
        return { valid: false, error: `Tipo de archivo no permitido: ${ext}. Permitidos: ${extensions.join(", ")}` }
    }

    return { valid: true }
}

// --- Input length validation ---
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength)
}

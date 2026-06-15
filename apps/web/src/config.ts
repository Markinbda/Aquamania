const configuredApiUrl = import.meta.env.VITE_API_URL?.toString().trim()

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:4000' : '')

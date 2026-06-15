const configuredApiUrl = import.meta.env.VITE_API_URL?.toString().trim()

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:4000' : '')

export const API_CONFIG_ERROR =
	!configuredApiUrl && !import.meta.env.DEV
		? 'API is not configured. Set VITE_API_URL in Netlify build environment and redeploy.'
		: null

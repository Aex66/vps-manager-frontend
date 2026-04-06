/**
 * Base URL for the Go API (server-side fetches from Route Handlers / middleware).
 * Prefer BACKEND_API_URL in Docker/internal networks; fall back to NEXT_PUBLIC_API_URL.
 */
export function backendBaseUrl(): string {
  const raw =
    process.env.BACKEND_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:8080"
  return raw.replace(/\/$/, "")
}

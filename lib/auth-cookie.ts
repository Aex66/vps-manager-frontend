/** HttpOnly cookie set by `/api/auth/login`; must match `middleware.ts` and API routes. */
export const VPS_SESSION_COOKIE = "vps_session"

/** HttpOnly cookie for operator panel (`/api/auth/admin/login`). */
export const VPS_ADMIN_SESSION_COOKIE = "vps_admin_session"

/** Keep in sync with backend `JWT_EXPIRE_HOURS` (default 720 = 30d). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30

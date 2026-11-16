/**
 * Player mobile must not call administrative HTTP surfaces (Release 1.0.0 / scoped access epic).
 * Club Admin and Super Admin workflows stay on web; mobile clients use self-service paths only.
 */

export const ADMIN_API_PREFIX = '/api/admin';

/** Returns true when a path targets Club Admin / Super Admin routes. */
export function isAdministrativeApiPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === ADMIN_API_PREFIX || normalized.startsWith(`${ADMIN_API_PREFIX}/`);
}

/**
 * Paths invoked by Player mobile HTTP clients in this repo. Used by tests to ensure no admin leakage.
 */
export const PLAYER_MOBILE_HTTP_PATHS = [
  '/api/invitations',
  '/api/join-requests',
  '/api/me/clubs',
  '/api/clubs/live-tournaments',
  '/api/tournaments/:id/entries',
  '/api/invitations/:id/accept',
  '/api/invitations/:id/decline',
  '/api/me/clubs/:clubId/tournaments',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/google',
  '/api/auth/sessions',
  '/api/auth/password-reset/request',
  '/api/auth/password-reset/confirm',
  '/api/auth/sign-out',
  '/api/auth/me',
] as const;

export function assertPlayerMobilePathAllowed(pathTemplate: string): void {
  if (isAdministrativeApiPath(pathTemplate)) {
    throw new Error(`Player mobile must not call administrative path: ${pathTemplate}`);
  }
}

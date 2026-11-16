import type { ApiErrorBody } from './types.ts';

/**
 * Player mobile HTTP helper. Identifies the native Player app so sessions and audits can tell
 * mobile from web; Club Admin / Super Admin clients are not defined here (#192/#194).
 */
export const PLAYER_MOBILE_USER_AGENT = 'Teezo-Player-Mobile/1.0 (iOS; Android)';

export const PLAYER_MOBILE_CLIENT_HEADER = 'x-teezo-client';
export const PLAYER_MOBILE_CLIENT_VALUE = 'player-mobile';

export class MobileApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    const code = body?.error?.code ?? 'internal_error';
    const message = body?.error?.message ?? fallback;
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
    this.code = code;
    if (body?.error?.fields) this.fields = body.error.fields;
  }
}

export type MobileHttpOptions = {
  baseUrl: string;
  accessToken?: string | null;
  /** Override for tests (iOS vs Android UA). */
  userAgent?: string;
  fetchImpl?: typeof fetch;
};

export async function mobileRequest<T>(
  options: MobileHttpOptions,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: T }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': options.userAgent ?? PLAYER_MOBILE_USER_AGENT,
    [PLAYER_MOBILE_CLIENT_HEADER]: PLAYER_MOBILE_CLIENT_VALUE,
  };
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;

  const response = await fetchImpl(`${options.baseUrl.replace(/\/$/, '')}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    throw new MobileApiError(
      response.status,
      parsed as ApiErrorBody | null,
      `Mobile API ${method} ${path} failed with ${response.status}`,
    );
  }

  return { status: response.status, data: parsed as T };
}

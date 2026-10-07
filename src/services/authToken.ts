/**
 * The current access token, kept outside React so non-component code can read
 * it synchronously.
 *
 * next-auth's `getSession()` always goes to the network, which is fine inside a
 * component that already has the session but wasteful anywhere that fires often.
 * The session provider pushes the token here whenever it changes, and callers
 * read it without waiting.
 */
let accessToken: string | null = null;

export function setAuthToken(token: string | null): void {
  accessToken = token;
}

export function getAuthToken(): string | null {
  return accessToken;
}

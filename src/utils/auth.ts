const TOKEN_KEY = 'access_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    console.error('[Auth] Failed to access localStorage');
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.error('[Auth] Failed to save token to localStorage');
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    console.error('[Auth] Failed to remove token from localStorage');
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

interface JwtPayload {
  sub?: string;
  role?: string;
  is_admin?: boolean;
  exp?: number;
  [key: string]: unknown;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.warn('[Auth] Token has no payload segment');
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch (error) {
    console.error('[Auth] Failed to decode token:', error);
    return null;
  }
}

export function getRole(token: string): string | null {
  const payload = decodeToken(token);
  return payload?.role ?? null;
}

export function checkIsAdmin(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return false;
  // is_admin boolean 클레임 우선, 없으면 role 클레임 폴백
  if (typeof payload.is_admin === 'boolean') return payload.is_admin;
  return payload.role === 'admin';
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true; // exp 없으면 만료로 간주
  return Date.now() >= payload.exp * 1000;
}

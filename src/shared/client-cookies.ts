/**
 * Client-side cookie utilities
 *
 * These utilities work in the browser and complement the server-side
 * cookie functions from next/headers.
 */

export interface CookieOptions {
  /**
   * Cookie expiration in days (default: 365 days / 1 year)
   */
  maxAge?: number;
  /**
   * Cookie path (default: "/")
   */
  path?: string;
  /**
   * Secure flag - only send over HTTPS (default: true in production)
   */
  secure?: boolean;
  /**
   * SameSite attribute (default: "lax")
   */
  sameSite?: "strict" | "lax" | "none";
}

/**
 * Set a cookie in the browser
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof window === "undefined") {
    console.warn("setCookie called on server side - skipping");
    return;
  }

  const {
    maxAge = 365, // 1 year default
    path = "/",
    secure = process.env.NODE_ENV === "production",
    sameSite = "lax",
  } = options;

  // Calculate expiration date
  const expires = new Date();
  expires.setDate(expires.getDate() + maxAge);

  // Build cookie string
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookieString += `; expires=${expires.toUTCString()}`;
  cookieString += `; path=${path}`;

  if (secure) {
    cookieString += "; secure";
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value from the browser
 */
export function getCookie(name: string): string | null {
  if (typeof window === "undefined") {
    console.warn("getCookie called on server side - returning null");
    return null;
  }

  const nameEQ = encodeURIComponent(name) + "=";
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Delete a cookie from the browser
 */
export function deleteCookie(name: string, path: string = "/"): void {
  if (typeof window === "undefined") {
    console.warn("deleteCookie called on server side - skipping");
    return;
  }

  // Set expiration to the past to delete
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

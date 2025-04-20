import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  sub: string;
  type: 'backoffice' | 'public';
  exp: number;
}

export class AuthService {
  private static PUBLIC_TOKEN_KEY = 'public_token';
  private static BACKOFFICE_TOKEN_KEY = 'backoffice_token';

  static async login(password: string, isBackoffice: boolean = false) {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, isBackoffice }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const { access_token } = await response.json();
    const tokenKey = isBackoffice ? this.BACKOFFICE_TOKEN_KEY : this.PUBLIC_TOKEN_KEY;
    
    document.cookie = `${tokenKey}=${access_token}; path=/; SameSite=Strict`;
    return access_token;
  }

  static logout(isBackoffice: boolean = false) {
    const tokenKey = isBackoffice ? this.BACKOFFICE_TOKEN_KEY : this.PUBLIC_TOKEN_KEY;
    document.cookie = `${tokenKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }

  static isAuthenticated(isBackoffice: boolean = false): boolean {
    return !!this.getToken(isBackoffice);
  }

  static getToken(isBackoffice: boolean = false): string | null {
    const tokenKey = isBackoffice ? this.BACKOFFICE_TOKEN_KEY : this.PUBLIC_TOKEN_KEY;
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${tokenKey}=`));
    const token = tokenCookie?.split('=')[1];

    if (!token) return null;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      if (decoded.type !== (isBackoffice ? 'backoffice' : 'public')) {
        console.error('Token type mismatch:', { expected: isBackoffice ? 'backoffice' : 'public', actual: decoded.type });
        return null;
      }
      if (decoded.exp * 1000 < Date.now()) {
        console.error('Token expired');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  static getCorrectToken(isBackoffice: boolean = false): string | null {
    return this.getToken(isBackoffice);
  }
} 
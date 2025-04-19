import { AuthService } from '@/utils/auth'; // corregí el import según donde esté tu auth.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class PanelistsService {
  static getTokenOrThrow(): string {
    const token = AuthService.getCorrectToken(true);
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  static async getAll() {
    const token = this.getTokenOrThrow();

    const response = await fetch(`${API_URL}/panelists`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch panelists');
    }

    return response.json();
  }

  static async create(name: string) {
    const token = this.getTokenOrThrow();

    const response = await fetch(`${API_URL}/panelists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create panelist');
    }

    const data = await response.json();
    if (!data || !data.id) {
      throw new Error('Invalid response from server');
    }

    return data;
  }

  static async addToProgram(panelistId: string, programId: number) {
    const token = this.getTokenOrThrow();

    const response = await fetch(
      `${API_URL}/panelists/${panelistId}/programs/${programId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add panelist to program');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  static async removeFromProgram(panelistId: string, programId: number) {
    const token = this.getTokenOrThrow();

    const response = await fetch(
      `${API_URL}/panelists/${panelistId}/programs/${programId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to remove panelist from program');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }
}
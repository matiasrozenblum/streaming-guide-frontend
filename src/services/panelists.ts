import { Panelist } from '@/types/panelist';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class PanelistsService {
  static async getAll() {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

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
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

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
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

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

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  static async removeFromProgram(panelistId: string, programId: number) {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }

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

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }
} 
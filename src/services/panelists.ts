export class PanelistsService {
  static async getAll() {
    const response = await fetch(`/api/panelists`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch panelists');
    }

    return response.json();
  }

  static async create(name: string) {
    const response = await fetch(`/api/panelists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch(`/api/panelists/${panelistId}/programs/${programId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    const response = await fetch(`/api/panelists/${panelistId}/programs/${programId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

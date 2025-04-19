export const fetchConfig = async (key: string): Promise<string | null> => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  
    if (!res.ok) {
      console.warn(`Config key "${key}" not found or error occurred.`);
      return null;
    }
  
    const data = await res.json();
    return data?.value ?? null;
  };
  
export const ConfigService = {
  findAll: async (): Promise<{ key: string; value: string; type: string }[]> => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Error fetching configurations.');
      return [];
    }

    const data = await res.json();
    return data.map((config: { key: string; value: string }) => ({
      ...config,
      type: typeof config.value,
    }));
  },

  set: async (key: string, value: string): Promise<void> => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    if (!token) {
      throw new Error('No authentication token found');
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value }),
    });

    if (!res.ok) {
      console.warn(`Error setting configuration for key: ${key}`);
    }
  },

  delete: async (key: string): Promise<void> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/${key}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`Error deleting configuration for key: ${key}`);
    }
  },

  update: async (key: string, value: string): Promise<void> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/${key}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!res.ok) {
      console.warn(`Error updating configuration for key: ${key}`);
    }
  },
};
  
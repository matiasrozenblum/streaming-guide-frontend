export const fetchConfig = async (key: string): Promise<string | null> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/config/${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
  
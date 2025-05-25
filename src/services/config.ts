import { api } from '@/services/api';

/**
 * Obtiene el valor de configuración para una clave dada.
 * Retorna null si no existe o falla la petición.
 */
export const fetchConfig = async (key: string, token?: string): Promise<string | null> => {
  try {
    const res = await api.get<{ value: string }>(`/config/${key}`, {
      // Evita cache de Next.js
      headers: { 'Cache-Control': 'no-store', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return res.data.value ?? null;
  } catch (err) {
    console.warn(`Config key "${key}" not found or error occurred.`, err);
    return null;
  }
};

/**
 * Servicio de configuración general usando la instancia axios `api`,
 * que ya inyecta automáticamente el token de sesión.
 */
export const ConfigService = {
  /**
   * Recupera todas las configuraciones disponibles.
   */
  findAll: async (token?: string): Promise<{ key: string; value: string; type: string }[]> => {
    try {
      const res = await api.get<{ key: string; value: string }[]>('/config', {
        headers: { 'Cache-Control': 'no-store', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      return res.data.map((cfg) => ({
        ...cfg,
        type: typeof cfg.value,
      }));
    } catch (err) {
      console.warn('Error fetching configurations.', err);
      return [];
    }
  },

  /**
   * Crea o actualiza una configuración.
   */
  set: async (key: string, value: string, token?: string): Promise<void> => {
    try {
      await api.post('/config', { key, value }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (err) {
      console.warn(`Error setting configuration for key: ${key}`, err);
    }
  },

  /**
   * Elimina una configuración por clave.
   */
  delete: async (key: string, token?: string): Promise<void> => {
    try {
      await api.delete(`/config/${key}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (err) {
      console.warn(`Error deleting configuration for key: ${key}`, err);
    }
  },

  /**
   * Actualiza el valor de una configuración existente.
   */
  update: async (key: string, value: string, token?: string): Promise<void> => {
    try {
      await api.patch(`/config/${key}`, { value }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (err) {
      console.warn(`Error updating configuration for key: ${key}`, err);
    }
  },
};
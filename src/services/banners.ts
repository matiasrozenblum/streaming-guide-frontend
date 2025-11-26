import type { 
  Banner, 
  CreateBannerDto, 
  UpdateBannerDto, 
  ReorderBannersDto,
  BannerStats 
} from '@/types/banner';

export const bannersApi = {
  // Public endpoints
  async getActiveBanners(): Promise<Banner[]> {
    const response = await fetch('/api/banners/active');
    if (!response.ok) throw new Error('Failed to fetch active banners');
    return response.json();
  },

  // Admin endpoints
  async getAllBanners(): Promise<Banner[]> {
    const response = await fetch('/api/banners');
    if (!response.ok) throw new Error('Failed to fetch banners');
    return response.json();
  },

  async getBanner(id: number): Promise<Banner> {
    const response = await fetch(`/api/banners/${id}`);
    if (!response.ok) throw new Error('Failed to fetch banner');
    return response.json();
  },

  async createBanner(data: CreateBannerDto): Promise<Banner> {
    const response = await fetch('/api/banners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create banner');
    return response.json();
  },

  async updateBanner(id: number, data: UpdateBannerDto): Promise<Banner> {
    const response = await fetch(`/api/banners/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update banner');
    return response.json();
  },

  async deleteBanner(id: number): Promise<void> {
    const response = await fetch(`/api/banners/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete banner');
  },

  async reorderBanners(data: ReorderBannersDto): Promise<Banner[]> {
    const response = await fetch('/api/banners/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to reorder banners');
    return response.json();
  },

  async getBannerStats(): Promise<BannerStats> {
    const response = await fetch('/api/banners/stats');
    if (!response.ok) throw new Error('Failed to fetch banner stats');
    return response.json();
  },
};

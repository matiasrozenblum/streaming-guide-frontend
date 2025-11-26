import { api } from './api';
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
    const response = await api.get<Banner[]>('/banners/active');
    return response.data;
  },

  // Admin endpoints
  async getAllBanners(): Promise<Banner[]> {
    const response = await api.get<Banner[]>('/banners');
    return response.data;
  },

  async getBanner(id: number): Promise<Banner> {
    const response = await api.get<Banner>(`/banners/${id}`);
    return response.data;
  },

  async createBanner(data: CreateBannerDto): Promise<Banner> {
    const response = await api.post<Banner>('/banners', data);
    return response.data;
  },

  async updateBanner(id: number, data: UpdateBannerDto): Promise<Banner> {
    const response = await api.patch<Banner>(`/banners/${id}`, data);
    return response.data;
  },

  async deleteBanner(id: number): Promise<void> {
    await api.delete(`/banners/${id}`);
  },

  async reorderBanners(data: ReorderBannersDto): Promise<Banner[]> {
    const response = await api.put<Banner[]>('/banners/reorder', data);
    return response.data;
  },

  async getBannerStats(): Promise<BannerStats> {
    const response = await api.get<BannerStats>('/banners/stats');
    return response.data;
  },
};

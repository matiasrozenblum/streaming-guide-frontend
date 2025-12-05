export enum LinkType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  NONE = 'none',
}

export enum BannerType {
  NEWS = 'news',
  PROMOTIONAL = 'promotional',
  FEATURED = 'featured',
}

export interface Banner {
  id: number;
  title: string;
  description?: string | null;
  image_url: string;
  link_type: LinkType;
  link_url?: string | null;
  is_enabled: boolean;
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  display_order: number;
  banner_type: BannerType;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface CreateBannerDto {
  title: string;
  description?: string;
  image_url: string;
  link_type?: LinkType;
  link_url?: string;
  is_enabled?: boolean;
  start_date?: string;
  end_date?: string;
  display_order?: number;
  banner_type?: BannerType;
}

export type UpdateBannerDto = Partial<CreateBannerDto>;

export interface BannerOrderItem {
  id: number;
  display_order: number;
}

export interface ReorderBannersDto {
  banners: BannerOrderItem[];
}

export interface BannerStats {
  total: number;
  active: number;
  byType: Record<string, number>;
}

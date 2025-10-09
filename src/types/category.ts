export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

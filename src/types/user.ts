export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
} 
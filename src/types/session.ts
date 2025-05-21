export interface SessionUser {
  id: string;
  role: string;
  name?: string;
  email?: string;
  // Agregá aquí otras propiedades relevantes del usuario si las hay
}

export interface SessionWithToken {
  user: SessionUser;
  accessToken?: string;
  // Agregá aquí otras propiedades relevantes de la sesión si las hay
} 
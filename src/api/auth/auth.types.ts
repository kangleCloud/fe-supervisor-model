export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResult {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: AuthUser;
}

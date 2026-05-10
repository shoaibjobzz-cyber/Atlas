export type AuthUser = {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
};

export type AuthSession = {
  user: AuthUser;
};

export type SignInPayload = {
  username: string;
  password: string;
};

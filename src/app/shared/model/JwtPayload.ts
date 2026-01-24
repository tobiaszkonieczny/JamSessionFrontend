export interface JwtPayload {
  sub: string;
  exp: number;
  email: string;
  name: string;
  roles: string[];
}

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = () => process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export function generateAccessToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, ACCESS_SECRET(), { expiresIn: '15m' });
}

export function generateRefreshToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, REFRESH_SECRET(), { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET()) as { userId: string; email: string; role: string };
}

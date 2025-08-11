// Lambda-compatible token verification utility
import jwt from 'jsonwebtoken';

export const verifyToken = (event) => {
  let token;
  const authHeader = event.headers && (event.headers.Authorization || event.headers.authorization);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) {
    return { valid: false, error: 'Not authorized, no token' };
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: 'Not authorized, token failed' };
  }
};

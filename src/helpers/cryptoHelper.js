import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const SALT_ROUNDS = 12;

class CryptoHelper {
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_name
    };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiration
    });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user.id
    };
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiration
    });
  }

  verifyToken(token, isRefresh = false) {
    const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }
}

export default new CryptoHelper();

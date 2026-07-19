import userRepository from '../user/userRepository.js';
import roleRepository from '../user/roleRepository.js';
import tokenRepository from './tokenRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import cryptoHelper from '../../helpers/cryptoHelper.js';

class AuthService {
  async register(userData, clientInfo = {}) {
    const visitorRole = await roleRepository.getRoleByName('visitor');
    if (!visitorRole) {
      throw new Error('Visitor role not found in database');
    }

    const hashedPassword = await cryptoHelper.hashPassword(userData.password);

    const userId = await userRepository.create({
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      password: hashedPassword,
      role_id: visitorRole.id,
      status: 'pending',
      is_verified: false,
      profile_image: userData.profile_image || null
    });

    await auditLogRepository.create({
      user_id: userId,
      action: 'Register',
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    const user = await userRepository.findById(userId);
    const accessToken = cryptoHelper.generateAccessToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role_name,
        status: user.status
      }
    };
  }

  async login(email, password, clientInfo = {}) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await cryptoHelper.comparePassword(password, user.password);
    if (!isPasswordValid) {
      await auditLogRepository.create({
        user_id: user.id,
        action: 'Login Failure: Incorrect Password',
        ip: clientInfo.ip || null,
        device: clientInfo.device || null,
        browser: clientInfo.browser || null
      });
      throw new Error('Invalid email or password');
    }

    if (user.status === 'blocked') {
      throw new Error('Your account is blocked. Please contact admin.');
    }
    if (user.status === 'suspended') {
      throw new Error('Your account is suspended. Please contact admin.');
    }

    await userRepository.updateLastLogin(user.id);

    await auditLogRepository.create({
      user_id: user.id,
      action: 'Login Success',
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    const accessToken = cryptoHelper.generateAccessToken(user);
    const refreshToken = cryptoHelper.generateRefreshToken(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tokenRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role_name,
        status: user.status
      }
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) return false;
    await tokenRepository.deleteRefreshToken(refreshToken);
    return true;
  }

  async refresh(tokenStr) {
    const dbToken = await tokenRepository.findRefreshToken(tokenStr);
    if (!dbToken) {
      throw new Error('Refresh token not found or revoked');
    }

    if (new Date(dbToken.expires_at) < new Date()) {
      await tokenRepository.deleteRefreshToken(tokenStr);
      throw new Error('Refresh token expired');
    }

    const payload = cryptoHelper.verifyToken(tokenStr, true);
    if (!payload) {
      await tokenRepository.deleteRefreshToken(tokenStr);
      throw new Error('Invalid refresh token signature');
    }

    const user = await userRepository.findById(payload.id);
    if (!user || user.status === 'blocked' || user.status === 'suspended') {
      throw new Error('User not allowed to refresh token');
    }

    const accessToken = cryptoHelper.generateAccessToken(user);
    return { accessToken };
  }

  async forgotPassword(email, clientInfo = {}) {
    const user = await userRepository.findByEmail(email);
    const genericResponse = { message: 'If the email exists, password reset instructions have been generated.' };

    if (!user) {
      return genericResponse;
    }

    const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await tokenRepository.createPasswordResetToken(user.id, token, expiresAt);

    await auditLogRepository.create({
      user_id: user.id,
      action: 'Password Reset Requested',
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    // Log token to server terminal console for manual developer testing
    console.log(`\n🔑 [DEVELOPMENT ONLY] Password Reset Token for ${email}:`);
    console.log(`   Token: ${token}\n`);

    return genericResponse;
  }

  async resetPassword(token, newPassword, clientInfo = {}) {
    const dbToken = await tokenRepository.findPasswordResetToken(token);
    if (!dbToken || dbToken.used) {
      throw new Error('Invalid or already used password reset token');
    }

    if (new Date(dbToken.expires_at) < new Date()) {
      throw new Error('Password reset token expired');
    }

    const hashedPassword = await cryptoHelper.hashPassword(newPassword);

    await userRepository.update(dbToken.user_id, { password: hashedPassword });

    await tokenRepository.markPasswordResetTokenUsed(token);
    await tokenRepository.invalidateUserResetTokens(dbToken.user_id);
    await tokenRepository.deleteUserRefreshTokens(dbToken.user_id);

    await auditLogRepository.create({
      user_id: dbToken.user_id,
      action: 'Password Reset Completed',
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Password has been reset successfully.' };
  }
}

export default new AuthService();

import userRepository from '../user/userRepository.js';
import roleRepository from '../user/roleRepository.js';
import tokenRepository from '../auth/tokenRepository.js';
import auditLogRepository from './auditLogRepository.js';
import cryptoHelper from '../../helpers/cryptoHelper.js';
import teacherRepository from '../teacher/teacherRepository.js';
import studentRepository from '../student/studentRepository.js';

class AdminService {
  async getAllUsers(filters = {}) {
    return userRepository.findAll(filters);
  }

  async updateUserRole(userId, roleName, adminId, clientInfo = {}) {
    const role = await roleRepository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' does not exist.`);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    await userRepository.update(userId, { role_id: role.id });
    await tokenRepository.deleteUserRefreshTokens(userId);

    // Auto-link profiles based on email matching
    const emailNorm = user.email.trim().toLowerCase();
    if (roleName === 'teacher') {
      const teacher = await teacherRepository.findByEmail(emailNorm);
      if (teacher) {
        await teacherRepository.update(teacher.id, { user_id: userId });
      }
      const student = await studentRepository.findByEmail(emailNorm);
      if (student && student.user_id === userId) {
        await studentRepository.update(student.id, { user_id: null });
      }
    } else if (roleName === 'student') {
      const student = await studentRepository.findByEmail(emailNorm);
      if (student) {
        await studentRepository.update(student.id, { user_id: userId });
      }
      const teacher = await teacherRepository.findByEmail(emailNorm);
      if (teacher && teacher.user_id === userId) {
        await teacherRepository.update(teacher.id, { user_id: null });
      }
    } else {
      // Clean up link from both teacher and student tables if role is no longer teacher/student
      const teacher = await teacherRepository.findByEmail(emailNorm);
      if (teacher && teacher.user_id === userId) {
        await teacherRepository.update(teacher.id, { user_id: null });
      }
      const student = await studentRepository.findByEmail(emailNorm);
      if (student && student.user_id === userId) {
        await studentRepository.update(student.id, { user_id: null });
      }
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Admin updated role of user ID ${userId} to '${roleName}'`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: `Role of user updated successfully to ${roleName}` };
  }

  async updateUserStatus(userId, status, adminId, clientInfo = {}) {
    const validStatuses = ['pending', 'active', 'blocked', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    await userRepository.update(userId, { status });

    if (status === 'blocked' || status === 'suspended') {
      await tokenRepository.deleteUserRefreshTokens(userId);
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Admin updated status of user ID ${userId} to '${status}'`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: `User status updated successfully to ${status}` };
  }

  async deleteUser(userId, adminId, clientInfo = {}) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    await userRepository.softDelete(userId);
    await tokenRepository.deleteUserRefreshTokens(userId);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Admin deleted (soft) user ID ${userId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'User deleted successfully.' };
  }

  async resetUserPassword(userId, newPassword, adminId, clientInfo = {}) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const hashedPassword = await cryptoHelper.hashPassword(newPassword);

    await userRepository.update(userId, { password: hashedPassword });
    await tokenRepository.deleteUserRefreshTokens(userId);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Admin reset password of user ID ${userId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'User password reset by admin successfully.' };
  }
}

export default new AdminService();

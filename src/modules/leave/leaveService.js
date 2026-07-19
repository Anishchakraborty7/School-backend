import leaveRepository from './leaveRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class LeaveService {
  async requestLeave(leaveData, user, clientInfo = {}) {
    const requestId = await leaveRepository.create({
      user_id: user.id,
      leave_type: leaveData.leave_type,
      start_date: leaveData.start_date,
      end_date: leaveData.end_date,
      reason: leaveData.reason
    });

    await auditLogRepository.create({
      user_id: user.id,
      action: `Requested leave ID ${requestId} (${leaveData.leave_type})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return leaveRepository.findById(requestId);
  }

  async getLeaveRequests(filters, user) {
    const activeFilters = { ...filters };

    // If user is not admin, they can only view their own leave requests
    if (user.role_name !== 'admin') {
      activeFilters.user_id = user.id;
    }

    return leaveRepository.findAll(activeFilters);
  }

  async processLeaveRequest(requestId, status, remarks, adminId, clientInfo = {}) {
    const request = await leaveRepository.findById(requestId);
    if (!request) {
      throw new Error('Leave request not found.');
    }

    await leaveRepository.updateStatus(requestId, {
      status,
      remarks,
      processed_by: adminId
    });

    // Send notification to the user
    const pool = getPool();
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'in_app')",
      [
        request.user_id,
        'Leave Request Processed',
        `Your request for ${request.leave_type} leave from ${request.start_date.toISOString().split('T')[0]} to ${request.end_date.toISOString().split('T')[0]} has been ${status}. Remarks: ${remarks || 'None'}`
      ]
    );

    await auditLogRepository.create({
      user_id: adminId,
      action: `Processed leave request ID ${requestId} (${status})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: `Leave request has been ${status}.` };
  }
}

export default new LeaveService();

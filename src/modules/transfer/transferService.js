import studentRepository from '../student/studentRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class TransferService {
  async transferStudent(transfer, adminId, clientInfo = {}) {
    const { student_id, to_academic_year_id, to_class_id, to_section_id, to_roll_number, transfer_type, reason } = transfer;

    const student = await studentRepository.findById(student_id);
    if (!student) {
      throw new Error('Student not found.');
    }

    const isRollTaken = await studentRepository.existsRollNumber(to_roll_number, to_class_id, to_section_id, to_academic_year_id);
    if (isRollTaken) {
      throw new Error(`Roll number ${to_roll_number} is already taken in the target class section.`);
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      await conn.query(`
        INSERT INTO student_transfer_history (
          student_id, from_academic_year_id, to_academic_year_id, 
          from_class_id, to_class_id, from_section_id, to_section_id, 
          transfer_type, reason, transferred_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        student.id, student.academic_year_id, to_academic_year_id,
        student.class_id, to_class_id, student.section_id, to_section_id,
        transfer_type || 'other', reason || null, adminId
      ]);

      await conn.query(`
        UPDATE students 
        SET academic_year_id = ?, class_id = ?, section_id = ?, roll_number = ?
        WHERE id = ?
      `, [to_academic_year_id, to_class_id, to_section_id, to_roll_number, student.id]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Transferred student ID ${student_id} (Type: ${transfer_type})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Student transferred successfully.' };
  }
}

export default new TransferService();

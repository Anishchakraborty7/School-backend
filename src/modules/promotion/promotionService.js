import studentRepository from '../student/studentRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class PromotionService {
  async promoteSingleStudent(promotion, adminId, clientInfo = {}) {
    const { student_id, to_academic_year_id, to_class_id, to_section_id, to_roll_number } = promotion;

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
        INSERT INTO student_promotion_history (
          student_id, from_academic_year_id, to_academic_year_id, 
          from_class_id, to_class_id, from_section_id, to_section_id, 
          from_roll_number, to_roll_number, promoted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        student.id, student.academic_year_id, to_academic_year_id,
        student.class_id, to_class_id, student.section_id, to_section_id,
        student.roll_number, to_roll_number, adminId
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
      action: `Promoted student ID ${student_id} to Class ID ${to_class_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Student promoted successfully.' };
  }

  async promoteClass(bulkData, adminId, clientInfo = {}) {
    const { from_class_id, to_class_id, to_academic_year_id } = bulkData;

    const students = await studentRepository.findAll({ class_id: from_class_id });
    if (students.length === 0) {
      throw new Error('No active students found in the source class.');
    }

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      for (const student of students) {
        const [targetSecRows] = await conn.query(
          'SELECT id FROM sections WHERE class_id = ? AND section_name = ?',
          [to_class_id, student.section_name]
        );
        if (targetSecRows.length === 0) {
          throw new Error(`Target section for name '${student.section_name}' does not exist in target class.`);
        }
        const to_section_id = targetSecRows[0].id;
        
        const to_roll_number = student.roll_number;
        const [rollCheck] = await conn.query(
          'SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND section_id = ? AND academic_year_id = ? AND deleted_at IS NULL',
          [to_roll_number, to_class_id, to_section_id, to_academic_year_id]
        );
        if (rollCheck.length > 0) {
          throw new Error(`Roll number ${to_roll_number} is already taken in the target section ${student.section_name} of class ${to_class_id}. Bulk promotion failed.`);
        }

        await conn.query(`
          INSERT INTO student_promotion_history (
            student_id, from_academic_year_id, to_academic_year_id, 
            from_class_id, to_class_id, from_section_id, to_section_id, 
            from_roll_number, to_roll_number, promoted_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          student.id, student.academic_year_id, to_academic_year_id,
          student.class_id, to_class_id, student.section_id, to_section_id,
          student.roll_number, to_roll_number, adminId
        ]);

        await conn.query(`
          UPDATE students 
          SET academic_year_id = ?, class_id = ?, section_id = ?, roll_number = ?
          WHERE id = ?
        `, [to_academic_year_id, to_class_id, to_section_id, to_roll_number, student.id]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Bulk promoted students of class ID ${from_class_id} to Class ID ${to_class_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: `Bulk promotion completed successfully for ${students.length} students.` };
  }
}

export default new PromotionService();

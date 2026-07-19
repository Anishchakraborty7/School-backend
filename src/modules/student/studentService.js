import studentRepository from './studentRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';
import userRepository from '../user/userRepository.js';

class StudentService {
  async admitStudent(studentData, guardianData, adminId, clientInfo = {}) {
    // 1. Validate constraints
    const isAdmTaken = await studentRepository.existsAdmissionNumber(studentData.admission_number);
    if (isAdmTaken) {
      throw new Error(`Admission number '${studentData.admission_number}' is already registered.`);
    }

    const isRollTaken = await studentRepository.existsRollNumber(
      studentData.roll_number,
      studentData.class_id,
      studentData.section_id,
      studentData.academic_year_id
    );
    if (isRollTaken) {
      throw new Error(`Roll number '${studentData.roll_number}' is already assigned in this section for the current academic year.`);
    }

    // 2. Perform Atomic Transaction Admission
    const pool = getPool();
    const conn = await pool.getConnection();
    let studentId;

    try {
      await conn.beginTransaction();

      // Auto-link to matching user with 'student' role
      if (studentData.email) {
        studentData.email = studentData.email.trim().toLowerCase();
        const matchedUser = await userRepository.findByEmail(studentData.email);
        if (matchedUser && matchedUser.role_name === 'student') {
          studentData.user_id = matchedUser.id;
        }
      }

      // Insert Student
      const studentQuery = `
        INSERT INTO students (
          user_id, admission_number, roll_number, first_name, middle_name, last_name, 
          gender, date_of_birth, blood_group, email, phone, address, city, state, country, 
          pin_code, photo, aadhaar_number, admission_date, academic_year_id, class_id, 
          section_id, house_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `;
      const studentParams = [
        studentData.user_id || null, studentData.admission_number, studentData.roll_number,
        studentData.first_name, studentData.middle_name || null, studentData.last_name,
        studentData.gender, studentData.date_of_birth, studentData.blood_group || null,
        studentData.email || null, studentData.phone || null, studentData.address || null,
        studentData.city || null, studentData.state || null, studentData.country || null,
        studentData.pin_code || null, studentData.photo || null, studentData.aadhaar_number || null,
        studentData.admission_date, studentData.academic_year_id, studentData.class_id,
        studentData.section_id, studentData.house_id || null
      ];
      
      const [studentResult] = await conn.query(studentQuery, studentParams);
      studentId = studentResult.insertId;

      // Insert Guardian
      const guardianQuery = `
        INSERT INTO guardians (
          student_id, father_name, mother_name, guardian_name, relationship, 
          occupation, phone, email, address, annual_income
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const guardianParams = [
        studentId, guardianData.father_name || null, guardianData.mother_name || null,
        guardianData.guardian_name, guardianData.relationship, guardianData.occupation || null,
        guardianData.phone, guardianData.email || null, guardianData.address || null, guardianData.annual_income || null
      ];

      await conn.query(guardianQuery, guardianParams);

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    // 3. Log Audit Trail
    await auditLogRepository.create({
      user_id: adminId,
      action: `Admitted student: ${studentData.first_name} ${studentData.last_name} (Adm: ${studentData.admission_number})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return studentRepository.findById(studentId);
  }

  async editStudent(id, studentData, guardianData, adminId, clientInfo = {}) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new Error('Student profile not found.');
    }

    // Check unique constraints if values changed
    if (studentData.admission_number && studentData.admission_number !== student.admission_number) {
      const isAdmTaken = await studentRepository.existsAdmissionNumber(studentData.admission_number, id);
      if (isAdmTaken) {
        throw new Error(`Admission number '${studentData.admission_number}' is already registered.`);
      }
    }

    const roll = studentData.roll_number || student.roll_number;
    const cls = studentData.class_id || student.class_id;
    const sec = studentData.section_id || student.section_id;
    const yr = studentData.academic_year_id || student.academic_year_id;

    if (
      roll !== student.roll_number ||
      cls !== student.class_id ||
      sec !== student.section_id ||
      yr !== student.academic_year_id
    ) {
      const isRollTaken = await studentRepository.existsRollNumber(roll, cls, sec, yr, id);
      if (isRollTaken) {
        throw new Error(`Roll number '${roll}' is already assigned in this section for the specified academic year.`);
      }
    }

    if (studentData.email && studentData.email !== student.email) {
      studentData.email = studentData.email.trim().toLowerCase();
      const matchedUser = await userRepository.findByEmail(studentData.email);
      if (matchedUser && matchedUser.role_name === 'student') {
        studentData.user_id = matchedUser.id;
      } else {
        studentData.user_id = null;
      }
    }

    // Update in transaction
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      if (Object.keys(studentData).length > 0) {
        const sets = Object.keys(studentData).map(k => `\`${k}\` = ?`).join(', ');
        await conn.query(`UPDATE students SET ${sets} WHERE id = ?`, [...Object.values(studentData), id]);
      }

      if (guardianData && Object.keys(guardianData).length > 0) {
        const sets = Object.keys(guardianData).map(k => `\`${k}\` = ?`).join(', ');
        await conn.query(`UPDATE guardians SET ${sets} WHERE student_id = ?`, [...Object.values(guardianData), id]);
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated student profile ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return studentRepository.findById(id);
  }

  async deleteStudent(id, adminId, clientInfo = {}) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new Error('Student not found.');
    }

    await studentRepository.softDelete(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Soft deleted student ID ${id} (${student.first_name} ${student.last_name})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Student profile deleted successfully.' };
  }

  async restoreStudent(id, adminId, clientInfo = {}) {
    const affected = await studentRepository.restore(id);
    if (affected === 0) {
      throw new Error('Student profile not found or not in soft deleted status.');
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Restored student profile ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Student profile restored successfully.' };
  }

  async getStudentProfile(id) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new Error('Student profile not found.');
    }

    const guardian = await studentRepository.getGuardian(id);
    const documents = await studentRepository.getDocuments(id);

    return {
      profile: student,
      guardian,
      documents
    };
  }

  async addStudentDocument(docData, adminId, clientInfo = {}) {
    await studentRepository.addDocument(docData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Uploaded student document type '${docData.document_type}' for student ID ${docData.student_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Document uploaded successfully.' };
  }

  async getAllStudents(filters = {}) {
    return studentRepository.findAll(filters);
  }

  async getNextAdmissionNumber() {
    const latest = await studentRepository.getLatestAdmissionNumber();
    if (!latest) {
      return 'T_ADM_00001';
    }

    const match = latest.match(/^(.*?)(\d+)$/);
    if (!match) {
      return latest + '00001';
    }

    const prefix = match[1];
    const digitsStr = match[2];
    const nextVal = parseInt(digitsStr, 10) + 1;
    const paddedDigits = String(nextVal).padStart(digitsStr.length, '0');
    return prefix + paddedDigits;
  }
}

export default new StudentService();

import teacherRepository from './teacherRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import userRepository from '../user/userRepository.js';
import { getPool } from '../../database/db.js';

class TeacherService {
  async addTeacher(teacherData, adminId, clientInfo = {}) {
    const isEmpIdTaken = await teacherRepository.existsEmployeeId(teacherData.employee_id);
    if (isEmpIdTaken) {
      throw new Error(`Employee ID '${teacherData.employee_id}' is already registered.`);
    }

    const isEmailTaken = await teacherRepository.existsEmail(teacherData.email);
    if (isEmailTaken) {
      throw new Error(`Teacher email '${teacherData.email}' is already registered.`);
    }

    // Auto-link to matching user with 'teacher' role
    const matchedUser = await userRepository.findByEmail(teacherData.email);
    if (matchedUser && matchedUser.role_name === 'teacher') {
      teacherData.user_id = matchedUser.id;
    }

    const teacherId = await teacherRepository.create(teacherData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Added teacher: ${teacherData.first_name} ${teacherData.last_name} (${teacherData.employee_id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return teacherRepository.findById(teacherId);
  }

  async editTeacher(id, teacherData, adminId, clientInfo = {}) {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) {
      throw new Error('Teacher not found.');
    }

    if (teacherData.employee_id && teacherData.employee_id !== teacher.employee_id) {
      const isEmpIdTaken = await teacherRepository.existsEmployeeId(teacherData.employee_id, id);
      if (isEmpIdTaken) {
        throw new Error(`Employee ID '${teacherData.employee_id}' is already registered.`);
      }
    }

    if (teacherData.email && teacherData.email !== teacher.email) {
      const isEmailTaken = await teacherRepository.existsEmail(teacherData.email, id);
      if (isEmailTaken) {
        throw new Error(`Teacher email '${teacherData.email}' is already registered.`);
      }

      // Auto-link/update link to matching user with 'teacher' role
      const matchedUser = await userRepository.findByEmail(teacherData.email);
      if (matchedUser && matchedUser.role_name === 'teacher') {
        teacherData.user_id = matchedUser.id;
      } else {
        teacherData.user_id = null; // Unlink if email changed and new email does not belong to a teacher user
      }
    }

    await teacherRepository.update(id, teacherData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated teacher profile ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return teacherRepository.findById(id);
  }

  async deleteTeacher(id, adminId, clientInfo = {}) {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) {
      throw new Error('Teacher not found.');
    }

    await teacherRepository.softDelete(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted teacher ID ${id} (${teacher.first_name} ${teacher.last_name})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Teacher deleted successfully.' };
  }

  async restoreTeacher(id, adminId, clientInfo = {}) {
    const affected = await teacherRepository.restore(id);
    if (affected === 0) {
      throw new Error('Teacher not found or not in deleted state.');
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Restored teacher ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Teacher restored successfully.' };
  }

  async getTeacherProfile(id) {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) {
      throw new Error('Teacher not found.');
    }

    const qualifications = await teacherRepository.getQualifications(id);
    const experienceDetails = await teacherRepository.getExperience(id);
    const documents = await teacherRepository.getDocuments(id);
    const assignedClasses = await teacherRepository.findAssignedClasses(id);
    const assignedSubjects = await teacherRepository.findAssignedSubjects(id);

    return {
      profile: teacher,
      qualifications,
      experience: experienceDetails,
      documents,
      assignedClasses,
      assignedSubjects
    };
  }

  async addQualification(qualData, adminId, clientInfo = {}) {
    await teacherRepository.addQualification(qualData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Added qualification degree '${qualData.degree}' for teacher ID ${qualData.teacher_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Qualification added successfully.' };
  }

  async addExperience(expData, adminId, clientInfo = {}) {
    await teacherRepository.addExperience(expData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Added experience organization '${expData.organization}' for teacher ID ${expData.teacher_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Experience added successfully.' };
  }

  async addDocument(docData, adminId, clientInfo = {}) {
    await teacherRepository.addDocument(docData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Added document type '${docData.document_type}' for teacher ID ${docData.teacher_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Teacher document uploaded and mapped successfully.' };
  }

  async assignSubjectsAndClasses(teacherId, subjectIds, classIds, confirm_overwrite, adminId, clientInfo = {}) {
    const teacher = await teacherRepository.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found.');
    }

    const pool = getPool();

    // Wrap in clear-then-insert steps
    if (subjectIds) {
      await teacherRepository.clearSubjects(teacherId);
      for (const subjectId of subjectIds) {
        await teacherRepository.assignSubject(teacherId, subjectId);
      }
    }

    if (classIds) {
      await teacherRepository.clearClasses(teacherId);
      for (const classId of classIds) {
        await teacherRepository.assignClass(teacherId, classId);
      }
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Assigned classes/subjects for teacher ID ${teacherId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Assignments updated successfully.' };
  }

  async getAllTeachers(filters = {}) {
    return teacherRepository.findAll(filters);
  }
}

export default new TeacherService();

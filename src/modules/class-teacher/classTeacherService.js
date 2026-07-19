import classTeacherRepository from './classTeacherRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class ClassTeacherService {
  async assignClassTeacher(data, adminId, clientInfo = {}) {
    // 1. Prevent duplicate class teacher assignment for the same teacher in the same year
    const activeAssignment = await classTeacherRepository.findByTeacherAndYear(data.teacher_id, data.academic_year_id);
    if (activeAssignment) {
      throw new Error(`Teacher is already assigned as Class Teacher for ${activeAssignment.class_name}-${activeAssignment.section_name} in this academic year.`);
    }

    // 2. Perform assignment
    await classTeacherRepository.assign(data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Assigned teacher ID ${data.teacher_id} as class teacher for class ID ${data.class_id}, section ID ${data.section_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return classTeacherRepository.findBySection(data.class_id, data.section_id, data.academic_year_id);
  }

  async getClassTeacher(classId, sectionId, academicYearId) {
    return classTeacherRepository.findBySection(classId, sectionId, academicYearId);
  }

  async removeClassTeacher(data, adminId, clientInfo = {}) {
    await classTeacherRepository.removeAssignment(data.class_id, data.section_id, data.academic_year_id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Removed class teacher for class ID ${data.class_id}, section ID ${data.section_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });
  }
}

export default new ClassTeacherService();

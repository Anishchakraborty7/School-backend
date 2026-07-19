import classRepository from './classRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class ClassService {
  async createClass(data, adminId, clientInfo = {}) {
    const existing = await classRepository.findByNameAndYear(data.class_name, data.academic_year_id);
    if (existing) {
      throw new Error(`Class '${data.class_name}' already exists for this academic year.`);
    }

    const classId = await classRepository.create(data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created class ${data.class_name} for academic year ID ${data.academic_year_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return classRepository.findById(classId);
  }

  async updateClass(id, data, adminId, clientInfo = {}) {
    const cls = await classRepository.findById(id);
    if (!cls) {
      throw new Error('Class not found.');
    }

    await classRepository.update(id, data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated class ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return classRepository.findById(id);
  }

  async getAllClasses(academicYearId) {
    return classRepository.findAll(academicYearId);
  }

  async deleteClass(id, adminId, clientInfo = {}) {
    const cls = await classRepository.findById(id);
    if (!cls) {
      throw new Error('Class not found.');
    }

    const affected = await classRepository.delete(id);
    
    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted class ${cls.class_name} (ID ${id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return affected;
  }
}

export default new ClassService();

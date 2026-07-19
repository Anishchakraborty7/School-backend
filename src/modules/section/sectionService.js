import sectionRepository from './sectionRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class SectionService {
  async createSection(data, adminId, clientInfo = {}) {
    const existing = await sectionRepository.findByNameAndClass(data.section_name, data.class_id);
    if (existing) {
      throw new Error(`Section '${data.section_name}' already exists for this class.`);
    }

    const sectionId = await sectionRepository.create(data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created section ${data.section_name} for class ID ${data.class_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return sectionRepository.findById(sectionId);
  }

  async updateSection(id, data, adminId, clientInfo = {}) {
    const sec = await sectionRepository.findById(id);
    if (!sec) {
      throw new Error('Section not found.');
    }

    await sectionRepository.update(id, data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated section ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return sectionRepository.findById(id);
  }

  async getAllSections(classId) {
    return sectionRepository.findAll(classId);
  }

  async deleteSection(id, adminId, clientInfo = {}) {
    const sec = await sectionRepository.findById(id);
    if (!sec) {
      throw new Error('Section not found.');
    }

    const affected = await sectionRepository.delete(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted section ${sec.section_name} of class ${sec.class_name} (ID ${id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return affected;
  }
}

export default new SectionService();

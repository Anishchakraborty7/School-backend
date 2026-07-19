import subjectRepository from './subjectRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class SubjectService {
  async createSubject(data, adminId, clientInfo = {}) {
    const existing = await subjectRepository.findByCode(data.subject_code);
    if (existing) {
      throw new Error(`Subject with code '${data.subject_code}' already exists.`);
    }

    const subjectId = await subjectRepository.create(data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created subject ${data.subject_name} (${data.subject_code})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return subjectRepository.findById(subjectId);
  }

  async updateSubject(id, data, adminId, clientInfo = {}) {
    const sub = await subjectRepository.findById(id);
    if (!sub) {
      throw new Error('Subject not found.');
    }

    await subjectRepository.update(id, data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated subject ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return subjectRepository.findById(id);
  }

  async getAllSubjects() {
    return subjectRepository.findAll();
  }

  async linkSubjectsToClass(classId, subjectIds, adminId, clientInfo = {}) {
    for (const subjectId of subjectIds) {
      await subjectRepository.linkClassSubject(classId, subjectId);
    }

    await auditLogRepository.create({
      user_id: adminId,
      action: `Linked subjects ${subjectIds.join(', ')} to class ID ${classId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Subjects linked to class successfully.' };
  }

  async getSubjectsByClass(classId) {
    return subjectRepository.findSubjectsByClass(classId);
  }
}

export default new SubjectService();

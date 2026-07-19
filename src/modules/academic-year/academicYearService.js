import academicYearRepository from './academicYearRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class AcademicYearService {
  async createAcademicYear(data, adminId, clientInfo = {}) {
    const existing = await academicYearRepository.findByName(data.year_name);
    if (existing) {
      throw new Error(`Academic year '${data.year_name}' already exists.`);
    }

    if (data.is_current) {
      await academicYearRepository.unsetCurrent();
    }

    const yearId = await academicYearRepository.create(data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created academic year ${data.year_name}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return academicYearRepository.findById(yearId);
  }

  async updateAcademicYear(id, data, adminId, clientInfo = {}) {
    const year = await academicYearRepository.findById(id);
    if (!year) {
      throw new Error('Academic year not found.');
    }

    if (data.is_current) {
      await academicYearRepository.unsetCurrent();
    }

    await academicYearRepository.update(id, data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated academic year ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return academicYearRepository.findById(id);
  }

  async getAllAcademicYears() {
    return academicYearRepository.findAll();
  }

  async deleteAcademicYear(id, adminId, clientInfo = {}) {
    const year = await academicYearRepository.findById(id);
    if (!year) {
      throw new Error('Academic year not found.');
    }

    const affected = await academicYearRepository.delete(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted academic year ${year.year_name} (ID ${id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return affected;
  }
}

export default new AcademicYearService();

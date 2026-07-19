import timetableRepository from './timetableRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class TimetableService {
  async createPeriod(period, adminId, clientInfo = {}) {
    const periodId = await timetableRepository.createPeriod(period);
    
    await auditLogRepository.create({
      user_id: adminId,
      action: `Created school period '${period.period_name}'`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return timetableRepository.findPeriodById(periodId);
  }

  async getPeriods(yearId) {
    return timetableRepository.getPeriods(yearId);
  }

  async createTimetableEntry(entry, adminId, clientInfo = {}) {
    // 1. Conflict Validation - Teacher
    const teacherConflict = await timetableRepository.findEntry(entry.academic_year_id, {
      teacher_id: entry.teacher_id,
      day_of_week: entry.day_of_week,
      period_id: entry.period_id
    });
    if (teacherConflict.length > 0) {
      throw new Error('Teacher Conflict: This teacher is already assigned to another class during this period.');
    }

    // 2. Conflict Validation - Room
    const roomConflict = await timetableRepository.findEntry(entry.academic_year_id, {
      room_number: entry.room_number,
      day_of_week: entry.day_of_week,
      period_id: entry.period_id
    });
    if (roomConflict.length > 0) {
      throw new Error('Room Conflict: This room is already booked for another class during this period.');
    }

    // 3. Conflict Validation - Class/Section Period Duplicate
    const dupPeriod = await timetableRepository.findEntry(entry.academic_year_id, {
      class_id: entry.class_id,
      section_id: entry.section_id,
      day_of_week: entry.day_of_week,
      period_id: entry.period_id
    });
    if (dupPeriod.length > 0) {
      throw new Error('Class Period Duplicate: This class/section is already assigned to a period at this time slot.');
    }

    // 4. Save Entry
    const entryId = await timetableRepository.createEntry(entry);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Scheduled timetable slot ID ${entryId} for class ID ${entry.class_id}, period ID ${entry.period_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { id: entryId, message: 'Timetable entry added successfully.' };
  }

  async updateTimetableEntry(id, entry, adminId, clientInfo = {}) {
    const existing = await timetableRepository.findEntryById(id);
    if (!existing) {
      throw new Error('Timetable entry not found.');
    }

    const merged = { ...existing, ...entry };

    // 1. Conflict Validation - Teacher
    const teacherConflict = await timetableRepository.findEntry(merged.academic_year_id, {
      teacher_id: merged.teacher_id,
      day_of_week: merged.day_of_week,
      period_id: merged.period_id
    });
    if (teacherConflict.filter(t => t.id !== id).length > 0) {
      throw new Error('Teacher Conflict: This teacher is already assigned to another class during this period.');
    }

    // 2. Conflict Validation - Room
    const roomConflict = await timetableRepository.findEntry(merged.academic_year_id, {
      room_number: merged.room_number,
      day_of_week: merged.day_of_week,
      period_id: merged.period_id
    });
    if (roomConflict.filter(r => r.id !== id).length > 0) {
      throw new Error('Room Conflict: This room is already booked for another class during this period.');
    }

    // 3. Conflict Validation - Class/Section Period Duplicate
    const dupPeriod = await timetableRepository.findEntry(merged.academic_year_id, {
      class_id: merged.class_id,
      section_id: merged.section_id,
      day_of_week: merged.day_of_week,
      period_id: merged.period_id
    });
    if (dupPeriod.filter(p => p.id !== id).length > 0) {
      throw new Error('Class Period Duplicate: This class/section is already assigned to a period at this time slot.');
    }

    await timetableRepository.updateEntry(id, entry);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated timetable slot ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Timetable entry updated successfully.' };
  }

  async deleteTimetableEntry(id, adminId, clientInfo = {}) {
    const existing = await timetableRepository.findEntryById(id);
    if (!existing) {
      throw new Error('Timetable entry not found.');
    }

    await timetableRepository.deleteEntry(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted timetable slot ID ${id} (Class ID ${existing.class_id}, Period ID ${existing.period_id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Timetable entry deleted successfully.' };
  }

  async getTimetableEntry(id) {
    return timetableRepository.findEntryById(id);
  }

  async getTimetableForSection(classId, sectionId, yearId) {
    return timetableRepository.findTimetableForSection(classId, sectionId, yearId);
  }

  async getTimetableForTeacher(teacherId, yearId) {
    return timetableRepository.findTimetableForTeacher(teacherId, yearId);
  }

  async deletePeriod(id, adminId, clientInfo = {}) {
    const existing = await timetableRepository.findPeriodById(id);
    if (!existing) {
      throw new Error('School period not found.');
    }

    await timetableRepository.deletePeriod(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted school period '${existing.period_name}' (ID ${id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'School period deleted successfully.' };
  }

  async updatePeriod(id, data, adminId, clientInfo = {}) {
    const existing = await timetableRepository.findPeriodById(id);
    if (!existing) {
      throw new Error('School period not found.');
    }

    await timetableRepository.updatePeriod(id, data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated school period '${existing.period_name}' (ID ${id})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'School period updated successfully.' };
  }
}

export default new TimetableService();

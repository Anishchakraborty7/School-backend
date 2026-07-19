import announcementRepository from './announcementRepository.js';
import studentRepository from '../student/studentRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class AnnouncementService {
  async createAnnouncement(data, authorId, clientInfo = {}) {
    const annId = await announcementRepository.create({
      ...data,
      author_id: authorId
    });

    await auditLogRepository.create({
      user_id: authorId,
      action: `Created announcement ID ${annId} (${data.title})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return announcementRepository.findById(annId);
  }

  async getAnnouncementsForUser(user) {
    const filters = {};

    if (user.role_name === 'student') {
      const student = await studentRepository.findByUserId(user.id);
      if (student) {
        filters.visibility = 'students';
        filters.target_class_id = student.class_id;
        filters.target_section_id = student.section_id;
      }
    } else if (user.role_name === 'teacher') {
      filters.visibility = 'teachers';
    }

    return announcementRepository.findAll(filters);
  }
}

export default new AnnouncementService();

import calendarRepository from './calendarRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class CalendarService {
  async createHoliday(hData, adminId, clientInfo = {}) {
    const existing = await calendarRepository.findHolidayByDate(hData.holiday_date, hData.academic_year_id);
    if (existing) {
      throw new Error(`Holiday already scheduled for ${hData.holiday_date}.`);
    }

    const holidayId = await calendarRepository.createHoliday(hData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created holiday ID ${holidayId} (${hData.holiday_name})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return calendarRepository.findHolidayById(holidayId);
  }

  async getHolidays(yearId) {
    return calendarRepository.getHolidays(yearId);
  }

  async createEvent(eData, adminId, clientInfo = {}) {
    const eventId = await calendarRepository.createEvent(eData);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created calendar event ID ${eventId} (${eData.title})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return calendarRepository.findEventById(eventId);
  }

  async getEvents(yearId) {
    return calendarRepository.getEvents(yearId);
  }

  async checkIsHoliday(date) {
    return calendarRepository.checkDateIsHoliday(date);
  }
}

export default new CalendarService();

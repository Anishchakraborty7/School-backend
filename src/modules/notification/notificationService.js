import notificationRepository from './notificationRepository.js';

class NotificationService {
  async getNotifications(userId) {
    return notificationRepository.getNotifications(userId);
  }

  async markRead(id, userId) {
    await notificationRepository.markAsRead(id, userId);
    return { message: 'Notification marked as read.' };
  }
}

export default new NotificationService();

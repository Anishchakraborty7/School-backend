import houseRepository from './houseRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class HouseService {
  async createHouse(data, adminId, clientInfo = {}) {
    const existing = await houseRepository.findByName(data.house_name);
    if (existing) {
      throw new Error(`House '${data.house_name}' already exists.`);
    }

    const houseId = await houseRepository.create(data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Created school house: ${data.house_name}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return houseRepository.findById(houseId);
  }

  async updateHouse(id, data, adminId, clientInfo = {}) {
    const house = await houseRepository.findById(id);
    if (!house) {
      throw new Error('House not found.');
    }

    await houseRepository.update(id, data);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Updated school house ID ${id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return houseRepository.findById(id);
  }

  async deleteHouse(id, adminId, clientInfo = {}) {
    const house = await houseRepository.findById(id);
    if (!house) {
      throw new Error('House not found.');
    }

    await houseRepository.delete(id);

    await auditLogRepository.create({
      user_id: adminId,
      action: `Deleted school house ID ${id} (${house.house_name})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'House deleted successfully.' };
  }

  async getAllHouses() {
    return houseRepository.findAll();
  }
}

export default new HouseService();

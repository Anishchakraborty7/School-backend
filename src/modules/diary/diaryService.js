import diaryRepository from './diaryRepository.js';
import studentRepository from '../student/studentRepository.js';
import teacherRepository from '../teacher/teacherRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';

class DiaryService {
  async addTeacherDiary(diaryData, teacherUser, clientInfo = {}) {
    const teacher = await teacherRepository.findByUserId(teacherUser.id);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }

    const diaryId = await diaryRepository.saveTeacherDiary({
      ...diaryData,
      teacher_id: teacher.id
    });

    await auditLogRepository.create({
      user_id: teacherUser.id,
      action: `Created teacher diary ID ${diaryId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return diaryRepository.findTeacherDiaryById(diaryId);
  }

  async getTeacherDiaries(teacherUser) {
    if (teacherUser.role_name === 'admin') {
      return diaryRepository.findAllTeacherDiaries();
    }
    const teacher = await teacherRepository.findByUserId(teacherUser.id);
    if (!teacher) {
      throw new Error('Teacher profile not found.');
    }
    return diaryRepository.findTeacherDiaries(teacher.id);
  }

  async addStudentDiary(diaryData, studentOrParentUser, clientInfo = {}) {
    let studentId = diaryData.student_id;

    if (studentOrParentUser.role_name === 'student') {
      const student = await studentRepository.findByUserId(studentOrParentUser.id);
      if (!student) {
        throw new Error('Student profile not found.');
      }
      studentId = student.id;
    }

    const diaryId = await diaryRepository.saveStudentDiary({
      ...diaryData,
      student_id: studentId
    });

    await auditLogRepository.create({
      user_id: studentOrParentUser.id,
      action: `Created student diary ID ${diaryId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return diaryRepository.findStudentDiaryById(diaryId);
  }

  async getStudentDiaries(studentUser) {
    if (studentUser.role_name === 'admin') {
      return diaryRepository.findAllStudentDiaries();
    }
    const student = await studentRepository.findByUserId(studentUser.id);
    if (!student) {
      throw new Error('Student profile not found.');
    }
    return diaryRepository.findStudentDiaries(student.id);
  }
}

export default new DiaryService();

import homeworkRepository from './homeworkRepository.js';
import studentRepository from '../student/studentRepository.js';
import teacherRepository from '../teacher/teacherRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class HomeworkService {
  async createHomework(hwData, filePath, adminOrTeacherUser, clientInfo = {}) {
    let teacherId;
    if (adminOrTeacherUser.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(adminOrTeacherUser.id);
      if (!teacher) {
        throw new Error('Associated teacher profile not found.');
      }
      teacherId = teacher.id;
    } else {
      teacherId = hwData.teacher_id; // Admin assigns teacher ID
    }

    const homeworkId = await homeworkRepository.create({
      ...hwData,
      teacher_id: teacherId,
      attachment: filePath ? filePath : null
    });

    // Create notifications for students in the class/section
    const pool = getPool();
    const students = await studentRepository.findAll({
      class_id: hwData.class_id,
      section_id: hwData.section_id
    });

    for (const student of students) {
      if (student.user_id) {
        await pool.query(
          "INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'in_app')",
          [
            student.user_id,
            'New Homework Assigned',
            `A new homework titled '${hwData.title}' was assigned for subject ID ${hwData.subject_id}. Due date: ${hwData.due_date}`
          ]
        );
      }
    }

    await auditLogRepository.create({
      user_id: adminOrTeacherUser.id,
      action: `Created homework ID ${homeworkId} for class ID ${hwData.class_id}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return homeworkRepository.findById(homeworkId);
  }

  async getHomeworkList(filters, user) {
    const activeFilters = { ...filters };

    if (user.role_name === 'student') {
      const student = await studentRepository.findByUserId(user.id);
      if (!student) {
        throw new Error('Associated student profile not found.');
      }
      activeFilters.class_id = student.class_id;
      activeFilters.section_id = student.section_id;
      activeFilters.academic_year_id = student.academic_year_id;
    } else if (user.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(user.id);
      if (teacher) {
        activeFilters.teacher_id = teacher.id;
      }
    }

    return homeworkRepository.findAll(activeFilters);
  }

  async submitHomework(homeworkId, submissionText, filePath, fileSize, fileType, studentUser, clientInfo = {}) {
    const student = await studentRepository.findByUserId(studentUser.id);
    if (!student) {
      throw new Error('Associated student profile not found.');
    }

    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      throw new Error('Homework not found.');
    }

    await homeworkRepository.saveSubmission({
      homework_id: homeworkId,
      student_id: student.id,
      submission_text: submissionText,
      file_path: filePath,
      file_size: fileSize,
      file_type: fileType
    });

    await auditLogRepository.create({
      user_id: studentUser.id,
      action: `Submitted homework ID ${homeworkId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Homework submitted successfully.' };
  }

  async getSubmissions(homeworkId, teacherUser) {
    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      throw new Error('Homework not found.');
    }

    if (teacherUser.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(teacherUser.id);
      if (!teacher || homework.teacher_id !== teacher.id) {
        throw new Error('Access Denied: You did not assign this homework.');
      }
    }

    return homeworkRepository.findSubmissionsByHomework(homeworkId);
  }

  async reviewSubmission(submissionId, points, remarks, teacherUser, clientInfo = {}) {
    const sub = await homeworkRepository.findSubmissionById(submissionId);
    if (!sub) {
      throw new Error('Submission not found.');
    }

    const homework = await homeworkRepository.findById(sub.homework_id);
    
    if (teacherUser.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(teacherUser.id);
      if (!teacher || homework.teacher_id !== teacher.id) {
        throw new Error('Access Denied: You cannot review this homework.');
      }
    }

    await homeworkRepository.updateSubmissionReview(submissionId, {
      status: 'reviewed',
      remarks,
      points_score: points
    });

    // Notify student
    const student = await studentRepository.findById(sub.student_id);
    if (student && student.user_id) {
      const pool = getPool();
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'in_app')",
        [
          student.user_id,
          'Homework Reviewed',
          `Your submission for homework '${homework.title}' has been reviewed. Score: ${points} points.`
        ]
      );
    }

    await auditLogRepository.create({
      user_id: teacherUser.id,
      action: `Reviewed homework submission ID ${submissionId}`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Submission reviewed successfully.' };
  }
}

export default new HomeworkService();

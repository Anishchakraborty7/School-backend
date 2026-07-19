import assignmentRepository from './assignmentRepository.js';
import studentRepository from '../student/studentRepository.js';
import teacherRepository from '../teacher/teacherRepository.js';
import auditLogRepository from '../admin/auditLogRepository.js';
import { getPool } from '../../database/db.js';

class AssignmentService {
  async createAssignment(assignData, filePath, adminOrTeacherUser, clientInfo = {}) {
    let teacherId;
    if (adminOrTeacherUser.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(adminOrTeacherUser.id);
      if (!teacher) {
        throw new Error('Associated teacher profile not found.');
      }
      teacherId = teacher.id;
    } else {
      teacherId = assignData.teacher_id;
    }

    const assignmentId = await assignmentRepository.create({
      ...assignData,
      teacher_id: teacherId,
      attachment_path: filePath ? filePath : null
    });

    if (assignData.status === 'published') {
      const pool = getPool();
      const students = await studentRepository.findAll({
        class_id: assignData.class_id,
        section_id: assignData.section_id
      });

      for (const student of students) {
        if (student.user_id) {
          await pool.query(
            "INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'in_app')",
            [
              student.user_id,
              'New Assignment Published',
              `A new assignment titled '${assignData.title}' was published. Max marks: ${assignData.max_marks}. Deadline: ${assignData.submission_deadline}`
            ]
          );
        }
      }
    }

    await auditLogRepository.create({
      user_id: adminOrTeacherUser.id,
      action: `Created assignment ID ${assignmentId} (${assignData.status})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return assignmentRepository.findById(assignmentId);
  }

  async getAssignmentsList(filters, user) {
    const activeFilters = { ...filters };

    if (user.role_name === 'student') {
      const student = await studentRepository.findByUserId(user.id);
      if (!student) {
        throw new Error('Associated student profile not found.');
      }
      activeFilters.class_id = student.class_id;
      activeFilters.section_id = student.section_id;
      activeFilters.status = 'published';
    } else if (user.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(user.id);
      if (teacher) {
        activeFilters.teacher_id = teacher.id;
      }
    }

    return assignmentRepository.findAll(activeFilters);
  }

  async submitAssignment(assignmentId, status, files, studentUser, clientInfo = {}) {
    const student = await studentRepository.findByUserId(studentUser.id);
    if (!student) {
      throw new Error('Associated student profile not found.');
    }

    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    const isLate = new Date() > new Date(assignment.submission_deadline);

    let submission = await assignmentRepository.findSubmission(assignmentId, student.id);
    let submissionId;

    if (submission) {
      submissionId = submission.id;
      await assignmentRepository.updateSubmission(submissionId, {
        status: status || 'submitted',
        is_late: isLate,
        submitted_at: new Date()
      });
      // Clear previous files for this submission and replace
      const pool = getPool();
      await pool.query('DELETE FROM assignment_submission_files WHERE submission_id = ?', [submissionId]);
    } else {
      submissionId = await assignmentRepository.createSubmission({
        assignment_id: assignmentId,
        student_id: student.id,
        is_late: isLate,
        status: status || 'submitted'
      });
    }

    if (files && files.length > 0) {
      const mappedFiles = files.map(f => ({
        file_path: `uploads/student_docs/${f.filename}`,
        file_size: f.size,
        file_type: f.mimetype
      }));
      await assignmentRepository.saveSubmissionFiles(submissionId, mappedFiles);
    }

    await auditLogRepository.create({
      user_id: studentUser.id,
      action: `Submitted assignment ID ${assignmentId} (Status: ${status || 'submitted'})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Assignment submitted successfully.' };
  }

  async getSubmissions(assignmentId, teacherUser) {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    if (teacherUser.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(teacherUser.id);
      if (!teacher || assignment.teacher_id !== teacher.id) {
        throw new Error('Access Denied: You did not assign this assignment.');
      }
    }

    const submissions = await assignmentRepository.findSubmissionsByAssignment(assignmentId);
    for (const sub of submissions) {
      sub.files = await assignmentRepository.getSubmissionFiles(sub.id);
    }
    return submissions;
  }

  async reviewSubmission(submissionId, marksObtained, remarks, status, teacherUser, clientInfo = {}) {
    const sub = await assignmentRepository.findSubmissionById(submissionId);
    if (!sub) {
      throw new Error('Submission not found.');
    }

    const assignment = await assignmentRepository.findById(sub.assignment_id);

    if (teacherUser.role_name === 'teacher') {
      const teacher = await teacherRepository.findByUserId(teacherUser.id);
      if (!teacher || assignment.teacher_id !== teacher.id) {
        throw new Error('Access Denied: You cannot review this assignment.');
      }
    }

    if (marksObtained !== undefined && marksObtained > assignment.max_marks) {
      throw new Error(`Marks obtained cannot exceed max marks of ${assignment.max_marks}.`);
    }

    await assignmentRepository.updateSubmission(submissionId, {
      marks_obtained: marksObtained,
      remarks,
      status: status || 'reviewed'
    });

    // Notify student
    const student = await studentRepository.findById(sub.student_id);
    if (student && student.user_id) {
      const pool = getPool();
      await pool.query(
        "INSERT INTO notifications (user_id, title, message, channel) VALUES (?, ?, ?, 'in_app')",
        [
          student.user_id,
          'Assignment Graded',
          status === 'correction_required'
            ? `Your submission for assignment '${assignment.title}' requires corrections.`
            : `Your submission for assignment '${assignment.title}' has been graded. Marks: ${marksObtained}/${assignment.max_marks}.`
        ]
      );
    }

    await auditLogRepository.create({
      user_id: teacherUser.id,
      action: `Reviewed assignment submission ID ${submissionId} (Marks: ${marksObtained})`,
      ip: clientInfo.ip || null,
      device: clientInfo.device || null,
      browser: clientInfo.browser || null
    });

    return { message: 'Submission reviewed successfully.' };
  }
}

export default new AssignmentService();

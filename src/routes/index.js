import { Router } from 'express';
import authRoutes from '../modules/auth/authRoutes.js';
import userRoutes from '../modules/user/userRoutes.js';
import adminRoutes from '../modules/admin/adminRoutes.js';
import academicYearRoutes from '../modules/academic-year/academicYearRoutes.js';
import classRoutes from '../modules/class/classRoutes.js';
import sectionRoutes from '../modules/section/sectionRoutes.js';
import subjectRoutes from '../modules/subject/subjectRoutes.js';
import houseRoutes from '../modules/house/houseRoutes.js';
import studentRoutes from '../modules/student/studentRoutes.js';
import teacherRoutes from '../modules/teacher/teacherRoutes.js';
import classTeacherRoutes from '../modules/class-teacher/classTeacherRoutes.js';
import promotionRoutes from '../modules/promotion/promotionRoutes.js';
import transferRoutes from '../modules/transfer/transferRoutes.js';
import importExportRoutes from '../modules/import-export/importExportRoutes.js';

// Phase 3 Route Imports
import attendanceRoutes from '../modules/attendance/attendanceRoutes.js';
import timetableRoutes from '../modules/timetable/timetableRoutes.js';
import homeworkRoutes from '../modules/homework/homeworkRoutes.js';
import assignmentRoutes from '../modules/assignment/assignmentRoutes.js';
import leaveRoutes from '../modules/leave/leaveRoutes.js';
import examRoutes from '../modules/exam/examRoutes.js';
import reportCardRoutes from '../modules/report-card/reportCardRoutes.js';
import announcementRoutes from '../modules/announcement/announcementRoutes.js';
import notificationRoutes from '../modules/notification/notificationRoutes.js';
import diaryRoutes from '../modules/diary/diaryRoutes.js';
import calendarRoutes from '../modules/calendar/calendarRoutes.js';

const router = Router();

// Phase 1 Routes
router.use('/', authRoutes);
router.use('/', userRoutes);
router.use('/admin', adminRoutes);

// Phase 2 Routes
router.use('/academic-years', academicYearRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/subjects', subjectRoutes);
router.use('/houses', houseRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/class-teacher', classTeacherRoutes);
router.use('/promotion', promotionRoutes);
router.use('/transfer', transferRoutes);
router.use('/', importExportRoutes);

// Phase 3 Routes
router.use('/attendance', attendanceRoutes);
router.use('/timetable', timetableRoutes);
router.use('/homework', homeworkRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/leaves', leaveRoutes);
router.use('/exams', examRoutes);
router.use('/report-cards', reportCardRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/diaries', diaryRoutes);
router.use('/calendar', calendarRoutes);

export default router;

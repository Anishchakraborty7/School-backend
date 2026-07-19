import app from '../app.js';
import { initializeDatabase, getPool } from '../database/db.js';
import bcrypt from 'bcryptjs';

const PORT = 5003;
let server;

async function setup() {
  await initializeDatabase();
  const pool = getPool();
  
  // Clean tables to ensure tests are idempotent and database schema is fresh
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query("DELETE FROM students WHERE class_id = 4 AND section_id = 10 AND roll_number = 1");
  await pool.query("DELETE FROM students WHERE admission_number = 'ADM001'");
  await pool.query("DELETE FROM teachers WHERE employee_id = 'EMP001'");
  await pool.query("DELETE FROM users WHERE email IN ('alice@student.com', 'john@school.com')");
  await pool.query('TRUNCATE TABLE student_attendance');
  await pool.query('TRUNCATE TABLE attendance_locks');
  await pool.query('TRUNCATE TABLE teacher_attendance');
  await pool.query('TRUNCATE TABLE timetable');
  await pool.query('TRUNCATE TABLE homework_submissions');
  await pool.query('TRUNCATE TABLE homework');
  await pool.query('TRUNCATE TABLE assignment_submission_files');
  await pool.query('TRUNCATE TABLE assignment_submissions');
  await pool.query('TRUNCATE TABLE assignments');
  await pool.query('TRUNCATE TABLE leave_requests');
  await pool.query('TRUNCATE TABLE exam_marks');
  await pool.query('TRUNCATE TABLE exam_schedules');
  await pool.query('TRUNCATE TABLE exams');
  await pool.query('TRUNCATE TABLE holidays');
  await pool.query('TRUNCATE TABLE calendar_events');
  await pool.query('TRUNCATE TABLE announcements');
  await pool.query('TRUNCATE TABLE notifications');
  await pool.query('TRUNCATE TABLE teacher_diaries');
  await pool.query('TRUNCATE TABLE student_diaries');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[PHASE 3 TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });
}

async function teardown() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[PHASE 3 TEST SERVER] Stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function run() {
  console.log('\n--- STARTING PHASE 3 ERP OPERATIONAL INTEGRATION TESTS ---\n');
  let testCount = 0;
  let passCount = 0;

  function assert(condition, message) {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`✔ [PASS] ${message}`);
    } else {
      console.error(`✘ [FAIL] ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  try {
    await setup();
    const baseUrl = `http://localhost:${PORT}`;
    const pool = getPool();

    // Hashed credentials for logins
    const teacherPasswordHash = await bcrypt.hash('TeacherPassword123!', 10);
    const studentPasswordHash = await bcrypt.hash('StudentPassword123!', 10);

    // Step A: Login as admin
    const adminLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@school.com',
        password: 'AdminPassword123!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin login should succeed');
    const adminAccessToken = adminLoginData.data.accessToken;

    // Step B: Set up dynamic teacher and student linking from Phase 2 in the test DB
    // 1. Create school house
    await pool.query(
      "INSERT IGNORE INTO school_houses (house_name, color_code) VALUES ('Blue House', '#0000ff')"
    );
    const [houseRows] = await pool.query("SELECT id FROM school_houses WHERE house_name = 'Blue House'");
    const houseId = houseRows[0].id;
    
    // 2. Resolve Role IDs dynamically
    const [studentRoleRows] = await pool.query("SELECT id FROM roles WHERE role_name = 'student'");
    const studentRoleId = studentRoleRows[0].id;
    
    const [teacherRoleRows] = await pool.query("SELECT id FROM roles WHERE role_name = 'teacher'");
    const teacherRoleId = teacherRoleRows[0].id;

    // 3. Create student user for Alice
    const [aliceUserResult] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified) VALUES ('Alice Smith', 'alice@student.com', '1112223334', ?, ?, 'active', 1)",
      [studentPasswordHash, studentRoleId]
    );
    const aliceUserId = aliceUserResult.insertId;

    // 4. Create student profile linked to aliceUserId
    const [studentResult] = await pool.query(
      `INSERT INTO students (admission_number, roll_number, first_name, last_name, gender, date_of_birth, admission_date, academic_year_id, class_id, section_id, house_id, user_id)
       VALUES ('ADM001', 1, 'Alice', 'Smith', 'female', '2018-08-20', '2026-06-15', 1, 4, 10, ?, ?)`,
      [houseId, aliceUserId]
    );
    const studentId = studentResult.insertId;

    // 5. Create teacher user for John
    const [johnUserResult] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified) VALUES ('John Doe', 'john@school.com', '9876543211', ?, ?, 'active', 1)",
      [teacherPasswordHash, teacherRoleId]
    );
    const johnUserId = johnUserResult.insertId;

    // 5. Create teacher profile linked to johnUserId
    const [teacherResult] = await pool.query(
      `INSERT INTO teachers (employee_id, joining_date, first_name, last_name, gender, dob, phone, email, designation, department, salary, user_id)
       VALUES ('EMP001', '2026-06-01', 'John', 'Doe', 'male', '1985-05-15', '9876543211', 'john@school.com', 'Senior Faculty', 'Mathematics', 65000.00, ?)`,
      [johnUserId]
    );
    const teacherId = teacherResult.insertId;

    // Logins for student and teacher
    const teacherLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@school.com',
        password: 'TeacherPassword123!'
      })
    });
    const teacherLoginData = await teacherLoginRes.json();
    const teacherAccessToken = teacherLoginData.data.accessToken;

    const studentLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@student.com',
        password: 'StudentPassword123!'
      })
    });
    const studentLoginData = await studentLoginRes.json();
    const studentAccessToken = studentLoginData.data.accessToken;

    const todayDate = new Date().toISOString().split('T')[0];

    // ==========================================
    // TEST CASE 1: TIMETABLE & PERIOD SEEDS
    // ==========================================
    const periodsRes = await fetch(`${baseUrl}/timetable/periods?year_id=1`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const periodsData = await periodsRes.json();
    assert(periodsRes.status === 200, 'Fetching school periods should succeed');
    assert(periodsData.data.length > 0, 'Seeded periods should exist in database');
    const period1Id = periodsData.data[0].id;

    // Create Timetable Slot
    const timetableRes = await fetch(`${baseUrl}/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 4, // Class 1
        section_id: 10, // Section A
        period_id: period1Id,
        subject_id: 2, // Mathematics
        teacher_id: teacherId,
        room_number: 'Room 101',
        day_of_week: 'Monday'
      })
    });
    assert(timetableRes.status === 201, 'Creating timetable slot should succeed');

    // Attempt to register overlapping timetable slot (Teacher conflict)
    const overlapTimetableRes = await fetch(`${baseUrl}/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 5, // Class 2
        section_id: 13, // Section A
        period_id: period1Id,
        subject_id: 1, // English
        teacher_id: teacherId, // John Doe again
        room_number: 'Room 102',
        day_of_week: 'Monday'
      })
    });
    assert(overlapTimetableRes.status === 500, 'Overlapping timetable booking (Teacher conflict) should block and fail');

    // ==========================================
    // TEST CASE 2: ATTENDANCE & LOCK CONTROLS
    // ==========================================
    // Submit student attendance
    const attendanceRes = await fetch(`${baseUrl}/attendance/student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        class_id: 4,
        section_id: 10,
        date: todayDate,
        records: [
          { student_id: studentId, status: 'present', remarks: 'On time' }
        ]
      })
    });
    assert(attendanceRes.status === 200, 'Recording student attendance should succeed');

    // Lock attendance
    const lockRes = await fetch(`${baseUrl}/attendance/student/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        class_id: 4,
        section_id: 10,
        date: todayDate
      })
    });
    assert(lockRes.status === 200, 'Locking student attendance should succeed');

    // Try to update locked attendance (expect fail)
    const lockedUpdateRes = await fetch(`${baseUrl}/attendance/student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        class_id: 4,
        section_id: 10,
        date: todayDate,
        records: [
          { student_id: studentId, status: 'absent' }
        ]
      })
    });
    assert(lockedUpdateRes.status === 500, 'Updating locked student attendance should fail');

    // Unlock attendance
    const unlockRes = await fetch(`${baseUrl}/attendance/student/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        class_id: 4,
        section_id: 10,
        date: todayDate
      })
    });
    assert(unlockRes.status === 200, 'Unlocking student attendance should succeed');

    // Record teacher attendance
    const teacherAttRes = await fetch(`${baseUrl}/attendance/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        teacher_id: teacherId,
        date: todayDate,
        status: 'present',
        remarks: 'Punctual'
      })
    });
    assert(teacherAttRes.status === 200, 'Recording teacher attendance should succeed');

    // ==========================================
    // TEST CASE 3: HOMEWORK ASSIGNMENT & LOGS
    // ==========================================
    const homeworkRes = await fetch(`${baseUrl}/homework`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 4,
        section_id: 10,
        subject_id: 2,
        title: 'Math Algebra Homework',
        description: 'Complete page 12 exercises',
        due_date: todayDate,
        priority: 'normal'
      })
    });
    const homeworkData = await homeworkRes.json();
    if (homeworkRes.status !== 201) {
      console.error('Homework creation failed. Status:', homeworkRes.status, 'Response:', homeworkData);
    }
    assert(homeworkRes.status === 201, 'Teacher creating homework should succeed');
    const homeworkId = homeworkData.data.id;

    // Student Submits Homework
    const hwSubmitRes = await fetch(`${baseUrl}/homework/${homeworkId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentAccessToken}`
      },
      body: JSON.stringify({
        submission_text: 'Solved exercises 1 to 10.'
      })
    });
    assert(hwSubmitRes.status === 200, 'Student submitting homework should succeed');

    // Teacher retrieves submissions
    const submissionsRes = await fetch(`${baseUrl}/homework/${homeworkId}/submissions`, {
      headers: { 'Authorization': `Bearer ${teacherAccessToken}` }
    });
    const subsData = await submissionsRes.json();
    assert(submissionsRes.status === 200, 'Teacher fetching homework submissions should succeed');
    const subId = subsData.data[0].id;

    // Teacher reviews submission
    const reviewRes = await fetch(`${baseUrl}/homework/submissions/${subId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherAccessToken}`
      },
      body: JSON.stringify({
        points_score: 9.5,
        remarks: 'Well done'
      })
    });
    assert(reviewRes.status === 200, 'Teacher reviewing submission should succeed');

    // ==========================================
    // TEST CASE 4: ASSIGNMENTS (DRAFT, MULTI-FILE)
    // ==========================================
    const assignRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 4,
        section_id: 10,
        subject_id: 2,
        title: 'Term Assignment',
        description: 'Write essay',
        max_marks: 50.00,
        due_date: todayDate,
        submission_deadline: '2026-12-31 23:59:59',
        status: 'published'
      })
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 201, 'Creating assignment should succeed');
    const assignmentId = assignData.data.id;

    // Submit assignment as Draft
    const draftSubmitRes = await fetch(`${baseUrl}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentAccessToken}`
      },
      body: JSON.stringify({
        status: 'draft'
      })
    });
    assert(draftSubmitRes.status === 200, 'Submitting assignment as draft should succeed');

    // ==========================================
    // TEST CASE 5: LEAVE MANAGEMENT
    // ==========================================
    const leaveReqRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentAccessToken}`
      },
      body: JSON.stringify({
        leave_type: 'medical',
        start_date: todayDate,
        end_date: todayDate,
        reason: 'Dentist appointment'
      })
    });
    const leaveReqData = await leaveReqRes.json();
    assert(leaveReqRes.status === 201, 'Student requesting leave should succeed');
    const leaveId = leaveReqData.data.id;

    // Admin processes leave
    const processLeaveRes = await fetch(`${baseUrl}/leaves/${leaveId}/process`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        remarks: 'Rest well'
      })
    });
    assert(processLeaveRes.status === 200, 'Admin approving leave request should succeed');

    // ==========================================
    // TEST CASE 6: EXAMINATION, LOCKS & GRADES
    // ==========================================
    const examRes = await fetch(`${baseUrl}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        exam_type: 'half_yearly',
        exam_name: 'Mid Term Exams'
      })
    });
    const examData = await examRes.json();
    assert(examRes.status === 201, 'Creating exam term should succeed');
    const examId = examData.data.id;

    // Schedule Exam Subject
    const schedRes = await fetch(`${baseUrl}/exams/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        exam_id: examId,
        subject_id: 2, // Math
        class_id: 4,
        section_id: 10,
        exam_date: todayDate,
        start_time: '09:00:00',
        end_time: '12:00:00',
        room_number: 'Exam Hall 1',
        max_marks: 100.00,
        pass_marks: 40.00
      })
    });
    const schedData = await schedRes.json();
    assert(schedRes.status === 201, 'Scheduling exam should succeed');
    const scheduleId = schedData.data.id;

    // Enter Exam Marks
    const marksRes = await fetch(`${baseUrl}/exams/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherAccessToken}`
      },
      body: JSON.stringify({
        records: [
          {
            exam_schedule_id: scheduleId,
            student_id: studentId,
            marks_theory: 50.00,
            marks_practical: 30.00,
            marks_internal: 15.00,
            is_absent: false,
            remarks: 'Excellent work'
          }
        ]
      })
    });
    assert(marksRes.status === 200, 'Recording student exam marks should succeed');

    // Lock Exam
    const lockExamRes = await fetch(`${baseUrl}/exams/${examId}/lock`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    assert(lockExamRes.status === 200, 'Admin locking/completing exam should succeed');

    // Try to edit marks after exam lock (expect fail)
    const lockVerifyRes = await fetch(`${baseUrl}/exams/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherAccessToken}`
      },
      body: JSON.stringify({
        records: [
          {
            exam_schedule_id: scheduleId,
            student_id: studentId,
            marks_theory: 60.00,
            marks_practical: 30.00,
            marks_internal: 10.00
          }
        ]
      })
    });
    assert(lockVerifyRes.status === 500, 'Modifying marks of locked exam should fail');

    // ==========================================
    // TEST CASE 7: PRINTABLE PROGRESS CARD
    // ==========================================
    const reportCardRes = await fetch(`${baseUrl}/report-cards/student/${studentId}?exam_id=${examId}`, {
      headers: { 'Authorization': `Bearer ${studentAccessToken}` }
    });
    const reportCardHtml = await reportCardRes.text();
    assert(reportCardRes.status === 200, 'Fetching student progress report card should succeed');
    assert(reportCardHtml.includes('PROGRESS REPORT CARD') && reportCardHtml.includes('Alice Smith') && reportCardHtml.includes('A+'), 'Report card HTML should render title, student profile, and correct resolved grade letter (A+)');

    // ==========================================
    // TEST CASE 8: HOLIDAYS, ANNOUNCEMENTS & DIARY
    // ==========================================
    // Create Holiday
    const holidayRes = await fetch(`${baseUrl}/calendar/holidays`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        holiday_name: 'Summer Break',
        holiday_date: '2026-07-20',
        holiday_type: 'school',
        description: 'Annual vacation'
      })
    });
    assert(holidayRes.status === 201, 'Creating holiday should succeed');

    // Create Announcement
    const annRes = await fetch(`${baseUrl}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        title: 'School Reopens',
        content: 'Reopening on next Monday.',
        visibility: 'all',
        priority: 'important'
      })
    });
    assert(annRes.status === 201, 'Creating announcement should succeed');

    // Create Teacher Diary entry
    const diaryRes = await fetch(`${baseUrl}/diaries/teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherAccessToken}`
      },
      body: JSON.stringify({
        date: todayDate,
        class_id: 4,
        section_id: 10,
        subject_id: 2,
        topics_covered: 'Algebra basics and equations.',
        homework_given: 'Solve exercise 2A.'
      })
    });
    assert(diaryRes.status === 201, 'Creating teacher diary entry should succeed');

    // ==========================================
    // TEST CASE 9: USER DASHBOARD UPDATES
    // ==========================================
    const dashboardRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${studentAccessToken}` }
    });
    const dashboardData = await dashboardRes.json();
    assert(dashboardRes.status === 200, 'Student fetching updated dashboard should succeed');
    assert(dashboardData.data.active_homework.length > 0, 'Dashboard should render assigned homework');

    console.log(`\n🎉 ALL PHASE 3 TESTS PASSED: ${passCount}/${testCount}\n`);
  } catch (error) {
    console.error('\n❌ PHASE 3 TEST RUN ERROR:', error.message);
    process.exitCode = 1;
  } finally {
    await teardown();
    process.exit(process.exitCode || 0);
  }
}

run();

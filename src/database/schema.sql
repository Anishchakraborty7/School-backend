-- Schema definition for School Management System (Phase 1 & Phase 2)

-- ==========================================
-- PHASE 1: AUTHENTICATION AND ROLE SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('pending', 'active', 'blocked', 'suspended') DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255) NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_token (token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_token (token)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NULL,
  device VARCHAR(255) NULL,
  browser VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;


-- ==========================================
-- PHASE 2: ACADEMIC MODULE TABLES
-- ==========================================

-- 1. Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_name VARCHAR(20) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Classes
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  description VARCHAR(255) NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE KEY uq_year_class (academic_year_id, class_name)
) ENGINE=InnoDB;

-- 3. Sections
CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  section_name VARCHAR(10) NOT NULL,
  capacity INT DEFAULT 40,
  room_number VARCHAR(20) NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY uq_class_section (class_id, section_name)
) ENGINE=InnoDB;

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(30) UNIQUE NOT NULL,
  description VARCHAR(255) NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Class Subjects Junction
CREATE TABLE IF NOT EXISTS class_subjects (
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  PRIMARY KEY (class_id, subject_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. School Houses
CREATE TABLE IF NOT EXISTS school_houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  house_name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NULL,
  color_code VARCHAR(10) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Students
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  roll_number INT NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  date_of_birth DATE NOT NULL,
  blood_group VARCHAR(5) NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(50) NULL,
  state VARCHAR(50) NULL,
  country VARCHAR(50) NULL,
  pin_code VARCHAR(15) NULL,
  photo VARCHAR(255) NULL,
  aadhaar_number VARCHAR(20) NULL,
  admission_date DATE NOT NULL,
  academic_year_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  house_id INT NULL,
  status ENUM('active', 'inactive', 'graduated', 'transferred', 'dropped') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (house_id) REFERENCES school_houses(id) ON DELETE SET NULL,
  UNIQUE KEY uq_class_section_roll (academic_year_id, class_id, section_id, roll_number),
  INDEX idx_student_name (first_name, last_name),
  INDEX idx_student_email (email),
  INDEX idx_student_phone (phone),
  INDEX idx_student_deleted (deleted_at)
) ENGINE=InnoDB;

-- 8. Guardians
CREATE TABLE IF NOT EXISTS guardians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNIQUE NOT NULL,
  father_name VARCHAR(100) NULL,
  mother_name VARCHAR(100) NULL,
  guardian_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  occupation VARCHAR(100) NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NULL,
  address VARCHAR(255) NULL,
  annual_income DECIMAL(12,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Student Documents
CREATE TABLE IF NOT EXISTS student_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  document_type ENUM('birth_certificate', 'transfer_certificate', 'migration', 'marksheet', 'passport_photo', 'aadhaar', 'other') NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Student Promotion History
CREATE TABLE IF NOT EXISTS student_promotion_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  from_academic_year_id INT NOT NULL,
  to_academic_year_id INT NOT NULL,
  from_class_id INT NOT NULL,
  to_class_id INT NOT NULL,
  from_section_id INT NOT NULL,
  to_section_id INT NOT NULL,
  from_roll_number INT NOT NULL,
  to_roll_number INT NOT NULL,
  promoted_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (from_academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (to_academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (from_class_id) REFERENCES classes(id),
  FOREIGN KEY (to_class_id) REFERENCES classes(id),
  FOREIGN KEY (from_section_id) REFERENCES sections(id),
  FOREIGN KEY (to_section_id) REFERENCES sections(id),
  FOREIGN KEY (promoted_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- 11. Student Transfer History
CREATE TABLE IF NOT EXISTS student_transfer_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  from_academic_year_id INT NOT NULL,
  to_academic_year_id INT NOT NULL,
  from_class_id INT NOT NULL,
  to_class_id INT NOT NULL,
  from_section_id INT NOT NULL,
  to_section_id INT NOT NULL,
  transfer_type ENUM('section_change', 'class_change', 'year_change', 'other') NOT NULL,
  reason VARCHAR(255) NULL,
  transferred_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (from_academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (to_academic_year_id) REFERENCES academic_years(id),
  FOREIGN KEY (from_class_id) REFERENCES classes(id),
  FOREIGN KEY (to_class_id) REFERENCES classes(id),
  FOREIGN KEY (from_section_id) REFERENCES sections(id),
  FOREIGN KEY (to_section_id) REFERENCES sections(id),
  FOREIGN KEY (transferred_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- 12. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  joining_date DATE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  middle_name VARCHAR(50) NULL,
  last_name VARCHAR(50) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  dob DATE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  qualification VARCHAR(255) NULL,
  experience VARCHAR(255) NULL,
  department VARCHAR(100) NULL,
  designation VARCHAR(100) NULL,
  salary DECIMAL(12,2) NULL,
  blood_group VARCHAR(5) NULL,
  photo VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(50) NULL,
  state VARCHAR(50) NULL,
  country VARCHAR(50) NULL,
  status ENUM('active', 'inactive', 'suspended', 'retired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_teacher_name (first_name, last_name),
  INDEX idx_teacher_email (email),
  INDEX idx_teacher_phone (phone),
  INDEX idx_teacher_deleted (deleted_at)
) ENGINE=InnoDB;

-- 13. Teacher Documents
CREATE TABLE IF NOT EXISTS teacher_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  document_type ENUM('pan', 'aadhaar', 'certificates', 'resume', 'experience_letters', 'joining_letter', 'other') NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Teacher Qualifications
CREATE TABLE IF NOT EXISTS teacher_qualifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  degree VARCHAR(100) NOT NULL,
  institution VARCHAR(150) NOT NULL,
  passing_year INT NOT NULL,
  percentage_cgpa VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Teacher Experience
CREATE TABLE IF NOT EXISTS teacher_experience (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  organization VARCHAR(150) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. Class Teacher Assignment
CREATE TABLE IF NOT EXISTS class_teacher (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE KEY uq_section_class_teacher (class_id, section_id, academic_year_id)
) ENGINE=InnoDB;

-- 17. Teacher Subjects Junction
CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  PRIMARY KEY (teacher_id, subject_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Teacher Classes Junction
CREATE TABLE IF NOT EXISTS teacher_classes (
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  PRIMARY KEY (teacher_id, class_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ==========================================
-- PHASE 3: DAILY OPERATIONAL MODULES
-- ==========================================

-- 1. Student Attendance
CREATE TABLE IF NOT EXISTS student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_date DATE NOT NULL,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NULL,
  status ENUM('present', 'absent', 'late', 'half_day', 'medical_leave', 'authorized_leave', 'unauthorized_leave') NOT NULL,
  remarks VARCHAR(255) NULL,
  taken_by INT NOT NULL,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (taken_by) REFERENCES users(id),
  UNIQUE KEY uq_student_date_subject (student_id, attendance_date, subject_id)
) ENGINE=InnoDB;

-- 2. Attendance Locks
CREATE TABLE IF NOT EXISTS attendance_locks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_date DATE NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  is_locked BOOLEAN DEFAULT TRUE,
  locked_by INT NOT NULL,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (locked_by) REFERENCES users(id),
  UNIQUE KEY uq_class_section_date (class_id, section_id, attendance_date)
) ENGINE=InnoDB;

-- 3. Teacher Attendance
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_date DATE NOT NULL,
  teacher_id INT NOT NULL,
  status ENUM('present', 'absent', 'late', 'half_day', 'medical_leave', 'authorized_leave', 'unauthorized_leave') NOT NULL,
  remarks VARCHAR(255) NULL,
  taken_by INT NOT NULL,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (taken_by) REFERENCES users(id),
  UNIQUE KEY uq_teacher_date (teacher_id, attendance_date)
) ENGINE=InnoDB;

-- 4. School Periods
CREATE TABLE IF NOT EXISTS school_periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  period_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_lunch_break BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  period_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (period_id) REFERENCES school_periods(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_teacher_day_period (academic_year_id, teacher_id, day_of_week, period_id),
  UNIQUE KEY uq_room_day_period (academic_year_id, room_number, day_of_week, period_id),
  UNIQUE KEY uq_class_section_day_period (academic_year_id, class_id, section_id, day_of_week, period_id)
) ENGINE=InnoDB;

-- 6. Homework
CREATE TABLE IF NOT EXISTS homework (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  attachment VARCHAR(255) NULL,
  due_date DATE NOT NULL,
  status ENUM('active', 'archived') DEFAULT 'active',
  priority ENUM('normal', 'important', 'emergency') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Homework Submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  homework_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT NULL,
  file_path VARCHAR(255) NULL,
  file_size INT NULL,
  file_type VARCHAR(50) NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted', 'reviewed') DEFAULT 'submitted',
  remarks TEXT NULL,
  points_score DECIMAL(5,2) NULL,
  FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_homework (homework_id, student_id)
) ENGINE=InnoDB;

-- 8. Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  attachment_path VARCHAR(255) NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  due_date DATE NOT NULL,
  submission_deadline TIMESTAMP NOT NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_late BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'submitted', 'reviewed', 'correction_required') DEFAULT 'submitted',
  remarks TEXT NULL,
  marks_obtained DECIMAL(5,2) NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_assignment (assignment_id, student_id)
) ENGINE=InnoDB;

-- 10. Assignment Submission Files
CREATE TABLE IF NOT EXISTS assignment_submission_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type ENUM('medical', 'emergency', 'personal', 'vacation', 'half_day') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  remarks TEXT NULL,
  processed_by INT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. Exams
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  exam_type ENUM('unit_test', 'half_yearly', 'annual', 'practical', 'class_test') NOT NULL,
  exam_name VARCHAR(100) NOT NULL,
  status ENUM('draft', 'published', 'completed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Exam Schedules
CREATE TABLE IF NOT EXISTS exam_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  pass_marks DECIMAL(5,2) NOT NULL,
  status ENUM('active', 'cancelled') DEFAULT 'active',
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE KEY uq_exam_schedule (exam_id, subject_id, class_id, section_id)
) ENGINE=InnoDB;

-- 14. Exam Marks
CREATE TABLE IF NOT EXISTS exam_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_schedule_id INT NOT NULL,
  student_id INT NOT NULL,
  marks_theory DECIMAL(5,2) DEFAULT 0.00,
  marks_practical DECIMAL(5,2) DEFAULT 0.00,
  marks_internal DECIMAL(5,2) DEFAULT 0.00,
  total_marks DECIMAL(5,2) DEFAULT 0.00,
  is_absent BOOLEAN DEFAULT FALSE,
  remarks TEXT NULL,
  entered_by INT NOT NULL,
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_schedule_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id),
  UNIQUE KEY uq_student_exam_marks (exam_schedule_id, student_id)
) ENGINE=InnoDB;

-- 15. Grading Scales
CREATE TABLE IF NOT EXISTS grading_scales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade_letter VARCHAR(5) UNIQUE NOT NULL,
  min_percentage DECIMAL(5,2) NOT NULL,
  max_percentage DECIMAL(5,2) NOT NULL,
  gpa_value DECIMAL(3,2) NOT NULL,
  description VARCHAR(100) NULL
) ENGINE=InnoDB;

-- 16. Holidays
CREATE TABLE IF NOT EXISTS holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  holiday_name VARCHAR(100) NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_type ENUM('national', 'festival', 'emergency', 'school', 'half_day') NOT NULL,
  description TEXT NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE KEY uq_holiday_date (academic_year_id, holiday_date)
) ENGINE=InnoDB;

-- 17. Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  event_type ENUM('opening_closing', 'exam', 'ptm', 'sports', 'festival', 'result_day', 'cultural', 'competition', 'seminar', 'workshop') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  visibility ENUM('all', 'teachers', 'students') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  visibility ENUM('all', 'class', 'section', 'teachers', 'students') DEFAULT 'all',
  target_class_id INT NULL,
  target_section_id INT NULL,
  priority ENUM('normal', 'important', 'emergency') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (target_section_id) REFERENCES sections(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 19. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('in_app', 'email', 'sms', 'push') DEFAULT 'in_app',
  status ENUM('unread', 'read') DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 20. Teacher Diaries
CREATE TABLE IF NOT EXISTS teacher_diaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  date DATE NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  topics_covered TEXT NOT NULL,
  homework_given TEXT NULL,
  remarks TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 21. Student Diaries
CREATE TABLE IF NOT EXISTS student_diaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  diary_notes TEXT NOT NULL,
  parent_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;


import { initializeDatabase, getPool } from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting DB seeding of test teachers and students...');
  try {
    await initializeDatabase();
    const pool = getPool();

    // 1. Get role IDs
    const [teacherRoleRows] = await pool.query('SELECT id FROM roles WHERE role_name = "teacher"');
    const [studentRoleRows] = await pool.query('SELECT id FROM roles WHERE role_name = "student"');

    if (teacherRoleRows.length === 0 || studentRoleRows.length === 0) {
      throw new Error('Required roles (teacher or student) not found. Please ensure roles are seeded.');
    }

    const teacherRoleId = teacherRoleRows[0].id;
    const studentRoleId = studentRoleRows[0].id;

    console.log(`Retrieved Role IDs - Teacher: ${teacherRoleId}, Student: ${studentRoleId}`);

    // 2. Clean up previous test seed data
    console.log('Cleaning up previous test seed data...');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');

      // Clean guardians
      await conn.query('DELETE FROM guardians WHERE student_id IN (SELECT id FROM students WHERE admission_number LIKE "T_ADM_%")');
      // Clean students
      await conn.query('DELETE FROM students WHERE admission_number LIKE "T_ADM_%"');
      // Clean student users
      await conn.query('DELETE FROM users WHERE email LIKE "test_student_%@test.com"');

      // Clean teacher assignments/relations
      await conn.query('DELETE FROM class_teacher WHERE teacher_id IN (SELECT id FROM teachers WHERE employee_id LIKE "T_EMP_%")');
      await conn.query('DELETE FROM teacher_classes WHERE teacher_id IN (SELECT id FROM teachers WHERE employee_id LIKE "T_EMP_%")');
      await conn.query('DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE employee_id LIKE "T_EMP_%")');
      // Clean teachers
      await conn.query('DELETE FROM teachers WHERE employee_id LIKE "T_EMP_%"');
      // Clean teacher users
      await conn.query('DELETE FROM users WHERE email LIKE "test_teacher_%@test.com"');

      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      await conn.commit();
      console.log('Cleanup completed successfully.');
    } catch (err) {
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // 3. Hash passwords once
    console.log('Hashing passwords...');
    const teacherPasswordHash = await bcrypt.hash('teacher@me', 12);
    const studentPasswordHash = await bcrypt.hash('student@me', 12);
    console.log('Passwords hashed.');

    // 4. Seed 30 teachers
    console.log('Seeding 30 teachers...');
    const connTeachers = await pool.getConnection();
    try {
      await connTeachers.beginTransaction();

      for (let i = 1; i <= 30; i++) {
        const email = `test_teacher_${i}@test.com`;
        const phone = `90000000${String(i).padStart(2, '0')}`;
        const fullName = `Test Teacher ${i}`;
        const employeeId = `T_EMP_${String(i).padStart(3, '0')}`;
        const firstName = `Teacher${i}`;
        const lastName = `Test`;
        const gender = i % 2 === 0 ? 'female' : 'male';
        const department = i % 3 === 0 ? 'Science' : i % 3 === 1 ? 'Mathematics' : 'Academics';

        // Insert into users
        const [userResult] = await connTeachers.query(
          `INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified)
           VALUES (?, ?, ?, ?, ?, 'active', true)`,
          [fullName, email, phone, teacherPasswordHash, teacherRoleId]
        );
        const userId = userResult.insertId;

        // Insert into teachers
        await connTeachers.query(
          `INSERT INTO teachers (user_id, employee_id, joining_date, first_name, last_name, gender, dob, phone, email, department, designation, salary, status)
           VALUES (?, ?, '2026-06-01', ?, ?, ?, '1985-05-15', ?, ?, ?, 'Senior Faculty', 50000.00, 'active')`,
          [userId, employeeId, firstName, lastName, gender, phone, email, department]
        );
      }

      await connTeachers.commit();
      console.log('30 teachers seeded successfully.');
    } catch (err) {
      await connTeachers.rollback();
      throw err;
    } finally {
      connTeachers.release();
    }

    // 5. Seed students in every class and section
    console.log('Retrieving classes and sections...');
    const [sections] = await pool.query(`
      SELECT s.id as section_id, s.class_id, c.academic_year_id, c.class_name, s.section_name 
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      ORDER BY c.display_order ASC, s.section_name ASC
    `);

    console.log(`Found ${sections.length} sections. Seeding 25 students per section...`);

    const connStudents = await pool.getConnection();
    try {
      await connStudents.beginTransaction();

      let globalStudentIdx = 1;
      for (const sec of sections) {
        const { section_id, class_id, academic_year_id, class_name, section_name } = sec;

        // Query maximum roll number to avoid duplicates
        const [rollRows] = await connStudents.query(
          'SELECT MAX(roll_number) as max_roll FROM students WHERE class_id = ? AND section_id = ? AND academic_year_id = ?',
          [class_id, section_id, academic_year_id]
        );
        const maxRoll = rollRows[0].max_roll || 0;

        for (let rOffset = 1; rOffset <= 25; rOffset++) {
          const roll = maxRoll + rOffset;
          const admissionNumber = `T_ADM_${String(globalStudentIdx).padStart(5, '0')}`;
          const firstName = `Student${globalStudentIdx}`;
          const lastName = `Test`;
          const fullName = `${firstName} ${lastName}`;
          const email = `test_student_${globalStudentIdx}@test.com`;
          const phone = `80000${String(globalStudentIdx).padStart(5, '0')}`;
          const gender = globalStudentIdx % 2 === 0 ? 'female' : 'male';

          // Insert into users
          const [userResult] = await connStudents.query(
            `INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified)
             VALUES (?, ?, ?, ?, ?, 'active', true)`,
            [fullName, email, phone, studentPasswordHash, studentRoleId]
          );
          const userId = userResult.insertId;

          // Insert into students
          const [studentResult] = await connStudents.query(
            `INSERT INTO students (user_id, admission_number, roll_number, first_name, last_name, gender, date_of_birth, email, phone, admission_date, academic_year_id, class_id, section_id, status)
             VALUES (?, ?, ?, ?, ?, ?, '2015-08-20', ?, ?, '2026-06-15', ?, ?, ?, 'active')`,
            [userId, admissionNumber, roll, firstName, lastName, gender, email, phone, academic_year_id, class_id, section_id]
          );
          const studentId = studentResult.insertId;

          // Insert into guardians
          await connStudents.query(
            `INSERT INTO guardians (student_id, guardian_name, relationship, phone)
             VALUES (?, ?, 'father', ?)`,
            [studentId, `Father of ${firstName}`, `70000${String(globalStudentIdx).padStart(5, '0')}`]
          );

          globalStudentIdx++;
        }
      }

      await connStudents.commit();
      console.log(`Seeding of ${globalStudentIdx - 1} students completed successfully.`);
    } catch (err) {
      await connStudents.rollback();
      throw err;
    } finally {
      connStudents.release();
    }

    console.log('Database seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
}

seed();

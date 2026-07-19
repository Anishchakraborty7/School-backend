import app from '../app.js';
import { initializeDatabase, getPool } from '../database/db.js';

const PORT = 5002;
let server;

async function setup() {
  await initializeDatabase();

  const pool = getPool();
  
  // Clean tables to ensure tests are idempotent
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE student_promotion_history');
  await pool.query('TRUNCATE TABLE student_transfer_history');
  await pool.query('TRUNCATE TABLE student_documents');
  await pool.query('TRUNCATE TABLE teacher_documents');
  await pool.query('TRUNCATE TABLE teacher_qualifications');
  await pool.query('TRUNCATE TABLE teacher_experience');
  await pool.query('TRUNCATE TABLE teacher_subjects');
  await pool.query('TRUNCATE TABLE teacher_classes');
  await pool.query('TRUNCATE TABLE class_teacher');
  await pool.query('TRUNCATE TABLE guardians');
  await pool.query('DELETE FROM students');
  await pool.query('ALTER TABLE students AUTO_INCREMENT = 1');
  await pool.query('DELETE FROM teachers');
  await pool.query('ALTER TABLE teachers AUTO_INCREMENT = 1');
  await pool.query('DELETE FROM school_houses');
  await pool.query('ALTER TABLE school_houses AUTO_INCREMENT = 1');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[PHASE 2 TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });
}

function teardown() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[PHASE 2 TEST SERVER] Stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function run() {
  console.log('\n--- STARTING PHASE 2 ACADEMIC INTEGRATION TESTS ---\n');
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

    // Test 1: Verify bootstrapped classes list (should have Nursery to Class 12, total 15 classes)
    const classesRes = await fetch(`${baseUrl}/classes`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const classesData = await classesRes.json();
    assert(classesRes.status === 200, 'Fetching classes should succeed');
    assert(classesData.data.length === 15, 'Bootstrapper should seed 15 classes');

    const class1Id = classesData.data.find(c => c.class_name === 'Class 1').id;
    const class2Id = classesData.data.find(c => c.class_name === 'Class 2').id;

    // Verify sections A, B, C exist for Class 1 (should be seeded)
    const sectionsRes = await fetch(`${baseUrl}/sections?class_id=${class1Id}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const sectionsData = await sectionsRes.json();
    assert(sectionsRes.status === 200, 'Fetching Class 1 sections should succeed');
    assert(sectionsData.data.length === 3, 'Class 1 should have 3 sections (A, B, C)');
    
    const secAId = sectionsData.data.find(s => s.section_name === 'A').id;
    const secBId = sectionsData.data.find(s => s.section_name === 'B').id;

    // Verify subjects are seeded (ENG, MTH, SCI, etc., total 8)
    const subjectsRes = await fetch(`${baseUrl}/subjects`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const subjectsData = await subjectsRes.json();
    assert(subjectsRes.status === 200, 'Fetching subjects should succeed');
    assert(subjectsData.data.length === 8, 'Should have 8 seeded subjects');

    // Test 2: Create school house (Red House)
    const houseRes = await fetch(`${baseUrl}/houses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        house_name: 'Red House',
        description: 'Vibrant fire house',
        color_code: '#ff0000'
      })
    });
    const houseData = await houseRes.json();
    assert(houseRes.status === 201, 'House creation should succeed');
    const houseId = houseData.data.id;

    // Test 3: Create Teacher profile
    const teacherRes = await fetch(`${baseUrl}/teachers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        employee_id: 'EMP001',
        joining_date: '2026-06-01',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'male',
        dob: '1985-05-15',
        phone: '9876543211',
        email: 'john@school.com',
        designation: 'Senior Faculty',
        department: 'Mathematics',
        salary: 65000.00
      })
    });
    const teacherData = await teacherRes.json();
    assert(teacherRes.status === 201, 'Teacher profile creation should succeed');
    const teacherId = teacherData.data.id;

    // Test 4: Add teacher qualifications & experience
    const qualRes = await fetch(`${baseUrl}/teachers/${teacherId}/qualification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        degree: 'M.Sc Mathematics',
        institution: 'University of Science',
        passing_year: 2008,
        percentage_cgpa: '9.2 CGPA'
      })
    });
    assert(qualRes.status === 201, 'Adding teacher qualification should succeed');

    const expRes = await fetch(`${baseUrl}/teachers/${teacherId}/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        organization: 'Global School',
        designation: 'Math Teacher',
        start_date: '2010-06-01',
        end_date: '2026-05-31'
      })
    });
    assert(expRes.status === 201, 'Adding teacher experience should succeed');

    // Test 5: Assign classes and subjects to John Doe
    const assignRes = await fetch(`${baseUrl}/teachers/${teacherId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        subject_ids: [1, 2], // English, Math
        class_ids: [class1Id, class2Id]
      })
    });
    assert(assignRes.status === 200, 'Assigning classes and subjects to teacher should succeed');

    // Test 6: Assign John Doe as Section Class Teacher for Class 1 Section A
    const classTeacherRes = await fetch(`${baseUrl}/class-teacher/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        teacher_id: teacherId,
        class_id: class1Id,
        section_id: secAId,
        academic_year_id: 1
      })
    });
    assert(classTeacherRes.status === 200, 'Class teacher mapping should succeed');

    // Test 7: Attempt to assign duplicate class teacher to Class 1 Section A (should fail)
    const duplicateCTRes = await fetch(`${baseUrl}/class-teacher/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        teacher_id: teacherId,
        class_id: class1Id,
        section_id: secAId,
        academic_year_id: 1
      })
    });
    assert(duplicateCTRes.status === 500, 'Duplicate class teacher assignment should fail');

    // Test 8: Admit student (Alice Smith)
    const admitRes = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        student: {
          admission_number: 'ADM001',
          roll_number: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          gender: 'female',
          date_of_birth: '2018-08-20',
          admission_date: '2026-06-15',
          academic_year_id: 1,
          class_id: class1Id,
          section_id: secAId,
          house_id: houseId,
          email: 'alice@student.com'
        },
        guardian: {
          guardian_name: 'Bob Smith',
          relationship: 'father',
          phone: '9998887776',
          email: 'bob.smith@test.com'
        }
      })
    });
    const admitData = await admitRes.json();
    assert(admitRes.status === 201, 'Student admission should succeed');
    const studentId = admitData.data.id;

    // Test 9: Verify unique roll number constraint per class/section/year (should fail)
    const duplicateRollRes = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        student: {
          admission_number: 'ADM002',
          roll_number: 1, // Same roll
          first_name: 'Charlie',
          last_name: 'Brown',
          gender: 'male',
          date_of_birth: '2018-05-10',
          admission_date: '2026-06-15',
          academic_year_id: 1,
          class_id: class1Id,
          section_id: secAId
        },
        guardian: {
          guardian_name: 'Snoopy Brown',
          relationship: 'father',
          phone: '8887776665'
        }
      })
    });
    assert(duplicateRollRes.status === 500, 'Duplicate roll number in same class section should fail');

    // Admit Charlie with valid roll number
    const admitCharlieRes = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        student: {
          admission_number: 'ADM002',
          roll_number: 2,
          first_name: 'Charlie',
          last_name: 'Brown',
          gender: 'male',
          date_of_birth: '2018-05-10',
          admission_date: '2026-06-15',
          academic_year_id: 1,
          class_id: class1Id,
          section_id: secAId
        },
        guardian: {
          guardian_name: 'Snoopy Brown',
          relationship: 'father',
          phone: '8887776665'
        }
      })
    });
    assert(admitCharlieRes.status === 201, 'Admitting student with distinct roll should succeed');

    // Test 10: Search and Filter students
    const searchRes = await fetch(`${baseUrl}/students?q=Alice`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, 'Student search query should succeed');
    assert(searchData.data.length === 1 && searchData.data[0].first_name === 'Alice', 'Search should return Alice');

    // Test 11: Promote Alice Smith (Class 1 -> Class 2)
    const promoteRes = await fetch(`${baseUrl}/promotion/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        to_academic_year_id: 1,
        to_class_id: class2Id,
        to_section_id: secAId,
        to_roll_number: 1
      })
    });
    assert(promoteRes.status === 200, 'Promoting student should succeed');

    // Verify Alice is now in Class 2 in database
    const aliceVerifyRes = await fetch(`${baseUrl}/students/${studentId}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const aliceVerifyData = await aliceVerifyRes.json();
    assert(aliceVerifyData.data.profile.class_name === 'Class 2', 'Alice class should be updated to Class 2');

    // Verify promotion history was saved
    const [promotionRows] = await getPool().query('SELECT * FROM student_promotion_history WHERE student_id = ?', [studentId]);
    assert(promotionRows.length === 1, 'Promotion history record should be created');

    // Test 12: Transfer Alice Smith (Section A -> Section B)
    const transferRes = await fetch(`${baseUrl}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        to_academic_year_id: 1,
        to_class_id: class2Id,
        to_section_id: secBId,
        to_roll_number: 1,
        transfer_type: 'section_change',
        reason: 'Better room assignment'
      })
    });
    assert(transferRes.status === 200, 'Transferring student should succeed');

    // Verify transfer history was saved
    const [transferRows] = await getPool().query('SELECT * FROM student_transfer_history WHERE student_id = ?', [studentId]);
    assert(transferRows.length === 1, 'Transfer history record should be created');

    // Test 13: Bulk promote Class 1 to Class 2
    // We have Charlie in Class 1. Promote class bulk.
    const bulkPromoteRes = await fetch(`${baseUrl}/promotion/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        from_class_id: class1Id,
        to_class_id: class2Id,
        to_academic_year_id: 1
      })
    });
    assert(bulkPromoteRes.status === 200, 'Bulk promotion should succeed');

    // Test 14: Export students and teachers to CSV
    const exportStudentsRes = await fetch(`${baseUrl}/export/students`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const exportStudentsText = await exportStudentsRes.text();
    assert(exportStudentsRes.status === 200, 'Exporting students should succeed');
    assert(exportStudentsText.includes('admission_number') && exportStudentsText.includes('ADM001'), 'Exported student CSV should contain headers and records');

    const exportTeachersRes = await fetch(`${baseUrl}/export/teachers`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const exportTeachersText = await exportTeachersRes.text();
    assert(exportTeachersRes.status === 200, 'Exporting teachers should succeed');
    assert(exportTeachersText.includes('employee_id') && exportTeachersText.includes('EMP001'), 'Exported teacher CSV should contain headers and records');

    // Test 15: Import students CSV
    const csvContent = 'admission_number,roll_number,first_name,last_name,gender,date_of_birth,admission_date,academic_year_id,class_id,section_id,phone,email\n' +
                       'ADM003,3,Bob,Marley,male,2018-02-12,2026-06-15,1,4,10,9998881234,bob@marley.com';
    
    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'import_students.csv');

    const importRes = await fetch(`${baseUrl}/import/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: formData
    });
    const importData = await importRes.json();
    assert(importRes.status === 200, 'Importing students CSV should succeed');

    // Check if Bob Marley exists in database
    const bobVerifyRes = await fetch(`${baseUrl}/students?q=Marley`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const bobVerifyData = await bobVerifyRes.json();
    assert(bobVerifyData.data.length === 1 && bobVerifyData.data[0].first_name === 'Bob', 'Bob Marley should be present in database after import');

    // Test 16: ID Cards rendering check
    const studentCardRes = await fetch(`${baseUrl}/admin/idcard/student/${studentId}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const studentCardHtml = await studentCardRes.text();
    assert(studentCardRes.status === 200, 'Fetching student ID card should succeed');
    assert(studentCardHtml.includes('METROPOLITAN ACADEMY') && studentCardHtml.includes('<svg') && studentCardHtml.includes('src="data:image/png;base64,'), 'Student ID Card HTML should render headers, barcode SVG, and QR base64 image');

    const teacherCardRes = await fetch(`${baseUrl}/admin/idcard/teacher/${teacherId}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const teacherCardHtml = await teacherCardRes.text();
    assert(teacherCardRes.status === 200, 'Fetching teacher ID card should succeed');
    assert(teacherCardHtml.includes('FACULTY CARD') && teacherCardHtml.includes('John'), 'Teacher ID Card HTML should render headers and name');

    console.log(`\n🎉 ALL PHASE 2 TESTS PASSED: ${passCount}/${testCount}\n`);
  } catch (error) {
    console.error('\n❌ PHASE 2 TEST RUN ERROR:', error.message);
    process.exitCode = 1;
  } finally {
    await teardown();
    process.exit(process.exitCode || 0);
  }
}

run();

import app from '../app.js';
import { initializeDatabase, getPool } from '../database/db.js';
import bcrypt from 'bcryptjs';

const PORT = 5004;
let server;

async function setup() {
  await initializeDatabase();
  const pool = getPool();
  
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query("DELETE FROM teachers WHERE employee_id = 'T_CRUD_01'");
  await pool.query("DELETE FROM users WHERE email = 't_crud@school.com'");
  await pool.query('TRUNCATE TABLE timetable');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TIMETABLE TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });
}

async function teardown() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[TIMETABLE TEST SERVER] Stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function run() {
  console.log('\n--- STARTING TIMETABLE CRUD INTEGRATION TESTS ---\n');
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

    // 1. Admin Login
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

    // 2. Setup dynamic teacher profile
    const teacherPasswordHash = await bcrypt.hash('TeacherPassword123!', 10);
    const [teacherRoleRows] = await pool.query("SELECT id FROM roles WHERE role_name = 'teacher'");
    const teacherRoleId = teacherRoleRows[0].id;

    const [teacherUserResult] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password, role_id, status, is_verified) VALUES ('Tchr CRUD', 't_crud@school.com', '5554443332', ?, ?, 'active', 1)",
      [teacherPasswordHash, teacherRoleId]
    );
    const teacherUserId = teacherUserResult.insertId;

    const [teacherResult] = await pool.query(
      `INSERT INTO teachers (employee_id, joining_date, first_name, last_name, gender, dob, phone, email, designation, department, salary, user_id)
       VALUES ('T_CRUD_01', '2026-06-01', 'Tchr', 'CRUD', 'female', '1988-10-10', '5554443332', 't_crud@school.com', 'Faculty', 'Science', 45000.00, ?)`,
      [teacherUserId]
    );
    const teacherId = teacherResult.insertId;

    // 3. Fetch period 1
    const periodsRes = await fetch(`${baseUrl}/timetable/periods?year_id=1`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const periodsData = await periodsRes.json();
    assert(periodsRes.status === 200, 'Fetching school periods should succeed');
    const period1Id = periodsData.data[0].id;
    const period2Id = periodsData.data[1].id;

    // 4. Create first slot (Monday, Period 1, Class 1-A)
    const createRes1 = await fetch(`${baseUrl}/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 4,
        section_id: 10,
        period_id: period1Id,
        subject_id: 2,
        teacher_id: teacherId,
        room_number: 'Room 101',
        day_of_week: 'Monday'
      })
    });
    const createData1 = await createRes1.json();
    assert(createRes1.status === 201, 'Creating timetable slot 1 should succeed');
    const slot1Id = createData1.data.id;

    // 5. Retrieve first slot details by ID
    const getRes = await fetch(`${baseUrl}/timetable/${slot1Id}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'Retrieving slot details by ID should succeed');
    assert(getData.data.room_number === 'Room 101', 'Retrieved slot room number should be Room 101');

    // 6. Update room number to Room 202
    const updateRes = await fetch(`${baseUrl}/timetable/${slot1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        room_number: 'Room 202'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Updating slot room number should succeed');

    const getResVerify = await fetch(`${baseUrl}/timetable/${slot1Id}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const getVerifyData = await getResVerify.json();
    assert(getVerifyData.data.room_number === 'Room 202', 'Verified slot room number should be Room 202');

    // 7. Create second slot (Tuesday, Period 2, Class 1-A)
    const createRes2 = await fetch(`${baseUrl}/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 4,
        section_id: 10,
        period_id: period2Id,
        subject_id: 2,
        teacher_id: teacherId,
        room_number: 'Room 101',
        day_of_week: 'Tuesday'
      })
    });
    const createData2 = await createRes2.json();
    assert(createRes2.status === 201, 'Creating timetable slot 2 should succeed');
    const slot2Id = createData2.data.id;

    // 8. Attempt to edit slot 2 to conflict with slot 1 (same day, period, teacher)
    const conflictUpdateRes = await fetch(`${baseUrl}/timetable/${slot2Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        day_of_week: 'Monday',
        period_id: period1Id
      })
    });
    assert(conflictUpdateRes.status === 500, 'Updating slot to produce conflict should block and return 500');

    // 9. Delete slot 1
    const deleteRes = await fetch(`${baseUrl}/timetable/${slot1Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    assert(deleteRes.status === 200, 'Deleting timetable slot 1 should succeed');

    // 10. Attempt to retrieve deleted slot (should return 404)
    const getDeletedRes = await fetch(`${baseUrl}/timetable/${slot1Id}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    assert(getDeletedRes.status === 404, 'Retrieving deleted slot should return 404 Not Found');

    // 11. Create a custom period for testing CRUD
    const createPeriodRes = await fetch(`${baseUrl}/timetable/periods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        period_name: 'Test Period CRUD',
        start_time: '16:00:00',
        end_time: '17:00:00',
        is_lunch_break: false
      })
    });
    const createPeriodData = await createPeriodRes.json();
    assert(createPeriodRes.status === 201, 'Creating new period should succeed');
    const customPeriodId = createPeriodData.data.id;

    // 12. Update period details
    const updatePeriodRes = await fetch(`${baseUrl}/timetable/periods/${customPeriodId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        period_name: 'Test Period Updated',
        start_time: '16:15:00'
      })
    });
    assert(updatePeriodRes.status === 200, 'Updating period details should succeed');

    // Verify update
    const verifyPeriodsRes = await fetch(`${baseUrl}/timetable/periods?year_id=1`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const verifyPeriodsData = await verifyPeriodsRes.json();
    const updatedPeriod = verifyPeriodsData.data.find(p => p.id === customPeriodId);
    assert(updatedPeriod !== undefined, 'Period should exist in listing');
    assert(updatedPeriod.period_name === 'Test Period Updated', 'Period name should be updated to Test Period Updated');
    assert(updatedPeriod.start_time === '16:15:00', 'Period start time should be updated to 16:15:00');

    // 13. Create a timetable slot using the custom period
    const customSlotRes = await fetch(`${baseUrl}/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({
        academic_year_id: 1,
        class_id: 4,
        section_id: 10,
        period_id: customPeriodId,
        subject_id: 2,
        teacher_id: teacherId,
        room_number: 'Room 303',
        day_of_week: 'Wednesday'
      })
    });
    const customSlotData = await customSlotRes.json();
    assert(customSlotRes.status === 201, 'Creating timetable slot in custom period should succeed');
    const customSlotId = customSlotData.data.id;

    // 14. Delete the custom period (should cascade and delete timetable slot)
    const deletePeriodRes = await fetch(`${baseUrl}/timetable/periods/${customPeriodId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    assert(deletePeriodRes.status === 200, 'Deleting custom period should succeed');

    // 15. Check that period no longer exists in listing
    const verifyPeriodsRes2 = await fetch(`${baseUrl}/timetable/periods?year_id=1`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const verifyPeriodsData2 = await verifyPeriodsRes2.json();
    const deletedPeriod = verifyPeriodsData2.data.find(p => p.id === customPeriodId);
    assert(deletedPeriod === undefined, 'Deleted period should not exist in listing');

    // 16. Check that timetable slot has been cascaded and deleted (should return 404)
    const getCascadedSlotRes = await fetch(`${baseUrl}/timetable/${customSlotId}`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    assert(getCascadedSlotRes.status === 404, 'Cascaded timetable slot should return 404 Not Found');

    console.log(`\n🎉 ALL TIMETABLE & PERIOD CRUD TESTS PASSED: ${passCount}/${testCount}\n`);
  } catch (error) {
    console.error('\n❌ TIMETABLE CRUD TEST RUN ERROR:', error.message);
    process.exitCode = 1;
  } finally {
    await teardown();
    process.exit(process.exitCode || 0);
  }
}

run();

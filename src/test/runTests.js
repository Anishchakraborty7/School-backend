import app from '../app.js';
import { initializeDatabase, getPool } from '../database/db.js';
import { config } from '../config/env.js';

const PORT = 5001;
let server;

async function setup() {
  await initializeDatabase();
  
  // Clean up any existing test user to make the test idempotent
  const pool = getPool();
  await pool.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['visitor@test.com']);
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['visitor@test.com']);
  await pool.query('DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['visitor@test.com']);
  await pool.query('DELETE FROM users WHERE email = ?', ['visitor@test.com']);

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });
}

function teardown() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[TEST SERVER] Stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function run() {
  console.log('\n--- STARTING INTEGRATION TESTS ---\n');
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

    // Test 1: Register new visitor
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Visitor',
        email: 'visitor@test.com',
        phone: '9876543210',
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Registration response code should be 201');
    assert(regData.success === true, 'Registration success should be true');
    assert(regData.data.user.role === 'visitor', 'Registered user should have visitor role');
    assert(regData.data.user.status === 'pending', 'Registered user should have pending status');
    assert(!!regData.data.accessToken, 'Registration should return an access token');

    const visitorAccessToken = regData.data.accessToken;

    // Test 2: Try accessing /me
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${visitorAccessToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, '/me should return 200 for authenticated visitor');
    assert(meData.data.email === 'visitor@test.com', 'Me endpoint should return user details');

    // Test 3: Try accessing /dashboard as visitor (should fail)
    const dbRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${visitorAccessToken}` }
    });
    const dbData = await dbRes.json();
    assert(dbRes.status === 403, '/dashboard should return 403 Forbidden for visitors');
    assert(dbData.success === false, 'Visitor dashboard success should be false');

    // Test 4: Log in as admin
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
    assert(adminLoginData.data.user.role === 'admin', 'Admin user should have admin role');

    // Test 5: Admin retrieves users list
    const usersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    const usersData = await usersRes.json();
    assert(usersRes.status === 200, 'Admin should be able to fetch users list');
    const visitorUser = usersData.data.find(u => u.email === 'visitor@test.com');
    assert(!!visitorUser, 'Visitor should be present in the user list');
    const visitorId = visitorUser.id;

    // Test 6: Admin approves visitor (status -> active)
    const approveRes = await fetch(`${baseUrl}/admin/users/${visitorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({ status: 'active' })
    });
    assert(approveRes.status === 200, 'Admin should be able to approve user');

    // Test 7: Admin promotes visitor to student
    const roleRes = await fetch(`${baseUrl}/admin/users/${visitorId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({ role_name: 'student' })
    });
    assert(roleRes.status === 200, 'Admin should be able to change user role');

    // Test 8: Visitor logs in again to get student credentials
    const visitorLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'visitor@test.com',
        password: 'Password123!'
      })
    });
    const visitorLoginData = await visitorLoginRes.json();
    assert(visitorLoginRes.status === 200, 'Approved user should be able to login');
    assert(visitorLoginData.data.user.role === 'student', 'Role should now be student');
    assert(visitorLoginData.data.user.status === 'active', 'Status should now be active');
    const studentAccessToken = visitorLoginData.data.accessToken;

    // Test 9: Student accesses dashboard (should succeed)
    const studentDbRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${studentAccessToken}` }
    });
    const studentDbData = await studentDbRes.json();
    assert(studentDbRes.status === 200, 'Student should be allowed to access dashboard');
    assert(studentDbData.data.role === 'student', 'Dashboard should show student-specific data');

    // Test 10: Admin suspends student
    const suspendRes = await fetch(`${baseUrl}/admin/users/${visitorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminAccessToken}`
      },
      body: JSON.stringify({ status: 'suspended' })
    });
    assert(suspendRes.status === 200, 'Admin should be able to suspend student');

    // Test 11: Suspended student tries to access dashboard (should fail)
    const suspendedDbRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${studentAccessToken}` }
    });
    assert(suspendedDbRes.status === 403, 'Suspended user access to dashboard should return 403');

    // Test 12: Admin soft deletes user
    const deleteRes = await fetch(`${baseUrl}/admin/users/${visitorId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminAccessToken}` }
    });
    assert(deleteRes.status === 200, 'Admin should be able to soft delete user');

    // Verify user is soft deleted in database
    const [dbRows] = await getPool().query('SELECT deleted_at FROM users WHERE id = ?', [visitorId]);
    assert(dbRows[0].deleted_at !== null, 'User database record should have deleted_at timestamp');

    console.log(`\n🎉 ALL TESTS PASSED: ${passCount}/${testCount}\n`);
  } catch (error) {
    console.error('\n❌ TEST RUN ERROR:', error.message);
    process.exitCode = 1;
  } finally {
    await teardown();
    process.exit(process.exitCode || 0);
  }
}

run();

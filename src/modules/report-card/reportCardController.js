import examService from '../exam/examService.js';
import attendanceService from '../attendance/attendanceService.js';
import { generateQrCodeBase64 } from '../../helpers/idCardHelper.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const generateReportCard = asyncHandler(async (req, res) => {
  const { id } = req.params; // student ID
  const { exam_id } = req.query; // optional exam ID

  // 1. Get Exam report details
  const reportData = await examService.getStudentReportData(parseInt(id, 10), exam_id ? parseInt(exam_id, 10) : null);
  const student = reportData.student;
  const marks = reportData.marks;
  const summary = reportData.summary;

  // 2. Get attendance percentage
  let attendancePct = 100.00;
  try {
    const year = parseInt(student.year_name.split('-')[0], 10) || 2026;
    const att = await attendanceService.getAttendanceAnalytics(parseInt(id, 10), year, null);
    if (att.total_days > 0) {
      attendancePct = att.attendance_percentage;
    }
  } catch (err) {
    console.error('Error fetching attendance for report card:', err);
  }

  // 3. Generate verification QR code
  const verificationUrl = `https://schoolerp.com/verify/report-card/${student.admission_number}`;
  const qrBase64 = await generateQrCodeBase64(verificationUrl);

  // 4. Render beautiful HTML report card
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report Card - ${student.full_name}</title>
      <style>
        body {
          font-family: sans-serif;
          background: #f7fafc;
          padding: 40px;
          color: #2d3748;
        }
        .report-card {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2b6cb0;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 28px;
          letter-spacing: 1px;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 13px;
          color: #718096;
        }
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
          font-size: 14px;
        }
        .student-info div {
          padding: 8px;
          background: #f8fafc;
          border-radius: 4px;
          border: 1px solid #edf2f7;
        }
        .student-info div strong {
          color: #4a5568;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 14px;
        }
        table th, table td {
          border: 1px solid #cbd5e0;
          padding: 10px;
          text-align: left;
        }
        table th {
          background: #edf2f7;
          color: #2d3748;
        }
        .summary-section {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-box {
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          padding: 20px;
          border-radius: 6px;
        }
        .summary-box h3 {
          margin: 0 0 10px 0;
          color: #2b6cb0;
        }
        .summary-box p {
          margin: 6px 0;
          font-size: 14px;
        }
        .qr-box {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed #cbd5e0;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          flex-direction: column;
        }
        .qr-box img {
          width: 90px;
          height: 90px;
          margin-bottom: 5px;
        }
        .qr-box p {
          margin: 0;
          font-size: 10px;
          color: #a0aec0;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .signature-block {
          text-align: center;
          width: 200px;
        }
        .signature-line {
          border-top: 1px solid #718096;
          margin-top: 40px;
          padding-top: 5px;
          font-weight: bold;
          color: #4a5568;
        }
        @media print {
          body {
            background: none;
            padding: 0;
          }
          .report-card {
            box-shadow: none;
            border: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-card">
        <div class="header">
          <h1>METROPOLITAN ACADEMY</h1>
          <p>PROGRESS REPORT CARD</p>
        </div>
        <div class="student-info">
          <div><strong>Student Name:</strong> ${student.full_name}</div>
          <div><strong>Admission No:</strong> ${student.admission_number}</div>
          <div><strong>Class & Section:</strong> ${student.class_name} - ${student.section_name}</div>
          <div><strong>Roll Number:</strong> ${student.roll_number}</div>
          <div><strong>Academic Year:</strong> ${student.year_name}</div>
          <div><strong>Attendance Rate:</strong> ${attendancePct}%</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Theory</th>
              <th>Practical</th>
              <th>Internal</th>
              <th>Total Marks</th>
              <th>Max Marks</th>
              <th>Grade</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${marks.map(m => `
              <tr>
                <td><strong>${m.subject_name} (${m.subject_code})</strong></td>
                <td>${m.is_absent ? 'A' : m.marks_theory}</td>
                <td>${m.is_absent ? 'A' : m.marks_practical}</td>
                <td>${m.is_absent ? 'A' : m.marks_internal}</td>
                <td>${m.is_absent ? 'A' : m.total_marks}</td>
                <td>${m.max_marks}</td>
                <td><span style="font-weight: bold; color: ${m.grade_letter === 'Fail' ? '#e53e3e' : '#2b6cb0'}">${m.grade_letter}</span></td>
                <td>${m.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-box">
            <h3>Performance Summary</h3>
            <p><strong>Total Marks Obtained:</strong> ${summary.total_obtained_marks} / ${summary.total_max_marks}</p>
            <p><strong>Overall Percentage:</strong> ${summary.overall_percentage}%</p>
            <p><strong>Overall CGPA:</strong> ${summary.overall_gpa} / 4.00</p>
            <p><strong>Overall Grade:</strong> <span style="font-weight: bold; color: ${summary.overall_grade === 'Fail' ? '#e53e3e' : '#2b6cb0'}">${summary.overall_grade}</span></p>
          </div>
          <div class="qr-box">
            <img src="${qrBase64}" alt="Verification QR">
            <p>Scan to verify report card authenticity</p>
          </div>
        </div>

        <div class="signatures">
          <div class="signature-block">
            <div class="signature-line">Class Teacher</div>
          </div>
          <div class="signature-block">
            <div class="signature-line">Principal Signature</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

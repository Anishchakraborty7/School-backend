/**
 * ID Card HTML and CSS templates
 * Metropolitan Academy Premium ID Card Designs
 */

export function getSharedStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    
    :root {
      --primary-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      --accent-color: #6366f1;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --card-bg: #ffffff;
      --border-color: #e2e8f0;
      
      --student-gradient: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      --teacher-gradient: linear-gradient(135deg, #10b981 0%, #047857 100%);
    }

    body {
      font-family: 'Outfit', sans-serif;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: var(--text-main);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Outer ID Card Container */
    .id-card {
      width: 320px;
      height: 490px;
      background: var(--card-bg);
      border-radius: 20px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
      border: 1px solid var(--border-color);
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      page-break-inside: avoid;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.05) 0px, transparent 50%);
    }

    /* Card Header */
    .card-header {
      width: 100%;
      height: 140px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      padding: 20px 0;
      box-sizing: border-box;
    }

    .card-header.student-header {
      background: var(--student-gradient);
    }

    .card-header.teacher-header {
      background: var(--teacher-gradient);
    }

    .card-header h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .card-header p {
      margin: 4px 0 0 0;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
      opacity: 0.9;
    }

    .card-header .logo-crest {
      font-size: 20px;
      margin-bottom: 6px;
    }

    /* Photo Frame styling */
    .photo-frame {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: #ffffff;
      padding: 4px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      position: absolute;
      bottom: -55px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      box-sizing: border-box;
    }

    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      background: #f8fafc;
    }

    /* Body Details */
    .card-details {
      margin-top: 65px;
      text-align: center;
      padding: 0 20px;
      flex-grow: 1;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .card-details h3 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.5px;
    }

    .card-details .sub-title {
      font-size: 12px;
      color: var(--accent-color);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      width: 100%;
      margin-bottom: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      font-size: 12px;
    }

    .info-row span.label {
      color: var(--text-muted);
      font-weight: 500;
    }

    .info-row span.value {
      color: var(--text-main);
      font-weight: 600;
    }

    /* House Badge */
    .house-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 4px;
      letter-spacing: 0.5px;
    }

    /* Card Footer & Code Area */
    .card-footer {
      width: 100%;
      background: #f8fafc;
      border-top: 1px solid var(--border-color);
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .qr-container {
      width: 60px;
      height: 60px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .qr-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .barcode-container {
      flex-grow: 1;
      height: 60px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .barcode-container svg {
      width: 100%;
      height: 38px;
    }

    .barcode-label {
      font-size: 8px;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 1px;
      margin-top: 2px;
      text-transform: uppercase;
    }

    /* Print styles */
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .id-card {
        box-shadow: none;
        border: 1px solid #ccd0d5;
        page-break-after: always;
        margin: 20px auto;
      }
    }
  `;
}

// Single Student Card Template
export function renderStudentCard(student, qr, barcode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student ID Card - ${student.first_name}</title>
      <style>
        ${getSharedStyles()}
      </style>
    </head>
    <body>
      <div class="id-card">
        <div class="card-header student-header">
          <div class="logo-crest">🎓</div>
          <h2>METROPOLITAN ACADEMY</h2>
          <p>Student ID Card</p>
          <div class="photo-frame">
            <img src="${student.photo ? '/' + student.photo : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}" alt="Student Photo">
          </div>
        </div>
        <div class="card-details">
          <h3>${student.first_name} ${student.last_name}</h3>
          <div class="sub-title">Session ${student.year_name || '2026-2027'}</div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="label">Admission No:</span>
              <span class="value">${student.admission_number}</span>
            </div>
            <div class="info-row">
              <span class="label">Class / Sec:</span>
              <span class="value">${student.class_name} - ${student.section_name}</span>
            </div>
            <div class="info-row">
              <span class="label">Roll Number:</span>
              <span class="value">${student.roll_number}</span>
            </div>
          </div>
          
          ${student.house_name ? `
            <div class="house-badge" style="background: ${student.house_color || '#6366f1'}15; color: ${student.house_color || '#6366f1'}; border: 1px solid ${student.house_color || '#6366f1'}30;">
              ${student.house_name} House
            </div>
          ` : ''}
        </div>
        <div class="card-footer">
          <div class="qr-container">
            <img src="${qr}" alt="QR Code">
          </div>
          <div class="barcode-container">
            ${barcode}
            <div class="barcode-label">${student.admission_number}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Bulk Students Cards Template
export function renderBulkStudents(studentsList) {
  const cardsHtml = studentsList.map(item => `
    <div class="id-card">
      <div class="card-header student-header">
        <div class="logo-crest">🎓</div>
        <h2>METROPOLITAN ACADEMY</h2>
        <p>Student ID Card</p>
        <div class="photo-frame">
          <img src="${item.student.photo ? '/' + item.student.photo : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}" alt="Student Photo">
        </div>
      </div>
      <div class="card-details">
        <h3>${item.student.first_name} ${item.student.last_name}</h3>
        <div class="sub-title">Session ${item.student.year_name || '2026-2027'}</div>
        
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Admission No:</span>
            <span class="value">${item.student.admission_number}</span>
          </div>
          <div class="info-row">
            <span class="label">Class / Sec:</span>
            <span class="value">${item.student.class_name} - ${item.student.section_name}</span>
          </div>
          <div class="info-row">
            <span class="label">Roll Number:</span>
            <span class="value">${item.student.roll_number}</span>
          </div>
        </div>
        
        ${item.student.house_name ? `
          <div class="house-badge" style="background: ${item.student.house_color || '#6366f1'}15; color: ${item.student.house_color || '#6366f1'}; border: 1px solid ${item.student.house_color || '#6366f1'}30;">
            ${item.student.house_name} House
          </div>
        ` : ''}
      </div>
      <div class="card-footer">
        <div class="qr-container">
          <img src="${item.qr}" alt="QR Code">
        </div>
        <div class="barcode-container">
          ${item.barcode}
          <div class="barcode-label">${item.student.admission_number}</div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bulk Student ID Cards</title>
      <style>
        ${getSharedStyles()}
        body {
          flex-wrap: wrap;
          gap: 24px;
          padding: 24px;
          justify-content: center;
          align-items: flex-start;
          min-height: auto;
        }
      </style>
    </head>
    <body>
      ${cardsHtml}
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
}

// Single Teacher Card Template
export function renderTeacherCard(teacher, qr, barcode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Teacher ID Card - ${teacher.first_name}</title>
      <style>
        ${getSharedStyles()}
      </style>
    </head>
    <body>
      <div class="id-card">
        <div class="card-header teacher-header">
          <div class="logo-crest">💼</div>
          <h2>METROPOLITAN ACADEMY</h2>
          <p>Faculty Card</p>
          <div class="photo-frame">
            <img src="${teacher.photo ? '/' + teacher.photo : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256'}" alt="Teacher Photo">
          </div>
        </div>
        <div class="card-details">
          <h3>${teacher.first_name} ${teacher.last_name}</h3>
          <div class="sub-title">${teacher.designation || 'Faculty'}</div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="label">Employee ID:</span>
              <span class="value">${teacher.employee_id}</span>
            </div>
            <div class="info-row">
              <span class="label">Department:</span>
              <span class="value">${teacher.department || 'Academics'}</span>
            </div>
            <div class="info-row">
              <span class="label">Role Type:</span>
              <span class="value">Faculty Staff</span>
            </div>
          </div>
          
          <div class="house-badge" style="background: #10b98115; color: #10b981; border: 1px solid #10b98130;">
            Staff
          </div>
        </div>
        <div class="card-footer">
          <div class="qr-container">
            <img src="${qr}" alt="QR Code">
          </div>
          <div class="barcode-container">
            ${barcode}
            <div class="barcode-label">${teacher.employee_id}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Bulk Teachers Cards Template
export function renderBulkTeachers(teachersList) {
  const cardsHtml = teachersList.map(item => `
    <div class="id-card">
      <div class="card-header teacher-header">
        <div class="logo-crest">💼</div>
        <h2>METROPOLITAN ACADEMY</h2>
        <p>Faculty Card</p>
        <div class="photo-frame">
          <img src="${item.teacher.photo ? '/' + item.teacher.photo : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256'}" alt="Teacher Photo">
        </div>
      </div>
      <div class="card-details">
        <h3>${item.teacher.first_name} ${item.teacher.last_name}</h3>
        <div class="sub-title">${item.teacher.designation || 'Faculty'}</div>
        
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Employee ID:</span>
            <span class="value">${item.teacher.employee_id}</span>
          </div>
          <div class="info-row">
            <span class="label">Department:</span>
            <span class="value">${item.teacher.department || 'Academics'}</span>
          </div>
          <div class="info-row">
            <span class="label">Role Type:</span>
            <span class="value">Faculty Staff</span>
          </div>
        </div>
        
        <div class="house-badge" style="background: #10b98115; color: #10b981; border: 1px solid #10b98130;">
          Staff
        </div>
      </div>
      <div class="card-footer">
        <div class="qr-container">
          <img src="${item.qr}" alt="QR Code">
        </div>
        <div class="barcode-container">
          ${item.barcode}
          <div class="barcode-label">${item.teacher.employee_id}</div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bulk Faculty Cards</title>
      <style>
        ${getSharedStyles()}
        body {
          flex-wrap: wrap;
          gap: 24px;
          padding: 24px;
          justify-content: center;
          align-items: flex-start;
          min-height: auto;
        }
      </style>
    </head>
    <body>
      ${cardsHtml}
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
}

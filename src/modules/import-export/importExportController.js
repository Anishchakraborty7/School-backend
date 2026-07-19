import importExportService from './importExportService.js';
import response from '../../utils/response.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import fs from 'fs';

export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.sendError(res, 'Validation failed', ['No CSV file uploaded'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  try {
    const csvText = fs.readFileSync(req.file.path, 'utf8');
    const result = await importExportService.importStudents(csvText, adminId, clientInfo);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    return response.sendSuccess(res, result.message, {}, 200);
  } catch (error) {
    // Make sure we clean up even if it fails
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

export const importTeachers = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.sendError(res, 'Validation failed', ['No CSV file uploaded'], 400);
  }

  const adminId = req.user.id;
  const clientInfo = {
    ip: req.ip,
    device: req.headers['sec-ch-ua-platform'] || 'Unknown Device',
    browser: req.headers['user-agent'] || 'Unknown Browser'
  };

  try {
    const csvText = fs.readFileSync(req.file.path, 'utf8');
    const result = await importExportService.importTeachers(csvText, adminId, clientInfo);

    fs.unlinkSync(req.file.path);

    return response.sendSuccess(res, result.message, {}, 200);
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

export const exportStudentsCSV = asyncHandler(async (req, res) => {
  const csv = await importExportService.exportStudents();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
  return res.send(csv);
});

export const exportTeachersCSV = asyncHandler(async (req, res) => {
  const csv = await importExportService.exportTeachers();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=teachers_export.csv');
  return res.send(csv);
});

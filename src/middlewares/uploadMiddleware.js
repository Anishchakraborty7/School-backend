import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

// Switch Multer to use memory storage (file buffers in RAM)
const storage = multer.memoryStorage();

// Helper to stream file buffer to Cloudinary
const uploadStream = (fileBuffer, folder, isImage) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto'
    };
    // Apply 65% quality compression for images
    if (isImage) {
      uploadOptions.quality = 65;
    }
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });
};

// Filters to validate file formats
const imageFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png/;
  const isExtensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const isMimeValid = allowedExtensions.test(file.mimetype);

  if (isExtensionValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, JPEG, PNG) are allowed!'), false);
  }
};

const docFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx|jpeg|jpg|png/;
  const isExtensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  if (isExtensionValid) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word documents, or images are allowed!'), false);
  }
};

// Size Limits
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// Wrapper function to mimic Multer middleware behavior with Cloudinary upload hooks
const wrapMulterApi = (rawMulter, folder, isImage) => {
  return {
    single: (fieldName) => {
      const singleMiddleware = rawMulter.single(fieldName);
      return (req, res, next) => {
        singleMiddleware(req, res, async (err) => {
          if (err) return next(err);
          if (!req.file) return next();

          try {
            const result = await uploadStream(req.file.buffer, folder, isImage);
            // Overwrite filename & path with the resulting Cloudinary public URL
            req.file.path = result.secure_url;
            req.file.filename = result.secure_url;
            next();
          } catch (uploadErr) {
            next(new Error(`Cloudinary upload failed: ${uploadErr.message}`));
          }
        });
      };
    },
    array: (fieldName, maxCount) => {
      const arrayMiddleware = rawMulter.array(fieldName, maxCount);
      return (req, res, next) => {
        arrayMiddleware(req, res, async (err) => {
          if (err) return next(err);
          if (!req.files || req.files.length === 0) return next();

          try {
            const uploadPromises = req.files.map(async (file) => {
              const result = await uploadStream(file.buffer, folder, isImage);
              file.path = result.secure_url;
              file.filename = result.secure_url;
              return file;
            });
            req.files = await Promise.all(uploadPromises);
            next();
          } catch (uploadErr) {
            next(new Error(`Cloudinary array upload failed: ${uploadErr.message}`));
          }
        });
      };
    }
  };
};

// Raw Multer Instances
const rawTeacherPhoto = multer({ storage, fileFilter: imageFilter, limits });
const rawTeacherDoc = multer({ storage, fileFilter: docFilter, limits });
const rawStudentPhoto = multer({ storage, fileFilter: imageFilter, limits });
const rawStudentDoc = multer({ storage, fileFilter: docFilter, limits });

// Exported Middleware APIs matching original names and structures
export const uploadTeacherPhoto = wrapMulterApi(rawTeacherPhoto, 'teacher_photos', true);
export const uploadTeacherDoc = wrapMulterApi(rawTeacherDoc, 'teacher_docs', false);
export const uploadStudentPhoto = wrapMulterApi(rawStudentPhoto, 'student_photos', true);
export const uploadStudentDoc = wrapMulterApi(rawStudentDoc, 'student_docs', false);

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Helper to determine destination directory and create it dynamically
const getStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', subfolder);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
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

// Exporting multer instances
export const uploadTeacherPhoto = multer({
  storage: getStorage('teacher_photos'),
  fileFilter: imageFilter,
  limits
});

export const uploadTeacherDoc = multer({
  storage: getStorage('teacher_docs'),
  fileFilter: docFilter,
  limits
});

export const uploadStudentPhoto = multer({
  storage: getStorage('student_photos'),
  fileFilter: imageFilter,
  limits
});

export const uploadStudentDoc = multer({
  storage: getStorage('student_docs'),
  fileFilter: docFilter,
  limits
});

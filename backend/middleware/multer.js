import multer from 'multer';
import path from 'path';
// const storage = multer.memoryStorage();
// Local storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // The 'uploads/' folder should exist in your backend directory
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Use a timestamp to generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'), false);
    }
  }
});
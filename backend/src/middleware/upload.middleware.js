const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const portfolioDir = path.join(uploadsDir, 'portfolio');
const avatarsDir = path.join(uploadsDir, 'avatars');
const tournamentDir = path.join(uploadsDir, 'tournaments');

[uploadsDir, portfolioDir, avatarsDir, tournamentDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for portfolio images
const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, portfolioDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `portfolio-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'), false);
  }
};

// Portfolio upload middleware (single image, max 10MB)
const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: imageFileFilter
});

// Avatar upload middleware (single image, max 5MB)
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFileFilter
});

// Tournament submission upload middleware (single image, max 10MB)
const tournamentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tournamentDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `tournament-${uniqueSuffix}${ext}`);
  }
});

const uploadTournament = multer({
  storage: tournamentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: imageFileFilter
});

// Error handling wrapper for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size allowed is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next();
};

module.exports = {
  uploadPortfolio,
  uploadAvatar,
  uploadTournament,
  handleMulterError
};


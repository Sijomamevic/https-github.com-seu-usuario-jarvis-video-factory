const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { projectId, type } = req.body;
    const dest = path.join('/data/video_factory', projectId, type || 'uploads');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Upload file
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'No file uploaded' } });
  }
  
  res.json({ 
    message: 'File uploaded successfully',
    file: {
      name: req.file.filename,
      path: req.file.path,
      size: req.file.size
    }
  });
});

// Serve project files
router.get('/:projectId/:type/:filename', (req, res) => {
  const { projectId, type, filename } = req.params;
  const filePath = path.join('/data/video_factory', projectId, type, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: { message: 'File not found' } });
  }
});

// List files in project directory
router.get('/:projectId/:type', async (req, res, next) => {
  try {
    const { projectId, type } = req.params;
    const dirPath = path.join('/data/video_factory', projectId, type);
    
    if (!fs.existsSync(dirPath)) {
      return res.json({ files: [] });
    }
    
    const files = await fs.promises.readdir(dirPath);
    const fileDetails = await Promise.all(files.map(async (file) => {
      const stats = await fs.promises.stat(path.join(dirPath, file));
      return {
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
        isDirectory: stats.isDirectory()
      };
    }));
    
    res.json({ files: fileDetails });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

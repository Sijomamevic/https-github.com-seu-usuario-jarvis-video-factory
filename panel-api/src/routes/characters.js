const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Get characters for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { rows } = await req.app.locals.db.query(
      'SELECT * FROM characters WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.projectId]
    );
    res.json({ characters: rows });
  } catch (error) {
    next(error);
  }
});

// Create new character
router.post('/', async (req, res, next) => {
  try {
    const { projectId, name, profile, referenceImage, seed } = req.body;
    
    const { rows } = await req.app.locals.db.query(
      `INSERT INTO characters (project_id, name, profile, reference_image, seed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, name, profile, referenceImage, seed]
    );
    
    // Update manifest with new character
    const projectPath = path.join('/data/video_factory', projectId);
    const manifestPath = path.join(projectPath, 'manifest.json');
    
    try {
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
      
      if (!manifest.characters) manifest.characters = [];
      manifest.characters.push(rows[0]);
      manifest.updatedAt = new Date().toISOString();
      
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    } catch (err) {
      console.error('Failed to update manifest with character:', err);
    }
    
    res.status(201).json({ character: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

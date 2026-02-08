const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await req.app.locals.db.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json({ projects: rows });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await req.app.locals.db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Project not found' } });
    res.json({ project: rows[0] });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, type, description, duration, reference } = req.body;
    const projectId = uuidv4();
    const projectPath = path.join('/data/video_factory', projectId);
    const dirs = ['characters', 'reference', 'roteiro', 'prompts', 'imagens', 'videos', 'frames_extraidos', 'audio', 'musica', 'edicao', 'export'];
    for (const dir of dirs) await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    const manifest = { version: '1.0', projectId, name, type, duration, reference, status: 'draft', scenes: [], characters: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await fs.writeFile(path.join(projectPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
    const { rows } = await req.app.locals.db.query('INSERT INTO projects (id, name, description, type, duration, status, manifest) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [projectId, name, description, type, duration, 'draft', manifest]);
    await req.app.locals.redis.publish('agent-events', JSON.stringify({ type: 'project.created', projectId, timestamp: new Date().toISOString() }));
    res.status(201).json({ project: rows[0] });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, status, manifest } = req.body;
    const { rows } = await req.app.locals.db.query('UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), manifest = COALESCE($4, manifest), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *', [name, description, status, manifest, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Project not found' } });
    if (manifest) {
      const projectPath = path.join('/data/video_factory', req.params.id);
      await fs.writeFile(path.join(projectPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }
    await req.app.locals.redis.publish('agent-events', JSON.stringify({ type: 'project.updated', projectId: req.params.id, timestamp: new Date().toISOString() }));
    res.json({ project: rows[0] });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await req.app.locals.db.query('DELETE FROM projects WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Project not found' } });
    const projectPath = path.join('/data/video_factory', req.params.id);
    await fs.rm(projectPath, { recursive: true, force: true });
    await req.app.locals.redis.publish('agent-events', JSON.stringify({ type: 'project.deleted', projectId: req.params.id, timestamp: new Date().toISOString() }));
    res.json({ message: 'Project deleted successfully' });
  } catch (error) { next(error); }
});

router.get('/:id/download', async (req, res, next) => {
  try {
    const videoPath = path.join('/data/video_factory', req.params.id, 'export', 'final_video.mp4');
    try {
      await fs.access(videoPath);
    } catch (err) {
      return res.status(404).json({ error: { message: 'Vídeo não encontrado.', path: videoPath } });
    }
    res.download(videoPath, 'projeto-' + req.params.id + '.mp4');
  } catch (error) { next(error); }
});

router.post('/:id/execute', async (req, res, next) => {
  try {
    const { sceneId } = req.body;
    await req.app.locals.db.query('UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['executing', req.params.id]);
    await req.app.locals.redis.lpush('execution-queue', JSON.stringify({ projectId: req.params.id, sceneId: sceneId || 'all', timestamp: new Date().toISOString() }));
    await req.app.locals.redis.publish('agent-events', JSON.stringify({ type: 'execution.started', projectId: req.params.id, sceneId, timestamp: new Date().toISOString() }));
    res.json({ message: 'Execution started', projectId: req.params.id, sceneId });
  } catch (error) { next(error); }
});

module.exports = router;

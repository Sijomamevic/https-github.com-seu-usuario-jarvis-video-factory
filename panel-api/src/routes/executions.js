const express = require('express');
const router = express.Router();

// Get executions for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { rows } = await req.app.locals.db.query(
      `SELECT e.*, 
       (SELECT json_agg(l.*) FROM (SELECT * FROM agent_logs WHERE execution_id = e.id ORDER BY timestamp DESC LIMIT 50) l) as logs
       FROM executions e 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [req.params.projectId]
    );
    res.json({ executions: rows });
  } catch (error) {
    next(error);
  }
});

// Get execution details and logs
router.get('/:id', async (req, res, next) => {
  try {
    const { rows: executionRows } = await req.app.locals.db.query(
      'SELECT * FROM executions WHERE id = $1',
      [req.params.id]
    );
    
    if (executionRows.length === 0) {
      return res.status(404).json({ error: { message: 'Execution not found' } });
    }
    
    const { rows: logRows } = await req.app.locals.db.query(
      'SELECT * FROM agent_logs WHERE execution_id = $1 ORDER BY timestamp ASC',
      [req.params.id]
    );
    
    res.json({ 
      execution: executionRows[0],
      logs: logRows
    });
  } catch (error) {
    next(error);
  }
});

// Create manual execution (for testing)
router.post('/', async (req, res, next) => {
  try {
    const { projectId, sceneId, agentName, input } = req.body;
    
    const { rows } = await req.app.locals.db.query(
      `INSERT INTO executions (project_id, scene_id, agent_name, status, input)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, sceneId, agentName, 'pending', input]
    );
    
    // Queue task in Redis
    await req.app.locals.redis.lpush('agent-tasks', JSON.stringify({
      executionId: rows[0].id,
      projectId,
      sceneId,
      agentName,
      input,
      timestamp: new Date().toISOString()
    }));
    
    res.status(201).json({ execution: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

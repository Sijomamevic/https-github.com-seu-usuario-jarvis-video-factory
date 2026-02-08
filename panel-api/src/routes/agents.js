const express = require('express');
const router = express.Router();

// Get status of all agents
router.get('/status', async (req, res, next) => {
  try {
    const agents = [
      'jarvis', 'neoqeav', 'joao', 'cassiano', 
      'noah', 'melissa', 'victoria', 'miriam', 'caio'
    ];
    
    const agentStatus = {};
    
    for (const agent of agents) {
      const status = await req.app.locals.redis.get(`agent-status:${agent}`);
      agentStatus[agent] = status ? JSON.parse(status) : { status: 'offline' };
    }
    
    res.json({ agents: agentStatus });
  } catch (error) {
    next(error);
  }
});

// Trigger specific agent action
router.post('/:agentName/action', async (req, res, next) => {
  try {
    const { agentName } = req.params;
    const { projectId, action, params } = req.body;
    
    const task = {
      agentName,
      projectId,
      action,
      params,
      timestamp: new Date().toISOString()
    };
    
    await req.app.locals.redis.lpush('agent-tasks', JSON.stringify(task));
    
    res.json({ 
      message: `Action triggered for agent ${agentName}`,
      task
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

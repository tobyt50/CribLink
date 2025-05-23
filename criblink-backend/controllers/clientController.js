const db = require('../db');

// Fetch clients + VIP + notes
exports.getClientsForAgent = async (req, res) => {
  const { agentId } = req.params;
  try {
    const result = await db.query(`
      SELECT u.user_id, u.full_name, u.email, u.date_joined, u.status, ac.notes, ac.status AS client_status
      FROM agent_clients ac
      JOIN users u ON ac.client_id = u.user_id
      WHERE ac.agent_id = $1
    `, [agentId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Internal error fetching clients' });
  }
};

// Send email mock
exports.sendEmailToClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { subject, message } = req.body;

  console.log(`Email from agent ${agentId} to client ${clientId}: Subject=${subject}, Message=${message}`);
  res.status(200).json({ message: 'Email sent (mock)' });
};

// Respond to inquiry mock
exports.respondToInquiry = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { message } = req.body;

  console.log(`Agent ${agentId} responded to client ${clientId}: ${message}`);
  res.status(200).json({ message: 'Response sent (mock)' });
};

// Add agent notes
exports.addNoteToClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { note } = req.body;

  try {
    await db.query(`
      UPDATE agent_clients SET notes = $1 WHERE agent_id = $2 AND client_id = $3
    `, [note, agentId, clientId]);

    res.status(200).json({ message: 'Note added' });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Error adding note' });
  }
};

// Toggle VIP status
exports.toggleVipFlag = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { status } = req.body;

  if (!['vip', 'regular'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    await db.query(`
      UPDATE agent_clients SET status = $1 WHERE agent_id = $2 AND client_id = $3
    `, [status, agentId, clientId]);

    res.status(200).json({ message: 'Client status updated' });
  } catch (err) {
    console.error('Toggle VIP error:', err);
    res.status(500).json({ error: 'Error updating VIP status' });
  }
};

// Optional: Save message to message log
exports.sendMessageToClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { message } = req.body;

  try {
    await db.query(`
      INSERT INTO client_messages (agent_id, client_id, message)
      VALUES ($1, $2, $3)
    `, [agentId, clientId, message]);

    res.status(200).json({ message: 'Message logged' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Error sending message' });
  }
};

exports.archiveClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  try {
    // Copy to archive first
    await db.query(`
      INSERT INTO archived_clients (agent_id, client_id, notes, status)
      SELECT agent_id, client_id, notes, status
      FROM agent_clients
      WHERE agent_id = $1 AND client_id = $2
    `, [agentId, clientId]);

    // Delete from active table
    await db.query(`
      DELETE FROM agent_clients WHERE agent_id = $1 AND client_id = $2
    `, [agentId, clientId]);

    res.status(200).json({ message: 'Client archived' });
  } catch (err) {
    console.error('Archive client error:', err);
    res.status(500).json({ error: 'Failed to archive client' });
  }
};

exports.getArchivedClients = async (req, res) => {
  const { agentId } = req.params;
  try {
    const result = await db.query(`
      SELECT u.user_id, u.full_name, u.email, u.date_joined, u.status, ac.notes, ac.status AS client_status, ac.archived_at
      FROM archived_clients ac
      JOIN users u ON ac.client_id = u.user_id
      WHERE ac.agent_id = $1
    `, [agentId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch archived error:', err);
    res.status(500).json({ error: 'Failed to fetch archived clients' });
  }
};

exports.restoreClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  try {
    // Move back to active table
    await db.query(`
      INSERT INTO agent_clients (agent_id, client_id, notes, status)
      SELECT agent_id, client_id, notes, status
      FROM archived_clients
      WHERE agent_id = $1 AND client_id = $2
    `, [agentId, clientId]);

    // Remove from archive
    await db.query(`
      DELETE FROM archived_clients WHERE agent_id = $1 AND client_id = $2
    `, [agentId, clientId]);

    res.status(200).json({ message: 'Client restored' });
  } catch (err) {
    console.error('Restore client error:', err);
    res.status(500).json({ error: 'Failed to restore client' });
  }
};

// Function to permanently delete an archived client
exports.deleteArchivedClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  try {
    // Delete the client from the archived_clients table
    const result = await db.query(`
      DELETE FROM archived_clients WHERE agent_id = $1 AND client_id = $2
      RETURNING *; -- Optional: return deleted row to confirm deletion
    `, [agentId, clientId]);

    if (result.rowCount === 0) {
      // If no rows were deleted, the client was not found
      return res.status(404).json({ error: 'Archived client not found' });
    }

    res.status(200).json({ message: 'Archived client deleted permanently' });
  } catch (err) {
    console.error('Delete archived client error:', err);
    res.status(500).json({ error: 'Failed to permanently delete archived client' });
  }
};

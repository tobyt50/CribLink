// inquiriesController.js
const pool = require('../db');
const { query } = require('../db');
const logActivity = require('../utils/logActivity');
const { v4: uuidv4 } = require('uuid');

// POST /inquiries (for clients/guests to create a new initial inquiry with property_id)
const createInquiry = async (req, res) => {
  const { client_id, agent_id, property_id, name, email, phone, message_content } = req.body;
  const io = req.app.get('io'); // Get the Socket.IO instance

  const sender_id = req.user ? req.user.user_id : null;

  if (!message_content) {
    return res.status(400).json({ error: 'Message content is required for property inquiries.' });
  }

  try {
    const finalClientId = req.user?.role === 'client' ? req.user.user_id : client_id || null;
    const finalAgentId = agent_id || null;
    const finalSenderId = sender_id || finalClientId; // If client_id is null (guest), sender_id will be null, so use finalClientId

    const result = await query(
      `INSERT INTO inquiries
      (client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_agent, name, email, phone, is_agent_responded, is_opened, read_by_client)
      VALUES ($1, $2, $3, $4, $5, $6, 'initial_inquiry', 'new', false, $7, $8, $9, false, false, true)
      RETURNING *`,
      [
        finalClientId, finalAgentId, property_id || null, finalSenderId, finalAgentId, // recipient_id is agentId for initial inquiry
        message_content, name || null, email || null, phone || null
      ]
    );

    const newInquiry = result.rows[0];

    await logActivity(
      `Client ${newInquiry.client_id || 'Guest'} sent a new inquiry (ID: ${newInquiry.inquiry_id}) for property ${property_id || 'N/A'}.`,
      req.user,
      'inquiry'
    );

    // ✨ REAL-TIME: Emit event for the new inquiry
    if (io) {
        const eventData = {
            conversationId: newInquiry.conversation_id,
            inquiryId: newInquiry.inquiry_id,
            clientId: newInquiry.client_id,
            agentId: newInquiry.agent_id,
            propertyId: newInquiry.property_id,
            message: newInquiry.message_content,
            timestamp: newInquiry.created_at,
            senderId: newInquiry.sender_id,
            messageType: newInquiry.message_type,
            status: newInquiry.status,
            read: newInquiry.read_by_client // Read status for the sender (client/guest)
        };

        if (newInquiry.agent_id) {
            // This event is for an agent's list to update when a new inquiry is assigned to them
            io.emit('new_inquiry_for_agent', eventData);
        } else {
            // This is for a general pool of unassigned inquiries (if applicable)
            io.emit('new_general_inquiry', eventData);
        }
        // Also emit to the conversation room itself for real-time chat updates
        io.to(newInquiry.conversation_id).emit('new_message', eventData);
        // Also emit a general list change event to prompt re-fetch if needed for other dashboards/lists
        io.emit('inquiry_list_changed', { reason: 'new_inquiry', conversationId: newInquiry.conversation_id });
    }

    res.status(201).json(newInquiry);
  } catch (err) {
    console.error('Error creating inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /inquiries/general (for agents to create a new general inquiry without property_id)
const createGeneralInquiry = async (req, res) => {
  const { client_id, agent_id, message_content } = req.body;
  const io = req.app.get('io');
  const sender_id = req.user.user_id;

  if (!client_id || !agent_id) {
    return res.status(400).json({ error: 'Client ID and Agent ID are required for general inquiry.' });
  }

  const trimmedContent = typeof message_content === 'string' ? message_content.trim() : '';
  const isMessageEmpty = trimmedContent === '';
  const generatedConversationId = uuidv4();

  if (isMessageEmpty) {
    const generatedConversationId = uuidv4();

    return res.status(200).json({
      conversation: {
        id: generatedConversationId,
        client_id,
        agent_id,
        property_id: null,
        client_full_name: req.user.full_name,
        client_email: req.user.email,
        client_phone: req.user.phone,
        property_title: null,
        messages: [],
        last_message: null,
        last_message_timestamp: null,
        is_agent_responded: false,
        unread_messages_count: 0
      }
    });
  }


  try {
    const result = await query(
      `INSERT INTO inquiries
        (conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_agent, is_agent_responded, is_opened, read_by_client)
       VALUES ($1, $2, $3, NULL, $4, $5, $6, 'general_inquiry', 'open', true, true, true, false)
       RETURNING *`,
      [generatedConversationId, client_id, agent_id, sender_id, client_id, trimmedContent]
    );

    const newInquiry = result.rows[0];

    await logActivity(
      `Agent (ID: ${newInquiry.agent_id}) started a new general inquiry (ID: ${newInquiry.inquiry_id}) with client (ID: ${newInquiry.client_id}).`,
      req.user,
      'inquiry'
    );

    if (io && trimmedContent !== '::shell::') {
      const eventData = {
        conversationId: newInquiry.conversation_id,
        inquiryId: newInquiry.inquiry_id,
        clientId: newInquiry.client_id,
        agentId: newInquiry.agent_id,
        propertyId: newInquiry.property_id,
        message: newInquiry.message_content,
        timestamp: newInquiry.created_at,
        senderId: newInquiry.sender_id,
        messageType: newInquiry.message_type,
        status: newInquiry.status,
        read: newInquiry.read_by_agent
      };

      if (newInquiry.message_content && newInquiry.message_content.trim() !== '' && newInquiry.message_content !== '::shell::') {
        io.emit('new_inquiry_for_agent', eventData);
        io.to(newInquiry.conversation_id).emit('new_message', eventData);
        io.emit('inquiry_list_changed', {
          reason: 'new_general_inquiry',
          conversationId: newInquiry.conversation_id
        });
      }
    }

    res.status(201).json({
      conversation: {
        id: newInquiry.conversation_id,
        client_id: newInquiry.client_id,
        agent_id: newInquiry.agent_id,
        property_id: newInquiry.property_id,
        client_full_name: req.user.full_name,
        client_email: req.user.email,
        client_phone: req.user.phone,
        property_title: null,
        messages: [
          {
            inquiry_id: newInquiry.inquiry_id,
            sender_id: newInquiry.sender_id,
            message: newInquiry.message_content,
            read: newInquiry.read_by_client,
            timestamp: newInquiry.created_at
          }
        ],
        last_message: newInquiry.message_content,
        last_message_timestamp: newInquiry.created_at,
        is_agent_responded: newInquiry.is_agent_responded,
        unread_messages_count: 0
      }
    });

  } catch (err) {
    console.error('Error creating general inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /inquiries/message
const sendMessageInquiry = async (req, res) => {
  const { conversation_id, property_id, message_content, recipient_id, message_type } = req.body;
  const sender_id = req.user.user_id;
  const io = req.app.get('io');

  if (
    !conversation_id ||
    !message_content || // message_content is always required for non-shell messages
    !recipient_id ||
    !['client_reply', 'agent_reply', 'agency_admin_reply'].includes(message_type) // NEW: Added agency_admin_reply
  ) {
    return res.status(400).json({ error: 'Missing required message fields or invalid message type.' });
  }

  try {
    // Step 1: Check if conversation already exists
    const existing = await query(
      'SELECT 1 FROM inquiries WHERE conversation_id = $1 LIMIT 1',
      [conversation_id]
    );

    let client_id = null;
    let agent_id = null;

    // Step 2: If conversation exists, extract client_id and agent_id
    if (existing.rows.length > 0) {
      const convDetails = await query(
        'SELECT client_id, agent_id, property_id FROM inquiries WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 1',
        [conversation_id]
      );
      const first = convDetails.rows[0];
      client_id = first.client_id;
      agent_id = first.agent_id;
    } else {
      // Step 3: This is a new conversation — pull values from token/req
      if (req.user.role === 'agent' || req.user.role === 'agency_admin') { // NEW: Allow agency_admin
        agent_id = req.user.user_id; // The sender is the agent/agency_admin
        client_id = recipient_id; // The recipient is the client
      } else if (req.user.role === 'client') {
        client_id = req.user.user_id;
        agent_id = recipient_id; // The recipient is the agent
      } else {
        return res.status(400).json({ error: 'Invalid sender role.' });
      }
    }

    // Step 4: Determine read flags based on who is sending the message
    const read_by_client = ['client_reply'].includes(message_type); // Client sends, so client has read it
    const read_by_agent = ['agent_reply', 'agency_admin_reply'].includes(message_type); // Agent/Admin sends, so agent/admin has read it

    // Step 5: Insert the message into the DB
    const result = await query(
      `INSERT INTO inquiries
        (conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10)
       RETURNING *`,
      [
        conversation_id,
        client_id,
        agent_id,
        property_id || null,
        sender_id,
        recipient_id,
        message_content.trim(),
        message_type,
        read_by_client,
        read_by_agent
      ]
    );

    const newMessage = result.rows[0];

    // Step 6: Update flags/status on conversation
    if (['agent_reply', 'agency_admin_reply'].includes(message_type)) { // If an agent or agency admin replies
      await query(
        `UPDATE inquiries SET is_agent_responded = TRUE, status = 'open' WHERE conversation_id = $1`,
        [conversation_id]
      );
      // Mark all messages from client as read by agent
      await query(
        `UPDATE inquiries SET read_by_agent = TRUE WHERE conversation_id = $1 AND sender_id = $2`,
        [conversation_id, client_id]
      );
    } else if (message_type === 'client_reply') {
      await query(
        `UPDATE inquiries SET is_agent_responded = FALSE, status = 'new' WHERE conversation_id = $1`,
        [conversation_id]
      );
      // Mark all messages from agent as read by client
      await query(
        `UPDATE inquiries SET read_by_client = TRUE WHERE conversation_id = $1 AND sender_id = $2`,
        [conversation_id, agent_id]
      );
    }

    await logActivity(
      `${req.user.role} (ID: ${sender_id}) sent a ${message_type.replace('_', ' ')} in conversation ${conversation_id}.`,
      req.user,
      'inquiry'
    );

    // Step 7: Emit message only after real content is saved
    if (io) {
      io.to(conversation_id).emit('new_message', {
        conversationId: conversation_id,
        message: newMessage.message_content,
        senderId: newMessage.sender_id,
        recipientId: newMessage.recipient_id,
        messageType: newMessage.message_type,
        timestamp: newMessage.created_at,
        inquiryId: newMessage.inquiry_id,
        // The 'read' flag here should indicate if the RECIPIENT has read it based on message type
        read: message_type === 'client_reply' ? newMessage.read_by_agent : newMessage.read_by_client,
        is_agent_responded: ['agent_reply', 'agency_admin_reply'].includes(message_type)
      });

      io.emit('inquiry_list_changed', {
        reason: 'new_message',
        conversationId: conversation_id
      });
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error sending message in inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// PUT /[role]/inquiries/mark-read/:conversationId
const markMessagesAsRead = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.user_id;
  const role = req.user.role;
  const io = req.app.get('io'); // Get the Socket.IO instance

  const updateColumn = role === 'client' ? 'read_by_client' : (role === 'agent' || role === 'admin' || role === 'agency_admin') ? 'read_by_agent' : null; // NEW: Added agency_admin
  if (!updateColumn) {
    return res.status(403).json({ error: 'Unauthorized role.' });
  }

  try {
    // Mark messages sent by the OTHER party as read by the current user
    await query(
      `UPDATE inquiries SET ${updateColumn} = TRUE WHERE conversation_id = $1 AND sender_id != $2`,
      [conversationId, userId]
    );

    // ✨ REAL-TIME: Emit read receipt acknowledgment to the conversation room
    if (io) {
        io.to(conversationId).emit('message_read_ack', {
            conversationId: conversationId,
            readerId: userId, // The user who read the messages
            role: role // The role of the user who read the messages
        });
        // Also emit a general list change event to prompt re-fetch if needed
        io.emit('inquiry_list_changed', { reason: 'messages_read', conversationId: conversationId });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const getAllInquiriesForAgent = async (req, res) => {
  try {
    const { search, page, limit, sort, direction } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let orderBy = 'i.created_at';
    let orderDirection = 'DESC';

    const validSortKeys = ['i.created_at', 'u_client.full_name', 'p.title', 'i.status'];
    if (sort === 'client_name') {
      orderBy = `COALESCE(u_client.full_name, i.name)`;
    } else if (sort === 'property_title') {
      orderBy = 'p.title';
    } else if (sort && validSortKeys.includes(`i.${sort}`)) {
      orderBy = `i.${sort}`;
    } else if (sort === 'assigned_agent') { // NEW: Sort by assigned agent name
      orderBy = 'u_agent.full_name';
    }


    if (direction && ['asc', 'desc'].includes(direction.toLowerCase())) {
      orderDirection = direction.toUpperCase();
    }

    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    // Adjust query for agent/admin/agency_admin
    if (req.user.role === 'agent') {
        whereClause += `
          WHERE
            (i.agent_id = $${paramIndex} OR i.recipient_id = $${paramIndex} OR i.sender_id = $${paramIndex})
            AND i.hidden_from_agent = FALSE
        `;
        queryParams.push(req.user.user_id);
        paramIndex++;
    } else if (req.user.role === 'agency_admin') { // Agency Admin can see inquiries for their agents
        // Get all agent_ids belonging to this agency
        const agencyAgents = await query(
            `SELECT user_id FROM users WHERE agency_id = $1 AND role IN ('agent', 'agency_admin')`, // Include agency_admin themselves
            [req.user.agency_id]
        );
        const agentIds = agencyAgents.rows.map(row => row.user_id);

        if (agentIds.length === 0) {
            return res.json({ inquiries: [], total: 0, page: pageNum, totalPages: 0 });
        }

        // The query needs to select conversations where the agent_id (assigned agent)
        // or sender_id or recipient_id is one of the agents in the agency.
        whereClause += `
            WHERE
                (i.agent_id = ANY($${paramIndex}::int[]) OR i.recipient_id = ANY($${paramIndex}::int[]) OR i.sender_id = ANY($${paramIndex}::int[]))
                AND i.hidden_from_agent = FALSE
        `;
        queryParams.push(agentIds);
        paramIndex++;
    } else if (req.user.role === 'admin') {
        // Admin can see all inquiries, no specific user ID filter needed initially
        whereClause += ` WHERE i.hidden_from_agent = FALSE`; // Still hide from agent's perspective if marked
    }


    if (search) {
      const searchTerm = `%${search}%`;
      const searchConditions = `(COALESCE(u_client.full_name, i.name) ILIKE $${paramIndex} OR u_agent.full_name ILIKE $${paramIndex + 1} OR p.title ILIKE $${paramIndex + 2} OR i.message_content ILIKE $${paramIndex + 3} OR i.email ILIKE $${paramIndex + 4} OR i.phone ILIKE $${paramIndex + 5})`;
      whereClause += whereClause ? ` AND ${searchConditions}` : ` WHERE ${searchConditions}`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      paramIndex += 6;
    }

    const totalResult = await query(
      `SELECT COUNT(DISTINCT i.conversation_id)
       FROM inquiries i
       LEFT JOIN users u_client ON i.client_id = u_client.user_id
       LEFT JOIN users u_agent ON i.agent_id = u_agent.user_id
       LEFT JOIN property_listings p ON i.property_id = p.property_id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    const allInquiries = await query(
      `SELECT
          i.inquiry_id, i.conversation_id, i.client_id, i.agent_id, i.property_id, i.sender_id,
          i.recipient_id, i.message_content, i.message_type, i.status, i.read_by_client, i.read_by_agent,
          i.is_agent_responded, i.is_opened, i.created_at, i.updated_at,
          COALESCE(u_client.full_name, i.name) AS client_name,
          COALESCE(u_client.email, i.email) AS client_email,
          COALESCE(u_client.phone, i.phone) AS client_phone,
          u_client.profile_picture_url AS client_profile_picture_url, -- ADDED: Client profile picture URL
          u_agent.full_name AS agent_name, u_agent.email AS agent_email,
          p.title AS property_title
       FROM inquiries i
       LEFT JOIN users u_client ON i.client_id = u_client.user_id
       LEFT JOIN users u_agent ON i.agent_id = u_agent.user_id
       LEFT JOIN property_listings p ON i.property_id = p.property_id
       ${whereClause}
       ORDER BY i.conversation_id, i.created_at ASC`,
      queryParams
    );

    const conversationsMap = new Map();
    allInquiries.rows.forEach(inq => {
      if (!conversationsMap.has(inq.conversation_id)) {
        conversationsMap.set(inq.conversation_id, {
          id: inq.conversation_id, client_id: inq.client_id, agent_id: inq.agent_id, property_id: inq.property_id,
          clientName: inq.client_name, clientEmail: inq.client_email, clientPhone: inq.client_phone,
          clientProfilePictureUrl: inq.client_profile_picture_url, // ADDED: Client profile picture URL to map
          agent_name: inq.agent_name, // NEW: Include assigned agent's name
          propertyTitle: inq.property_title || (inq.property_id ? `Property ${inq.property_id}` : 'General Inquiry'),
          messages: [], lastMessage: null, lastMessageTimestamp: null, lastMessageSenderId: null,
          unreadCount: 0, is_agent_responded: inq.is_agent_responded, is_opened: inq.is_opened,
        });
      }
      const conversation = conversationsMap.get(inq.conversation_id);
      const isClientMessage = inq.sender_id === inq.client_id;

      // Filter out messages that are explicitly null or '::shell::' content
      if (inq.message_content !== null && inq.message_content !== '::shell::') {
        conversation.messages.push({
          inquiry_id: inq.inquiry_id, sender_id: inq.sender_id, sender: isClientMessage ? 'Client' : 'Agent',
          message: inq.message_content, timestamp: inq.created_at,
          read: isClientMessage ? inq.read_by_agent : inq.read_by_client, // Correct read status based on recipient
        });
      }
    });

    const groupedConversations = Array.from(conversationsMap.values());

    groupedConversations.forEach(conv => {
      conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      if (conv.messages.length > 0) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        conv.lastMessage = lastMsg.message;
        conv.lastMessageTimestamp = lastMsg.timestamp;
        conv.lastMessageSenderId = lastMsg.sender_id;
      }
      // Correct unread count for the current user's role
      let unreadCount = 0;
      if (req.user.role === 'client') {
        // For client, count messages from agent that client hasn't read
        unreadCount = conv.messages.filter(msg =>
          msg.sender_id === conv.agent_id && !msg.read
        ).length;
      } else if (req.user.role === 'agent' || req.user.role === 'admin' || req.user.role === 'agency_admin') {
        // For agent/admin/agency_admin, count messages from client that agent/admin hasn't read
        unreadCount = conv.messages.filter(msg =>
          msg.sender_id === conv.client_id && !msg.read
        ).length;
      }
      conv.unreadCount = unreadCount;

      const latestStatusInquiry = allInquiries.rows
        .filter(inq => inq.conversation_id === conv.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (latestStatusInquiry) {
        conv.is_agent_responded = latestStatusInquiry.is_agent_responded;
        conv.is_opened = latestStatusInquiry.is_opened;
      }
    });

    groupedConversations.sort((a, b) => {
      // Handle sorting by agent name
      if (sort === 'assigned_agent') {
        const nameA = a.agent_name || '';
        const nameB = b.agent_name || '';
        return orderDirection === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      // Existing sorting logic for other keys
      const dateA = new Date(a.lastMessageTimestamp);
      const dateB = new Date(b.lastMessageTimestamp);
      return orderDirection === 'ASC' ? dateA - dateB : dateB - dateA;
    });

    const paginatedConversations = groupedConversations.slice(offset, offset + limitNum);

    res.json({ inquiries: paginatedConversations, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('Error fetching agent inquiries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllInquiriesForClient = async (req, res) => {
  try {
    const { search, page, limit, sort, direction } = req.query;
    const client_id = req.user.user_id;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let orderBy = 'i.created_at';
    let orderDirection = 'DESC';

    if (sort === 'agent_name') orderBy = 'u_agent.full_name';
    else if (sort === 'property_title') orderBy = 'p.title';

    if (direction && ['asc', 'desc'].includes(direction.toLowerCase())) orderDirection = direction.toUpperCase();

    let whereClause = ` WHERE i.client_id = $1 AND i.hidden_from_client = FALSE`;
    const queryParams = [client_id];
    let paramIndex = 2;

    if (search) {
      const searchTerm = `%${search}%`;
      const searchConditions = `(u_agent.full_name ILIKE $${paramIndex} OR p.title ILIKE $${paramIndex + 1} OR i.message_content ILIKE $${paramIndex + 2})`;
      whereClause += ` AND ${searchConditions}`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    const totalResult = await query(
      `SELECT COUNT(DISTINCT i.conversation_id) FROM inquiries i
       LEFT JOIN users u_agent ON i.agent_id = u_agent.user_id
       LEFT JOIN property_listings p ON i.property_id = p.property_id
       ${whereClause}`,
      queryParams
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    const allInquiries = await query(
      `SELECT
          i.inquiry_id, i.conversation_id, i.client_id, i.agent_id, i.property_id, i.sender_id,
          i.recipient_id, i.message_content, i.message_type, i.status, i.read_by_client,
          i.read_by_agent, i.is_agent_responded, i.is_opened, i.created_at, i.updated_at,
          u_agent.full_name AS agent_name, u_agent.email AS agent_email,
          p.title AS property_title
       FROM inquiries i
       LEFT JOIN users u_agent ON i.agent_id = u_agent.user_id
       LEFT JOIN property_listings p ON i.property_id = p.property_id
       ${whereClause}
       ORDER BY i.conversation_id, i.created_at ASC`,
      queryParams
    );

    const conversationsMap = new Map();
    allInquiries.rows.forEach(inq => {
      if (!conversationsMap.has(inq.conversation_id)) {
        conversationsMap.set(inq.conversation_id, {
          id: inq.conversation_id, client_id: inq.client_id, property_id: inq.property_id,
          agent_id: inq.agent_id, agentName: inq.agent_name || 'Unassigned Agent', agentEmail: inq.agent_email,
          propertyTitle: inq.property_title || (inq.property_id ? `Property ${inq.property_id}` : 'General Inquiry'),
          messages: [], lastMessage: null, lastMessageTimestamp: null, lastMessageSenderId: null,
          unreadCount: 0, is_agent_responded: inq.is_agent_responded, is_opened: inq.is_opened,
        });
      }

      const conversation = conversationsMap.get(inq.conversation_id);
      const isClientMessage = inq.sender_id === inq.client_id;

      // Filter out messages that are explicitly null or '::shell::' content
      if (inq.message_content !== null && inq.message_content !== '::shell::') {
        conversation.messages.push({
          inquiry_id: inq.inquiry_id,
          sender_id: inq.sender_id,
          sender: isClientMessage ? 'Client' : 'Agent',
          read: isClientMessage ? inq.read_by_agent : inq.read_by_client,
          message: inq.message_content,
          timestamp: inq.created_at,
        });
      }

      // The is_agent_responded status should be based on the latest message or the conversation state.
      // This logic here might be redundant if the main query is correct.
      // if (inq.message_type === 'agent_reply') conversation.is_agent_responded = true;
      // if (inq.is_opened) conversation.is_opened = true;
    });

    const groupedConversations = Array.from(conversationsMap.values());

    groupedConversations.forEach(conv => {
      conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      if (conv.messages.length > 0) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        conv.lastMessage = lastMsg.message;
        conv.lastMessageTimestamp = lastMsg.timestamp;
        conv.lastMessageSenderId = lastMsg.sender_id;
      }
      // Correct unread count for the CLIENT (messages from agent that client hasn't read)
      conv.unreadCount = conv.messages.filter(msg =>
        msg.sender_id === conv.agent_id && !msg.read
      ).length;
    });

    groupedConversations.sort((a, b) => {
      const dateA = new Date(a.lastMessageTimestamp);
      const dateB = new Date(b.lastMessageTimestamp);
      return orderDirection === 'ASC' ? dateA - dateB : dateB - dateA;
    });

    const paginatedConversations = groupedConversations.slice(offset, offset + limitNum);

    res.json({ inquiries: paginatedConversations, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('Error fetching client inquiries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /inquiries/assign/:inquiryId
const assignInquiry = async (req, res) => {
  const { inquiryId } = req.params;
  const { agent_id } = req.body;
  const io = req.app.get('io'); // Get the Socket.IO instance

  if (!agent_id) {
    return res.status(400).json({ error: 'Agent ID is required for assignment.' });
  }

  try {
    const result = await query(
      `UPDATE inquiries
       SET agent_id = $1, status = 'assigned', read_by_agent = TRUE
       WHERE inquiry_id = $2 AND message_type = 'initial_inquiry' RETURNING *`,
      [agent_id, inquiryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Initial inquiry not found or already assigned.' });
    }

    const assignedInquiry = result.rows[0];

    await logActivity(`Assigned inquiry ID ${inquiryId} to agent ID ${agent_id}`, req.user, 'inquiry');

    // Emit Socket.IO event for the assignment
    if (io) {
      io.emit('inquiry_assigned', {
        conversationId: assignedInquiry.conversation_id,
        inquiryId: assignedInquiry.inquiry_id,
        assignedAgentId: assignedInquiry.agent_id,
        clientId: assignedInquiry.client_id,
        propertyId: assignedInquiry.property_id,
        timestamp: assignedInquiry.updated_at,
      });
      io.emit('inquiry_list_changed', {
        reason: 'inquiry_assigned',
        conversationId: assignedInquiry.conversation_id
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error assigning inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /inquiries/agency-admin/reassign/:conversationId - NEW ENDPOINT
const reassignInquiry = async (req, res) => {
  const { conversationId } = req.params;
  const { new_agent_id } = req.body;
  const io = req.app.get('io');
  const agencyAdminUserId = req.user.user_id;
  const agencyId = req.user.agency_id;

  if (!new_agent_id) {
    return res.status(400).json({ error: 'New agent ID is required for reassignment.' });
  }

  try {
    // 1. Verify the agency admin is authorized for this agency
    const userAgencyCheck = await query('SELECT agency_id FROM users WHERE user_id = $1', [agencyAdminUserId]);
    if (!userAgencyCheck.rows.length || userAgencyCheck.rows[0].agency_id !== agencyId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized for this agency.' });
    }

    // 2. Verify the conversation belongs to an agent within this agency
    const conversationCheck = await query(
      `SELECT i.agent_id, i.client_id, i.property_id, u_agent.agency_id
       FROM inquiries i
       JOIN users u_agent ON i.agent_id = u_agent.user_id
       WHERE i.conversation_id = $1 LIMIT 1`,
      [conversationId]
    );

    if (conversationCheck.rows.length === 0 || conversationCheck.rows[0].agency_id !== agencyId) {
      return res.status(404).json({ message: 'Conversation not found or not part of your agency.' });
    }

    // 3. Verify the new_agent_id belongs to the same agency
    const newAgentCheck = await query(
      `SELECT user_id FROM users WHERE user_id = $1 AND agency_id = $2 AND role = 'agent'`,
      [new_agent_id, agencyId]
    );
    if (newAgentCheck.rows.length === 0) {
      return res.status(400).json({ message: 'New agent not found in your agency or is not an agent.' });
    }

    // 4. Update all messages in the conversation with the new agent_id
    const result = await query(
      `UPDATE inquiries
       SET agent_id = $1, updated_at = NOW()
       WHERE conversation_id = $2
       RETURNING *`,
      [new_agent_id, conversationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found or no messages updated.' });
    }

    await logActivity(
      `Agency Admin (ID: ${agencyAdminUserId}) reassigned conversation ${conversationId} to agent ID ${new_agent_id}.`,
      req.user,
      'inquiry_reassignment'
    );

    // Emit Socket.IO event for reassignment
    if (io) {
      io.emit('inquiry_reassigned', {
        conversationId: conversationId,
        newAgentId: new_agent_id,
        oldAgentId: conversationCheck.rows[0].agent_id,
        timestamp: new Date().toISOString(),
      });
      io.emit('inquiry_list_changed', {
        reason: 'inquiry_reassigned',
        conversationId: conversationId
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error reassigning inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// PUT /agent/inquiries/mark-opened/:conversationId
const markConversationOpened = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.user_id;
  const io = req.app.get('io'); // Get the Socket.IO instance

  try {
    await query(
      `UPDATE inquiries
       SET is_opened = TRUE
       WHERE conversation_id = $1 AND (agent_id = $2 OR recipient_id = $2 OR sender_id = $2)`,
      [conversationId, userId]
    );

    // Emit Socket.IO event
    if (io) {
      io.to(conversationId).emit('conversation_opened', {
        conversationId,
        openerId: userId,
        timestamp: new Date().toISOString()
      });
      io.emit('inquiry_list_changed', { reason: 'conversation_opened', conversationId });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error marking conversation as opened:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /agent/inquiries/mark-responded/:conversationId
const markConversationResponded = async (req, res) => {
  const { conversationId } = req.params;
  const io = req.app.get('io'); // Get the Socket.IO instance

  try {
    await query(
      `UPDATE inquiries
       SET is_agent_responded = TRUE
       WHERE conversation_id = $1`,
      [conversationId]
    );

    await logActivity(`Agent (ID: ${req.user.user_id}) marked conversation ${conversationId} as responded.`, req.user, 'inquiry');

    // Emit Socket.IO event
    if (io) {
      io.to(conversationId).emit('conversation_responded', {
        conversationId,
        responderId: req.user.user_id,
        timestamp: new Date().toISOString()
      });
      io.emit('inquiry_list_changed', { reason: 'conversation_responded', conversationId });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error marking conversation as responded:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /inquiries/delete-conversation/:conversationId
const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.user_id;
  const role = req.user.role;
  const io = req.app.get('io'); // Get the Socket.IO instance

  const columnToUpdate =
    role === 'client' ? 'hidden_from_client'
    : role === 'agent' || role === 'admin' || role === 'agency_admin' ? 'hidden_from_agent' // NEW: Added agency_admin
    : null;

  if (!columnToUpdate) {
    return res.status(403).json({ error: 'Unauthorized role to delete conversation.' });
  }

  try {
    // Soft delete: Mark conversation as hidden from the deleting user's view
    await query(
      `UPDATE inquiries
       SET ${columnToUpdate} = TRUE
       WHERE conversation_id = $1 AND (sender_id = $2 OR recipient_id = $2 OR client_id = $2 OR agent_id = $2)`,
      [conversationId, userId]
    );

    // After soft deleting, check if both client and agent have marked it hidden
    const checkHiddenStatus = await query(
      `SELECT hidden_from_client, hidden_from_agent
       FROM inquiries
       WHERE conversation_id = $1
       LIMIT 1`,
      [conversationId]
    );

    if (checkHiddenStatus.rows.length > 0) {
      const { hidden_from_client, hidden_from_agent } = checkHiddenStatus.rows[0];

      // If both client and agent have marked it hidden, then delete it completely
      if (hidden_from_client && hidden_from_agent) {
        await query(
          `DELETE FROM inquiries
           WHERE conversation_id = $1`,
          [conversationId]
        );

        // Emit a specific event for permanent deletion
        if (io) {
          io.to(conversationId).emit('conversation_permanently_deleted', {
            conversationId
          });
          io.emit('inquiry_list_changed', {
            reason: 'conversation_permanently_deleted',
            conversationId
          });
        }
      } else {
        // If not permanently deleted, emit the soft-delete event as before
        if (io) {
          io.to(conversationId).emit('conversation_deleted', {
            conversationId,
            deleterId: userId,
            role
          });
          io.emit('inquiry_list_changed', {
            reason: 'conversation_deleted',
            conversationId
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error handling conversation deletion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Count total inquiries (distinct conversations) for the authenticated user's role
const countAllInquiries = async (req, res) => {
  const userId = req.user.user_id;
  const role = req.user.role;

  let whereClause = '';
  const queryParams = [];
  let paramIndex = 1;

  if (role === 'agent') {
    // For agents, count distinct conversations where they are the assigned agent, sender, or recipient
    whereClause += `
      WHERE
        (agent_id = $${paramIndex} OR sender_id = $${paramIndex} OR recipient_id = $${paramIndex})
        AND hidden_from_agent = FALSE
    `;
    queryParams.push(userId);
    paramIndex++;
  } else if (role === 'agency_admin') {
    // Agency admin sees inquiries for all agents in their agency
    const agencyAgents = await query(
      `SELECT user_id FROM users WHERE agency_id = $1 AND role IN ('agent', 'agency_admin')`, // Include agency_admin themselves
      [req.user.agency_id]
    );
    const agentIds = agencyAgents.rows.map(row => row.user_id);

    if (agentIds.length === 0) {
      return res.json({ count: 0 });
    }

    whereClause += `
      WHERE
        (agent_id = ANY($${paramIndex}::int[]) OR sender_id = ANY($${paramIndex}::int[]) OR recipient_id = ANY($${paramIndex}::int[]))
        AND hidden_from_agent = FALSE
    `;
    queryParams.push(agentIds);
    paramIndex++;
  } else if (role === 'admin') {
    // Admin sees all inquiries
    whereClause += ` WHERE hidden_from_agent = FALSE`;
  } else if (role === 'client') {
    // Clients only see their own inquiries
    whereClause += ` WHERE client_id = $${paramIndex} AND hidden_from_client = FALSE`;
    queryParams.push(userId);
    paramIndex++;
  }


  try {
    const result = await query(`
      SELECT COUNT(DISTINCT conversation_id)
      FROM inquiries
      ${whereClause}
    `, queryParams);

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error counting inquiries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Count all agent replies (messages with message_type = 'agent_reply')
const countAgentResponses = async (req, res) => {
  const userId = req.user.user_id;
  const role = req.user.role;

  let whereClause = ` WHERE message_type = 'agent_reply'`;
  const queryParams = [];
  let paramIndex = 1;

  if (role === 'agent') {
    // For agents, count only their own replies
    whereClause += ` AND sender_id = $${paramIndex} AND hidden_from_agent = FALSE`;
    queryParams.push(userId);
    paramIndex++;
  } else if (role === 'agency_admin') {
    // Agency admin sees responses from agents in their agency
    const agencyAgents = await query(
      `SELECT user_id FROM users WHERE agency_id = $1 AND role IN ('agent', 'agency_admin')`, // Include agency_admin themselves
      [req.user.agency_id]
    );
    const agentIds = agencyAgents.rows.map(row => row.user_id);

    if (agentIds.length === 0) {
      return res.json({ count: 0 });
    }

    whereClause += ` AND sender_id = ANY($${paramIndex}::int[]) AND hidden_from_agent = FALSE`;
    queryParams.push(agentIds);
    paramIndex++;
  } else if (role === 'admin') {
    // Admin sees all agent replies
    whereClause += ` AND hidden_from_agent = FALSE`;
  } else if (role === 'client') {
    // Clients should not be calling this endpoint, but if they do, filter by their conversations
    whereClause += ` AND client_id = $${paramIndex} AND hidden_from_client = FALSE`;
    queryParams.push(userId);
    paramIndex++;
  }

  try {
    const result = await query(`
      SELECT COUNT(*)
      FROM inquiries
      ${whereClause}
    `, queryParams);

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error counting agent responses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get agent-client conversation thread
const getAgentClientConversation = async (req, res) => {
  const { agentId, clientId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  try {
    // Basic authorization check
    if (currentUserRole === 'client' && parseInt(clientId) !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own client conversations.' });
    }
    // For agents/agency_admins, they can view conversations they are involved in (either as agent_id or sender/recipient).
    // An admin can view all.
    if ((currentUserRole === 'agent' || currentUserRole === 'agency_admin') && parseInt(agentId) !== currentUserId) { // NEW: Added agency_admin
         // Also check if the agent/agency_admin is the sender or recipient of any message in this conversation.
        const isAgentInvolved = await query(
            `SELECT 1 FROM inquiries
             WHERE conversation_id = (SELECT conversation_id FROM inquiries WHERE agent_id = $1 AND client_id = $2 LIMIT 1)
             AND (sender_id = $3 OR recipient_id = $3) LIMIT 1`,
            [agentId, clientId, currentUserId]
        );
        if (!isAgentInvolved.rows.length && currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You can only view conversations you are involved in.' });
        }
    }


    const conversationResult = await query(
      `SELECT
        i.conversation_id AS id,
        i.client_id,
        i.agent_id,
        COALESCE(uc.full_name, i.name) AS clientName,
        COALESCE(uc.email, i.email) AS clientEmail,
        COALESCE(uc.phone, i.phone) AS clientPhone,
        uc.profile_picture_url AS clientProfilePictureUrl, -- ADDED: Client profile picture URL
        ua.full_name AS agentName,
        ua.email AS agentEmail,
        pl.property_id,
        pl.title AS propertyTitle,
        i.status,
        i.is_agent_responded,
        i.is_opened,
        (SELECT read_by_client FROM inquiries WHERE conversation_id = i.conversation_id ORDER BY created_at DESC LIMIT 1) AS read_by_client,
        (SELECT read_by_agent FROM inquiries WHERE conversation_id = i.conversation_id ORDER BY created_at DESC LIMIT 1) AS read_by_agent
      FROM inquiries i
      LEFT JOIN users uc ON i.client_id = uc.user_id
      LEFT JOIN users ua ON i.agent_id = ua.user_id
      LEFT JOIN property_listings pl ON i.property_id = pl.property_id
      WHERE i.agent_id = $1 AND i.client_id = $2
      ORDER BY i.created_at DESC
      LIMIT 1`,
      [agentId, clientId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(200).json({ conversation: null });
    }

    const conversation = conversationResult.rows[0];

    // Determine the visibility column based on the current user's role
    const visibilityColumn = currentUserRole === 'client' ? 'hidden_from_client' : 'hidden_from_agent'; // This is fine, as agency_admin also uses hidden_from_agent

    const messagesResult = await query(
      `SELECT
        inquiry_id, sender_id, message_content AS message,
        created_at AS timestamp, read_by_client, read_by_agent
       FROM inquiries
       WHERE conversation_id = $1
       AND message_content IS NOT NULL AND message_content != '::shell::' -- Filter out null and '::shell::' messages
       AND ${visibilityColumn} = FALSE
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    conversation.messages = messagesResult.rows.map(msg => ({
      inquiry_id: msg.inquiry_id,
      sender_id: msg.sender_id,
      message: msg.message,
      timestamp: msg.timestamp,
      // Fix: Determine 'read' status based on who sent the message and who the recipient is.
      // If the sender is the client, 'read' means 'read_by_agent'.
      // If the sender is the agent, 'read' means 'read_by_client'.
      read: msg.sender_id === conversation.client_id ? msg.read_by_agent : msg.read_by_client
    }));

    res.status(200).json({ conversation });
  } catch (err) {
    console.error('Error fetching agent-client conversation:', err);
    res.status(500).json({ message: 'Failed to fetch conversation.', error: err.message });
  }
};

module.exports = {
  createInquiry,
  createGeneralInquiry, // Export the new function
  sendMessageInquiry,
  getAllInquiriesForAgent,
  getAllInquiriesForClient,
  markMessagesAsRead,
  assignInquiry,
  reassignInquiry, // NEW: Export the reassign function
  markConversationOpened,
  markConversationResponded,
  deleteConversation,
  countAllInquiries,
  countAgentResponses,
  getAgentClientConversation,
};

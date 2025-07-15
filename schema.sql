-- Drop existing tables to avoid "already exists" errors
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS legal_documents CASCADE;
DROP TABLE IF EXISTS client_interactions CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS property_listings CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS finance_overview CASCADE;
DROP TABLE IF EXISTS staff_directory CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE; -- Drop inquiries table first as its structure is changing
DROP TABLE IF EXISTS agent_clients CASCADE;
DROP TABLE IF EXISTS client_property_preferences CASCADE;
DROP TABLE IF EXISTS agent_recommended_listings CASCADE;
DROP TABLE IF EXISTS archived_clients CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS property_details CASCADE;
DROP TABLE IF EXISTS user_favourites CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS agent_settings CASCADE;
DROP TABLE IF EXISTS client_settings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_login_history CASCADE;
-- NEW: Drop the agent_client_requests table and the ENUM type if they exist
DROP TABLE IF EXISTS agent_client_requests CASCADE;
DROP TYPE IF EXISTS request_status;

-- Users table to manage all user roles
-- Main Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'client', -- 'client', 'agent', 'admin'
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    agency VARCHAR(255), -- Relevant for 'agent' role
    bio TEXT,
    location VARCHAR(100),
    profile_picture_url TEXT, -- URL to the profile picture
    profile_picture_public_id VARCHAR(255), -- NEW: Cloudinary public ID for profile picture
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'deactivated', banned
    reset_token VARCHAR(255), -- For password reset functionality
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMPTZ, -- NEW: Added last_login column

    -- Security Settings (from Security.js)
    is_2fa_enabled BOOLEAN DEFAULT FALSE,

    -- Privacy Settings (from Privacy.js)
    data_collection_opt_out BOOLEAN DEFAULT FALSE,
    personalized_ads BOOLEAN DEFAULT TRUE,
    cookie_preferences JSONB DEFAULT '{ "essential": true, "analytics": true, "marketing": true, "functional": true }'::jsonb, -- Stores { essential: bool, analytics: bool, marketing: bool, functional: bool }
    communication_email_updates BOOLEAN DEFAULT TRUE,
    communication_marketing BOOLEAN DEFAULT TRUE,
    communication_newsletter BOOLEAN DEFAULT FALSE,
    share_favourites_with_agents BOOLEAN DEFAULT FALSE, -- NEW: Added for client control over favourite sharing
    share_property_preferences_with_agents BOOLEAN DEFAULT FALSE, -- NEW: Added for client control over property preference sharing

    -- General/App Settings (from Settings.js)
    notifications_settings JSONB DEFAULT '{ "email_alerts": true, "push_notifications": true, "in_app_messages": true }'::jsonb, -- Stores { email_alerts: bool, push_notifications: bool, in_app_messages: true }
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos', -- Set to Nigeria's timezone
    currency VARCHAR(10) DEFAULT 'NGN', -- Set to Nigerian Naira
    default_landing_page VARCHAR(255) DEFAULT '/dashboard',
    notification_email VARCHAR(100), -- User's preferred email for notifications, can differ from login email
    preferred_communication_channel VARCHAR(20) DEFAULT 'email', -- 'email', 'sms', 'in-app'

    -- Social Links (from General.js) - Stored as JSONB array of objects
    -- Example: [{"platform": "LinkedIn", "url": "https://linkedin.com/in/user"}, {"platform": "Twitter", "https://twitter.com/user"}]
    social_links JSONB DEFAULT '[]'::jsonb,

    -- Constraints
    CONSTRAINT valid_role CHECK (role IN ('client', 'agent', 'admin')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'deactivated'))
);

-- Table for User Active Sessions (from Security.js)
-- This table tracks each active login session for a user.
CREATE TABLE user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device VARCHAR(255), -- e.g., 'Chrome on Windows 10', 'Safari on iPhone'
    location VARCHAR(100), -- e.g., 'Lagos, Nigeria'
    ip_address VARCHAR(45), -- Supports IPv4 (e.g., 192.168.1.1) and IPv6
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE, -- Indicates if this is the currently logged-in session (for client-side display)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for User Login History (from Security.js)
-- This table logs all login attempts, successful or failed.
CREATE TABLE user_login_history (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device VARCHAR(255),
    location VARCHAR(100),
    ip_address VARCHAR(45),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Success', 'Failed')),
    message TEXT -- Optional: e.g., 'Invalid password', 'Account locked'
);


-- Staff directory for agents and admin users
CREATE TABLE staff_directory (
    employee_id INT PRIMARY KEY,
    full_name VARCHAR(100),
	role VARCHAR(100),
    department VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    start_date DATE,
    status VARCHAR(20),
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE
);

-- Agent performance linked to user_id
CREATE TABLE agent_performance (
    user_id INT PRIMARY KEY REFERENCES users(user_id),
    full_name VARCHAR(100),
    deals_closed INT,
    revenue BIGINT,
    avg_rating NUMERIC(2,1),
    properties_assigned INT,
    client_feedback TEXT,
    region VARCHAR(50),
    commission_earned BIGINT
);

-- Finance overview table
CREATE TABLE finance_overview (
    month VARCHAR(20) PRIMARY KEY,
    revenue BIGINT,
    expenses BIGINT,
    net_profit BIGINT
);

-- Property listings, now referencing users.user_id as agent_id
CREATE TABLE property_listings (
    property_id SERIAL PRIMARY KEY,
    purchase_category VARCHAR(50),
    title VARCHAR(100),
    location VARCHAR(100),
    state VARCHAR(100),
    price BIGINT,
    status VARCHAR(50),
    agent_id INT REFERENCES users(user_id),
    date_listed DATE,
    property_type VARCHAR(50),
    bedrooms INT,
    bathrooms INT,
    image_url TEXT,
    image_public_id VARCHAR(255) -- NEW: Cloudinary public ID for the main listing image
);

-- Property images, linked to listings
CREATE TABLE property_images (
    image_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property_listings(property_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    public_id VARCHAR(255) -- NEW: Cloudinary public ID for gallery images
);

CREATE TABLE user_favourites (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT REFERENCES property_listings(property_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, property_id)
);

-- Client interactions, also referencing users.user_id for agent
CREATE TABLE client_interactions (
    interaction_id SERIAL PRIMARY KEY,
    client_name VARCHAR(100),
    email VARCHAR(50),
    interaction_type VARCHAR(50),
    interaction_date DATE,
    notes TEXT,
    agent_id INT REFERENCES users(user_id),
    follow_up_date DATE
);

-- Legal documents for listings
CREATE TABLE legal_documents (
    document_id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    client_name VARCHAR(100),
    property_id INT REFERENCES property_listings(property_id),
    document_type VARCHAR(50),
    status VARCHAR(50),
    upload_date DATE,
    completion_date DATE,
    document_url TEXT, -- ADDED: Column to store the Cloudinary URL of the document
    public_id VARCHAR(255) -- ADDED: Column to store the Cloudinary public ID for deletion
);

-- Support tickets
CREATE TABLE support_tickets (
    ticket_id SERIAL PRIMARY KEY,
    issue VARCHAR(100),
    status VARCHAR(20),
    assigned_to VARCHAR(50),
    date_logged DATE
);

-- Modified inquiries table for conversational support
CREATE TABLE inquiries (
    inquiry_id SERIAL PRIMARY KEY, -- Unique ID for each message
    conversation_id UUID DEFAULT gen_random_uuid(), -- Unique ID for the conversation thread
    client_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- Can be NULL if from guest, or when agent replies
    agent_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- Can be NULL if not yet assigned, or when client initiates without agent
    property_id INT REFERENCES property_listings(property_id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- ID of the user who sent this message (client or agent) - NOW NULLABLE
    recipient_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- ID of the user who is the intended recipient
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'initial_inquiry', -- 'initial_inquiry', 'client_reply', 'agent_reply'
    status TEXT DEFAULT 'new' NOT NULL, -- 'new', 'assigned', 'open', 'resolved', 'deleted'
    read_by_client BOOLEAN DEFAULT FALSE,
    read_by_agent BOOLEAN DEFAULT FALSE,
	is_agent_responded BOOLEAN DEFAULT FALSE,
	is_opened BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),   -- Added column for guest name
    email VARCHAR(100),  -- Added column for guest email
    phone VARCHAR(20),   -- Added column for guest phone
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
	hidden_from_client BOOLEAN DEFAULT FALSE,
	hidden_from_agent BOOLEAN DEFAULT FALSE
);

-- Add new indexes for faster lookups
CREATE INDEX idx_inquiries_conversation_id ON inquiries (conversation_id);
CREATE INDEX idx_inquiries_client_id ON inquiries (client_id);
CREATE INDEX idx_inquiries_agent_id ON inquiries (agent_id);
CREATE INDEX idx_inquiries_status ON inquiries (status);
CREATE INDEX idx_inquiries_sender_id ON inquiries (sender_id);
CREATE INDEX idx_inquiries_recipient_id ON inquiries (recipient_id);

-- Create a trigger function to update updated_at on every row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- NEW ENUM Type for Request Status
-- This block ensures the type is created only if it doesn't already exist.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
    END IF;
END $$;

-- New table to relate agents with their clients
-- The 'request_status' type is now guaranteed to exist from the block above.
CREATE TABLE agent_clients (
    agent_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    client_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    relationship_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT '',
    status VARCHAR(20),  -- Client type: 'vip', 'regular'
    request_status request_status DEFAULT 'accepted' NOT NULL,  -- Relationship approval state
    PRIMARY KEY (agent_id, client_id)
);


-- NEW: Table for Agent-Client Connection Requests
CREATE TABLE agent_client_requests (
    request_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL, -- 'client' or 'agent'
    receiver_role VARCHAR(50) NOT NULL, -- 'client' or 'agent'
    status request_status DEFAULT 'pending' NOT NULL, -- 'pending', 'accepted', 'rejected'
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_request UNIQUE (sender_id, receiver_id) -- Ensures only one unique request exists between a sender and receiver
);

-- Add indexes for faster lookup of requests for a user
CREATE INDEX idx_acr_receiver_id ON agent_client_requests (receiver_id);
CREATE INDEX idx_acr_sender_id ON agent_client_requests (sender_id);


CREATE TABLE IF NOT EXISTS client_property_preferences (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    preferred_property_type VARCHAR(50) DEFAULT 'any',
    preferred_location TEXT DEFAULT 'any', -- Renamed from preferred_location to be consistent with ClientProfile.js
    min_price BIGINT DEFAULT 0,
    max_price BIGINT DEFAULT 1000000000,
    min_bedrooms INT DEFAULT 0, -- NEW: Added min_bedrooms
    min_bathrooms INT DEFAULT 0, -- NEW: Added min_bathrooms
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Corrected from TIMESTANDARD to TIMESTAMPTZ
);

-- Create a new table for agent-recommended listings for specific clients
-- This allows agents to curate a list of properties for each client.
CREATE TABLE IF NOT EXISTS agent_recommended_listings (
    agent_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    client_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES property_listings(property_id) ON DELETE CASCADE,
    recommended_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (agent_id, client_id, property_id)
);

CREATE TABLE archived_clients (
  agent_id INT REFERENCES users(user_id),
  client_id INT REFERENCES users(user_id),
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'regular' NOT NULL, -- Changed to VARCHAR(20)
  request_status request_status DEFAULT 'rejected' NOT NULL, -- Added request_status column to archived_clients
  PRIMARY KEY (agent_id, client_id)
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,                  -- what happened
  actor_name TEXT NOT NULL,              -- who did it (e.g. "agent: John Doe")
  user_id INT REFERENCES users(user_id), -- relational link to user
  type VARCHAR(50),                      -- optional: listing, inquiry, agent, etc.
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- New table for detailed property information
CREATE TABLE property_details (
    property_details_id SERIAL PRIMARY KEY,
    property_id INT UNIQUE REFERENCES property_listings(property_id) ON DELETE CASCADE,
    description TEXT,
    square_footage INT,
    lot_size NUMERIC(10,2), -- Example: 10 digits total, 2 after decimal for acres/sqft
    year_built INT,
    heating_type VARCHAR(50),
    cooling_type VARCHAR(50),
    parking VARCHAR(100),
    amenities TEXT, -- Can store a comma-separated list of amenities
    land_size NUMERIC(10,2), -- NEW: For land properties (e.g., in acres or sqft)
    zoning_type VARCHAR(50), -- NEW: For land properties (e.g., Residential, Commercial)
    title_type VARCHAR(50), -- NEW: For land properties (e.g., C of O, Gazette, Deed)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table for Admin Settings (remains global)
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY, -- Will likely only have one row with ID = 1
    default_list_view VARCHAR(50) DEFAULT 'simple',
    sidebar_permanently_expanded BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    sender_email VARCHAR(255) DEFAULT 'admin@example.com',
    smtp_host VARCHAR(255) DEFAULT 'smtp.example.com',
    require_2fa BOOLEAN DEFAULT FALSE,
    min_password_length INTEGER DEFAULT 8,
    crm_integration_enabled BOOLEAN DEFAULT FALSE,
    analytics_id VARCHAR(255) DEFAULT '',
    auto_approve_listings BOOLEAN DEFAULT FALSE,
    enable_comments BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    database_backup_scheduled BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial default settings if the table is empty
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- New table for Agent Settings (personalized for each agent)
CREATE TABLE agent_settings (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    new_inquiry_alert BOOLEAN DEFAULT TRUE,
    ticket_update_alert BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    default_signature TEXT,
    auto_assign_inquiries BOOLEAN DEFAULT FALSE,
    theme VARCHAR(50) DEFAULT 'system', -- Personalized display setting
    default_list_view VARCHAR(50) DEFAULT 'simple', -- Personalized display setting
    sidebar_permanently_expanded BOOLEAN DEFAULT FALSE, -- Personalized display setting
    language VARCHAR(10) DEFAULT 'en', -- Personalized display setting
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- New table for Client Settings (personalized for each client)
CREATE TABLE client_settings (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    new_listing_alert BOOLEAN DEFAULT TRUE,
    price_drop_alert BOOLEAN DEFAULT TRUE,
    favourite_update_alert BOOLEAN DEFAULT TRUE,
    preferred_property_type VARCHAR(50) DEFAULT 'any',
    preferred_location TEXT DEFAULT 'any',
    max_price_alert BIGINT DEFAULT 100000000,
    theme VARCHAR(50) DEFAULT 'system',
    default_list_view VARCHAR(50) DEFAULT 'graphical', -- Clients might prefer grid view by default
    language VARCHAR(10) DEFAULT 'en',
    sidebar_permanently_expanded BOOLEAN DEFAULT FALSE, -- New: Personalized sidebar setting for clients
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Corrected from TIMESTANDARD to TIMESTAMPTZ
);

-- Reset the sequence for the users table after all table creations
-- This ensures that the next generated user_id is always greater than any existing user_id
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users), false);
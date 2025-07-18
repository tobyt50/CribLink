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
DROP TABLE IF EXISTS inquiries CASCADE;
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
DROP TABLE IF EXISTS agent_client_requests CASCADE;
DROP TYPE IF EXISTS request_status; -- Drop the ENUM type if it exists

-- NEW: Drop agency-related tables if they exist
DROP TABLE IF EXISTS agency_members CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- Define ENUM for request_status
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Agencies Table
CREATE TABLE agencies (
    agency_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    website TEXT,
    logo_url TEXT,
    logo_public_id VARCHAR(255),
    description TEXT,
    agency_admin_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Users table to manage all user roles
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin', 'agency_admin')),
    agency_id INT REFERENCES agencies(agency_id) ON DELETE SET NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    agency VARCHAR(255),
    bio TEXT,
    location VARCHAR(100),
    profile_picture_url TEXT,
    profile_picture_public_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMPTZ,
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    data_collection_opt_out BOOLEAN DEFAULT FALSE,
    personalized_ads BOOLEAN DEFAULT TRUE,
    cookie_preferences JSONB DEFAULT '{ "essential": true, "analytics": true, "marketing": true, "functional": true }'::jsonb,
    communication_email_updates BOOLEAN DEFAULT TRUE,
    communication_marketing BOOLEAN DEFAULT TRUE,
    communication_newsletter BOOLEAN DEFAULT FALSE,
    share_favourites_with_agents BOOLEAN DEFAULT FALSE,
    share_property_preferences_with_agents BOOLEAN DEFAULT FALSE,
    notifications_settings JSONB DEFAULT '{ "email_alerts": true, "push_notifications": true, "in_app_messages": true }'::jsonb,
    timezone VARCHAR(50) DEFAULT 'Africa/Lagos',
    currency VARCHAR(10) DEFAULT 'NGN',
    default_landing_page VARCHAR(255) DEFAULT '/dashboard',
    notification_email VARCHAR(100),
    preferred_communication_channel VARCHAR(20) DEFAULT 'email',
    social_links JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Agency Members Table
CREATE TABLE agency_members (
    agency_member_id SERIAL PRIMARY KEY,
    agency_id INT REFERENCES agencies(agency_id) ON DELETE CASCADE,
    agent_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'agent')),
    request_status request_status DEFAULT 'pending',
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    message TEXT,
    member_status VARCHAR(50) DEFAULT 'regular' NOT NULL,
    UNIQUE (agency_id, agent_id)
);

-- Table for User Active Sessions
CREATE TABLE user_sessions (
    session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device VARCHAR(255),
    location VARCHAR(100),
    ip_address VARCHAR(45),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for User Login History
CREATE TABLE user_login_history (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device VARCHAR(255),
    location VARCHAR(100),
    ip_address VARCHAR(45),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Success', 'Failed')),
    message TEXT
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

-- Property listings, now referencing users.user_id as agent_id and agency_id
CREATE TABLE property_listings (
    property_id SERIAL PRIMARY KEY,
    purchase_category VARCHAR(50),
    title VARCHAR(100),
    location VARCHAR(100),
    state VARCHAR(100),
    price BIGINT,
    status VARCHAR(50),
    agent_id INT REFERENCES users(user_id),
    agency_id INT REFERENCES agencies(agency_id) ON DELETE SET NULL,
    date_listed DATE,
    property_type VARCHAR(50),
    bedrooms INT,
    bathrooms INT,
    image_url TEXT,
    image_public_id VARCHAR(255)
);

-- Property images, linked to listings
CREATE TABLE property_images (
    image_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property_listings(property_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    public_id VARCHAR(255)
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
    document_url TEXT,
    public_id VARCHAR(255)
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
    inquiry_id SERIAL PRIMARY KEY,
    conversation_id UUID DEFAULT gen_random_uuid(),
    client_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    agent_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    property_id INT REFERENCES property_listings(property_id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    recipient_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'initial_inquiry',
    status TEXT DEFAULT 'new' NOT NULL,
    read_by_client BOOLEAN DEFAULT FALSE,
    read_by_agent BOOLEAN DEFAULT FALSE,
	is_agent_responded BOOLEAN DEFAULT FALSE,
	is_opened BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
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

-- Create the trigger for inquiries
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- New table to relate agents with their clients
CREATE TABLE agent_clients (
    agent_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    client_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    relationship_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT '',
    status VARCHAR(20),
    request_status request_status DEFAULT 'accepted' NOT NULL,
    PRIMARY KEY (agent_id, client_id)
);

-- Table for Agent-Client Connection Requests
CREATE TABLE agent_client_requests (
    request_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL,
    receiver_role VARCHAR(50) NOT NULL,
    status request_status DEFAULT 'pending' NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_request UNIQUE (sender_id, receiver_id)
);

-- Add indexes for faster lookup of requests for a user
CREATE INDEX idx_acr_receiver_id ON agent_client_requests (receiver_id);
CREATE INDEX idx_acr_sender_id ON agent_client_requests (sender_id);

CREATE TABLE client_property_preferences (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    preferred_property_type VARCHAR(50) DEFAULT 'any',
    preferred_location TEXT DEFAULT 'any',
    min_price BIGINT DEFAULT 0,
    max_price BIGINT DEFAULT 1000000000,
    min_bedrooms INT DEFAULT 0,
    min_bathrooms INT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create a new table for agent-recommended listings for specific clients
CREATE TABLE agent_recommended_listings (
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
  status VARCHAR(20) DEFAULT 'regular' NOT NULL,
  request_status request_status DEFAULT 'rejected' NOT NULL,
  PRIMARY KEY (agent_id, client_id)
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  user_id INT REFERENCES users(user_id),
  type VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- New table for detailed property information
CREATE TABLE property_details (
    property_details_id SERIAL PRIMARY KEY,
    property_id INT UNIQUE REFERENCES property_listings(property_id) ON DELETE CASCADE,
    description TEXT,
    square_footage INT,
    lot_size NUMERIC(10,2),
    year_built INT,
    heating_type VARCHAR(50),
    cooling_type VARCHAR(50),
    parking VARCHAR(100),
    amenities TEXT,
    land_size NUMERIC(10,2),
    zoning_type VARCHAR(50),
    title_type VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table for Admin Settings (remains global)
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
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
    theme VARCHAR(50) DEFAULT 'system',
    default_list_view VARCHAR(50) DEFAULT 'simple',
    sidebar_permanently_expanded BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
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
    default_list_view VARCHAR(50) DEFAULT 'graphical',
    language VARCHAR(10) DEFAULT 'en',
    sidebar_permanently_expanded BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reset the sequence for the users table after all table creations
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users), false);

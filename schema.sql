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
DROP TABLE IF EXISTS archived_clients CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS property_details CASCADE;

-- Users table to manage all user roles
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'client',
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    agency VARCHAR(255),
    bio TEXT, -- New column for bio
    location VARCHAR(100), -- New column for location
<<<<<<< HEAD
	profile_picture_url TEXT,
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
    CONSTRAINT valid_role CHECK (role IN ('client', 'agent', 'admin')),
    status VARCHAR(20) DEFAULT 'active',
	reset_token VARCHAR(255),
	reset_token_expires TIMESTAMP WITH TIME ZONE
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
    image_url TEXT
);

-- Property images, linked to listings
CREATE TABLE property_images (
    image_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property_listings(property_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
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
    completion_date DATE
);

-- Support tickets
CREATE TABLE support_tickets (
    ticket_id SERIAL PRIMARY KEY,
    issue VARCHAR(100),
    status VARCHAR(20),
    assigned_to VARCHAR(50),
    date_logged DATE
);

CREATE TABLE inquiries (
  inquiry_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  assigned_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table to relate agents with their clients

CREATE TABLE agent_clients (
    agent_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    client_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    relationship_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT '',
    status VARCHAR(20),
    PRIMARY KEY (agent_id, client_id)
);

CREATE TABLE archived_clients (
  agent_id INT REFERENCES users(user_id),
  client_id INT REFERENCES users(user_id),
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(20),
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
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reset the sequence for the users table after all table creations
-- This ensures that the next generated user_id is always greater than any existing user_id
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users), false);

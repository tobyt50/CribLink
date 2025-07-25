--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


ALTER TYPE public.request_status OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    message text NOT NULL,
    actor_name text NOT NULL,
    user_id integer,
    type character varying(50),
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_settings (
    id integer NOT NULL,
    default_list_view character varying(50) DEFAULT 'simple'::character varying,
    sidebar_permanently_expanded boolean DEFAULT false,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    in_app_notifications boolean DEFAULT true,
    sender_email character varying(255) DEFAULT 'admin@example.com'::character varying,
    smtp_host character varying(255) DEFAULT 'smtp.example.com'::character varying,
    require_2fa boolean DEFAULT false,
    min_password_length integer DEFAULT 8,
    crm_integration_enabled boolean DEFAULT false,
    analytics_id character varying(255) DEFAULT ''::character varying,
    auto_approve_listings boolean DEFAULT false,
    enable_comments boolean DEFAULT true,
    maintenance_mode boolean DEFAULT false,
    database_backup_scheduled boolean DEFAULT false,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_settings OWNER TO postgres;

--
-- Name: admin_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_settings_id_seq OWNER TO postgres;

--
-- Name: admin_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_settings_id_seq OWNED BY public.admin_settings.id;


--
-- Name: agencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agencies (
    agency_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    website text,
    logo_url text,
    logo_public_id character varying(255),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    agency_admin_id integer,
    address character varying(255)
);


ALTER TABLE public.agencies OWNER TO postgres;

--
-- Name: agencies_agency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agencies_agency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agencies_agency_id_seq OWNER TO postgres;

--
-- Name: agencies_agency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agencies_agency_id_seq OWNED BY public.agencies.agency_id;


--
-- Name: agency_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agency_members (
    agency_id integer NOT NULL,
    agent_id integer NOT NULL,
    role character varying(50) NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    agency_member_id integer NOT NULL,
    request_status public.request_status DEFAULT 'pending'::public.request_status,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    message text,
    member_status character varying(50) DEFAULT 'regular'::character varying NOT NULL,
    CONSTRAINT agency_members_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('agent'::character varying)::text])))
);


ALTER TABLE public.agency_members OWNER TO postgres;

--
-- Name: agency_members_agency_member_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agency_members_agency_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agency_members_agency_member_id_seq OWNER TO postgres;

--
-- Name: agency_members_agency_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agency_members_agency_member_id_seq OWNED BY public.agency_members.agency_member_id;


--
-- Name: agent_client_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_client_requests (
    request_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    sender_role character varying(50) NOT NULL,
    receiver_role character varying(50) NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agent_client_requests OWNER TO postgres;

--
-- Name: agent_client_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agent_client_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_client_requests_request_id_seq OWNER TO postgres;

--
-- Name: agent_client_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_client_requests_request_id_seq OWNED BY public.agent_client_requests.request_id;


--
-- Name: agent_clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_clients (
    agent_id integer NOT NULL,
    client_id integer NOT NULL,
    relationship_started timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text DEFAULT ''::text,
    status character varying(20),
    request_status public.request_status DEFAULT 'accepted'::public.request_status NOT NULL
);


ALTER TABLE public.agent_clients OWNER TO postgres;

--
-- Name: agent_performance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_performance (
    user_id integer NOT NULL,
    full_name character varying(100),
    deals_closed integer,
    revenue bigint,
    avg_rating numeric(2,1),
    properties_assigned integer,
    client_feedback text,
    region character varying(50),
    commission_earned bigint
);


ALTER TABLE public.agent_performance OWNER TO postgres;

--
-- Name: agent_recommended_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_recommended_listings (
    agent_id integer NOT NULL,
    client_id integer NOT NULL,
    property_id integer NOT NULL,
    recommended_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_recommended_listings OWNER TO postgres;

--
-- Name: agent_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_settings (
    user_id integer NOT NULL,
    two_factor_enabled boolean DEFAULT false,
    email_notifications boolean DEFAULT true,
    in_app_notifications boolean DEFAULT true,
    new_inquiry_alert boolean DEFAULT true,
    ticket_update_alert boolean DEFAULT true,
    is_available boolean DEFAULT true,
    default_signature text,
    auto_assign_inquiries boolean DEFAULT false,
    theme character varying(50) DEFAULT 'system'::character varying,
    default_list_view character varying(50) DEFAULT 'simple'::character varying,
    sidebar_permanently_expanded boolean DEFAULT false,
    language character varying(10) DEFAULT 'en'::character varying,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agent_settings OWNER TO postgres;

--
-- Name: archived_clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.archived_clients (
    agent_id integer NOT NULL,
    client_id integer NOT NULL,
    archived_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    status character varying(20) DEFAULT 'regular'::character varying NOT NULL,
    request_status public.request_status DEFAULT 'rejected'::public.request_status NOT NULL
);


ALTER TABLE public.archived_clients OWNER TO postgres;

--
-- Name: client_interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_interactions (
    interaction_id integer NOT NULL,
    client_name character varying(100),
    email character varying(50),
    interaction_type character varying(50),
    interaction_date date,
    notes text,
    agent_id integer,
    follow_up_date date
);


ALTER TABLE public.client_interactions OWNER TO postgres;

--
-- Name: client_interactions_interaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_interactions_interaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_interactions_interaction_id_seq OWNER TO postgres;

--
-- Name: client_interactions_interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_interactions_interaction_id_seq OWNED BY public.client_interactions.interaction_id;


--
-- Name: client_property_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_property_preferences (
    user_id integer NOT NULL,
    preferred_property_type character varying(50) DEFAULT 'any'::character varying,
    preferred_location text DEFAULT 'any'::text,
    min_price bigint DEFAULT 0,
    max_price bigint DEFAULT 1000000000,
    min_bedrooms integer DEFAULT 0,
    min_bathrooms integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.client_property_preferences OWNER TO postgres;

--
-- Name: client_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_settings (
    user_id integer NOT NULL,
    email_notifications boolean DEFAULT true,
    in_app_notifications boolean DEFAULT true,
    new_listing_alert boolean DEFAULT true,
    price_drop_alert boolean DEFAULT true,
    favourite_update_alert boolean DEFAULT true,
    preferred_property_type character varying(50) DEFAULT 'any'::character varying,
    preferred_location text DEFAULT 'any'::text,
    max_price_alert bigint DEFAULT 100000000,
    theme character varying(50) DEFAULT 'system'::character varying,
    default_list_view character varying(50) DEFAULT 'graphical'::character varying,
    language character varying(10) DEFAULT 'en'::character varying,
    sidebar_permanently_expanded boolean DEFAULT false,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.client_settings OWNER TO postgres;

--
-- Name: finance_overview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finance_overview (
    month character varying(20) NOT NULL,
    revenue bigint,
    expenses bigint,
    net_profit bigint
);


ALTER TABLE public.finance_overview OWNER TO postgres;

--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inquiries (
    inquiry_id integer NOT NULL,
    conversation_id uuid DEFAULT gen_random_uuid(),
    client_id integer,
    agent_id integer,
    property_id integer,
    sender_id integer,
    recipient_id integer,
    message_content text NOT NULL,
    message_type character varying(20) DEFAULT 'initial_inquiry'::character varying NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    read_by_client boolean DEFAULT false,
    read_by_agent boolean DEFAULT false,
    is_agent_responded boolean DEFAULT false,
    is_opened boolean DEFAULT false,
    name character varying(100),
    email character varying(100),
    phone character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    hidden_from_client boolean DEFAULT false,
    hidden_from_agent boolean DEFAULT false,
    original_agent_id integer,
    reassigned_by_admin_id integer,
    reassigned_at timestamp with time zone
);


ALTER TABLE public.inquiries OWNER TO postgres;

--
-- Name: inquiries_inquiry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inquiries_inquiry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiries_inquiry_id_seq OWNER TO postgres;

--
-- Name: inquiries_inquiry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inquiries_inquiry_id_seq OWNED BY public.inquiries.inquiry_id;


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.legal_documents (
    document_id integer NOT NULL,
    title character varying(100),
    client_name character varying(100),
    property_id integer,
    document_type character varying(50),
    status character varying(50),
    upload_date date,
    completion_date date,
    document_url text,
    public_id character varying(255)
);


ALTER TABLE public.legal_documents OWNER TO postgres;

--
-- Name: legal_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.legal_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.legal_documents_document_id_seq OWNER TO postgres;

--
-- Name: legal_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.legal_documents_document_id_seq OWNED BY public.legal_documents.document_id;


--
-- Name: property_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_details (
    property_details_id integer NOT NULL,
    property_id integer,
    description text,
    square_footage integer,
    lot_size numeric(10,2),
    year_built integer,
    heating_type character varying(50),
    cooling_type character varying(50),
    parking character varying(100),
    amenities text,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    land_size numeric,
    zoning_type character varying(50),
    title_type character varying(50)
);


ALTER TABLE public.property_details OWNER TO postgres;

--
-- Name: property_details_property_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.property_details_property_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.property_details_property_details_id_seq OWNER TO postgres;

--
-- Name: property_details_property_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.property_details_property_details_id_seq OWNED BY public.property_details.property_details_id;


--
-- Name: property_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_images (
    image_id integer NOT NULL,
    property_id integer,
    image_url text NOT NULL,
    public_id character varying(255)
);


ALTER TABLE public.property_images OWNER TO postgres;

--
-- Name: property_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.property_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.property_images_image_id_seq OWNER TO postgres;

--
-- Name: property_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.property_images_image_id_seq OWNED BY public.property_images.image_id;


--
-- Name: property_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_listings (
    property_id integer NOT NULL,
    purchase_category character varying(50),
    title character varying(100),
    location character varying(100),
    state character varying(100),
    price bigint,
    status character varying(50),
    agent_id integer,
    date_listed date,
    property_type character varying(50),
    bedrooms integer,
    bathrooms integer,
    image_url text,
    image_public_id character varying(255),
    agency_id integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.property_listings OWNER TO postgres;

--
-- Name: property_listings_property_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.property_listings_property_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.property_listings_property_id_seq OWNER TO postgres;

--
-- Name: property_listings_property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.property_listings_property_id_seq OWNED BY public.property_listings.property_id;


--
-- Name: revoked_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revoked_sessions (
    session_id uuid NOT NULL,
    revocation_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.revoked_sessions OWNER TO postgres;

--
-- Name: staff_directory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_directory (
    employee_id integer NOT NULL,
    full_name character varying(100),
    role character varying(100),
    department character varying(50),
    email character varying(100),
    phone character varying(20),
    start_date date,
    status character varying(20),
    user_id integer
);


ALTER TABLE public.staff_directory OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    ticket_id integer NOT NULL,
    issue character varying(100),
    status character varying(20),
    assigned_to character varying(50),
    date_logged date
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: support_tickets_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_tickets_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_tickets_ticket_id_seq OWNER TO postgres;

--
-- Name: support_tickets_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_tickets_ticket_id_seq OWNED BY public.support_tickets.ticket_id;


--
-- Name: user_favourites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favourites (
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_favourites OWNER TO postgres;

--
-- Name: user_login_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_login_history (
    history_id integer NOT NULL,
    user_id integer,
    device character varying(255),
    location character varying(100),
    ip_address character varying(45),
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) NOT NULL,
    message text,
    CONSTRAINT user_login_history_status_check CHECK (((status)::text = ANY (ARRAY[('Success'::character varying)::text, ('Failed'::character varying)::text])))
);


ALTER TABLE public.user_login_history OWNER TO postgres;

--
-- Name: user_login_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_login_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_login_history_history_id_seq OWNER TO postgres;

--
-- Name: user_login_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_login_history_history_id_seq OWNED BY public.user_login_history.history_id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    user_id integer NOT NULL,
    device character varying(255),
    location character varying(100),
    ip_address character varying(45),
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_current boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    login_time timestamp with time zone DEFAULT now(),
    status character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    username character varying(50),
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'client'::character varying,
    date_joined timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(20),
    agency character varying(255),
    bio text,
    location character varying(100),
    profile_picture_url text,
    status character varying(20) DEFAULT 'active'::character varying,
    reset_token character varying(255),
    reset_token_expires timestamp with time zone,
    last_login timestamp with time zone,
    is_2fa_enabled boolean DEFAULT false,
    data_collection_opt_out boolean DEFAULT false,
    personalized_ads boolean DEFAULT true,
    cookie_preferences jsonb DEFAULT '{"analytics": true, "essential": true, "marketing": true, "functional": true}'::jsonb,
    communication_email_updates boolean DEFAULT true,
    communication_marketing boolean DEFAULT true,
    communication_newsletter boolean DEFAULT false,
    share_favourites_with_agents boolean DEFAULT false,
    share_property_preferences_with_agents boolean DEFAULT false,
    notifications_settings jsonb DEFAULT '{"email_alerts": true, "in_app_messages": true, "push_notifications": true}'::jsonb,
    timezone character varying(50) DEFAULT 'Africa/Lagos'::character varying,
    currency character varying(10) DEFAULT 'NGN'::character varying,
    default_landing_page character varying(255) DEFAULT '/dashboard'::character varying,
    notification_email character varying(100),
    preferred_communication_channel character varying(20) DEFAULT 'email'::character varying,
    social_links jsonb DEFAULT '[]'::jsonb,
    profile_picture_public_id character varying(255),
    agency_id integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (((role)::text = ANY (ARRAY[('client'::character varying)::text, ('agent'::character varying)::text, ('admin'::character varying)::text, ('agency_admin'::character varying)::text]))),
    CONSTRAINT valid_status CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('deactivated'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: admin_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings ALTER COLUMN id SET DEFAULT nextval('public.admin_settings_id_seq'::regclass);


--
-- Name: agencies agency_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies ALTER COLUMN agency_id SET DEFAULT nextval('public.agencies_agency_id_seq'::regclass);


--
-- Name: agency_members agency_member_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_members ALTER COLUMN agency_member_id SET DEFAULT nextval('public.agency_members_agency_member_id_seq'::regclass);


--
-- Name: agent_client_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests ALTER COLUMN request_id SET DEFAULT nextval('public.agent_client_requests_request_id_seq'::regclass);


--
-- Name: client_interactions interaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_interactions ALTER COLUMN interaction_id SET DEFAULT nextval('public.client_interactions_interaction_id_seq'::regclass);


--
-- Name: inquiries inquiry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN inquiry_id SET DEFAULT nextval('public.inquiries_inquiry_id_seq'::regclass);


--
-- Name: legal_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents ALTER COLUMN document_id SET DEFAULT nextval('public.legal_documents_document_id_seq'::regclass);


--
-- Name: property_details property_details_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details ALTER COLUMN property_details_id SET DEFAULT nextval('public.property_details_property_details_id_seq'::regclass);


--
-- Name: property_images image_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_images ALTER COLUMN image_id SET DEFAULT nextval('public.property_images_image_id_seq'::regclass);


--
-- Name: property_listings property_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings ALTER COLUMN property_id SET DEFAULT nextval('public.property_listings_property_id_seq'::regclass);


--
-- Name: support_tickets ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN ticket_id SET DEFAULT nextval('public.support_tickets_ticket_id_seq'::regclass);


--
-- Name: user_login_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_history ALTER COLUMN history_id SET DEFAULT nextval('public.user_login_history_history_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: agencies agencies_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_email_key UNIQUE (email);


--
-- Name: agencies agencies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_name_key UNIQUE (name);


--
-- Name: agencies agencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_pkey PRIMARY KEY (agency_id);


--
-- Name: agency_members agency_members_agency_id_agent_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agency_id_agent_id_key UNIQUE (agency_id, agent_id);


--
-- Name: agency_members agency_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_pkey PRIMARY KEY (agency_id, agent_id);


--
-- Name: agent_client_requests agent_client_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_pkey PRIMARY KEY (request_id);


--
-- Name: agent_clients agent_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_pkey PRIMARY KEY (agent_id, client_id);


--
-- Name: agent_performance agent_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_pkey PRIMARY KEY (user_id);


--
-- Name: agent_recommended_listings agent_recommended_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_pkey PRIMARY KEY (agent_id, client_id, property_id);


--
-- Name: agent_settings agent_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_settings
    ADD CONSTRAINT agent_settings_pkey PRIMARY KEY (user_id);


--
-- Name: archived_clients archived_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_pkey PRIMARY KEY (agent_id, client_id);


--
-- Name: client_interactions client_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_pkey PRIMARY KEY (interaction_id);


--
-- Name: client_property_preferences client_property_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_property_preferences
    ADD CONSTRAINT client_property_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: client_settings client_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_pkey PRIMARY KEY (user_id);


--
-- Name: finance_overview finance_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_overview
    ADD CONSTRAINT finance_overview_pkey PRIMARY KEY (month);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (inquiry_id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (document_id);


--
-- Name: property_details property_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_pkey PRIMARY KEY (property_details_id);


--
-- Name: property_details property_details_property_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_property_id_key UNIQUE (property_id);


--
-- Name: property_images property_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_pkey PRIMARY KEY (image_id);


--
-- Name: property_listings property_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_pkey PRIMARY KEY (property_id);


--
-- Name: revoked_sessions revoked_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revoked_sessions
    ADD CONSTRAINT revoked_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: staff_directory staff_directory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_pkey PRIMARY KEY (employee_id);


--
-- Name: staff_directory staff_directory_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_user_id_key UNIQUE (user_id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (ticket_id);


--
-- Name: agent_client_requests unique_request; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT unique_request UNIQUE (sender_id, receiver_id);


--
-- Name: user_favourites user_favourites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_pkey PRIMARY KEY (user_id, property_id);


--
-- Name: user_login_history user_login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_history
    ADD CONSTRAINT user_login_history_pkey PRIMARY KEY (history_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_acr_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acr_receiver_id ON public.agent_client_requests USING btree (receiver_id);


--
-- Name: idx_acr_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acr_sender_id ON public.agent_client_requests USING btree (sender_id);


--
-- Name: idx_inquiries_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_agent_id ON public.inquiries USING btree (agent_id);


--
-- Name: idx_inquiries_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_client_id ON public.inquiries USING btree (client_id);


--
-- Name: idx_inquiries_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_conversation_id ON public.inquiries USING btree (conversation_id);


--
-- Name: idx_inquiries_recipient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_recipient_id ON public.inquiries USING btree (recipient_id);


--
-- Name: idx_inquiries_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_sender_id ON public.inquiries USING btree (sender_id);


--
-- Name: idx_inquiries_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_status ON public.inquiries USING btree (status);


--
-- Name: inquiries update_inquiries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: property_listings update_property_listings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_property_listings_updated_at BEFORE UPDATE ON public.property_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: agency_members agency_members_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE CASCADE;


--
-- Name: agency_members agency_members_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_client_requests agent_client_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_client_requests agent_client_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_clients agent_clients_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_clients agent_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_performance agent_performance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: agent_recommended_listings agent_recommended_listings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_recommended_listings agent_recommended_listings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agent_recommended_listings agent_recommended_listings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- Name: agent_settings agent_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_settings
    ADD CONSTRAINT agent_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: archived_clients archived_clients_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- Name: archived_clients archived_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id);


--
-- Name: client_interactions client_interactions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- Name: client_property_preferences client_property_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_property_preferences
    ADD CONSTRAINT client_property_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: client_settings client_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: agencies fk_agency_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT fk_agency_admin FOREIGN KEY (agency_admin_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: property_listings fk_property_listings_agency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT fk_property_listings_agency FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE SET NULL;


--
-- Name: users fk_users_agency; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_agency FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE SET NULL;


--
-- Name: inquiries inquiries_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: inquiries inquiries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: inquiries inquiries_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- Name: inquiries inquiries_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: inquiries inquiries_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: legal_documents legal_documents_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id);


--
-- Name: property_details property_details_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- Name: property_images property_images_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- Name: property_listings property_listings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- Name: staff_directory staff_directory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_favourites user_favourites_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- Name: user_favourites user_favourites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_login_history user_login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_history
    ADD CONSTRAINT user_login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


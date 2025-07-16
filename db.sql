--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-07-17 00:02:07

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
-- TOC entry 6 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 972 (class 1247 OID 246147)
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


--
-- TOC entry 304 (class 1255 OID 123081)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 247 (class 1259 OID 246260)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    message text NOT NULL,
    actor_name text NOT NULL,
    user_id integer,
    type character varying(50),
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- TOC entry 246 (class 1259 OID 246259)
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 246
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 251 (class 1259 OID 246292)
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 250 (class 1259 OID 246291)
-- Name: admin_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 250
-- Name: admin_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_settings_id_seq OWNED BY public.admin_settings.id;


--
-- TOC entry 255 (class 1259 OID 262309)
-- Name: agencies; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 254 (class 1259 OID 262308)
-- Name: agencies_agency_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agencies_agency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 254
-- Name: agencies_agency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agencies_agency_id_seq OWNED BY public.agencies.agency_id;


--
-- TOC entry 256 (class 1259 OID 262321)
-- Name: agency_members; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT agency_members_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'agent'::character varying])::text[])))
);


--
-- TOC entry 257 (class 1259 OID 262357)
-- Name: agency_members_agency_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agency_members_agency_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 257
-- Name: agency_members_agency_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agency_members_agency_member_id_seq OWNED BY public.agency_members.agency_member_id;


--
-- TOC entry 242 (class 1259 OID 246174)
-- Name: agent_client_requests; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 241 (class 1259 OID 246173)
-- Name: agent_client_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_client_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 241
-- Name: agent_client_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_client_requests_request_id_seq OWNED BY public.agent_client_requests.request_id;


--
-- TOC entry 240 (class 1259 OID 246153)
-- Name: agent_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_clients (
    agent_id integer NOT NULL,
    client_id integer NOT NULL,
    relationship_started timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text DEFAULT ''::text,
    status character varying(20),
    request_status public.request_status DEFAULT 'accepted'::public.request_status NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 246000)
-- Name: agent_performance; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 244 (class 1259 OID 246218)
-- Name: agent_recommended_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_recommended_listings (
    agent_id integer NOT NULL,
    client_id integer NOT NULL,
    property_id integer NOT NULL,
    recommended_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 252 (class 1259 OID 246316)
-- Name: agent_settings; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 245 (class 1259 OID 246239)
-- Name: archived_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.archived_clients (
    agent_id integer NOT NULL,
    client_id integer NOT NULL,
    archived_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    status character varying(20) DEFAULT 'regular'::character varying NOT NULL,
    request_status public.request_status DEFAULT 'rejected'::public.request_status NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 246062)
-- Name: client_interactions; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 232 (class 1259 OID 246061)
-- Name: client_interactions_interaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_interactions_interaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 232
-- Name: client_interactions_interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_interactions_interaction_id_seq OWNED BY public.client_interactions.interaction_id;


--
-- TOC entry 243 (class 1259 OID 246199)
-- Name: client_property_preferences; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 253 (class 1259 OID 246340)
-- Name: client_settings; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 226 (class 1259 OID 246012)
-- Name: finance_overview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_overview (
    month character varying(20) NOT NULL,
    revenue bigint,
    expenses bigint,
    net_profit bigint
);


--
-- TOC entry 239 (class 1259 OID 246095)
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
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
    hidden_from_agent boolean DEFAULT false
);


--
-- TOC entry 238 (class 1259 OID 246094)
-- Name: inquiries_inquiry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inquiries_inquiry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 238
-- Name: inquiries_inquiry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inquiries_inquiry_id_seq OWNED BY public.inquiries.inquiry_id;


--
-- TOC entry 235 (class 1259 OID 246076)
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 234 (class 1259 OID 246075)
-- Name: legal_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.legal_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 234
-- Name: legal_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.legal_documents_document_id_seq OWNED BY public.legal_documents.document_id;


--
-- TOC entry 249 (class 1259 OID 246275)
-- Name: property_details; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 248 (class 1259 OID 246274)
-- Name: property_details_property_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_details_property_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 248
-- Name: property_details_property_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_details_property_details_id_seq OWNED BY public.property_details.property_details_id;


--
-- TOC entry 230 (class 1259 OID 246032)
-- Name: property_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_images (
    image_id integer NOT NULL,
    property_id integer,
    image_url text NOT NULL,
    public_id character varying(255)
);


--
-- TOC entry 229 (class 1259 OID 246031)
-- Name: property_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 229
-- Name: property_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_images_image_id_seq OWNED BY public.property_images.image_id;


--
-- TOC entry 228 (class 1259 OID 246018)
-- Name: property_listings; Type: TABLE; Schema: public; Owner: -
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
    agency_id integer
);


--
-- TOC entry 227 (class 1259 OID 246017)
-- Name: property_listings_property_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.property_listings_property_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 227
-- Name: property_listings_property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.property_listings_property_id_seq OWNED BY public.property_listings.property_id;


--
-- TOC entry 224 (class 1259 OID 245988)
-- Name: staff_directory; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 237 (class 1259 OID 246088)
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    ticket_id integer NOT NULL,
    issue character varying(100),
    status character varying(20),
    assigned_to character varying(50),
    date_logged date
);


--
-- TOC entry 236 (class 1259 OID 246087)
-- Name: support_tickets_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.support_tickets_ticket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 236
-- Name: support_tickets_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.support_tickets_ticket_id_seq OWNED BY public.support_tickets.ticket_id;


--
-- TOC entry 231 (class 1259 OID 246045)
-- Name: user_favourites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favourites (
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 245973)
-- Name: user_login_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_login_history (
    history_id integer NOT NULL,
    user_id integer NOT NULL,
    device character varying(255),
    location character varying(100),
    ip_address character varying(45),
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) NOT NULL,
    message text,
    CONSTRAINT user_login_history_status_check CHECK (((status)::text = ANY ((ARRAY['Success'::character varying, 'Failed'::character varying])::text[])))
);


--
-- TOC entry 222 (class 1259 OID 245972)
-- Name: user_login_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_login_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 222
-- Name: user_login_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_login_history_history_id_seq OWNED BY public.user_login_history.history_id;


--
-- TOC entry 221 (class 1259 OID 245958)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    user_id integer NOT NULL,
    device character varying(255),
    location character varying(100),
    ip_address character varying(45),
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_current boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    session_id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 245925)
-- Name: users; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT valid_role CHECK (((role)::text = ANY ((ARRAY['client'::character varying, 'agent'::character varying, 'admin'::character varying, 'agency_admin'::character varying])::text[]))),
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'deactivated'::character varying])::text[])))
);


--
-- TOC entry 219 (class 1259 OID 245924)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4918 (class 2604 OID 246263)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 246295)
-- Name: admin_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings ALTER COLUMN id SET DEFAULT nextval('public.admin_settings_id_seq'::regclass);


--
-- TOC entry 4964 (class 2604 OID 262312)
-- Name: agencies agency_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies ALTER COLUMN agency_id SET DEFAULT nextval('public.agencies_agency_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 262358)
-- Name: agency_members agency_member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members ALTER COLUMN agency_member_id SET DEFAULT nextval('public.agency_members_agency_member_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 246177)
-- Name: agent_client_requests request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_client_requests ALTER COLUMN request_id SET DEFAULT nextval('public.agent_client_requests_request_id_seq'::regclass);


--
-- TOC entry 4885 (class 2604 OID 246065)
-- Name: client_interactions interaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_interactions ALTER COLUMN interaction_id SET DEFAULT nextval('public.client_interactions_interaction_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 246098)
-- Name: inquiries inquiry_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN inquiry_id SET DEFAULT nextval('public.inquiries_inquiry_id_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 246079)
-- Name: legal_documents document_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents ALTER COLUMN document_id SET DEFAULT nextval('public.legal_documents_document_id_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 246278)
-- Name: property_details property_details_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_details ALTER COLUMN property_details_id SET DEFAULT nextval('public.property_details_property_details_id_seq'::regclass);


--
-- TOC entry 4883 (class 2604 OID 246035)
-- Name: property_images image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_images ALTER COLUMN image_id SET DEFAULT nextval('public.property_images_image_id_seq'::regclass);


--
-- TOC entry 4882 (class 2604 OID 246021)
-- Name: property_listings property_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_listings ALTER COLUMN property_id SET DEFAULT nextval('public.property_listings_property_id_seq'::regclass);


--
-- TOC entry 4887 (class 2604 OID 246091)
-- Name: support_tickets ticket_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN ticket_id SET DEFAULT nextval('public.support_tickets_ticket_id_seq'::regclass);


--
-- TOC entry 4880 (class 2604 OID 245976)
-- Name: user_login_history history_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_history ALTER COLUMN history_id SET DEFAULT nextval('public.user_login_history_history_id_seq'::regclass);


--
-- TOC entry 4856 (class 2604 OID 245928)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5029 (class 2606 OID 246268)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 246315)
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5041 (class 2606 OID 262320)
-- Name: agencies agencies_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_email_key UNIQUE (email);


--
-- TOC entry 5043 (class 2606 OID 262405)
-- Name: agencies agencies_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_name_key UNIQUE (name);


--
-- TOC entry 5045 (class 2606 OID 262318)
-- Name: agencies agencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_pkey PRIMARY KEY (agency_id);


--
-- TOC entry 5047 (class 2606 OID 262408)
-- Name: agency_members agency_members_agency_id_agent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agency_id_agent_id_key UNIQUE (agency_id, agent_id);


--
-- TOC entry 5049 (class 2606 OID 262327)
-- Name: agency_members agency_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_pkey PRIMARY KEY (agency_id, agent_id);


--
-- TOC entry 5017 (class 2606 OID 246184)
-- Name: agent_client_requests agent_client_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 5015 (class 2606 OID 246162)
-- Name: agent_clients agent_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_pkey PRIMARY KEY (agent_id, client_id);


--
-- TOC entry 4991 (class 2606 OID 246006)
-- Name: agent_performance agent_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5025 (class 2606 OID 246223)
-- Name: agent_recommended_listings agent_recommended_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_pkey PRIMARY KEY (agent_id, client_id, property_id);


--
-- TOC entry 5037 (class 2606 OID 246334)
-- Name: agent_settings agent_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_settings
    ADD CONSTRAINT agent_settings_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5027 (class 2606 OID 246248)
-- Name: archived_clients archived_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_pkey PRIMARY KEY (agent_id, client_id);


--
-- TOC entry 5001 (class 2606 OID 246069)
-- Name: client_interactions client_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_pkey PRIMARY KEY (interaction_id);


--
-- TOC entry 5023 (class 2606 OID 246212)
-- Name: client_property_preferences client_property_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_property_preferences
    ADD CONSTRAINT client_property_preferences_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5039 (class 2606 OID 246359)
-- Name: client_settings client_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4993 (class 2606 OID 246016)
-- Name: finance_overview finance_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_overview
    ADD CONSTRAINT finance_overview_pkey PRIMARY KEY (month);


--
-- TOC entry 5013 (class 2606 OID 246113)
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (inquiry_id);


--
-- TOC entry 5003 (class 2606 OID 246081)
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (document_id);


--
-- TOC entry 5031 (class 2606 OID 246283)
-- Name: property_details property_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_pkey PRIMARY KEY (property_details_id);


--
-- TOC entry 5033 (class 2606 OID 246285)
-- Name: property_details property_details_property_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_property_id_key UNIQUE (property_id);


--
-- TOC entry 4997 (class 2606 OID 246039)
-- Name: property_images property_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_pkey PRIMARY KEY (image_id);


--
-- TOC entry 4995 (class 2606 OID 246025)
-- Name: property_listings property_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_pkey PRIMARY KEY (property_id);


--
-- TOC entry 4987 (class 2606 OID 245992)
-- Name: staff_directory staff_directory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_pkey PRIMARY KEY (employee_id);


--
-- TOC entry 4989 (class 2606 OID 245994)
-- Name: staff_directory staff_directory_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_user_id_key UNIQUE (user_id);


--
-- TOC entry 5005 (class 2606 OID 246093)
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (ticket_id);


--
-- TOC entry 5021 (class 2606 OID 246186)
-- Name: agent_client_requests unique_request; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT unique_request UNIQUE (sender_id, receiver_id);


--
-- TOC entry 4999 (class 2606 OID 246050)
-- Name: user_favourites user_favourites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_pkey PRIMARY KEY (user_id, property_id);


--
-- TOC entry 4985 (class 2606 OID 245982)
-- Name: user_login_history user_login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_history
    ADD CONSTRAINT user_login_history_pkey PRIMARY KEY (history_id);


--
-- TOC entry 4983 (class 2606 OID 262415)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 4977 (class 2606 OID 245956)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4979 (class 2606 OID 245952)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4981 (class 2606 OID 245954)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5018 (class 1259 OID 246197)
-- Name: idx_acr_receiver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acr_receiver_id ON public.agent_client_requests USING btree (receiver_id);


--
-- TOC entry 5019 (class 1259 OID 246198)
-- Name: idx_acr_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acr_sender_id ON public.agent_client_requests USING btree (sender_id);


--
-- TOC entry 5006 (class 1259 OID 246141)
-- Name: idx_inquiries_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_agent_id ON public.inquiries USING btree (agent_id);


--
-- TOC entry 5007 (class 1259 OID 246140)
-- Name: idx_inquiries_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_client_id ON public.inquiries USING btree (client_id);


--
-- TOC entry 5008 (class 1259 OID 246139)
-- Name: idx_inquiries_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_conversation_id ON public.inquiries USING btree (conversation_id);


--
-- TOC entry 5009 (class 1259 OID 246144)
-- Name: idx_inquiries_recipient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_recipient_id ON public.inquiries USING btree (recipient_id);


--
-- TOC entry 5010 (class 1259 OID 246143)
-- Name: idx_inquiries_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_sender_id ON public.inquiries USING btree (sender_id);


--
-- TOC entry 5011 (class 1259 OID 246142)
-- Name: idx_inquiries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_status ON public.inquiries USING btree (status);


--
-- TOC entry 5085 (class 2620 OID 246145)
-- Name: inquiries update_inquiries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5084 (class 2620 OID 278693)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5077 (class 2606 OID 246269)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5082 (class 2606 OID 262328)
-- Name: agency_members agency_members_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE CASCADE;


--
-- TOC entry 5083 (class 2606 OID 262333)
-- Name: agency_members agency_members_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency_members
    ADD CONSTRAINT agency_members_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5069 (class 2606 OID 246192)
-- Name: agent_client_requests agent_client_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5070 (class 2606 OID 246187)
-- Name: agent_client_requests agent_client_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5067 (class 2606 OID 246163)
-- Name: agent_clients agent_clients_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5068 (class 2606 OID 246168)
-- Name: agent_clients agent_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5054 (class 2606 OID 246007)
-- Name: agent_performance agent_performance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5072 (class 2606 OID 246224)
-- Name: agent_recommended_listings agent_recommended_listings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5073 (class 2606 OID 246229)
-- Name: agent_recommended_listings agent_recommended_listings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5074 (class 2606 OID 246234)
-- Name: agent_recommended_listings agent_recommended_listings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5079 (class 2606 OID 246335)
-- Name: agent_settings agent_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_settings
    ADD CONSTRAINT agent_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5075 (class 2606 OID 246249)
-- Name: archived_clients archived_clients_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5076 (class 2606 OID 246254)
-- Name: archived_clients archived_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id);


--
-- TOC entry 5060 (class 2606 OID 246070)
-- Name: client_interactions client_interactions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5071 (class 2606 OID 246213)
-- Name: client_property_preferences client_property_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_property_preferences
    ADD CONSTRAINT client_property_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5080 (class 2606 OID 246360)
-- Name: client_settings client_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5081 (class 2606 OID 262351)
-- Name: agencies fk_agency_admin; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT fk_agency_admin FOREIGN KEY (agency_admin_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5055 (class 2606 OID 262344)
-- Name: property_listings fk_property_listings_agency; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT fk_property_listings_agency FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE SET NULL;


--
-- TOC entry 5050 (class 2606 OID 262338)
-- Name: users fk_users_agency; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_agency FOREIGN KEY (agency_id) REFERENCES public.agencies(agency_id) ON DELETE SET NULL;


--
-- TOC entry 5062 (class 2606 OID 246119)
-- Name: inquiries inquiries_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5063 (class 2606 OID 246114)
-- Name: inquiries inquiries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5064 (class 2606 OID 246124)
-- Name: inquiries inquiries_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5065 (class 2606 OID 246134)
-- Name: inquiries inquiries_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5066 (class 2606 OID 246129)
-- Name: inquiries inquiries_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5061 (class 2606 OID 246082)
-- Name: legal_documents legal_documents_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id);


--
-- TOC entry 5078 (class 2606 OID 246286)
-- Name: property_details property_details_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5057 (class 2606 OID 246040)
-- Name: property_images property_images_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5056 (class 2606 OID 246026)
-- Name: property_listings property_listings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5053 (class 2606 OID 245995)
-- Name: staff_directory staff_directory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5058 (class 2606 OID 246056)
-- Name: user_favourites user_favourites_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5059 (class 2606 OID 246051)
-- Name: user_favourites user_favourites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5052 (class 2606 OID 245983)
-- Name: user_login_history user_login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_history
    ADD CONSTRAINT user_login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5051 (class 2606 OID 245967)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2025-07-17 00:02:07

--
-- PostgreSQL database dump complete
--


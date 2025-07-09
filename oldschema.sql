--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-07-09 13:00:17

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
-- TOC entry 2 (class 3079 OID 73833)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 3 (class 3079 OID 123047)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 969 (class 1247 OID 246147)
-- Name: request_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);


ALTER TYPE public.request_status OWNER TO postgres;

--
-- TOC entry 301 (class 1255 OID 123081)
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
-- TOC entry 248 (class 1259 OID 246260)
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
-- TOC entry 247 (class 1259 OID 246259)
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
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 247
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 252 (class 1259 OID 246292)
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
-- TOC entry 251 (class 1259 OID 246291)
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
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 251
-- Name: admin_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_settings_id_seq OWNED BY public.admin_settings.id;


--
-- TOC entry 243 (class 1259 OID 246174)
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
-- TOC entry 242 (class 1259 OID 246173)
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
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 242
-- Name: agent_client_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agent_client_requests_request_id_seq OWNED BY public.agent_client_requests.request_id;


--
-- TOC entry 241 (class 1259 OID 246153)
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
-- TOC entry 226 (class 1259 OID 246000)
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
-- TOC entry 245 (class 1259 OID 246218)
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
-- TOC entry 253 (class 1259 OID 246316)
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
-- TOC entry 246 (class 1259 OID 246239)
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
-- TOC entry 234 (class 1259 OID 246062)
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
-- TOC entry 233 (class 1259 OID 246061)
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
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 233
-- Name: client_interactions_interaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_interactions_interaction_id_seq OWNED BY public.client_interactions.interaction_id;


--
-- TOC entry 244 (class 1259 OID 246199)
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
-- TOC entry 254 (class 1259 OID 246340)
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
-- TOC entry 227 (class 1259 OID 246012)
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
-- TOC entry 240 (class 1259 OID 246095)
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
    hidden_from_agent boolean DEFAULT false
);


ALTER TABLE public.inquiries OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 246094)
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
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 239
-- Name: inquiries_inquiry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inquiries_inquiry_id_seq OWNED BY public.inquiries.inquiry_id;


--
-- TOC entry 236 (class 1259 OID 246076)
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
    completion_date date
);


ALTER TABLE public.legal_documents OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 246075)
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
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 235
-- Name: legal_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.legal_documents_document_id_seq OWNED BY public.legal_documents.document_id;


--
-- TOC entry 250 (class 1259 OID 246275)
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
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.property_details OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 246274)
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
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 249
-- Name: property_details_property_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.property_details_property_details_id_seq OWNED BY public.property_details.property_details_id;


--
-- TOC entry 231 (class 1259 OID 246032)
-- Name: property_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_images (
    image_id integer NOT NULL,
    property_id integer,
    image_url text NOT NULL
);


ALTER TABLE public.property_images OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 246031)
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
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 230
-- Name: property_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.property_images_image_id_seq OWNED BY public.property_images.image_id;


--
-- TOC entry 229 (class 1259 OID 246018)
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
    image_url text
);


ALTER TABLE public.property_listings OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 246017)
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
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 228
-- Name: property_listings_property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.property_listings_property_id_seq OWNED BY public.property_listings.property_id;


--
-- TOC entry 225 (class 1259 OID 245988)
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
-- TOC entry 238 (class 1259 OID 246088)
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
-- TOC entry 237 (class 1259 OID 246087)
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
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 237
-- Name: support_tickets_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_tickets_ticket_id_seq OWNED BY public.support_tickets.ticket_id;


--
-- TOC entry 232 (class 1259 OID 246045)
-- Name: user_favourites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favourites (
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_favourites OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 245973)
-- Name: user_login_history; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.user_login_history OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 245972)
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
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_login_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_login_history_history_id_seq OWNED BY public.user_login_history.history_id;


--
-- TOC entry 222 (class 1259 OID 245958)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    device character varying(255),
    location character varying(100),
    ip_address character varying(45),
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_current boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 245957)
-- Name: user_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_session_id_seq OWNER TO postgres;

--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 221
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- TOC entry 220 (class 1259 OID 245925)
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
    CONSTRAINT valid_role CHECK (((role)::text = ANY ((ARRAY['client'::character varying, 'agent'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'deactivated'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 245924)
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
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4908 (class 2604 OID 246263)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 246295)
-- Name: admin_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings ALTER COLUMN id SET DEFAULT nextval('public.admin_settings_id_seq'::regclass);


--
-- TOC entry 4893 (class 2604 OID 246177)
-- Name: agent_client_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests ALTER COLUMN request_id SET DEFAULT nextval('public.agent_client_requests_request_id_seq'::regclass);


--
-- TOC entry 4875 (class 2604 OID 246065)
-- Name: client_interactions interaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_interactions ALTER COLUMN interaction_id SET DEFAULT nextval('public.client_interactions_interaction_id_seq'::regclass);


--
-- TOC entry 4878 (class 2604 OID 246098)
-- Name: inquiries inquiry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN inquiry_id SET DEFAULT nextval('public.inquiries_inquiry_id_seq'::regclass);


--
-- TOC entry 4876 (class 2604 OID 246079)
-- Name: legal_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents ALTER COLUMN document_id SET DEFAULT nextval('public.legal_documents_document_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 246278)
-- Name: property_details property_details_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details ALTER COLUMN property_details_id SET DEFAULT nextval('public.property_details_property_details_id_seq'::regclass);


--
-- TOC entry 4873 (class 2604 OID 246035)
-- Name: property_images image_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_images ALTER COLUMN image_id SET DEFAULT nextval('public.property_images_image_id_seq'::regclass);


--
-- TOC entry 4872 (class 2604 OID 246021)
-- Name: property_listings property_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings ALTER COLUMN property_id SET DEFAULT nextval('public.property_listings_property_id_seq'::regclass);


--
-- TOC entry 4877 (class 2604 OID 246091)
-- Name: support_tickets ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN ticket_id SET DEFAULT nextval('public.support_tickets_ticket_id_seq'::regclass);


--
-- TOC entry 4870 (class 2604 OID 245976)
-- Name: user_login_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_history ALTER COLUMN history_id SET DEFAULT nextval('public.user_login_history_history_id_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 245961)
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- TOC entry 4847 (class 2604 OID 245928)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5010 (class 2606 OID 246268)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5016 (class 2606 OID 246315)
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4998 (class 2606 OID 246184)
-- Name: agent_client_requests agent_client_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 4996 (class 2606 OID 246162)
-- Name: agent_clients agent_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_pkey PRIMARY KEY (agent_id, client_id);


--
-- TOC entry 4972 (class 2606 OID 246006)
-- Name: agent_performance agent_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5006 (class 2606 OID 246223)
-- Name: agent_recommended_listings agent_recommended_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_pkey PRIMARY KEY (agent_id, client_id, property_id);


--
-- TOC entry 5018 (class 2606 OID 246334)
-- Name: agent_settings agent_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_settings
    ADD CONSTRAINT agent_settings_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5008 (class 2606 OID 246248)
-- Name: archived_clients archived_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_pkey PRIMARY KEY (agent_id, client_id);


--
-- TOC entry 4982 (class 2606 OID 246069)
-- Name: client_interactions client_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_pkey PRIMARY KEY (interaction_id);


--
-- TOC entry 5004 (class 2606 OID 246212)
-- Name: client_property_preferences client_property_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_property_preferences
    ADD CONSTRAINT client_property_preferences_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5020 (class 2606 OID 246359)
-- Name: client_settings client_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4974 (class 2606 OID 246016)
-- Name: finance_overview finance_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finance_overview
    ADD CONSTRAINT finance_overview_pkey PRIMARY KEY (month);


--
-- TOC entry 4994 (class 2606 OID 246113)
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (inquiry_id);


--
-- TOC entry 4984 (class 2606 OID 246081)
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (document_id);


--
-- TOC entry 5012 (class 2606 OID 246283)
-- Name: property_details property_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_pkey PRIMARY KEY (property_details_id);


--
-- TOC entry 5014 (class 2606 OID 246285)
-- Name: property_details property_details_property_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_property_id_key UNIQUE (property_id);


--
-- TOC entry 4978 (class 2606 OID 246039)
-- Name: property_images property_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_pkey PRIMARY KEY (image_id);


--
-- TOC entry 4976 (class 2606 OID 246025)
-- Name: property_listings property_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_pkey PRIMARY KEY (property_id);


--
-- TOC entry 4968 (class 2606 OID 245992)
-- Name: staff_directory staff_directory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_pkey PRIMARY KEY (employee_id);


--
-- TOC entry 4970 (class 2606 OID 245994)
-- Name: staff_directory staff_directory_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_user_id_key UNIQUE (user_id);


--
-- TOC entry 4986 (class 2606 OID 246093)
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (ticket_id);


--
-- TOC entry 5002 (class 2606 OID 246186)
-- Name: agent_client_requests unique_request; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT unique_request UNIQUE (sender_id, receiver_id);


--
-- TOC entry 4980 (class 2606 OID 246050)
-- Name: user_favourites user_favourites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_pkey PRIMARY KEY (user_id, property_id);


--
-- TOC entry 4966 (class 2606 OID 245982)
-- Name: user_login_history user_login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_history
    ADD CONSTRAINT user_login_history_pkey PRIMARY KEY (history_id);


--
-- TOC entry 4964 (class 2606 OID 245966)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 4958 (class 2606 OID 245956)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4960 (class 2606 OID 245952)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4962 (class 2606 OID 245954)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4999 (class 1259 OID 246197)
-- Name: idx_acr_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acr_receiver_id ON public.agent_client_requests USING btree (receiver_id);


--
-- TOC entry 5000 (class 1259 OID 246198)
-- Name: idx_acr_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_acr_sender_id ON public.agent_client_requests USING btree (sender_id);


--
-- TOC entry 4987 (class 1259 OID 246141)
-- Name: idx_inquiries_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_agent_id ON public.inquiries USING btree (agent_id);


--
-- TOC entry 4988 (class 1259 OID 246140)
-- Name: idx_inquiries_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_client_id ON public.inquiries USING btree (client_id);


--
-- TOC entry 4989 (class 1259 OID 246139)
-- Name: idx_inquiries_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_conversation_id ON public.inquiries USING btree (conversation_id);


--
-- TOC entry 4990 (class 1259 OID 246144)
-- Name: idx_inquiries_recipient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_recipient_id ON public.inquiries USING btree (recipient_id);


--
-- TOC entry 4991 (class 1259 OID 246143)
-- Name: idx_inquiries_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_sender_id ON public.inquiries USING btree (sender_id);


--
-- TOC entry 4992 (class 1259 OID 246142)
-- Name: idx_inquiries_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inquiries_status ON public.inquiries USING btree (status);


--
-- TOC entry 5050 (class 2620 OID 246145)
-- Name: inquiries update_inquiries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5046 (class 2606 OID 246269)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5038 (class 2606 OID 246192)
-- Name: agent_client_requests agent_client_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5039 (class 2606 OID 246187)
-- Name: agent_client_requests agent_client_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_client_requests
    ADD CONSTRAINT agent_client_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5036 (class 2606 OID 246163)
-- Name: agent_clients agent_clients_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 246168)
-- Name: agent_clients agent_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_clients
    ADD CONSTRAINT agent_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5024 (class 2606 OID 246007)
-- Name: agent_performance agent_performance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_performance
    ADD CONSTRAINT agent_performance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5041 (class 2606 OID 246224)
-- Name: agent_recommended_listings agent_recommended_listings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5042 (class 2606 OID 246229)
-- Name: agent_recommended_listings agent_recommended_listings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5043 (class 2606 OID 246234)
-- Name: agent_recommended_listings agent_recommended_listings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_recommended_listings
    ADD CONSTRAINT agent_recommended_listings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5048 (class 2606 OID 246335)
-- Name: agent_settings agent_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_settings
    ADD CONSTRAINT agent_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5044 (class 2606 OID 246249)
-- Name: archived_clients archived_clients_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5045 (class 2606 OID 246254)
-- Name: archived_clients archived_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.archived_clients
    ADD CONSTRAINT archived_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id);


--
-- TOC entry 5029 (class 2606 OID 246070)
-- Name: client_interactions client_interactions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_interactions
    ADD CONSTRAINT client_interactions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5040 (class 2606 OID 246213)
-- Name: client_property_preferences client_property_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_property_preferences
    ADD CONSTRAINT client_property_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5049 (class 2606 OID 246360)
-- Name: client_settings client_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_settings
    ADD CONSTRAINT client_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5031 (class 2606 OID 246119)
-- Name: inquiries inquiries_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5032 (class 2606 OID 246114)
-- Name: inquiries inquiries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5033 (class 2606 OID 246124)
-- Name: inquiries inquiries_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5034 (class 2606 OID 246134)
-- Name: inquiries inquiries_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5035 (class 2606 OID 246129)
-- Name: inquiries inquiries_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5030 (class 2606 OID 246082)
-- Name: legal_documents legal_documents_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id);


--
-- TOC entry 5047 (class 2606 OID 246286)
-- Name: property_details property_details_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_details
    ADD CONSTRAINT property_details_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5026 (class 2606 OID 246040)
-- Name: property_images property_images_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5025 (class 2606 OID 246026)
-- Name: property_listings property_listings_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5023 (class 2606 OID 245995)
-- Name: staff_directory staff_directory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_directory
    ADD CONSTRAINT staff_directory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5027 (class 2606 OID 246056)
-- Name: user_favourites user_favourites_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 5028 (class 2606 OID 246051)
-- Name: user_favourites user_favourites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favourites
    ADD CONSTRAINT user_favourites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5022 (class 2606 OID 245983)
-- Name: user_login_history user_login_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_login_history
    ADD CONSTRAINT user_login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5021 (class 2606 OID 245967)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2025-07-09 13:00:17

--
-- PostgreSQL database dump complete
--


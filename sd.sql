--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-07-17 00:06:43

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

DROP DATABASE IF EXISTS criblink_db;
--
-- TOC entry 5275 (class 1262 OID 16456)
-- Name: criblink_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE criblink_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';


ALTER DATABASE criblink_db OWNER TO postgres;

\connect criblink_db

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
-- TOC entry 5259 (class 0 OID 246260)
-- Dependencies: 247
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (1, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-01 21:29:56.331693+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (2, 'Sign in by client: Bruce Lee', 'client: Bruce Lee', 38, 'auth', '2025-07-01 21:30:42.460072+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (3, 'Listing "4" added to favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-01 21:31:06.850065+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (4, 'Listing "205" added to favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-01 21:31:12.62358+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (5, 'Listing "204" added to favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-01 21:31:20.10262+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (6, 'Listing "208" added to favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-01 21:31:32.316853+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (7, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-01 21:31:54.93158+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (8, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-01 21:34:51.908746+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (9, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-01 21:35:17.237262+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (10, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-01 21:36:47.048698+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (11, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:52:07.926952+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (12, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:52:09.399406+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (13, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:52:10.570385+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (14, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:52:16.724795+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (15, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:57:54.550253+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (16, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:57:56.074105+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (17, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:58:03.350858+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (18, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:58:05.200122+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (19, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:58:12.195116+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (20, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:58:14.814661+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (21, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 21:58:22.113787+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (22, 'undefined updated their client settings.', 'client: Bruce Lee', 38, 'client_settings_update', '2025-07-01 22:00:03.80103+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (23, 'Agent (ID: 34) marked conversation e6848350-79c0-4fa5-a83a-e677be6a203c as opened.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:13.631404+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (24, 'agent (ID: 34) marked messages in conversation e6848350-79c0-4fa5-a83a-e677be6a203c as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:13.872284+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (25, 'agent (ID: 34) marked messages in conversation e6848350-79c0-4fa5-a83a-e677be6a203c as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:13.981905+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (26, 'Agent (ID: 34) marked conversation d86ca9f4-524a-4a61-bb8e-fd5c70583ff7 as opened.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:27.125881+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (27, 'agent (ID: 34) marked messages in conversation d86ca9f4-524a-4a61-bb8e-fd5c70583ff7 as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:27.184219+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (28, 'agent (ID: 34) marked messages in conversation d86ca9f4-524a-4a61-bb8e-fd5c70583ff7 as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:27.403099+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (29, 'Agent (ID: 34) marked conversation 0f8686fa-53b6-46e1-a64d-41d067b00542 as opened.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:34.511513+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (30, 'agent (ID: 34) marked messages in conversation 0f8686fa-53b6-46e1-a64d-41d067b00542 as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:34.63735+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (31, 'agent (ID: 34) marked messages in conversation 0f8686fa-53b6-46e1-a64d-41d067b00542 as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:01:34.641594+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (32, 'Agent (ID: 34) marked conversation 75c3ab89-e819-4a17-9fad-15f15b305d77 as opened.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:03:34.858127+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (33, 'agent (ID: 34) marked messages in conversation 75c3ab89-e819-4a17-9fad-15f15b305d77 as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:03:34.925818+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (34, 'agent (ID: 34) marked messages in conversation 75c3ab89-e819-4a17-9fad-15f15b305d77 as read.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-01 22:03:35.122851+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (35, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-01 22:04:42.574002+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (36, 'Tony Stark uploaded a new profile picture', 'agent: Tony Stark', 34, 'user_profile_picture', '2025-07-01 22:15:31.879316+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (37, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-01 22:16:22.860175+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (38, 'Matthew Tedunjaiye uploaded a new profile picture', 'admin: Matthew Tedunjaiye', 35, 'user_profile_picture', '2025-07-01 22:25:25.336042+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (39, 'Matthew Tedunjaiye uploaded a new profile picture', 'admin: Matthew Tedunjaiye', 35, 'user_profile_picture', '2025-07-01 22:26:19.456635+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (40, 'Matthew Tedunjaiye uploaded a new profile picture', 'admin: Matthew Tedunjaiye', 35, 'user_profile_picture', '2025-07-01 22:27:03.733165+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (41, 'Tony Stark uploaded a new profile picture', 'agent: Tony Stark', 34, 'user_profile_picture', '2025-07-01 23:52:11.334241+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (42, 'Matthew Tedunjaiye uploaded a new profile picture', 'admin: Matthew Tedunjaiye', 35, 'user_profile_picture', '2025-07-02 00:20:21.599871+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (43, 'Matthew Tedunjaiye uploaded a new profile picture', 'admin: Matthew Tedunjaiye', 35, 'user_profile_picture', '2025-07-02 00:25:20.850931+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (44, 'Tony Stark updated their profile', 'agent: Tony Stark', 34, 'user', '2025-07-02 00:39:29.778282+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (45, 'Tony Stark updated their profile', 'agent: Tony Stark', 34, 'user', '2025-07-02 00:39:49.823733+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (46, 'Tony Stark uploaded a new profile picture', 'agent: Tony Stark', 34, 'user_profile_picture', '2025-07-02 00:40:21.246261+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (47, 'Tony Stark updated their profile', 'agent: Tony Stark', 34, 'user', '2025-07-02 00:40:21.275474+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (48, 'Tony Stark uploaded a new profile picture', 'agent: Tony Stark', 34, 'user_profile_picture', '2025-07-02 00:41:02.75036+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (49, 'Tony Stark updated their profile', 'agent: Tony Stark', 34, 'user', '2025-07-02 00:41:02.772432+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (50, 'Matthew Tedunjaiye uploaded a new profile picture', 'admin: Matthew Tedunjaiye', 35, 'user_profile_picture', '2025-07-02 00:41:35.438582+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (51, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-02 00:41:35.462606+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (52, 'Sign in by client: Bruce Lee', 'client: Bruce Lee', 38, 'auth', '2025-07-02 00:44:07.017005+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (53, 'Bruce Lee uploaded a new profile picture', 'client: Bruce Lee', 38, 'user_profile_picture', '2025-07-02 00:44:33.936791+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (54, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:44:33.952097+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (55, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:46:59.211783+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (56, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:48:17.054528+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (57, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:48:37.236896+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (58, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:50:36.457327+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (59, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:50:49.591915+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (60, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:50:59.407766+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (61, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:51:07.766137+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (62, 'Bruce Lee updated their profile', 'client: Bruce Lee', 38, 'user', '2025-07-02 00:51:16.602007+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (63, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-02 00:53:33.358727+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (64, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-02 00:54:53.124987+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (65, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-02 22:24:06.638025+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (66, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-03 01:35:15.446594+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (67, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-03 02:11:01.794752+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (68, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-03 02:11:23.902273+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (69, 'Sign in by client: Bruce Lee', 'client: Bruce Lee', 38, 'auth', '2025-07-09 13:06:47.258412+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (70, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-09 13:14:43.926284+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (71, 'Listing "Contemporary 5 Bedroom Smart Home with Swimming Pool" updated (status: featured)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-09 13:15:13.822749+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (72, 'Listing "5-Bedroom Mansion" updated (status: featured)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-09 13:25:35.695899+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (73, 'Listing "Studio Apartment" updated (status: featured)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-09 13:26:19.348075+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (74, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-09 17:10:09.321855+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (75, 'Listing "Commercial Plot" updated (status: Sold)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-09 17:10:48.554467+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (76, 'Listing "Commercial Plot" updated (status: featured)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-09 17:11:23.282615+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (77, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-10 21:10:08.706855+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (78, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-10 21:10:17.261908+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (79, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-10 21:10:35.166847+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (80, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-10 21:10:41.907157+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (81, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-10 21:19:19.429066+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (82, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-10 21:19:25.802112+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (83, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-10 21:19:46.014581+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (84, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-10 21:20:00.160609+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (85, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-10 21:20:05.519247+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (86, 'Matthew Tedunjaiye updated their profile', 'admin: Matthew Tedunjaiye', 35, 'user', '2025-07-10 21:20:23.596972+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (114, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-12 15:06:06.086614+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (115, 'Sign in by client: Bruce Lee', 'client: Bruce Lee', 38, 'auth', '2025-07-12 15:07:17.747367+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (116, 'Listing "202" added to favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-12 15:07:32.256656+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (117, 'Listing "205" removed from favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-12 15:07:54.046374+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (118, 'Listing "205" added to favourites', 'client: Bruce Lee', 38, 'favourite', '2025-07-12 15:07:55.251677+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (119, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-12 15:08:03.611426+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (120, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-12 15:08:59.138198+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (121, 'Sign in by client: Bruce Lee', 'client: Bruce Lee', 38, 'auth', '2025-07-13 12:41:56.754168+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (122, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-13 12:42:47.234506+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (123, 'Client 38 sent a new inquiry (ID: 1) for property 3.', 'client: Bruce Lee', 38, 'inquiry', '2025-07-13 12:43:33.488315+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (124, 'client (ID: 38) sent a client reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'client: Bruce Lee', 38, 'inquiry', '2025-07-13 12:43:40.010623+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (125, 'agent (ID: 34) sent a agent reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 12:43:59.844837+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (126, 'Agent (ID: 34) marked conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0 as responded.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 12:43:59.959469+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (127, 'client (ID: 38) sent a client reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'client: Bruce Lee', 38, 'inquiry', '2025-07-13 12:44:14.375554+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (128, 'agent (ID: 34) sent a agent reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 12:44:19.86902+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (129, 'Agent (ID: 34) marked conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0 as responded.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 12:44:19.966709+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (130, 'client (ID: 38) sent a client reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'client: Bruce Lee', 38, 'inquiry', '2025-07-13 12:44:23.575667+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (131, 'client (ID: 38) sent a client reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'client: Bruce Lee', 38, 'inquiry', '2025-07-13 12:44:31.914621+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (132, 'agent (ID: 34) sent a agent reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 12:44:35.683362+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (133, 'Agent (ID: 34) marked conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0 as responded.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 12:44:35.837913+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (134, 'client (ID: 38) sent a client reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'client: Bruce Lee', 38, 'inquiry', '2025-07-13 12:44:38.695079+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (135, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-13 12:45:50.94586+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (136, 'Listing "5" added to favourites', 'admin: Matthew Tedunjaiye', 35, 'favourite', '2025-07-13 12:50:24.005539+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (137, 'Listing "209" added to favourites', 'admin: Matthew Tedunjaiye', 35, 'favourite', '2025-07-13 12:50:31.235866+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (138, 'Listing "203" added to favourites', 'admin: Matthew Tedunjaiye', 35, 'favourite', '2025-07-13 12:50:37.418204+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (139, 'Listing "204" added to favourites', 'admin: Matthew Tedunjaiye', 35, 'favourite', '2025-07-13 12:50:49.502709+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (140, 'Listing "202" added to favourites', 'admin: Matthew Tedunjaiye', 35, 'favourite', '2025-07-13 12:51:00.858532+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (141, 'Listing "207" added to favourites', 'admin: Matthew Tedunjaiye', 35, 'favourite', '2025-07-13 12:51:08.255504+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (142, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-13 13:41:52.136085+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (143, 'agent (ID: 34) sent a agent reply in conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 14:06:39.834228+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (144, 'Agent (ID: 34) marked conversation ac219bed-dfd6-49dc-a86c-38fc78492ca0 as responded.', 'agent: Tony Stark', 34, 'inquiry', '2025-07-13 14:06:39.887454+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (145, 'Sign in by client: Bruce Lee', 'client: Bruce Lee', 38, 'auth', '2025-07-13 14:07:05.762586+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (146, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-13 14:10:00.046238+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (147, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-13 14:42:25.797763+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (148, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-13 15:16:10.52505+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (149, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-13 15:18:41.210719+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (150, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-13 15:29:33.070078+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (151, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-13 15:29:53.47275+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (152, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-13 15:41:24.510553+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (153, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-13 15:42:06.67951+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (154, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-15 05:42:38.256409+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (155, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 00:12:26.491882+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (156, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 01:43:56.851627+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (157, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 01:55:13.410347+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (158, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 02:04:55.954654+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (159, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 02:48:47.507336+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (160, 'Tony Stark updated their profile', 'agent: Tony Stark', 34, 'user', '2025-07-16 08:38:37.638996+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (161, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 08:58:43.336913+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (162, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-16 08:59:15.959895+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (163, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 09:17:24.110409+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (164, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 09:18:52.898156+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (165, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 09:24:11.54188+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (166, 'Agency Join Request Approved', 'Unknown', NULL, '34', '2025-07-16 09:43:33.039405+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (167, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-16 11:42:14.783505+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (168, 'Updated role of user ID 36 to "agent"', 'Unknown', NULL, 'user', '2025-07-16 11:42:46.008357+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (169, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 11:43:09.259733+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (170, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 12:42:58.655759+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (171, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 12:43:57.499073+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (172, 'Agency Join Request', 'Unknown', NULL, '36', '2025-07-16 12:44:19.64049+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (173, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 12:44:32.553712+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (174, 'Agency Join Request Approved', 'Unknown', NULL, '34', '2025-07-16 13:23:34.405731+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (175, 'Agency Member Removed', 'Unknown', NULL, '34', '2025-07-16 13:23:40.337054+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (176, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 13:23:57.00525+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (177, 'Agency Join Request', 'Unknown', NULL, '36', '2025-07-16 13:24:08.620829+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (178, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 13:24:24.226227+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (179, 'Agency Join Request Approved', 'Unknown', NULL, '34', '2025-07-16 13:24:48.185122+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (180, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 13:25:08.098529+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (181, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 13:29:49.737906+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (182, 'Agency Deleted by Admin', 'Unknown', NULL, '34', '2025-07-16 13:30:17.321848+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (183, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 13:31:07.659489+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (184, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 13:35:27.738077+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (185, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 13:36:43.836573+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (186, 'Agency Registered by Agent', 'Unknown', NULL, '34', '2025-07-16 14:02:15.486414+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (187, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 14:02:43.964954+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (188, 'Agency Updated', 'Unknown', NULL, '34', '2025-07-16 14:03:26.551615+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (189, 'Agency Updated', 'Unknown', NULL, '34', '2025-07-16 14:03:32.651788+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (190, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 14:04:39.569171+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (191, 'Agency Join Request', 'Unknown', NULL, '36', '2025-07-16 20:10:19.372611+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (192, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 20:10:31.750566+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (193, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 20:34:58.561674+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (194, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 21:00:01.081728+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (195, 'Agency Updated', 'Unknown', NULL, '34', '2025-07-16 21:02:18.244785+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (196, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 21:02:28.665664+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (197, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 21:02:52.09115+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (198, 'Agency Join Request Rejected', 'Unknown', NULL, '34', '2025-07-16 21:03:08.4302+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (199, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 21:03:15.782485+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (200, 'User undefined updated their profile picture', 'Unknown', NULL, 'profile_picture_update', '2025-07-16 21:04:05.947945+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (201, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 21:05:26.939442+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (202, 'User undefined updated their profile picture', 'Unknown', NULL, 'profile_picture_update', '2025-07-16 21:06:09.005856+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (203, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 21:06:53.79722+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (204, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 21:19:55.955085+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (205, 'User undefined updated their profile picture', 'Unknown', NULL, 'profile_picture_update', '2025-07-16 21:20:28.568183+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (206, 'User Tony Stark updated their profile', 'Unknown', NULL, 'profile_update', '2025-07-16 21:20:28.600563+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (207, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 21:21:43.891902+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (208, 'Agency Join Request Re-sent', 'Unknown', NULL, '36', '2025-07-16 21:25:42.906385+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (209, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 21:25:55.098261+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (210, 'Agency Join Request Approved', 'Unknown', NULL, '34', '2025-07-16 21:26:09.942497+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (211, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-16 21:26:42.352224+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (212, 'Listing "5-Bedroom Duplex" updated (status: Available)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-16 21:47:39.323605+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (213, 'Listing "5-Bedroom Duplex" updated (status: featured)', 'admin: Matthew Tedunjaiye', 35, 'listing', '2025-07-16 21:48:10.353885+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (214, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 21:54:04.727509+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (215, 'Agency Member Removed', 'Unknown', NULL, '34', '2025-07-16 22:02:27.98443+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (216, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 22:07:30.592632+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (217, 'Agency Join Request', 'Unknown', NULL, '34', '2025-07-16 22:07:48.47824+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (218, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 22:11:21.540217+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (219, 'Sign in by agent: Tony Stark', 'agent: Tony Stark', 34, 'auth', '2025-07-16 22:16:25.074179+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (220, 'Agency Registered by Agent', 'Unknown', NULL, '34', '2025-07-16 22:17:07.953082+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (221, 'Sign in by agent: Peter Parker', 'agent: Peter Parker', 36, 'auth', '2025-07-16 22:17:35.841873+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (222, 'Agency Join Request', 'Unknown', NULL, '36', '2025-07-16 22:17:47.838245+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (223, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 22:18:01.098991+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (224, 'Agency Join Request Approved', 'Unknown', NULL, '34', '2025-07-16 22:18:21.451374+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (225, 'Sign in by admin: Matthew Tedunjaiye', 'admin: Matthew Tedunjaiye', 35, 'auth', '2025-07-16 22:26:08.273891+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (226, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 22:26:39.683147+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (227, 'Member Peter Parker promoted to admin by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 22:58:09.270128+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (228, 'Sign in by agency_admin: Peter Parker', 'agency_admin: Peter Parker', 36, 'auth', '2025-07-16 23:02:01.517458+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (229, 'Peter Parker reverted from agency admin to agent', 'agency_admin: Peter Parker', 36, 'user_role_change', '2025-07-16 23:02:14.396833+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (230, 'Agency Join Request', 'Unknown', NULL, '36', '2025-07-16 23:02:23.119657+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (231, 'Sign in by agency_admin: Tony Stark', 'agency_admin: Tony Stark', 34, 'auth', '2025-07-16 23:02:34.241277+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (232, 'Agency Join Request Approved', 'Unknown', NULL, '34', '2025-07-16 23:02:59.703455+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (233, 'Member Peter Parker promoted to admin by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:03:10.600108+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (234, 'Member Peter Parker demoted to agent by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:06:12.852117+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (235, 'Member Peter Parker promoted to admin by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:06:16.804121+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (236, 'Member Peter Parker demoted to agent by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:13:16.665263+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (237, 'Member Peter Parker promoted to admin by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:17:38.893793+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (238, 'Member Peter Parker demoted to agent by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:17:51.32402+01');
INSERT INTO public.activity_logs (id, message, actor_name, user_id, type, "timestamp") VALUES (239, 'Member Peter Parker promoted to admin by undefined in agency 3', 'Unknown', NULL, 'member_role_change', '2025-07-16 23:17:56.399931+01');


--
-- TOC entry 5263 (class 0 OID 246292)
-- Dependencies: 251
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admin_settings (id, default_list_view, sidebar_permanently_expanded, email_notifications, sms_notifications, in_app_notifications, sender_email, smtp_host, require_2fa, min_password_length, crm_integration_enabled, analytics_id, auto_approve_listings, enable_comments, maintenance_mode, database_backup_scheduled, last_updated) VALUES (1, 'simple', false, true, false, true, 'admin@example.com', 'smtp.example.com', false, 8, false, '', false, true, false, false, '2025-07-01 21:14:32.807086+01');


--
-- TOC entry 5267 (class 0 OID 262309)
-- Dependencies: 255
-- Data for Name: agencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agencies (agency_id, name, email, phone, website, logo_url, logo_public_id, description, created_at, updated_at, agency_admin_id, address) VALUES (3, 'AdinKems Properties', 'contact@adinkems.property', '+2349056898459', 'https://www.adinkems.com', 'https://res.cloudinary.com/di22nmygf/image/upload/v1752700626/criblink/agency_logos/q7gdlrwrtlz7utepefow.jpg', 'criblink/agency_logos/q7gdlrwrtlz7utepefow', 'World-class treatment!', '2025-07-16 22:17:04.362741+01', '2025-07-16 22:17:04.362741+01', 34, '9 Bajeh Razak Close, opposite Witty Kids School, Karu LGA.');


--
-- TOC entry 5268 (class 0 OID 262321)
-- Dependencies: 256
-- Data for Name: agency_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agency_members (agency_id, agent_id, role, joined_at, agency_member_id, request_status, updated_at, message, member_status) VALUES (3, 34, 'admin', '2025-07-16 22:17:04.362741+01', 8, 'accepted', '2025-07-16 22:17:04.362741+01', NULL, 'regular');
INSERT INTO public.agency_members (agency_id, agent_id, role, joined_at, agency_member_id, request_status, updated_at, message, member_status) VALUES (3, 36, 'admin', '2025-07-16 23:02:59.532727+01', 10, 'accepted', '2025-07-16 23:17:56.393544+01', NULL, 'regular');


--
-- TOC entry 5254 (class 0 OID 246174)
-- Dependencies: 242
-- Data for Name: agent_client_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5252 (class 0 OID 246153)
-- Dependencies: 240
-- Data for Name: agent_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 9, '2025-05-01 00:00:00', 'Requested callback next Monday for follow-up.', 'vip', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 11, '2025-05-01 00:00:00', 'Prefers properties with waterfront views.', 'vip', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 17, '2025-05-01 00:00:00', 'Sent documents, waiting on legal review.', 'regular', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 26, '2025-05-01 00:00:00', 'Looking for investment opportunities in Abuja.', 'regular', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 27, '2025-05-01 00:00:00', 'Needs relocation within 60 days.', 'regular', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 29, '2025-05-01 00:00:00', 'Inquired about flexible payment options.', 'regular', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 36, '2025-05-01 00:00:00', 'First-time buyer, needs mortgage guidance.', 'regular', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 38, '2025-05-01 00:00:00', 'Nice', 'regular', 'accepted');
INSERT INTO public.agent_clients (agent_id, client_id, relationship_started, notes, status, request_status) VALUES (34, 3, '2025-05-01 00:00:00', 'Interested in 3-bedroom apartments in Lagos. dafsgdgjrafOKKKKKKKKKKLLSFsssssssssssssssssssssssssssssssssssssssssssss', 'vip', 'accepted');


--
-- TOC entry 5237 (class 0 OID 246000)
-- Dependencies: 225
-- Data for Name: agent_performance; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5256 (class 0 OID 246218)
-- Dependencies: 244
-- Data for Name: agent_recommended_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 3, '2025-07-01 21:32:19.439281+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 2, '2025-07-01 21:32:32.862537+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 205, '2025-07-01 21:33:07.82923+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 204, '2025-07-01 21:33:18.786679+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 5, '2025-07-12 15:06:33.755738+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 208, '2025-07-12 15:06:47.273575+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 209, '2025-07-12 15:06:57.825721+01');
INSERT INTO public.agent_recommended_listings (agent_id, client_id, property_id, recommended_at) VALUES (34, 38, 203, '2025-07-12 15:07:08.856511+01');


--
-- TOC entry 5264 (class 0 OID 246316)
-- Dependencies: 252
-- Data for Name: agent_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.agent_settings (user_id, two_factor_enabled, email_notifications, in_app_notifications, new_inquiry_alert, ticket_update_alert, is_available, default_signature, auto_assign_inquiries, theme, default_list_view, sidebar_permanently_expanded, language, last_updated) VALUES (34, false, true, true, true, true, true, '', false, 'system', 'simple', false, 'en', '2025-07-01 22:03:58.486285+01');


--
-- TOC entry 5257 (class 0 OID 246239)
-- Dependencies: 245
-- Data for Name: archived_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5245 (class 0 OID 246062)
-- Dependencies: 233
-- Data for Name: client_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5255 (class 0 OID 246199)
-- Dependencies: 243
-- Data for Name: client_property_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.client_property_preferences (user_id, preferred_property_type, preferred_location, min_price, max_price, min_bedrooms, min_bathrooms, last_updated) VALUES (38, 'Apartment', 'Abuja', 25700000, 100000000, 3, 2, '2025-07-01 21:55:46.612136+01');


--
-- TOC entry 5265 (class 0 OID 246340)
-- Dependencies: 253
-- Data for Name: client_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.client_settings (user_id, email_notifications, in_app_notifications, new_listing_alert, price_drop_alert, favourite_update_alert, preferred_property_type, preferred_location, max_price_alert, theme, default_list_view, language, sidebar_permanently_expanded, last_updated) VALUES (38, true, true, true, true, true, 'any', 'any', 100000000, 'system', 'graphical', 'en', false, '2025-07-01 22:00:03.797737+01');


--
-- TOC entry 5238 (class 0 OID 246012)
-- Dependencies: 226
-- Data for Name: finance_overview; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5251 (class 0 OID 246095)
-- Dependencies: 239
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (5, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 34, 38, 'good', 'agent_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:44:19.861628+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (3, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 34, 38, 'hey', 'agent_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:43:59.83963+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (10, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 34, 38, 'hey', 'agent_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 14:06:39.748523+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (9, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 38, 34, 'm', 'client_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:44:38.688074+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (6, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 38, 34, 'sure', 'client_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:44:23.563372+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (1, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 38, 34, '::shell::', 'initial_inquiry', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:43:33.431779+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (2, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 38, 34, 'hi', 'client_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:43:39.656321+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (4, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 38, 34, 'whats', 'client_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:44:14.361704+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (7, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 38, 34, 'yeah', 'client_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:44:31.905928+01', '2025-07-16 13:35:42.332844+01', false, false);
INSERT INTO public.inquiries (inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) VALUES (8, 'ac219bed-dfd6-49dc-a86c-38fc78492ca0', 38, 34, 3, 34, 38, 'i', 'agent_reply', 'open', true, true, true, true, NULL, NULL, NULL, '2025-07-13 12:44:35.674792+01', '2025-07-16 13:35:42.332844+01', false, false);


--
-- TOC entry 5247 (class 0 OID 246076)
-- Dependencies: 235
-- Data for Name: legal_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.legal_documents (document_id, title, client_name, property_id, document_type, status, upload_date, completion_date, document_url, public_id) VALUES (14, 'Frbgf', '', NULL, 'Sales Deed', 'Completed', '2025-07-15', NULL, 'https://res.cloudinary.com/di22nmygf/raw/upload/v1752612050/criblink/legal_documents/6.%20mod%20WRITING%20SKILLS%20I.%20%20The%20Writing%20Process%20%2Bdrafting.pdf', 'criblink/legal_documents/6. mod WRITING SKILLS I.  The Writing Process +drafting.pdf');
INSERT INTO public.legal_documents (document_id, title, client_name, property_id, document_type, status, upload_date, completion_date, document_url, public_id) VALUES (17, 'Ef', '', NULL, 'Sales Deed', 'Completed', '2025-07-15', NULL, 'https://res.cloudinary.com/di22nmygf/raw/upload/v1752612871/criblink/legal_documents/attachment.pdf', 'criblink/legal_documents/attachment.pdf');
INSERT INTO public.legal_documents (document_id, title, client_name, property_id, document_type, status, upload_date, completion_date, document_url, public_id) VALUES (18, 'AD', '', NULL, 'MOU', 'Completed', '2025-07-16', NULL, 'https://res.cloudinary.com/di22nmygf/raw/upload/v1752694550/criblink/legal_documents/MEE-101.pdf', 'criblink/legal_documents/MEE-101.pdf');
INSERT INTO public.legal_documents (document_id, title, client_name, property_id, document_type, status, upload_date, completion_date, document_url, public_id) VALUES (19, 'Jhh', '', NULL, 'Power of Attorney', 'Completed', '2025-07-16', NULL, 'https://res.cloudinary.com/di22nmygf/raw/upload/v1752696465/criblink/legal_documents/Virtual-Key-Codes-Windows.pdf', 'criblink/legal_documents/Virtual-Key-Codes-Windows.pdf');


--
-- TOC entry 5261 (class 0 OID 246275)
-- Dependencies: 249
-- Data for Name: property_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.property_details (property_details_id, property_id, description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities, last_updated, land_size, zoning_type, title_type) VALUES (1, 5, 'This stunning 4-bedroom family home boasts spacious living areas, a modern kitchen with granite countertops, and a beautifully landscaped garden. Located in a serene and secure neighborhood, it offers easy access to schools, shopping centers, and major highways. Perfect for a growing family looking for comfort and convenience.', 2800, 0.25, 2010, 'Central Heating', 'Central Air', 'Two-car garage, ample driveway space', 'Swimming Pool, Gym, Garden, Balcony, Security, Pet-Friendly', '2025-07-09 13:15:13.783087', NULL, NULL, NULL);


--
-- TOC entry 5242 (class 0 OID 246032)
-- Dependencies: 230
-- Data for Name: property_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (1, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/067d080ad4d5ab-contemporary-5-bedroom-smart-home-with-swimming-pool-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (2, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/0664748fc6963d-contemporary-5-bedroom-smart-home-with-a-maid-rooms-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (3, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/067d0803de636d-contemporary-5-bedroom-smart-home-with-swimming-pool-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (4, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/0664748ff9e008-contemporary-5-bedroom-smart-home-with-a-maid-rooms-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (5, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/0664748fb94abd-contemporary-5-bedroom-smart-home-with-a-maid-rooms-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (6, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/067d08037189d4-contemporary-5-bedroom-smart-home-with-swimming-pool-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (7, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/06647490069433-contemporary-5-bedroom-smart-home-with-a-maid-rooms-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL);
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (8, 209, 'https://res.cloudinary.com/di22nmygf/image/upload/v1752063926/listings/e6vazfzihepto3frsfav.jpg', 'listings/e6vazfzihepto3frsfav');
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (9, 208, 'https://res.cloudinary.com/di22nmygf/image/upload/v1752063969/listings/jsmwnbpk42iu3hil0wdr.jpg', 'listings/jsmwnbpk42iu3hil0wdr');
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (11, 203, 'https://res.cloudinary.com/di22nmygf/image/upload/v1752077439/listings/dmzrj3g2zi5wjqhk2daf.jpg', 'listings/dmzrj3g2zi5wjqhk2daf');
INSERT INTO public.property_images (image_id, property_id, image_url, public_id) VALUES (13, 2, 'https://res.cloudinary.com/di22nmygf/image/upload/v1752698855/listings/yix2byzo6gtwkeagjtwe.jpg', 'listings/yix2byzo6gtwkeagjtwe');


--
-- TOC entry 5240 (class 0 OID 246018)
-- Dependencies: 228
-- Data for Name: property_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (202, 'Sale', '2-Bedroom Apartment', 'Lekki', 'Lagos', 85000000, 'Sold', 4, '2025-03-05', 'Detached House', 4, 3, 'https://bullionriseconsult.com/wp-content/uploads/2024/06/Bungalow-house-The-11-Different-Types-of-House-Design-in-Nigeria-with-pictures-bullionrise-consult-1024x576.png', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (204, 'Rent', '4-Bedroom Duplex', 'Magodo', 'Lagos', 95000000, 'Available', 8, '2025-02-28', 'Bungalow', 2, 2, 'https://images.ctfassets.net/abyiu1tn7a0f/3vTBvQw6GEDHsymU7JL0HB/db64167a9e8e62d3c3577632a99eb394/fully-detached-apartments-for-sale-vgc.jpg', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (207, 'Lease', 'Office Space', 'Yaba', 'Lagos', 60000000, 'Under Offer', 13, '2025-01-10', 'Apartment', 1, 1, 'https://buildingpractice.biz/wp-content/uploads/2025/01/Can-15million-build-a-house-in-Nigeria.png', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (205, 'Lease', 'Luxury Apartment', 'Victoria Island', 'Lagos', 130000000, 'Available', 10, '2025-03-15', 'Duplex', 5, 4, 'https://boomschi.com/wp-content/uploads/2024/09/how-to-build-a-house-2.webp', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (4, 'Sale', '7-Bedroom Luxury Apartment', 'Kubwa', 'Abuja', 1200000000, 'Available', 35, '2025-05-09', 'Duplex', 7, 6, 'https://images.nigeriapropertycentre.com/properties/images/1601074/063cc9471e2339-best-4-bedroom-duplex-deal-detached-duplexes-for-sale-ajah-lagos.jpg', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (3, 'Rent', '2-Bedroom Flat', 'Apo', 'Abuja', 850000, 'Available', 34, '2025-05-09', 'Bungalow', 2, 1, 'https://images.privateproperty.com.ng/large/fetched-4-bedroom-bungalow-all-ensuite-with-an-upstairs-self-contain-security-house-downstairs-and-car-park-space-WmVaceFoDFmr589DWOlq.jpg', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (5, 'Sale', 'Contemporary 5 Bedroom Smart Home with Swimming Pool', 'Chevron', 'Lagos', 330000000, 'featured', 35, '2025-05-14', 'Duplex', 5, 5, 'https://images.nigeriapropertycentre.com/properties/images/1863506/067d080313b988-contemporary-5-bedroom-smart-home-with-swimming-pool-detached-duplexes-for-sale-lekki-lagos.jpeg', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (209, 'Rent', '5-Bedroom Mansion', 'Asokoro', 'Abuja', 200000000, 'featured', 15, '2025-01-25', 'Condo', 2, 2, 'https://images.nigeriapropertycentre.com/properties/images/1769260/064830ae93d5a1-luxury-living-at-its-finest-5-bedroom-detached-duplex-for-sale-ikota-lekki-lagos.jpeg', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (208, 'Long Let', 'Studio Apartment', 'Ikate', 'Lagos', 28000000, 'featured', 14, '2025-02-06', 'Semi-Detached House', 3, 2, 'https://installmenthomes.ng/wp-content/uploads/2021/05/WhatsApp-Image-2021-03-23-at-09.42.07.jpeg', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (203, 'Rent', 'Commercial Plot', 'Ajah', 'Lagos', 45000000, 'featured', 5, '2025-01-18', 'Townhouse', 3, 2, 'https://bullionriseconsult.com/wp-content/uploads/2024/06/Penthouse-The-11-Different-Types-of-House-Design-in-Nigeria-with-pictures-bullionrise-consult-1024x576.png', NULL, NULL);
INSERT INTO public.property_listings (property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id, agency_id) VALUES (2, 'Rent', '5-Bedroom Duplex', 'Ikorodu', 'Lagos', 2200000, 'featured', 35, '2025-05-09', 'Duplex', 5, 4, 'https://images.privateproperty.com.ng/uploaded/c8/54/a1/c854a119-4ef9-4e43-afb9-dde7733a46f2.jpg', NULL, NULL);


--
-- TOC entry 5236 (class 0 OID 245988)
-- Dependencies: 224
-- Data for Name: staff_directory; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (100, 'Alice Johnson', 'Real Estate Agent', 'Agent', 'adrianwiley@mcdaniel-henderson.com', '0701-234-5678', '2024-07-12', 'Active', 1);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (101, 'Bob Smith', 'Real Estate Agent', 'Agent', 'ygeorge@bell.biz', '0802-987-6543', '2024-09-18', 'Active', 2);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (102, 'Carol Williams', 'Real Estate Agent', 'Agent', 'lopezanthony@gmail.com', '0813-456-7890', '2024-08-16', 'Active', 3);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (103, 'Megan Campbell', 'Real Estate Agent', 'Agent', 'byrdtracy@hotmail.com', '0705-112-2334', '2024-07-23', 'Active', 4);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (104, 'Jordan Reynolds', 'Real Estate Agent', 'Agent', 'grossashley@gmail.com', '0816-998-8776', '2023-04-27', 'Active', 5);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (105, 'Andrew Lane Jr.', 'Real Estate Agent', 'Agent', 'juanyoung@ruiz.org', '0703-665-4421', '2023-09-06', 'Active', 6);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (106, 'Stephen Krueger', 'Real Estate Agent', 'Agent', 'christopher58@brown-anderson.org', '0814-555-7788', '2025-04-05', 'Active', 7);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (107, 'Taylor Evans', 'Financial Analyst', 'Finance', 'xorozco@fernandez.com', '0909-334-2211', '2024-11-30', 'Active', 8);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (108, 'Justin Fuller', 'UI/UX Designer', 'Tech', 'allisonmontes@austin-brown.net', '0802-641-9004', '2024-12-13', 'Active', 10);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (109, 'Samantha Hubbard', 'Marketing Lead', 'Marketing', 'rebeccawatkins@cain.com', '0817-755-1230', '2023-06-19', 'Active', 12);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (110, 'Sean Long', 'Real Estate Agent', 'Agent', 'qgonzalez@hotmail.com', '0701-833-4467', '2024-06-03', 'Active', 13);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (111, 'Andrea Hicks', 'Operations Manager', 'Operations', 'xjackson@wagner.com', '0808-990-3142', '2024-11-28', 'Active', 14);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (112, 'Sandra Peterson', 'Legal Officer', 'Legal', 'rachelpineda@hotmail.com', '0803-120-4533', '2023-12-25', 'Active', 15);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (113, 'Dr. Lauren Nunez', 'UI/UX Designer', 'Tech', 'goodmanlaura@gmail.com', '0805-622-8899', '2023-06-28', 'Active', 16);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (114, 'Jason Nelson', 'Backend Developer', 'Tech', 'jonesjonathan@yahoo.com', '0811-234-5677', '2023-07-19', 'Active', 18);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (115, 'Brian Bass', 'UI/UX Designer', 'Tech', 'mary09@yahoo.com', '0902-345-6781', '2024-01-02', 'Active', 19);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (116, 'Vincent Mckenzie', 'Client Relationship Mgr', 'Agent', 'richardevans@howell.com', '0701-444-5523', '2023-11-29', 'Active', 20);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (117, 'Thomas Anderson', 'IT Support', 'Tech', 'stephaniethomas@frye.info', '0815-763-2204', '2025-02-21', 'Active', 21);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (118, 'Fred Rogers', 'UI/UX Designer', 'Tech', 'abigail58@duncan.org', '0904-812-3795', '2024-08-20', 'Active', 22);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (119, 'Paul Miller', 'UI/UX Designer', 'Tech', 'baileystephen@farrell.biz', '0702-789-4561', '2024-12-14', 'Active', 23);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (120, 'Ann Olson', 'Client Relationship Mgr', 'Agent', 'bennettkenneth@yahoo.com', '0810-045-6239', '2023-05-29', 'Active', 24);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (121, 'Dr. Edwin James', 'Backend Developer', 'Tech', 'ymiller@gmail.com', '0807-154-9328', '2025-03-03', 'Active', 25);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (122, 'Danielle Thomas', 'IT Support', 'Tech', 'shepherdjohn@clark.org', '0901-324-8765', '2024-07-22', 'Active', 28);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (123, 'Jesse Gonzalez', 'Backend Developer', 'Tech', 'frank66@simpson.com', '0816-573-4902', '2025-04-09', 'Active', 30);
INSERT INTO public.staff_directory (employee_id, full_name, role, department, email, phone, start_date, status, user_id) VALUES (124, 'Catherine Hendrix', 'Marketing Lead', 'Marketing', 'alexanderhall@francis-goodwin.biz', '0704-938-1256', '2024-06-16', 'Active', 31);


--
-- TOC entry 5249 (class 0 OID 246088)
-- Dependencies: 237
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5243 (class 0 OID 246045)
-- Dependencies: 231
-- Data for Name: user_favourites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (38, 4, '2025-07-01 21:31:06.844253+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (38, 204, '2025-07-01 21:31:20.101109+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (38, 208, '2025-07-01 21:31:32.31437+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (38, 202, '2025-07-12 15:07:32.214564+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (38, 205, '2025-07-12 15:07:55.249603+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (35, 5, '2025-07-13 12:50:23.96831+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (35, 209, '2025-07-13 12:50:31.232387+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (35, 203, '2025-07-13 12:50:37.412192+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (35, 204, '2025-07-13 12:50:49.495022+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (35, 202, '2025-07-13 12:51:00.856941+01');
INSERT INTO public.user_favourites (user_id, property_id, created_at) VALUES (35, 207, '2025-07-13 12:51:08.25386+01');


--
-- TOC entry 5235 (class 0 OID 245973)
-- Dependencies: 223
-- Data for Name: user_login_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (1, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-01 21:29:56.30936', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (2, 38, 'Unknown', 'Unknown', 'Unknown', '2025-07-01 21:30:42.455999', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (3, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-01 22:04:39.233528', 'Failed', 'Invalid password');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (4, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-01 22:04:42.571172', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (5, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-01 22:16:22.855035', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (6, 38, 'Unknown', 'Unknown', 'Unknown', '2025-07-02 00:44:06.971955', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (7, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-02 00:53:33.354839', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (8, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-02 00:54:53.121186', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (9, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-02 22:24:05.926337', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (10, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-03 01:35:15.434605', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (11, 38, 'Unknown', 'Unknown', 'Unknown', '2025-07-09 13:06:47.201524', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (12, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-09 13:14:43.921004', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (13, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-09 17:10:09.138008', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (14, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-10 21:10:17.193389', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (15, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-10 21:10:41.902456', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (16, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-10 21:19:25.792962', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (17, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-10 21:20:05.504325', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (49, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-12 15:06:06.037742', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (50, 38, 'Unknown', 'Unknown', 'Unknown', '2025-07-12 15:07:17.743391', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (51, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-12 15:08:03.5798', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (52, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-12 15:08:59.134222', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (53, 38, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 12:41:56.544127', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (54, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 12:42:47.171012', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (55, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 12:45:50.939111', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (56, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 13:41:52.128002', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (57, 38, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 14:07:05.752155', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (58, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 14:10:00.041234', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (59, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 14:42:25.790678', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (60, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:16:10.518647', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (61, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:18:41.202204', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (62, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:29:33.061636', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (63, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:29:53.469219', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (64, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:41:13.271543', 'Failed', 'Invalid password');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (65, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:41:24.462282', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (66, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-13 15:42:06.676151', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (67, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-15 05:42:38.190824', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (68, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 00:12:26.353936', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (69, 34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', 'Unknown', '::1', '2025-07-16 01:22:04.210263', 'Failed', 'Server error during signin.');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (70, 34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', 'Unknown', '::1', '2025-07-16 01:30:14.788962', 'Success', 'Login successful');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (71, 34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', 'Unknown', '::1', '2025-07-16 01:30:31.011951', 'Success', 'Login successful');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (72, 34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', 'Unknown', '::1', '2025-07-16 01:39:54.283911', 'Success', 'Login successful');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (73, 34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', 'Unknown', '::1', '2025-07-16 01:43:37.731293', 'Success', 'Login successful');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (74, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 01:43:56.842362', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (75, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 01:55:13.405984', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (76, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 02:04:55.950486', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (77, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 02:48:47.497886', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (78, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 08:58:43.329373', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (79, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 08:59:15.942634', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (80, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 09:17:24.104282', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (81, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 09:18:52.892035', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (82, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 09:24:11.533881', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (83, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 11:42:14.666396', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (84, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 11:43:09.254858', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (85, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 12:42:58.64763', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (86, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 12:43:57.495627', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (87, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 12:44:32.550092', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (88, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:23:56.99991', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (89, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:24:24.222528', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (90, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:25:08.085049', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (91, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:29:49.733735', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (92, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:31:07.655768', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (93, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:35:27.734461', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (94, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:36:43.833089', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (95, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 14:02:43.960265', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (96, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 14:04:39.565153', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (97, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 20:10:31.607315', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (98, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 20:34:58.548253', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (99, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:00:01.073736', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (100, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:02:28.661912', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (101, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:02:52.087609', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (102, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:03:15.778827', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (103, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:05:26.935338', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (104, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:06:53.793721', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (105, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:19:55.951121', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (106, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:21:43.888201', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (107, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:25:55.090622', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (108, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:26:42.348093', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (109, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:54:04.719326', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (110, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:07:30.546714', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (111, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:11:21.535445', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (112, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:16:25.069313', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (113, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:17:35.835267', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (114, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:18:01.094632', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (115, 35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:26:08.266621', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (116, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:26:39.678243', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (117, 36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 23:02:01.510951', 'Success', 'Successful login');
INSERT INTO public.user_login_history (history_id, user_id, device, location, ip_address, login_time, status, message) VALUES (118, 34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 23:02:34.236687', 'Success', 'Successful login');


--
-- TOC entry 5233 (class 0 OID 245958)
-- Dependencies: 221
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:03:15.776759', false, '2025-07-16 21:03:15.776759', '2d237799-a1ea-4a16-b245-313eb5e5ab8b');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:06:53.791558', false, '2025-07-16 21:06:53.791558', 'fe6474bf-110a-4c65-92e1-c7b0cd97e833');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:21:43.886163', false, '2025-07-16 21:21:43.886163', '7d1243b9-fb7e-4a39-ab61-8d437e760e44');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:17:35.832668', false, '2025-07-16 22:17:35.832668', 'de413bc1-4d3c-4830-bca9-2b2653e20fcc');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 23:02:01.505127', true, '2025-07-16 23:02:01.505127', 'e730aac6-1b36-433b-869a-df5cf5379875');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', NULL, '::1', '2025-07-16 01:30:14.779613', false, '2025-07-16 01:30:14.779613', 'b42c82d0-1868-45ac-937b-3eb16234dc4c');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', NULL, '::1', '2025-07-16 01:30:31.003414', false, '2025-07-16 01:30:31.003414', 'bf836b75-0385-4c45-a120-d1f732866d64');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', NULL, '::1', '2025-07-16 01:39:54.270659', false, '2025-07-16 01:39:54.270659', '8f330dfd-ead0-4f06-aa74-90d719c1b57f');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', NULL, '::1', '2025-07-16 01:43:37.716692', false, '2025-07-16 01:43:37.716692', 'a940d85e-f059-452c-a4ef-0f2a7bf4d441');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 01:43:56.840187', false, '2025-07-16 01:43:56.840187', '291c8d38-cda2-493a-b923-fa363b3f0c44');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 01:55:13.40427', false, '2025-07-16 01:55:13.40427', '1e0b62ed-8c91-40d8-9270-9fa3c71e8894');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 02:04:55.948853', false, '2025-07-16 02:04:55.948853', 'c3d0a303-d84c-43a5-990b-1de4fb7b75c4');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 02:48:47.491017', false, '2025-07-16 02:48:47.491017', '4d0703c2-8e78-4b84-ac20-88ff01ed7d73');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:35:27.732434', false, '2025-07-16 13:35:27.732434', '2ce9b852-45b6-48f3-a433-c414ed29cc15');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 14:02:43.955385', false, '2025-07-16 14:02:43.955385', 'a43c0021-b3ed-4c9a-a850-a21255fa090d');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 08:59:15.940435', false, '2025-07-16 08:59:15.940435', 'db099d52-2a20-4d03-b2d9-0499aa1233f9');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:26:42.345971', false, '2025-07-16 21:26:42.345971', '846ed224-f544-484c-9feb-9c0e76473824');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:26:08.261171', true, '2025-07-16 22:26:08.261171', '3c321f4f-095a-4053-b907-6b6f3b9ef988');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 20:10:31.372194', false, '2025-07-16 20:10:31.372194', '9380df11-814d-41ed-be31-0e82257ec0b1');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:00:01.070923', false, '2025-07-16 21:00:01.070923', '2c3ff8ae-462e-4e80-b5f3-8875a2a9ac47');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:02:52.08547', false, '2025-07-16 21:02:52.08547', 'c3baa943-e9e3-4e5e-8b63-050abe30755a');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 11:43:09.25136', false, '2025-07-16 11:43:09.25136', '39401141-77c2-4e7c-9e95-076a0fa17db7');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 12:43:57.493459', false, '2025-07-16 12:43:57.493459', '4ee6b769-6806-42aa-82b7-3ed405220d2b');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:23:56.997759', false, '2025-07-16 13:23:56.997759', '24821f85-f24c-4ece-8398-db181d2dc1af');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:25:08.082194', false, '2025-07-16 13:25:08.082194', '1d801744-a210-4647-aa23-62e1828f7097');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 14:04:39.562948', false, '2025-07-16 14:04:39.562948', '461cf9d9-0fc3-41a3-a3f9-a6b3e604a09c');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 20:34:58.530515', false, '2025-07-16 20:34:58.530515', '5fac7ee9-45d9-4f67-899f-a4357cff75db');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (36, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:02:28.659754', false, '2025-07-16 21:02:28.659754', 'c0913f16-7758-44e0-9f6e-770e9258d306');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:07:30.538624', false, '2025-07-16 22:07:30.538624', '015de874-a38d-4960-9612-f2577a6e13d5');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 08:58:43.320517', false, '2025-07-16 08:58:43.320517', '65301836-e1eb-42f6-bb44-72e909041682');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 09:17:24.095518', false, '2025-07-16 09:17:24.095518', 'a69df13d-4d66-495a-864e-5bf9d849648d');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 09:18:52.882519', false, '2025-07-16 09:18:52.882519', '64703765-cd5d-4ff7-855c-4d8c3b94c693');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 09:24:11.525371', false, '2025-07-16 09:24:11.525371', '22e47a1c-d717-4bac-afaa-f43da76be6aa');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 12:42:58.635799', false, '2025-07-16 12:42:58.635799', 'ebb1bad0-e0ea-43fb-86c5-08a99d5e2169');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 12:44:32.547919', false, '2025-07-16 12:44:32.547919', '08832f4c-4e9c-4110-a6c2-c73d02eae7e1');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:24:24.220383', false, '2025-07-16 13:24:24.220383', 'c922a2c9-f152-4398-9769-fadb82887e85');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:29:49.730867', false, '2025-07-16 13:29:49.730867', '3e7387ff-adcf-48d9-80a0-f3d82ac15e24');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:31:07.653027', false, '2025-07-16 13:31:07.653027', 'd76d2715-a52e-487a-9839-619f44991657');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 13:36:43.830819', false, '2025-07-16 13:36:43.830819', '29f02e3e-981c-4353-8127-28c76d29149c');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:05:26.932804', false, '2025-07-16 21:05:26.932804', 'f72b4095-be36-44c2-aa24-720ef05c1c43');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:19:55.948862', false, '2025-07-16 21:19:55.948862', '239fe8b4-d51d-49b4-81a3-3b4421168985');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:25:55.088038', false, '2025-07-16 21:25:55.088038', '550007b6-1eb3-4e1b-a7e9-346eae92b813');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 21:54:04.710004', false, '2025-07-16 21:54:04.710004', 'bd989bd7-3947-4c7f-bb25-eab9fc500998');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:11:21.533458', false, '2025-07-16 22:11:21.533458', '82c081a3-134b-4cb1-b64d-a72ae008f827');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:16:25.053973', false, '2025-07-16 22:16:25.053973', '17bed48e-3f55-46c8-9d9a-25085c4e36f2');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (35, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 11:42:14.512752', false, '2025-07-16 11:42:14.512752', '3fd094f8-5d96-4e1f-b488-7cee09bea1dc');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:18:01.09233', false, '2025-07-16 22:18:01.09233', '315134fd-5a98-48c2-b19c-d806bf085dec');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 22:26:39.676319', false, '2025-07-16 22:26:39.676319', 'd5ba603c-6946-47cc-9425-5fccceb15272');
INSERT INTO public.user_sessions (user_id, device, location, ip_address, last_activity, is_current, created_at, session_id) VALUES (34, 'Unknown', 'Unknown', 'Unknown', '2025-07-16 23:02:34.209008', true, '2025-07-16 23:02:34.209008', '0c1b6206-3524-42ed-9e9a-5e684558a25d');


--
-- TOC entry 5232 (class 0 OID 245925)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (1, 'Alice Johnson', 'q', 'alice@example.com', '$2b$12$eImiTXuWVxfM37uY4JANjQ==', 'admin', '2024-01-15 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (2, 'Bob Smith', 'w', 'bob@example.com', '$2b$12$abcdefgWVxfM37uY4JANjQ==', 'agent', '2024-02-20 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (3, 'Carol Williams', 'e', 'carol@example.com', '$2b$12$1234567WVxfM37uY4JANjQ==', 'client', '2024-03-05 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (4, 'Megan Campbell', 'r', 'dominiquewaters@hotmail.com', '997b2ea57c209511619910541da3592a6cce090627b793cff9e185062c6ab371', 'agent', '2024-11-21 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (5, 'Jordan Reynolds', 't', 'michael03@yahoo.com', 'e4bbd81270a2fb11c65f1c30bcd18d35d280333880399c60e05141f2d5414a76', 'agent', '2022-05-24 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (6, 'Andrew Lane Jr.', 'y', 'kenttucker@perkins-morris.com', '5b8483d7afa4fa27459cf19b7a71acb2cf7aedcd5f937174acae9e359f49cf6e', 'admin', '2023-07-23 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (7, 'Stephen Krueger', 'u', 'wagnercassandra@kennedy.org', 'c1866e6f7fc7ab8fb10d97f321fbe514723e9181efa1b6ae9fb66b63e36aed89', 'admin', '2022-01-05 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (8, 'Taylor Evans', 'i', 'oliviaross@howard-davidson.biz', '07a3fdeda022429378f3d0abfa6e6890aedb2e3193f484b5d18118a148ad6ae3', 'agent', '2024-02-08 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (9, 'Brandon Stevens', 'o', 'jennifer97@fields.biz', 'f2ead8f409dc3be785803a5ff1cea94de3853e8068ef53215cb2a0ccfcfefc07', 'client', '2024-11-26 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (10, 'Justin Fuller', 'p', 'ucampbell@kelly.com', '96ac998731e92a586a16ed635f4121d876ce22ac4479138cc5d65eb29ce2b725', 'agent', '2020-09-24 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (11, 'Thomas Franklin', 'a', 'ashley19@bond-martinez.com', 'b243dfc528e334df2212a8d06fd2e9aae73fc2a3d905b4aa0e01fa80420b5835', 'client', '2021-01-22 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (12, 'Samantha Hubbard', 's', 'rosegina@hotmail.com', '2b6b24a357e0d2a1707da7dda5a436536d6b95fa2019f5d45d60a823b10c2e79', 'agent', '2023-10-17 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (13, 'Sean Long', 'd', 'brownheather@white.org', '33c7ad3bbaa2b92659eb2cf811edd6754c49464b4bcb1185b0ccb793ba24b92b', 'agent', '2023-09-25 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (14, 'Andrea Hicks', 'f', 'kaylamcguire@martinez.info', '0a050daffdc300e5921d5a51eb3f9e98ec0f06313986a914d4b30dfcd9135f4d', 'agent', '2020-07-19 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (15, 'Sandra Peterson', 'g', 'alyssahays@yahoo.com', '922e4a625a791f2b5cfff77644e582b74e7ae74bfa120a8297ed932572b9c857', 'agent', '2020-03-31 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (16, 'Dr. Lauren Nunez', 'h', 'rroberson@gmail.com', '76e46e3b1d51563fab7683059dad72f1f6de4c2c6d2ead192e85ffcf363320a9', 'agent', '2020-09-24 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (17, 'Jose Powell', 'j', 'leekimberly@hotmail.com', '8f57dec80a674af416bb9e6e3ac56d2a2d4efc319da365c7ff64c4eb76501bd9', 'client', '2020-11-14 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (18, 'Jason Nelson', 'k', 'jennifer99@poole.com', '3c4e29439eaac31668925a70304f24f5014e2567339a13c76899a0c04030a5f6', 'admin', '2023-06-22 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (19, 'Brian Bass', 'l', 'jennifer26@robinson.com', '429c8b2a6fd017b63bd131f7d8db7595eeb13e8ff7cad6b7ff228b2e8e90fe56', 'agent', '2022-09-13 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (20, 'Vincent Mckenzie', 'z', 'schultzandrea@gardner.com', '1cd84b5db889928c9def794142139dc0bddc29116287158cc6acebd22c7918e2', 'agent', '2022-05-26 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (21, 'Thomas Anderson', 'x', 'andrewgomez@gmail.com', '423e031303da39426be3fb27fa12b7ce4a98511ad1ba6fe16c568f55ab3927ef', 'agent', '2022-07-26 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (22, 'Fred Rogers', 'c', 'dmartin@arroyo.com', 'd96691c093ffd31d6e139e8588b23dfed9d7db97f32dc2441c64cef8f1353feb', 'agent', '2024-08-19 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (23, 'Paul Miller', 'v', 'christophermoore@gonzalez.com', 'bfb7e3555f7c0f1689df295265d38b32d37d7fee4f0613967a18f73d0c08d041', 'agent', '2023-08-21 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (24, 'Ann Olson', 'b', 'kendra68@martin.net', '2df607efad925d6e845e24d30fa70d4831af108fffdeb5ec2e815625e713d674', 'admin', '2021-05-08 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (25, 'Dr. Edwin James', 'n', 'vanderson@estrada.com', 'f8d2df57a23de6f64ffa5114dfa2bb53c69507cc1c0ee23f99770eecf2148a83', 'admin', '2024-07-20 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (26, 'Carl Walton', 'm', 'gregory39@yahoo.com', '243cade33cb022bd63021bba61ed64563f410d8d769aaac486d100a7f2b587bc', 'client', '2021-07-30 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (27, 'Robin Davis', 'qw', 'amyochoa@white-moore.com', '65c8aab4694ee03da2693a46415294d06b3d6faa17a7cc67a25e029ba168c9d0', 'client', '2024-12-21 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (28, 'Danielle Thomas', 'er', 'alexis93@brown.com', 'a393dfa999a1c6c5baa92a949d17bf622b8203c00b270712e98889d6afc0cfff', 'admin', '2020-04-16 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (29, 'Julie Clark', 'ty', 'bellchristina@hotmail.com', '64f19f0a4bea68d2b2b53db87b09dce23294a6483e8a26861c773b1c28c15dff', 'client', '2020-09-08 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (30, 'Jesse Gonzalez', 'ui', 'ymartinez@bowman.com', 'bd4f7871b1fef133a33e362e11b3a17183aa989aa799f2aa291e283bcb766d0b', 'agent', '2021-08-06 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (31, 'Catherine Hendrix', 'oi', 'zharvey@johnson.org', 'e3f550f767f43b21dc231e14b32085ce6cde94b0bae7d239a5675ea9f595e141', 'agent', '2025-01-01 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (32, 'Laura Hudson', 'pa', 'qbarnes@yahoo.com', 'b536f0b9503a8d7e45ba9755cf4ed03fe0295b932d18f936df9691b7dc5f5d30', 'agent', '2025-03-13 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (33, 'Beverly Navarro', 'sd', 'vreed@yahoo.com', '9bd23459f52e32749bda9efdc0d7dcc83afac38bf52b135c3692f9a847562175', 'agent', '2024-10-08 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (37, 'Jackie Chan', 'jk', 'jackiechan@gmail.com', '$2b$10$f.UN2mF1Jys7OVeeIcJcQuJeBEpZNRoPOkYKgmviSxeSEkGQfO6o.', 'client', '2025-05-23 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (40, 'Crib Link', 'zx', 'criblink@gmail.com', '$2b$10$JwRzD3BJaJ4q5OA2qUKlNOUYCDQCdcedrwczzpjnLCt.Mcco90AkS', 'agent', '2025-05-23 00:00:00', '7046015410', NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (41, 'masfa a', 'xc', 'af@gmail.com', '$2b$10$kxqQvPGcia4AnUH.rcz0geYC6oqqcJCZ1abBWADZLjpvx8.MwQAce', 'admin', '2025-05-23 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (39, 'Jet Li', 'cv', 'jetli@gmail.com', '$2b$10$9Jnx9IKRICYht8dX1/AmBu9FB9a7P6SIMTmLcFeCwPg66GBadr0EC', 'agent', '2025-05-23 00:00:00', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (35, 'Matthew Tedunjaiye', 'criblinker', 'tedunjaiyem@gmail.com', '$2a$06$7RKmVfWkwbCpPP4nRrUD3.417E6sJJfn.jVa9RgyqNbDvfB0Ts1TC', 'admin', '2025-05-08 00:00:00', '0704-601-5410', '', 'Oludasile CribLink', '', 'https://res.cloudinary.com/di22nmygf/image/upload/v1751413288/profile_pictures/crgapo3ifqngwjf68qxr.jpg', 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, 'UTC+1', 'NGN', '/admin/dashboard', '', 'email', '[]', NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (38, 'Bruce Lee', 'lz', 'brucelee@gmail.com', '$2b$10$k21iGx5QHGc.LZ31v9MQ8e3dp3sPPzdvJWGM.0gYKGRLh9n/k2Xs2', 'client', '2025-05-23 00:00:00', '', '', '', '', 'https://res.cloudinary.com/di22nmygf/image/upload/v1751413468/profile_pictures/htjexahwxzbufvqcgbgi.jpg', 'active', NULL, NULL, NULL, false, false, true, '{"analytics": true, "essential": true, "marketing": true, "functional": true}', true, true, false, true, true, '{"email_alerts": true, "in_app_messages": true, "push_notifications": true}', 'UTC+1', 'NGN', '/client/inquiries', '', 'email', '[]', NULL, NULL, '2025-07-16 21:19:25.386949+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (36, 'Peter Parker', 'gh', 'peterparker@gmail.com', '$2b$10$zQt3aR1V7iQMZUpds7tuH.jHcpM.bPMym2hBpQsDVaU0//u88Av8i', 'agency_admin', '2025-05-12 00:00:00', NULL, 'AdinKems Properties', NULL, NULL, 'https://res.cloudinary.com/di22nmygf/image/upload/v1752696244/criblink/profile_pictures/gvo1yy6kblxmj84kbw5t.jpg', 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'criblink/profile_pictures/gvo1yy6kblxmj84kbw5t', 3, '2025-07-16 23:17:56.393544+01');
INSERT INTO public.users (user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, profile_picture_public_id, agency_id, updated_at) VALUES (34, 'Tony Stark', 'fg', 'tonystark@gmail.com', '$2b$10$k48G97/fsZClKxKqAYTJluZ58aQ.Rlbhq7.M415fcdP3D7SDkHjCe', 'agency_admin', '2025-05-06 00:00:00', '', 'AdinKems Properties', '', '', 'https://res.cloudinary.com/di22nmygf/image/upload/v1752697225/criblink/profile_pictures/awoo7tgv4tll0zrsj8ch.jpg', 'active', NULL, NULL, NULL, false, false, true, NULL, true, true, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[]', 'criblink/profile_pictures/awoo7tgv4tll0zrsj8ch', 3, '2025-07-16 22:17:04.362741+01');


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 246
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 239, true);


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 250
-- Name: admin_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_settings_id_seq', 1, false);


--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 254
-- Name: agencies_agency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agencies_agency_id_seq', 3, true);


--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 257
-- Name: agency_members_agency_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agency_members_agency_member_id_seq', 10, true);


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 241
-- Name: agent_client_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_client_requests_request_id_seq', 1, false);


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 232
-- Name: client_interactions_interaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_interactions_interaction_id_seq', 1, false);


--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 238
-- Name: inquiries_inquiry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inquiries_inquiry_id_seq', 10, true);


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 234
-- Name: legal_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.legal_documents_document_id_seq', 19, true);


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 248
-- Name: property_details_property_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.property_details_property_details_id_seq', 1, false);


--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 229
-- Name: property_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.property_images_image_id_seq', 13, true);


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 227
-- Name: property_listings_property_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.property_listings_property_id_seq', 1, false);


--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 236
-- Name: support_tickets_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_tickets_ticket_id_seq', 1, false);


--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 222
-- Name: user_login_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_login_history_history_id_seq', 118, true);


--
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);


-- Completed on 2025-07-17 00:06:43

--
-- PostgreSQL database dump complete
--


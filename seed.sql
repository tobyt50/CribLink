-- seed.sql
-- This file contains \copy statements to load data into tables from corresponding CSV files.

\copy users(user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, profile_picture_public_id, status, reset_token, reset_token_expires, last_login, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, share_favourites_with_agents, share_property_preferences_with_agents, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links) FROM 'users.csv' DELIMITER ',' CSV HEADER

\copy user_sessions(session_id, user_id, device, location, ip_address, last_activity, is_current, created_at) FROM 'user_sessions.csv' DELIMITER ',' CSV HEADER

\copy user_login_history(history_id, user_id, device, location, ip_address, login_time, status, message) FROM 'user_login_history.csv' DELIMITER ',' CSV HEADER

\copy staff_directory(employee_id, full_name, role, department, email, phone, start_date, status, user_id) FROM 'staff_directory.csv' DELIMITER ',' CSV HEADER

\copy agent_performance(user_id, full_name, deals_closed, revenue, avg_rating, properties_assigned, client_feedback, region, commission_earned) FROM 'agent_performance.csv' DELIMITER ',' CSV HEADER

\copy finance_overview(month, revenue, expenses, net_profit) FROM 'finance_overview.csv' DELIMITER ',' CSV HEADER

\copy property_listings(property_id, purchase_category, title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, image_url, image_public_id) FROM 'property_listings.csv' DELIMITER ',' CSV HEADER

\copy property_images(image_id, property_id, image_url, public_id) FROM 'property_images.csv' DELIMITER ',' CSV HEADER

\copy user_favourites(user_id, property_id, created_at) FROM 'user_favourites.csv' DELIMITER ',' CSV HEADER

\copy client_interactions(interaction_id, client_name, email, interaction_type, interaction_date, notes, agent_id, follow_up_date) FROM 'client_interactions.csv' DELIMITER ',' CSV HEADER

\copy legal_documents(document_id, title, client_name, property_id, document_type, status, upload_date, completion_date) FROM 'legal_documents.csv' DELIMITER ',' CSV HEADER

\copy support_tickets(ticket_id, issue, status, assigned_to, date_logged) FROM 'support_tickets.csv' DELIMITER ',' CSV HEADER

\copy inquiries(inquiry_id, conversation_id, client_id, agent_id, property_id, sender_id, recipient_id, message_content, message_type, status, read_by_client, read_by_agent, is_agent_responded, is_opened, name, email, phone, created_at, updated_at, hidden_from_client, hidden_from_agent) FROM 'inquiries.csv' DELIMITER ',' CSV HEADER

\copy agent_clients(agent_id, client_id, relationship_started, notes, status, request_status) FROM 'agent_clients.csv' DELIMITER ',' CSV HEADER

\copy agent_client_requests(request_id, sender_id, receiver_id, sender_role, receiver_role, status, message, created_at, updated_at) FROM 'agent_client_requests.csv' DELIMITER ',' CSV HEADER

\copy client_property_preferences(user_id, preferred_property_type, preferred_location, min_price, max_price, min_bedrooms, min_bathrooms, last_updated) FROM 'client_property_preferences.csv' DELIMITER ',' CSV HEADER

\copy agent_recommended_listings(agent_id, client_id, property_id, recommended_at) FROM 'agent_recommended_listings.csv' DELIMITER ',' CSV HEADER

\copy archived_clients(agent_id, client_id, archived_at, notes, status, request_status) FROM 'archived_clients.csv' DELIMITER ',' CSV HEADER

\copy activity_logs(id, message, actor_name, user_id, type, timestamp) FROM 'activity_logs.csv' DELIMITER ',' CSV HEADER

\copy property_details(property_details_id, property_id, description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities, last_updated) FROM 'property_details.csv' DELIMITER ',' CSV HEADER

\copy admin_settings(id, default_list_view, sidebar_permanently_expanded, email_notifications, sms_notifications, in_app_notifications, sender_email, smtp_host, require_2fa, min_password_length, crm_integration_enabled, analytics_id, auto_approve_listings, enable_comments, maintenance_mode, database_backup_scheduled, last_updated) FROM 'admin_settings.csv' DELIMITER ',' CSV HEADER

\copy agent_settings(user_id, two_factor_enabled, email_notifications, in_app_notifications, new_inquiry_alert, ticket_update_alert, is_available, default_signature, auto_assign_inquiries, theme, default_list_view, sidebar_permanently_expanded, language, last_updated) FROM 'agent_settings.csv' DELIMITER ',' CSV HEADER

\copy client_settings(user_id, email_notifications, in_app_notifications, new_listing_alert, price_drop_alert, favourite_update_alert, preferred_property_type, preferred_location, max_price_alert, theme, default_list_view, language, sidebar_permanently_expanded, last_updated) FROM 'client_settings.csv' DELIMITER ',' CSV HEADER

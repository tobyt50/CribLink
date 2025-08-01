--for resetting users sequence
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

--for resetting listings sequence
SELECT setval('property_listings_property_id_seq', (SELECT MAX(property_id) FROM property_listings));
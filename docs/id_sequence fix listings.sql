BEGIN;

-- 1️⃣ Create a mapping table for old → new property IDs
CREATE TEMP TABLE property_id_map AS
SELECT property_id AS old_id,
       ROW_NUMBER() OVER (ORDER BY property_id) AS new_id
FROM property_listings;

-- 2️⃣ Update all referencing tables
UPDATE agent_recommended_listings arl
SET property_id = m.new_id
FROM property_id_map m
WHERE arl.property_id = m.old_id;

UPDATE inquiries i
SET property_id = m.new_id
FROM property_id_map m
WHERE i.property_id = m.old_id;

UPDATE legal_documents ld
SET property_id = m.new_id
FROM property_id_map m
WHERE ld.property_id = m.old_id;

UPDATE property_details pd
SET property_id = m.new_id
FROM property_id_map m
WHERE pd.property_id = m.old_id;

UPDATE property_images pi
SET property_id = m.new_id
FROM property_id_map m
WHERE pi.property_id = m.old_id;

UPDATE user_favourites uf
SET property_id = m.new_id
FROM property_id_map m
WHERE uf.property_id = m.old_id;

UPDATE user_favourites_properties ufp
SET property_id = m.new_id
FROM property_id_map m
WHERE ufp.property_id = m.old_id;

-- 3️⃣ Update property_listings itself
UPDATE property_listings pl
SET property_id = m.new_id
FROM property_id_map m
WHERE pl.property_id = m.old_id;

-- 4️⃣ Reset the sequence so new inserts start after max ID
SELECT setval('property_listings_property_id_seq', (SELECT MAX(property_id) FROM property_listings) + 1);

COMMIT;

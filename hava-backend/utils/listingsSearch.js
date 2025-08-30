// utils/listingsSearch.js
const searchConfig = require("../config/searchSynonyms.json");
const nigeriaLocations = require("../config/nigeriaLocations.json");
const {
  normalizeQuery,
  extractAmenities,
  extractNumbers,
  extractQualifiers,
  noiseWords,
    detectPropertyType,
    extractPriceRange,
} = require("../utils/searchParser");

function buildListingsQuery(reqQuery, user) {
  const {
    purchase_category,
    search,
    min_price,
    max_price,
    page,
    limit,
    status,
    agent_id,
    sortBy,
    location,
    state,
    property_type,
    bedrooms,
    bathrooms,
    living_rooms,
    kitchens,
    land_size,
    zoning_type,
    title_type,
    agency_id: queryAgencyId,
  } = reqQuery;

  const userRole = user ? user.role : "guest";
  const userId = user ? user.user_id : null;
  const userAgencyId = user ? user.agency_id : null;

  // --- Helper: convert words to numbers ---
  const numberWords = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };

  // --- Helper: parse numeric input (words, digits, '>=2', '< 3', 'at least 2', etc.) ---
  function parseNumberInput(input) {
    if (!input) return null;
    let str = input.toString().trim().toLowerCase();

    // Phrase operators -> symbolic operators
    if (/^(at\s*least|minimum)\s+/.test(str)) {
      str = str.replace(/^(at\s*least|minimum)\s+/, ">= ");
    } else if (/^(at\s*most|maximum)\s+/.test(str)) {
      str = str.replace(/^(at\s*most|maximum)\s+/, "<= ");
    } else if (/^(more\s+than|over|above|greater\s+than)\s+/.test(str)) {
      str = str.replace(/^(more\s+than|over|above|greater\s+than)\s+/, "> ");
    } else if (/^(less\s+than|under|below)\s+/.test(str)) {
      str = str.replace(/^(less\s+than|under|below)\s+/, "< ");
    }

    const m = str.match(/^(>=|<=|>|<|=)?\s*(\d+|\w+)$/);
    if (!m) return null;

    const op = m[1] || "=";
    const raw = m[2];
    const val = numberWords[raw] ?? parseInt(raw, 10);
    if (!Number.isInteger(val)) return null;

    return { operator: op, value: val };
  }

  // --- If land size extracted from search as text, normalize to numeric sqm where possible
  function parseLandSizeToSqm(text) {
    if (!text) return null;
    const m = String(text).match(/(\d+(?:\.\d+)?)\s*(sqm|square\s*meters?|m2|acre|acres|hectare|hectares|ha)\b/i);
    if (!m) return null;
    const val = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (!isFinite(val)) return null;
    if (unit.startsWith("sqm") || unit.startsWith("square") || unit === "m2") return val;
    if (unit.startsWith("acre")) return val * 4046.8564224;
    if (unit.startsWith("hectare") || unit === "ha") return val * 10000;
    return null;
  }

  let baseQuery = `
    FROM property_listings pl
    LEFT JOIN property_details pd ON pl.property_id = pd.property_id
    LEFT JOIN users u ON pl.agent_id = u.user_id
    LEFT JOIN agencies a ON pl.agency_id = a.agency_id
  `;

  let conditions = [];
  let values = [];
  let valueIndex = 1;

  // --- Status handling ---
  const normalizedStatus = status?.toLowerCase();
  if (status && normalizedStatus !== "all" && normalizedStatus !== "all statuses") {
    if (normalizedStatus === "featured") {
      conditions.push(`pl.is_featured = TRUE AND pl.featured_expires_at > NOW()`);
    } else {
      conditions.push(`pl.status ILIKE $${valueIndex++}`);
      values.push(status);
    }
  } else {
    if (userRole === "client" || userRole === "guest") {
      conditions.push(`pl.status ILIKE $${valueIndex++}`);
      values.push("available");
    } else if (userRole === "agent") {
      conditions.push(`(pl.status ILIKE ANY($${valueIndex++}) OR pl.agent_id = $${valueIndex++})`);
      values.push(["available", "sold", "under offer"], userId);
    } else if (userRole === "agency_admin" && userAgencyId) {
      conditions.push(
        `((pl.agency_id = $${valueIndex++}) OR (pl.agency_id != $${valueIndex++} AND pl.status ILIKE ANY($${valueIndex++})))`
      );
      values.push(userAgencyId, userAgencyId, ["available", "sold", "under offer"]);
    }
  }

  if (reqQuery.context === "home" && !status && !search) {
    conditions.push(`NOT (pl.is_featured = TRUE AND pl.featured_expires_at > NOW())`);
  }

  if (userRole !== "agency_admin" && queryAgencyId) {
    conditions.push(`pl.agency_id = $${valueIndex++}`);
    values.push(queryAgencyId);
  }
  if (agent_id) {
    conditions.push(`pl.agent_id = $${valueIndex++}`);
    values.push(agent_id);
  }
  if (purchase_category && purchase_category.toLowerCase() !== "all") {
    conditions.push(`pl.purchase_category ILIKE $${valueIndex++}`);
    values.push(purchase_category);
  }

  // --- Price filters from explicit query ---
  if (min_price) {
    conditions.push(`pl.price >= $${valueIndex++}`);
    values.push(min_price);
  }
  if (max_price) {
    conditions.push(`pl.price <= $${valueIndex++}`);
    values.push(max_price);
  }

  if (location) {
    conditions.push(`pl.location ILIKE $${valueIndex++}`);
    values.push(`%${location}%`);
  }
  if (state) {
    conditions.push(`pl.state ILIKE $${valueIndex++}`);
    values.push(state);
  }

  // --- Property type / bedrooms special-case for Self-Contain logic ---
  if (
    property_type &&
    bedrooms &&
    property_type.toLowerCase() === "apartment" &&
    parseInt(bedrooms) === 1
  ) {
    conditions.push(`(pl.property_type ILIKE ANY($${valueIndex++}))`);
    values.push(["Apartment", "Self-Contain"]);
    conditions.push(`pl.bedrooms = $${valueIndex++}`);
    values.push(1);
  } else if (property_type) {
    conditions.push(`pl.property_type ILIKE $${valueIndex++}`);
    values.push(`%${property_type}%`);
  }

  // Helper to push a numeric WHERE clause given a column + parsed {operator, value}
  function pushNumericCondition(column, parsed) {
    if (!parsed) return;
    let op = parsed.operator || "=";
    if (!["=", ">", "<", ">=", "<="].includes(op)) op = "=";
    conditions.push(`pl.${column} ${op} $${valueIndex++}`);
    values.push(parsed.value);
  }

  // --- Bedrooms / Bathrooms / Living rooms / Kitchens from explicit query ---
  if (bedrooms && (!property_type || property_type.toLowerCase() !== "land")) {
    pushNumericCondition("bedrooms", parseNumberInput(bedrooms));
  }
  if (bathrooms && property_type?.toLowerCase() !== "land") {
    pushNumericCondition("bathrooms", parseNumberInput(bathrooms));
  }
  if (living_rooms && property_type?.toLowerCase() !== "land") {
    pushNumericCondition("living_rooms", parseNumberInput(living_rooms));
  }
  if (kitchens && property_type?.toLowerCase() !== "land") {
    pushNumericCondition("kitchens", parseNumberInput(kitchens));
  }

  // --- Other explicit filters ---
  if (land_size) {
    conditions.push(`pd.land_size >= $${valueIndex++}`);
    values.push(parseFloat(land_size));
  }
  if (zoning_type) {
    conditions.push(`pd.zoning_type ILIKE $${valueIndex++}`);
    values.push(`%${zoning_type}%`);
  }
  if (title_type) {
    conditions.push(`pd.title_type ILIKE $${valueIndex++}`);
    values.push(`%${title_type}%`);
  }

  // --- 🔎 Smart Search (helper-powered) ---
  let rankSelect = "";
  let normalizedSearch = search ? normalizeQuery(search.trim()) : "";
  let inferredSortFromQualifiers = null;

  if (normalizedSearch) {
    let searchConditions = [];
    let fullTextForSearch = normalizedSearch;

    const qualifiers = extractQualifiers(normalizedSearch);
    // (Optional: set inferredSortFromQualifiers from `qualifiers`)

    // --- Canonical column mapping for structural synonyms ---
    const columnSynonyms = {
      bedrooms: ["bedroom", "bedrooms", "room", "rooms", "bed", "br", "bhk"],
      bathrooms: ["bathroom", "bathrooms", "bath", "toilet", "toilets", "wc"],
      living_rooms: ["living room", "living rooms", "parlour", "parlor", "sitting room", "lounge"],
      kitchens: ["kitchen", "kitchens", "cookroom", "kitchenette"]
    };

    // Normalize detected keys so "rooms" => bedrooms, etc.
    function normalizeStructuralKey(term) {
      const lower = term.toLowerCase();
      for (const [col, syns] of Object.entries(columnSynonyms)) {
        if (syns.some(s => lower.includes(s))) {
          return col;
        }
      }
      return null;
    }

    const numExtract = extractNumbers(normalizedSearch);

    // Treat extracted numbers as STRICT filters (AND), using operator+value
    // NOTE: extractNumbers already returns canonical keys like "bedrooms","living_rooms".
    // The previous normalizeStructuralKey(rawKey) call was incorrect for those canonical keys,
    // so numeric filters were being dropped (esp. for word-numbers like "two").
    if (numExtract && property_type?.toLowerCase() !== "land") {
      const canonicalKeys = ["bedrooms", "bathrooms", "living_rooms", "kitchens", "land_size"];
      for (const [rawKey, parsed] of Object.entries(numExtract)) {
        // Accept canonical keys directly; otherwise attempt to normalize as a fallback.
        let normalizedKey = canonicalKeys.includes(rawKey) ? rawKey : normalizeStructuralKey(rawKey);
        if (!normalizedKey) continue;

        // Respect explicit query params (URL) — they should override smart search.
        if (normalizedKey === "bedrooms" && !bedrooms) {
          pushNumericCondition("bedrooms", parsed);
        } else if (normalizedKey === "bathrooms" && !bathrooms) {
          pushNumericCondition("bathrooms", parsed);
        } else if (normalizedKey === "living_rooms" && !living_rooms) {
          pushNumericCondition("living_rooms", parsed);
        } else if (normalizedKey === "kitchens" && !kitchens) {
          pushNumericCondition("kitchens", parsed);
        }
        // Note: do not apply land_size as an equality here — it's already handled below as min-size.
      }
    }
      
    // --- START: Enhanced Price Range & Period Filtering ---

const priceRange = extractPriceRange(normalizedSearch);

if (priceRange) {
  // If the user's search includes a time period (e.g., "per month")...
  if (priceRange.period) {
    // 1. Define the SQL logic to convert all stored prices to a monthly equivalent.
    //    'one-time' prices are excluded from this comparison.
    const normalizedMonthlyPriceSQL = `
      (CASE pl.price_period
         WHEN 'yearly' THEN pl.price / 12.0
         WHEN 'monthly' THEN pl.price
         WHEN 'weekly' THEN pl.price * 4.333
         WHEN 'nightly' THEN pl.price * 30.417
         ELSE NULL
      END)
    `;

    // 2. Create a helper to normalize the user's input price to a monthly value.
    const normalizeInputPriceToMonthly = (price, period) => {
      if (!price || !period) return price;
      switch (period) {
        case 'yearly': return price / 12.0;
        case 'monthly': return price;
        case 'weekly': return price * 4.333;
        case 'nightly': return price * 30.417;
        default: return price;
      }
    };

    // 3. Add conditions that compare the normalized monthly price.
    if (priceRange.min) {
      conditions.push(`${normalizedMonthlyPriceSQL} >= $${valueIndex++}`);
      values.push(normalizeInputPriceToMonthly(priceRange.min, priceRange.period));
    }
    if (priceRange.max) {
      conditions.push(`${normalizedMonthlyPriceSQL} <= $${valueIndex++}`);
      values.push(normalizeInputPriceToMonthly(priceRange.max, priceRange.period));
    }
    if (priceRange.value) {
      // For exact matches, we allow a small tolerance (e.g., +/- 1%)
      const monthlyValue = normalizeInputPriceToMonthly(priceRange.value, priceRange.period);
      conditions.push(`${normalizedMonthlyPriceSQL} BETWEEN $${valueIndex++} AND $${valueIndex++}`);
      values.push(monthlyValue * 0.99, monthlyValue * 1.01);
    }

    // 4. Since a period was specified, ensure we only search rental-type listings.
    if (!purchase_category) {
      conditions.push(`pl.purchase_category ILIKE ANY($${valueIndex++})`);
      values.push(['Rent', 'Lease', 'Short Let', 'Long Let']);
    }
    
  } else {
    // Fallback to original logic for price searches WITHOUT a period (e.g., "house for 50M")
    // This typically implies a 'one-time' payment for a sale.
    if (priceRange.min) {
      conditions.push(`pl.price >= $${valueIndex++}`);
      values.push(priceRange.min);
    }
    if (priceRange.max) {
      conditions.push(`pl.price <= $${valueIndex++}`);
      values.push(priceRange.max);
    }
    if (priceRange.value) {
      conditions.push(`pl.price = $${valueIndex++}`);
      values.push(priceRange.value);
    }
  }
}
// --- END: Enhanced Price Range & Period Filtering ---
    


    // Land size from smart search (as minimum)
    if (!land_size && numExtract?.land_size) {
      const sqm = parseLandSizeToSqm(numExtract.land_size);
      if (sqm) {
        conditions.push(`COALESCE(pd.land_size,0) >= $${valueIndex++}`);
        values.push(sqm);
      }
    }

    // Amenities (can be OR'able or strict; keep as OR to remain soft)
    const amenList = extractAmenities(normalizedSearch);
    if (amenList.length) {
      for (const am of amenList) {
        searchConditions.push(`COALESCE(pd.amenities,'') ILIKE $${valueIndex++}`);
        values.push(`%${am}%`);
      }
    }

    // Geo detection
    const lowerSearch = normalizedSearch.toLowerCase();
    let detectedState = null;
    let detectedCity = null;

    for (const [city, mappedState] of Object.entries(nigeriaLocations.cityToState || {})) {
      if (lowerSearch.includes(city.toLowerCase())) {
        detectedCity = city;
        detectedState = mappedState;
        break;
      }
    }
    if (!detectedState) {
      for (const st of nigeriaLocations.states || []) {
        if (lowerSearch.includes(st.toLowerCase())) {
          detectedState = st;
          break;
        }
      }
    }

    if (detectedCity && !location) {
      searchConditions.push(`pl.location ILIKE $${valueIndex++}`);
      values.push(`%${detectedCity}%`);
    }
    if (detectedState && !state) {
      searchConditions.push(`pl.state ILIKE $${valueIndex++}`);
      values.push(`%${detectedState}%`);
    }

    // Purchase detection (soft)
    let detectedPurchase = null;
    if (!purchase_category) {
      const purchaseRegex = /\b(for\s+)?((to\s+)?let|lease|rent(al)?|sale|buy)\b/gi;
      const match = purchaseRegex.exec(normalizedSearch);
      if (match) {
        const term = match[2].toLowerCase().replace(/\s+/g, " ");
        if (term.includes("let") || term.includes("rent") || term.includes("lease")) detectedPurchase = "Rent";
        else if (term.includes("sale") || term.includes("buy")) detectedPurchase = "Sale";

        if (detectedPurchase) {
          searchConditions.push(`pl.purchase_category ILIKE $${valueIndex++}`);
          values.push(detectedPurchase);
        }
      }
    }

    // Property-type synonyms -> make this a STRICT filter (AND), not part of OR
    const detectedType = detectPropertyType(normalizedSearch, searchConfig.propertySynonyms);

if (detectedType && !property_type) {
  const noisePropertyTypes = searchConfig.noisePropertyTypes || [];
  if (!noisePropertyTypes.includes(detectedType)) {
    // Collect all synonyms that map to this canonical type
const synonyms = Object.entries(searchConfig.propertySynonyms)
.filter(([key, value]) => value === detectedType)
.map(([key]) => key);

// Always include the canonical type itself
const likeClauses = [`pl.property_type ILIKE $${valueIndex++}`];
values.push(`%${detectedType}%`);

// Add each synonym as an OR condition
for (const syn of synonyms) {
likeClauses.push(`pl.property_type ILIKE $${valueIndex++}`);
values.push(`%${syn}%`);
}

// Join into OR group
conditions.push(`(${likeClauses.join(" OR ")})`);

  }
}


    // Remove noise words from the text used for FTS/similarity
    if (noiseWords?.length) {
      for (const w of noiseWords) {
        fullTextForSearch = fullTextForSearch.replace(new RegExp(`\\b${w}\\b`, "gi"), " ");
      }
      fullTextForSearch = fullTextForSearch.replace(/\s{2,}/g, " ").trim();
    }

    // --- Decide if we should ADD the FTS OR block ---
    // If the remaining tokens are ONLY numbers + structural terms (room/bed/bath/kitchen),
    // skip FTS so numeric filters (e.g., "2 room") don't get wiped out.
    const cleanList = (arr = []) =>
      (arr || [])
        .filter(
          (s) => typeof s === "string" && s !== "_comment" && !/^A\s+list/i.test(s)
        )
        .flatMap((s) => s.toLowerCase().split(/[\s-]+/)) // Split multi-word terms
        .filter(Boolean);

    const structuralTerms = new Set([
      ...cleanList(searchConfig.bedTerms),
      ...cleanList(searchConfig.bathTerms),
      ...cleanList(searchConfig.livingRoomTerms),
      ...cleanList(searchConfig.kitchenTerms),
    ]);

    const tokens = fullTextForSearch.split(/\s+/).filter(Boolean);
    const onlyStructuralOrNumeric =
      tokens.length > 0 &&
      tokens.every(
        (t) =>
          /^\d+(?:\.\d+)?$/.test(t) || // It's a digit
          structuralTerms.has(t.toLowerCase()) || // It's a structural term (e.g., "living", "room", "bedrooms")
          numberWords.hasOwnProperty(t.toLowerCase()) // It's a number-word (e.g., "two")
      );

    // Build FTS/similarity only if there's meaningful text beyond structural tokens
    // If the query is ONLY numeric + structural tokens (like "2 living room" or "two living room"),
    // enforce strict numeric filters and skip any FTS/similarity or soft OR conditions
    // (amenities/geo/soft matches) that would otherwise dilute the strict match.
    if (onlyStructuralOrNumeric) {
      // wipe any soft search conditions (amenities/geo) so only the numeric AND filters remain
      searchConditions = [];
      // do not build ts_query / similarity (rankSelect remains empty)
    } else {
      // Build FTS/similarity only if there's meaningful text beyond structural tokens
      const tsQueryString = fullTextForSearch
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .join(" | ");

        if (tsQueryString) {
            const tsQueryParamIndex = valueIndex++;
            values.push(tsQueryString);
          
            const simLiteral = normalizedSearch;
            const simIdx1 = valueIndex++;
            const simIdx2 = valueIndex++;
            const simIdx3 = valueIndex++;
            const simIdx4 = valueIndex++;
            values.push(simLiteral, simLiteral, simLiteral, simLiteral);
          
            // --- FTS + similarity ---
            searchConditions.push(`(
              pl.search_vector @@ to_tsquery('english', $${tsQueryParamIndex})
              OR similarity(pl.title, $${simIdx1}) > 0.25
              OR similarity(pl.location, $${simIdx2}) > 0.25
              OR similarity(pl.state, $${simIdx3}) > 0.25
              OR similarity(pd.description, $${simIdx4}) > 0.25
            )`);
          
            // --- NEW: partial ILIKE fallback ---
            const partialIdx = valueIndex++;
            values.push(`%${normalizedSearch}%`);
            searchConditions.push(`(
              pl.title ILIKE $${partialIdx}
              OR pd.description ILIKE $${partialIdx}
              OR pl.location ILIKE $${partialIdx}
              OR pl.state ILIKE $${partialIdx}
              OR pl.property_type ILIKE $${partialIdx}
            )`);
          
            rankSelect = `,
              ts_rank(pl.search_vector, to_tsquery('english', $${tsQueryParamIndex}), 1)
                + GREATEST(
                    similarity(pl.title, $${simIdx1}),
                    similarity(pl.location, $${simIdx2}),
                    similarity(pl.state, $${simIdx3}),
                    similarity(pd.description, $${simIdx4})
                  )
                ${detectedCity ? `+ (CASE WHEN pl.location ILIKE '%${detectedCity.replace(/'/g, "''")}%' THEN 2 ELSE 0 END)` : ""}
              AS rank
            `;
          }
          
    }

    // If we have any conditions from the search string, join them with OR
    // and add them as a single, parenthesized condition to the main query.
    if (searchConditions.length > 0) {
      conditions.push(`(${searchConditions.join(" OR ")})`);
    }
  }

  // --- Where clause ---
  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  // --- Pagination ---
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

 // --- Ordering ---
 const effectivePriority = `COALESCE(a.featured_priority, u.featured_priority, 0)`;
 let orderByClause = "";

 let effectiveSortParam = sortBy;
 if (!effectiveSortParam && inferredSortFromQualifiers) {
   effectiveSortParam = inferredSortFromQualifiers;
 }

 // --- START: Enhanced Sorting Logic ---
 // Detect if key filters are present from the search string for prioritization.
 const numExtractForSort = extractNumbers(normalizedSearch);
 const detectedTypeForSort = detectPropertyType(normalizedSearch, searchConfig.propertySynonyms);
 const detectedPurchaseForSort = purchase_category || (normalizedSearch.match(/\b(rent|lease|let|sale|buy)\b/i) ? (normalizedSearch.includes("sale") || normalizedSearch.includes("buy") ? "Sale" : "Rent") : null);
 
 let detectedStateForSort = null;
 const lowerSearchForSort = normalizedSearch.toLowerCase();
 for (const st of nigeriaLocations.states || []) {
     if (lowerSearchForSort.includes(st.toLowerCase())) {
         detectedStateForSort = st;
         break;
     }
 }

 // Build a priority score. A lower score is better (comes first).
 // This CASE statement is the core of the solution.
 const prioritySort = `
   CASE
     -- Priority 0: Perfect match on state, purchase type, AND bedrooms from search
     WHEN ${detectedStateForSort ? `pl.state ILIKE '${detectedStateForSort.replace(/'/g, "''")}'` : 'FALSE'}
      AND ${detectedPurchaseForSort ? `pl.purchase_category ILIKE '${detectedPurchaseForSort}'` : 'FALSE'}
      AND ${numExtractForSort?.bedrooms ? `pl.bedrooms = ${numExtractForSort.bedrooms.value}` : 'FALSE'}
     THEN 0
     
     -- Priority 1: Match on state and purchase type
     WHEN ${detectedStateForSort ? `pl.state ILIKE '${detectedStateForSort.replace(/'/g, "''")}'` : 'FALSE'}
      AND ${detectedPurchaseForSort ? `pl.purchase_category ILIKE '${detectedPurchaseForSort}'` : 'FALSE'}
     THEN 1

     -- Priority 2: Match only on state
     WHEN ${detectedStateForSort ? `pl.state ILIKE '${detectedStateForSort.replace(/'/g, "''")}'` : 'FALSE'}
     THEN 2

     -- Priority 3: All other results
     ELSE 3
   END
 `;
 // --- END: Enhanced Sorting Logic ---

 const baseSortOrder = `
   ${prioritySort},
   CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
   ${effectivePriority} DESC,
   pl.date_listed DESC
 `;

 if (rankSelect) {
  orderByClause = `ORDER BY ${prioritySort}, rank DESC, CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END, ${effectivePriority} DESC, pl.date_listed DESC`;
} else if (effectiveSortParam === "price_asc" || effectiveSortParam === "price_desc") {
  const direction = effectiveSortParam === "price_asc" ? "ASC" : "DESC";
  orderByClause = `ORDER BY ${baseSortOrder.replace('pl.date_listed DESC', `pl.price ${direction}`)}`;
} else if (effectiveSortParam === "date_listed_asc") {
  orderByClause = `ORDER BY ${baseSortOrder.replace('pl.date_listed DESC', 'pl.date_listed ASC')}`;
} else if (effectiveSortParam === "view_count_desc") {
  orderByClause = `ORDER BY pl.view_count DESC NULLS LAST, ${baseSortOrder}`;
} else if (effectiveSortParam === "view_count_asc") {
  orderByClause = `ORDER BY pl.view_count ASC NULLS FIRST, ${baseSortOrder}`;
} else {
  orderByClause = `ORDER BY ${baseSortOrder}`;
}


  // --- Final queries ---
  const query = `
      SELECT
        pl.*,
        pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities, pd.land_size, pd.zoning_type, pd.title_type,
        ${effectivePriority} AS effective_priority
        ${rankSelect}
      ${baseQuery}
      ${whereClause}
      ${orderByClause}
      LIMIT $${valueIndex++} OFFSET $${valueIndex++}
    `;
  values.push(limitNum, offset);

  const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
  const countValues = values.slice(0, values.length - 2);

  return { query, values, countQuery, countValues, pageNum, limitNum };
}

module.exports = { buildListingsQuery };

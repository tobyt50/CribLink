const {
  normalizeQuery,
  extractPriceRange,
  extractAmenities,
  extractNumbers,
  extractQualifiers,
  noiseWords,
} = require("../utils/searchParser");

exports.getAllListings = async (req, res) => {
  try {
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
      land_size,
      zoning_type,
      title_type,
      agency_id: queryAgencyId,
    } = req.query;

    const userRole = req.user ? req.user.role : "guest";
    const userId = req.user ? req.user.user_id : null;
    const userAgencyId = req.user ? req.user.agency_id : null;

    const searchConfig = require("../config/searchSynonyms.json");
    const nigeriaLocations = require("../config/nigeriaLocations.json");

    // --- Helper: convert words to numbers ---
    const numberWords = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    // --- Helper: parse numeric input (words, digits, '>5') ---
    function parseNumberInput(input) {
      if (!input) return null;
      input = input.toString().trim().toLowerCase();

      let greaterMatch = input.match(/^>\s*(\d+)$/);
      if (greaterMatch)
        return { operator: ">", value: parseInt(greaterMatch[1]) };

      greaterMatch = input.match(/^>\s*(\w+)$/);
      if (greaterMatch && numberWords[greaterMatch[1]])
        return { operator: ">", value: numberWords[greaterMatch[1]] };

      if (numberWords[input])
        return { operator: "=", value: numberWords[input] };

      if (!isNaN(parseInt(input)))
        return { operator: "=", value: parseInt(input) };

      return null;
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
    if (
      status &&
      normalizedStatus !== "all" &&
      normalizedStatus !== "all statuses"
    ) {
      if (normalizedStatus === "featured") {
        conditions.push(
          `pl.is_featured = TRUE AND pl.featured_expires_at > NOW()`,
        );
      } else {
        conditions.push(`pl.status ILIKE $${valueIndex++}`);
        values.push(status);
      }
    } else {
      if (userRole === "client" || userRole === "guest") {
        conditions.push(`pl.status ILIKE $${valueIndex++}`);
        values.push("available");
      } else if (userRole === "agent") {
        conditions.push(
          `(pl.status ILIKE ANY($${valueIndex++}) OR pl.agent_id = $${valueIndex++})`,
        );
        values.push(["available", "sold", "under offer"], userId);
      } else if (userRole === "agency_admin" && userAgencyId) {
        conditions.push(
          `((pl.agency_id = $${valueIndex++}) OR (pl.agency_id != $${valueIndex++} AND pl.status ILIKE ANY($${valueIndex++})))`,
        );
        values.push(userAgencyId, userAgencyId, [
          "available",
          "sold",
          "under offer",
        ]);
      }
    }

    if (req.query.context === "home" && !status && !search) {
      conditions.push(
        `NOT (pl.is_featured = TRUE AND pl.featured_expires_at > NOW())`,
      );
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

    // --- Bedrooms smart filter from explicit query ---
    if (
      bedrooms &&
      (!property_type || property_type.toLowerCase() !== "land")
    ) {
      const parsedBeds = parseNumberInput(bedrooms);
      if (parsedBeds) {
        if (parsedBeds.operator === ">") {
          conditions.push(`pl.bedrooms > $${valueIndex++}`);
        } else {
          conditions.push(`pl.bedrooms = $${valueIndex++}`);
        }
        values.push(parsedBeds.value);
      }
    }

    // --- Bathrooms smart filter from explicit query ---
    if (bathrooms && property_type?.toLowerCase() !== "land") {
      const parsedBaths = parseNumberInput(bathrooms);
      if (parsedBaths) {
        if (parsedBaths.operator === ">") {
          conditions.push(`pl.bathrooms > $${valueIndex++}`);
        } else {
          conditions.push(`pl.bathrooms = $${valueIndex++}`);
        }
        values.push(parsedBaths.value);
      }
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
      // ################## MODIFICATION START ##################
      // This array will hold all conditions derived from the search string.
      // We will join them with OR at the end.
      let searchConditions = [];
      // ########################################################

      let fullTextForSearch = normalizedSearch;

      const qualifiers = extractQualifiers(normalizedSearch);
      if (qualifiers?.sort) {
        inferredSortFromQualifiers = qualifiers.sort;
      }

      const priceRange = extractPriceRange(normalizedSearch);
      if (priceRange && !min_price && !max_price) {
        if (priceRange.min) {
          // Price conditions are strict, so they go in the main `conditions` array
          conditions.push(`pl.price >= $${valueIndex++}`);
          values.push(priceRange.min);
        }
        if (priceRange.max) {
          conditions.push(`pl.price <= $${valueIndex++}`);
          values.push(priceRange.max);
        }
        if (priceRange.value && !priceRange.min && !priceRange.max) {
          conditions.push(`pl.price <= $${valueIndex++}`);
          values.push(priceRange.value);
        }
      }

      const numExtract = extractNumbers(normalizedSearch);
      if (!bedrooms && numExtract?.bedrooms && property_type?.toLowerCase() !== "land") {
        // Bed/bath are also strict filters
        conditions.push(`pl.bedrooms = $${valueIndex++}`);
        values.push(numExtract.bedrooms);
      }
      if (!bathrooms && numExtract?.bathrooms && property_type?.toLowerCase() !== "land") {
        conditions.push(`pl.bathrooms = $${valueIndex++}`);
        values.push(numExtract.bathrooms);
      }
      if (!land_size && numExtract?.land_size) {
        const sqm = parseLandSizeToSqm(numExtract.land_size);
        if (sqm) {
          conditions.push(`COALESCE(pd.land_size,0) >= $${valueIndex++}`);
          values.push(sqm);
        }
      }

      const amenList = extractAmenities(normalizedSearch);
      if (amenList.length) {
        for (const am of amenList) {
          // Amenities can be part of the broader OR search
          searchConditions.push(`COALESCE(pd.amenities,'') ILIKE $${valueIndex++}`);
          values.push(`%${am}%`);
        }
      }

      const lowerSearch = normalizedSearch.toLowerCase();
      let detectedState = null;
      let detectedCity = null;

      for (const [city, mappedState] of Object.entries(
        nigeriaLocations.cityToState || {},
      )) {
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

      if (!purchase_category) {
        const purchaseRegex = /\b(for\s+)?((to\s+)?let|lease|rent(al)?|sale|buy)\b/gi;
        const match = purchaseRegex.exec(normalizedSearch);
        if (match) {
          const term = match[2].toLowerCase().replace(/\s+/g, " ");
          let detectedPurchase = null;
          if (term.includes("let") || term.includes("rent") || term.includes("lease")) detectedPurchase = "Rent";
          else if (term.includes("sale") || term.includes("buy")) detectedPurchase = "Sale";

          if (detectedPurchase) {
            searchConditions.push(`pl.purchase_category ILIKE $${valueIndex++}`);
            values.push(detectedPurchase);
          }
        }
      }

      let detectedType = null;
      for (let synonym in searchConfig.propertySynonyms || {}) {
        const regex = new RegExp(`\\b${synonym}\\b`, "gi");
        if (regex.test(normalizedSearch)) {
          detectedType = searchConfig.propertySynonyms[synonym];
          break;
        }
      }
      if (detectedType && !property_type) {
        searchConditions.push(`pl.property_type ILIKE $${valueIndex++}`);
        values.push(`%${detectedType}%`);
      }

      if (noiseWords?.length) {
        for (const w of noiseWords) {
          fullTextForSearch = fullTextForSearch.replace(new RegExp(`\\b${w}\\b`, "gi"), " ");
        }
        fullTextForSearch = fullTextForSearch.replace(/\s{2,}/g, " ").trim();
      }

      const tsQueryString = fullTextForSearch.trim().split(/\s+/).filter(Boolean).join(' | ');

      if (tsQueryString) {
        const tsQueryParamIndex = valueIndex++;
        values.push(tsQueryString);

        const simLiteral = normalizedSearch;
        const simIdx1 = valueIndex++;
        const simIdx2 = valueIndex++;
        const simIdx3 = valueIndex++;
        const simIdx4 = valueIndex++;
        values.push(simLiteral, simLiteral, simLiteral, simLiteral);

        // The main FTS and similarity condition is also part of the OR group
        searchConditions.push(`(
          pl.search_vector @@ to_tsquery('english', $${tsQueryParamIndex})
          OR similarity(pl.title, $${simIdx1}) > 0.25
          OR similarity(pl.location, $${simIdx2}) > 0.25
          OR similarity(pl.state, $${simIdx3}) > 0.25
          OR similarity(pd.description, $${simIdx4}) > 0.25
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

      // ################## MODIFICATION START ##################
      // If we have any conditions from the search string, join them with OR
      // and add them as a single, parenthesized condition to the main query.
      if (searchConditions.length > 0) {
        conditions.push(`(${searchConditions.join(" OR ")})`);
      }
      // ################## MODIFICATION END ##################
    }

    // --- Where clause ---
    const whereClause =
      conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

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

    const defaultSort = `
      ORDER BY
        CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
        ${effectivePriority} DESC,
        pl.date_listed DESC
    `;

    if (rankSelect) {
      orderByClause = `
        ORDER BY
          rank DESC,
          CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
          ${effectivePriority} DESC,
          pl.date_listed DESC
      `;
    } else if (effectiveSortParam === "price_asc" || effectiveSortParam === "price_desc") {
      const direction = effectiveSortParam === "price_asc" ? "ASC" : "DESC";
      orderByClause = `
        ORDER BY
          CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
          pl.price ${direction}
      `;
    } else if (effectiveSortParam === "date_listed_asc") {
      orderByClause = `
        ORDER BY
          CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
          pl.date_listed ASC
      `;
    } else {
      orderByClause = defaultSort;
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

    const [listingsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const totalListings = parseInt(countResult.rows[0].count, 10);
    const listingsWithGallery = await attachGalleryImagesToList(
      listingsResult.rows,
    );

    res.status(200).json({
      listings: listingsWithGallery,
      total: totalListings,
      totalPages: Math.ceil(totalListings / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    res
      .status(500)
      .json({
        error: "Internal server error fetching listings",
        details: err.message,
      });
  }
};
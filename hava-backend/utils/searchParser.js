// utils/searchParser.js
const terms = require("../config/searchSynonyms.json"); 

function detectPropertyType(search, synonymsMap) {
  if (!search) return null;
  const lowerSearch = search.toLowerCase();

  for (const [synonym, canonical] of Object.entries(synonymsMap || {})) {
    if (synonym === "_comment") continue;

    const synLower = synonym.toLowerCase();

    // Multi-word synonyms or those with spaces/hyphens: use includes()
    if (/\s|-/g.test(synLower)) {
      if (lowerSearch.includes(synLower)) {
        return canonical;
      }
    } else {
      // Single word synonyms: safe regex with word boundaries
      const escaped = synLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(lowerSearch)) {
        return canonical;
      }
    }
  }
  return null;
}

// --- Price Parsing (500k, 20m, 1.5b, etc.) ---
function parsePrice(str) {
  if (!str) return null;
  str = str.toLowerCase()
    .replace(/,/g, "")
    .replace(/naira|₦|n/gi, "")
    .trim();

  const multipliers = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
  const match = str.match(/([\d.]+)(k|m|b)?/i);
  if (!match) return null;

  let value = parseFloat(match[1]);
  if (isNaN(value)) return null;

  if (match[2] && multipliers[match[2]]) {
    value *= multipliers[match[2]];
  }

  return Math.round(value);
}


// --- Extract Price Range ---
// --- Extract Price Range (with slang, ₦, commas, etc.) ---
function extractPriceRange(search) {
  if (!search) return null;
  const lower = search.toLowerCase();

  // Normalize ₦ and commas
  const clean = lower.replace(/₦/g, "n").replace(/,/g, "");

  // --- Period Detection (Smarter) ---
  const periodSynonyms = {
    yearly: ['yearly', 'annually', 'a year', 'per annum', 'year'],
    monthly: ['monthly', 'a month', 'month'],
    weekly: ['weekly', 'a week', 'week'],
    nightly: ['daily', 'a day', 'a night', 'night', 'day']
  };

  let period = null;
  let periodRegex;

  // Search for any of the period synonyms, using word boundaries (\b) to avoid partial matches
  for (const [canonical, synonyms] of Object.entries(periodSynonyms)) {
    // Create a regex like: /\b(yearly|annually|a year|per annum|year)\b/
    periodRegex = new RegExp(`\\b(${synonyms.join('|')})\\b`);
    if (periodRegex.test(clean)) {
      period = canonical;
      break; // Stop once we find the first match
    }
  }

  // --- BETWEEN ---
  let between = clean.match(/between\s+([\dn.kmb]+)\s+(and|to)\s+([\dn.kmb]+)/);
  if (between) {
    return { min: parsePrice(between[1]), max: parsePrice(between[3]), period };
  }

  // --- AT LEAST / MINIMUM ---
  let minMatch = clean.match(/(at\s*least|minimum)\s*n?([\dn.kmb]+)/);
  if (minMatch) {
    return { min: parsePrice(minMatch[2]), period };
  }

  // --- AT MOST / MAXIMUM ---
  let maxMatch = clean.match(/(at\s*most|maximum)\s*n?([\dn.kmb]+)/);
  if (maxMatch) {
    return { max: parsePrice(maxMatch[2]), period };
  }

  // --- LESS THAN / UNDER / CHEAPER THAN ---
  let under = clean.match(/(less\s*than|under|below|cheaper\s*than)\s*n?([\dn.kmb]+)/);
  if (under) {
    return { max: parsePrice(under[2]), period };
  }

  // --- MORE THAN / OVER / GREATER THAN / EXPENSIVE THAN ---
  let over = clean.match(/(more\s*than|over|greater\s*than|above|expensive\s*than)\s*n?([\dn.kmb]+)/);
  if (over) {
    return { min: parsePrice(over[2]), period };
  }

  // --- SINGLE VALUE ---
  // Improved regex to avoid accidentally matching numbers meant for bedrooms, etc.
  // It looks for a number that is either alone, near a currency symbol, or near a period word.
  const singleRegex = new RegExp(`(n?([\\d.kmb]+))(\\s*(${Object.values(periodSynonyms).flat().join('|')}))?`, 'i');
  let single = clean.match(singleRegex);
  
  // To avoid grabbing the "2" from "2 bedrooms", we check if the match is not too simple
  // and has some price context, or if no period was found yet.
  if (single && single[2]) {
     const isSimpleNumber = !/[kmb]/.test(single[2]) && !/n/.test(single[1]) && !single[3];
     if (!isSimpleNumber || search.split(' ').length < 4) {
         return { value: parsePrice(single[2]), period };
     }
  }

  return null;
}



// --- Normalize Nigerian Slang & Abbreviations ---
function normalizeQuery(input) {
  if (!input) return "";

  const map = {
    "ph": "port harcourt",
    "abj": "abuja",
    "lag": "lagos",
    "selfcon": "self contain",
    "self-con": "self contain",
    "apt": "apartment",
    "tolet": "rent",
    "lekki ph1": "lekki phase 1",
    "vi": "victoria island"
  };

  let out = input.toLowerCase();
  for (let [abbr, full] of Object.entries(map)) {
    out = out.replace(new RegExp(`\\b${abbr}\\b`, "gi"), full);
  }
  return out;
}

// --- Amenities Detection ---
function extractAmenities(search) {
  const amenities = [];
  const map = {
    "pool": "pool",
    "swimming pool": "pool",
    "parking": "parking",
    "garage": "parking",
    "car park": "parking",
    "furnished": "furnished",
    "serviced": "serviced",
    "gated": "gated",
    "estate": "estate"
  };
  for (let [key, val] of Object.entries(map)) {
    if (search.includes(key)) amenities.push(val);
  }
  return amenities;
}

// --- Noise Words to Ignore ---
const noiseWords = [
  "nice","beautiful","lovely","modern","good","newly","built","awesome",
  "affordable","cheap","luxury","expensive"
];

// --- Bedrooms / Bathrooms / Living Rooms / Kitchens / Land size ---
function extractNumbers(search) {
  const result = {};

  // Word-to-number mapping
  const numberWords = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const numberWordRegex = `(\\d+|${Object.keys(numberWords).join("|")})`;

  // Helper to parse digits or words
  const parseNumber = (match) => {
    if (!match) return null;
    const lowerMatch = match.toLowerCase();
    return numberWords[lowerMatch] || parseInt(match, 10);
  };

  // Generic helper to capture operator + value
  const parseWithOperator = (regex) => {
    let m = search.match(regex);
    if (!m) return null;

    let rawNum = m[2] || m[1];
    let num = parseNumber(rawNum);
    if (!num) return null;

    let op = "=";
    let prefix = m[0].toLowerCase();
    if (prefix.includes(">") || prefix.includes("more than") || prefix.includes("above") || prefix.includes("greater")) {
      op = ">";
    }
    if (prefix.includes("<") || prefix.includes("less than") || prefix.includes("under") || prefix.includes("below")) {
      op = "<";
    }
    if (prefix.includes("at least") || prefix.includes("minimum")) {
      op = ">=";
    }
    if (prefix.includes("at most") || prefix.includes("maximum")) {
      op = "<=";
    }

    return { value: num, operator: op };
  };

  // Build regex patterns dynamically from JSON lists
  const bedRegex = new RegExp(
    `((?:>|<|>=|<=|at least|at most|more than|less than|minimum|maximum)?\\s*)?${numberWordRegex}\\s*(${terms.bedTerms.filter(t => t !== "_comment").join("|")})`,
    "i"
  );
  const bathRegex = new RegExp(
    `((?:>|<|>=|<=|at least|at most|more than|less than|minimum|maximum)?\\s*)?${numberWordRegex}\\s*(${terms.bathTerms.filter(t => t !== "_comment").join("|")})`,
    "i"
  );
  const livingRegex = new RegExp(
    `((?:>|<|>=|<=|at least|at most|more than|less than|minimum|maximum)?\\s*)?${numberWordRegex}\\s*(${terms.livingRoomTerms.filter(t => t !== "_comment").join("|")})`,
    "i"
  );
  const kitchenRegex = new RegExp(
    `((?:>|<|>=|<=|at least|at most|more than|less than|minimum|maximum)?\\s*)?${numberWordRegex}\\s*(${terms.kitchenTerms.filter(t => t !== "_comment").join("|")})`,
    "i"
  );

  // --- Extract values ---
  let beds = parseWithOperator(bedRegex);
  if (beds) result.bedrooms = beds;

  let baths = parseWithOperator(bathRegex);
  if (baths) result.bathrooms = baths;

  let living = parseWithOperator(livingRegex);
  if (living) result.living_rooms = living;

  let kitchen = parseWithOperator(kitchenRegex);
  if (kitchen) result.kitchens = kitchen;

  // --- Land size remains custom ---
  let land = search.match(/(\d+)\s*(sqm|acre|hectare)/);
  if (land) {
    result.land_size = land[1] + " " + land[2];
  }

  return result;
}


// --- Qualifiers (cheap, luxury, etc.) ---
function extractQualifiers(search) {
  const out = {};
  if (search.includes("cheap") || search.includes("affordable")) {
    out.sort = "price_asc";
  }
  if (search.includes("luxury") || search.includes("expensive")) {
    out.sort = "price_desc";
  }
  return out;
}

module.exports = {
  normalizeQuery,
  extractPriceRange,
  extractAmenities,
  extractNumbers,
  extractQualifiers,
  noiseWords,
  detectPropertyType
};

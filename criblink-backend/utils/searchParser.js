// utils/searchParser.js

// --- Price Parsing (500k, 20m, 1.5b, etc.) ---
function parsePrice(str) {
    if (!str) return null;
    str = str.toLowerCase().replace(/\s+/g, "");
  
    const multipliers = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
    const match = str.match(/([\d,.]+)(k|m|b)?/i);
    if (!match) return null;
  
    let value = parseFloat(match[1].replace(/,/g, ""));
    if (isNaN(value)) return null;
  
    if (match[2] && multipliers[match[2]]) {
      value *= multipliers[match[2]];
    }
    return Math.round(value);
  }
  
  // --- Extract Price Range ---
  function extractPriceRange(search) {
    if (!search) return null;
    const lower = search.toLowerCase();
  
    let between = lower.match(/between\s+([\d.kmb]+)\s+(and|to)\s+([\d.kmb]+)/);
    if (between) {
      return { min: parsePrice(between[1]), max: parsePrice(between[3]) };
    }
  
    let under = lower.match(/(under|below|less than)\s+([\d.kmb]+)/);
    if (under) {
      return { max: parsePrice(under[2]) };
    }
  
    let over = lower.match(/(above|over|greater than|more than)\s+([\d.kmb]+)/);
    if (over) {
      return { min: parsePrice(over[2]) };
    }
  
    let num = lower.match(/([\d.kmb]+)/);
    if (num) {
      return { value: parsePrice(num[1]) };
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
  
  // --- Bedrooms / Bathrooms / Land size ---
  // --- Bedrooms / Bathrooms / Land size ---
function extractNumbers(search) {
    const result = {};
  
    // Define the word-to-number mapping
    const numberWords = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10
      // Add more if you need to support higher numbers
    };
    const numberWordRegex = `(\\d+|${Object.keys(numberWords).join('|')})`;
  
    // Helper function to parse the matched number (either digit or word)
    const parseNumber = (match) => {
      if (!match) return null;
      const lowerMatch = match.toLowerCase();
      return numberWords[lowerMatch] || parseInt(match, 10);
    };
  
    // Match bedrooms (e.g., "3 bedroom", "three bedroom")
    const bedsRegex = new RegExp(`${numberWordRegex}\\s*(bed|bedroom)`, 'i');
    let beds = search.match(bedsRegex);
    if (beds) {
      result.bedrooms = parseNumber(beds[1]);
    }
  
    // Match bathrooms (e.g., "2 bath", "two toilet")
    const bathsRegex = new RegExp(`${numberWordRegex}\\s*(bath|toilet|wc)`, 'i');
    let baths = search.match(bathsRegex);
    if (baths) {
      result.bathrooms = parseNumber(baths[1]);
    }
  
    // Match land size (this can remain as is, or you can enhance it similarly if needed)
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
    noiseWords
  };
  
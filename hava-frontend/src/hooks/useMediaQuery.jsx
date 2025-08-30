// src/hooks/useMediaQuery.jsx

import { useEffect, useState } from "react";

// You can export it as a named export or a default export.
// Default is common for single-function files.
export default function useMediaQuery(query) {
  // Initialize state with the media query's current value
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    const listener = (event) => {
      setMatches(event.matches);
    };

    // Use the modern, recommended method to add the event listener
    mediaQueryList.addEventListener("change", listener);

    // Clean up by removing the listener when the component unmounts
    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, [query]); // Only re-run the effect if the query string changes

  return matches;
}

// In another file, you would import it like this:
// import useMediaQuery from './hooks/useMediaQuery';
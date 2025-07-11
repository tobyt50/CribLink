import { useState, useEffect, useCallback } from 'react';

export const useSidebarState = () => {
    // Determine if the device is mobile based on screen width
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // State for whether the sidebar is open (for mobile overlay)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State for whether the sidebar is collapsed (for desktop permanent collapse)
    // Safely parse from localStorage, defaulting to false if not found or invalid
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            const storedValue = localStorage.getItem('sidebarPermanentlyExpanded');
            // If storedValue is "true", parse as true. If "false", parse as false.
            // If null or "undefined" or any other invalid JSON string, default to false.
            if (storedValue === 'true') {
                return false; // If permanently expanded, it's not collapsed
            }
            if (storedValue === 'false') {
                return true; // If not permanently expanded, it is collapsed
            }
            // For any other value (null, "undefined", etc.), default to collapsed (true)
            return true;
        } catch (error) {
            console.error("Error parsing sidebar state from localStorage:", error);
            return true; // Default to collapsed on error
        }
    });

    // Effect to handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to close sidebar on mobile if it's open and screen resizes to desktop
    useEffect(() => {
        if (!isMobile && isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [isMobile, isSidebarOpen]);

    // Callback to toggle the collapsed state, also updating localStorage
    const toggleCollapsed = useCallback(() => {
        setIsCollapsed(prev => {
            const newState = !prev;
            // Store the *permanently expanded* state, which is the inverse of collapsed
            localStorage.setItem('sidebarPermanentlyExpanded', (!newState).toString());
            return newState;
        });
    }, []);

    // When the parent component (e.g., ClientSettings) changes the sidebarPermanentlyExpanded setting,
    // this hook needs to react to it. The ClientSettings component already updates localStorage.
    // This useEffect listens to changes in localStorage for 'sidebarPermanentlyExpanded'
    // and updates the internal isCollapsed state accordingly.
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'sidebarPermanentlyExpanded') {
                try {
                    const newValue = event.newValue;
                    if (newValue === 'true') {
                        setIsCollapsed(false); // If permanently expanded, it's not collapsed
                    } else if (newValue === 'false') {
                        setIsCollapsed(true); // If not permanently expanded, it is collapsed
                    } else {
                        setIsCollapsed(true); // Default for invalid/unset values
                    }
                } catch (error) {
                    console.error("Error updating sidebar state from storage event:", error);
                    setIsCollapsed(true); // Default to collapsed on error
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);


    return {
        isMobile,
        isSidebarOpen,
        setIsSidebarOpen,
        isCollapsed,
        setIsCollapsed: toggleCollapsed, // Expose a controlled setter for collapsed state
    };
};

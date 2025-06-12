import { useEffect, useState } from 'react';

export const useSidebarState = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // collapsed = !permanentlyExpanded
    return !JSON.parse(localStorage.getItem('sidebarPermanentlyExpanded') || 'false');
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);

      if (!mobile) {
        const expanded = localStorage.getItem('sidebarPermanentlyExpanded') === 'true';
        setIsCollapsed(!expanded);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // run on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isSidebarOpen,
    setIsSidebarOpen,
    isCollapsed,
    setIsCollapsed,
  };
};

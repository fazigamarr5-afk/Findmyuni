import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition component to create smooth transitions between pages
 * It wraps the children components and animates them in/out during navigation
 * Also handles scroll behavior during transitions
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      // Start the transition animation
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  // Scroll to top on navigation and drive the transition with a timer.
  // Timer-based (not animationend) so the stage can never get stuck - and
  // never lock body scroll: a stuck lock would trap the page on mobile.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto' // 'auto' is faster than 'smooth' and more reliable across browsers
    });

    if (transitionStage === "fadeOut") {
      const timer = setTimeout(() => {
        setTransitionStage("fadeIn");
        setDisplayLocation(location);
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
      }, 320); // matches the fadeOutPage animation duration (0.3s)

      return () => clearTimeout(timer);
    }
  }, [location.pathname, transitionStage]);

  return (
    <div
      className={`page-transition ${transitionStage}`}
    >
      {children}
    </div>
  );
};

export default PageTransition; 
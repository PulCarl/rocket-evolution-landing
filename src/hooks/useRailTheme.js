import { useEffect, useRef, useState } from "react";

// Switches the social rail to its light-on-dark or dark-on-light variant
// depending on which section sits behind the rail's vertical center.
export function useRailTheme() {
  const railRef = useRef(null);
  const [onLight, setOnLight] = useState(false);

  useEffect(() => {
    const update = () => {
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const y = rect.top + rect.height / 2;
      const lightSections = document.querySelectorAll('[data-bg="light"]');
      const isOverLight = Array.from(lightSections).some((section) => {
        const sr = section.getBoundingClientRect();
        return y > sr.top && y < sr.bottom;
      });
      setOnLight(isOverLight);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return [railRef, onLight];
}

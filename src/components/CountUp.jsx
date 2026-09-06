import { useEffect, useMemo, useState } from "react";
import { useInView } from "../hooks/useInView.js";

const DURATION = 1300;
const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Splits "4 500 h" into { prefix: "", digits: "4 500", suffix: " h" }, etc.
// Returns null for values with no digits at all (nothing to animate).
function parseValue(raw) {
  const match = String(raw).match(/^(\D*)([\d\s]*\d)(\D*)$/);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return {
    prefix,
    suffix,
    target: parseInt(digits.replace(/\s/g, ""), 10),
    grouped: digits.includes(" "),
  };
}

function formatNumber(n, grouped) {
  const s = String(Math.round(n));
  return grouped ? s.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : s;
}

export default function CountUp({ value, className }) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const [ref, inView] = useInView();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || !parsed) return undefined;
    if (reducedMotion) {
      setDisplay(parsed.target);
      return undefined;
    }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(eased * parsed.target);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, parsed]);

  if (!parsed) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {formatNumber(display, parsed.grouped)}
      {parsed.suffix}
    </span>
  );
}

import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, label';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const canHover = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reducedMotion) return undefined;

    document.body.classList.add(styles.cursorEnabled);

    const dot = dotRef.current;
    const ring = ringRef.current;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pointer };

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
    };

    const onOver = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) ring.classList.add(styles.ringHover);
    };
    const onOut = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) ring.classList.remove(styles.ringHover);
    };
    const onDown = () => ring.classList.add(styles.ringDown);
    const onUp = () => ring.classList.remove(styles.ringDown);
    const onLeaveWindow = () => document.body.classList.add(styles.cursorHidden);
    const onEnterWindow = () => document.body.classList.remove(styles.cursorHidden);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("mouseenter", onEnterWindow);

    let raf;
    const LERP = 0.18;
    const tick = () => {
      ringPos.x += (pointer.x - ringPos.x) * LERP;
      ringPos.y += (pointer.y - ringPos.y) * LERP;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove(styles.cursorEnabled, styles.cursorHidden);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
      <div ref={ringRef} className={styles.ring} aria-hidden="true" />
    </>
  );
}

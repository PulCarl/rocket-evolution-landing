import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.css";

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, label';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reducedMotion) return undefined;

    setEnabled(true);
    document.body.classList.add(styles.cursorEnabled);

    return () => {
      document.body.classList.remove(styles.cursorEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pointer };

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;

      // Recomputed from scratch every move (instead of toggled by
      // mouseover/mouseout) so it self-corrects when the hovered element is
      // removed from under the cursor by React — e.g. the mini-game's
      // "Jouer"/"Rejouer" buttons unmount immediately on click, which never
      // fires a mouseout and used to leave the ring stuck enlarged.
      const hovered = document.elementFromPoint(pointer.x, pointer.y)?.closest?.(INTERACTIVE_SELECTOR);
      ring.classList.toggle(styles.ringHover, Boolean(hovered));
    };

    const onDown = () => ring.classList.add(styles.ringDown);
    const onUp = () => ring.classList.remove(styles.ringDown);
    const onLeaveWindow = () => document.body.classList.add(styles.cursorHidden);
    const onEnterWindow = () => document.body.classList.remove(styles.cursorHidden);

    window.addEventListener("mousemove", onMove);
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
      document.body.classList.remove(styles.cursorHidden);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
      <div ref={ringRef} className={styles.ring} aria-hidden="true" />
    </>
  );
}

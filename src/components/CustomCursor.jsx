import { useEffect, useRef, useState } from "react";
import styles from "./CustomCursor.module.css";

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, label';

export default function CustomCursor() {
  const ballRef = useRef(null);
  const trailRef = useRef(null);
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

    const ball = ballRef.current;
    const trail = trailRef.current;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const trailPos = { ...pointer };

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      ball.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) rotate(${
        (pointer.x + pointer.y) % 360
      }deg)`;
    };

    const onOver = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) {
        ball.classList.add(styles.ballBoost);
        trail.classList.add(styles.trailBoost);
      }
    };
    const onOut = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) {
        ball.classList.remove(styles.ballBoost);
        trail.classList.remove(styles.trailBoost);
      }
    };
    const onDown = () => ball.classList.add(styles.ballHit);
    const onUp = () => ball.classList.remove(styles.ballHit);
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
    const LERP = 0.16;
    const tick = () => {
      const prevX = trailPos.x;
      const prevY = trailPos.y;
      trailPos.x += (pointer.x - trailPos.x) * LERP;
      trailPos.y += (pointer.y - trailPos.y) * LERP;

      const dx = trailPos.x - prevX;
      const dy = trailPos.y - prevY;
      const speed = Math.min(Math.hypot(dx, dy), 40);
      const angle = speed > 0.05 ? (Math.atan2(dy, dx) * 180) / Math.PI : null;

      if (angle !== null) trail.style.setProperty("--angle", `${angle}deg`);
      trail.style.setProperty("--stretch", `${1 + speed * 0.09}`);
      trail.style.opacity = String(Math.min(0.35 + speed * 0.045, 1));
      trail.style.transform = `translate3d(${trailPos.x}px, ${trailPos.y}px, 0) translate(-50%, -50%)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove(styles.cursorHidden);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
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
      <div ref={trailRef} className={styles.trail} aria-hidden="true" />
      <div ref={ballRef} className={styles.ball} aria-hidden="true">
        <span className={styles.facet} style={{ top: "22%", left: "30%" }} />
        <span className={styles.facet} style={{ top: "55%", left: "62%" }} />
      </div>
    </>
  );
}

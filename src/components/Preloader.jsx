import { useEffect, useState } from "react";
import logo from "../assets/logo-rocket-evolution.svg";
import styles from "./Preloader.module.css";

const MIN_DURATION = 1200;
const MAX_DURATION = 4000;

export default function Preloader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_DURATION - elapsed);
      setTimeout(() => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 500);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
    const safety = setTimeout(finish, MAX_DURATION);

    return () => {
      window.removeEventListener("load", finish);
      clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (visible) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${leaving ? styles.leaving : ""}`} aria-hidden="true">
      <div className={styles.spinner}>
        <img src={logo} alt="" className={styles.logo} />
      </div>
      <div className={styles.wordmark}>ROCKET EVOLUTION</div>
    </div>
  );
}

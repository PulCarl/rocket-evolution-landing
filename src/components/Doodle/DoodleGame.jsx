import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "../Reveal.jsx";
import { createGame, step, draw, GAME_CONFIG } from "./engine.js";
import {
  unlockAudio,
  playBounce,
  playSpring,
  playJetpack,
  playShield,
  playShieldBreak,
  playCoin,
  playCrash,
  playRecord,
} from "./sfx.js";
import logoUrl from "../../assets/logo-rocket-evolution.svg";
import styles from "./DoodleGame.module.css";

const BEST_KEY = "re-doodle-best";
const NAME_KEY = "re-doodle-name";
const LEGACY_NAME_KEY = "re-runner-name";
const MUTED_KEY = "re-doodle-muted";
const SFX_VOLUME = 0.55;

// Physical key position, so this covers WASD on QWERTY and ZQSD on AZERTY
// for free (both press the same physical keys, which report the same code).
const KEY_MAP = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export default function DoodleGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGame());
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const logoRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = logoUrl;
    logoRef.current = img;
  }, []);

  const [phase, setPhase] = useState("idle"); // idle | playing | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [jetpackActive, setJetpackActive] = useState(false);
  const [shielded, setShielded] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    const storedBest = Number(localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(storedBest)) setBest(storedBest);
    setPlayerName(localStorage.getItem(NAME_KEY) || localStorage.getItem(LEGACY_NAME_KEY) || "");
    const storedMuted = localStorage.getItem(MUTED_KEY) === "1";
    setMuted(storedMuted);
    mutedRef.current = storedMuted;
  }, []);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTED_KEY, next ? "1" : "0");
      mutedRef.current = next;
      return next;
    });
  };

  const onNameChange = (e) => {
    const value = e.target.value.slice(0, 20);
    setPlayerName(value);
    localStorage.setItem(NAME_KEY, value);
  };

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    unlockAudio();
    gameRef.current = createGame();
    setScore(0);
    setIsNewBest(false);
    setJetpackActive(false);
    setShielded(false);
    setPhase("playing");
    lastRef.current = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const { crashed } = step(gameRef.current, dt);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx, gameRef.current, logoRef.current);

      if (gameRef.current.events.length > 0) {
        for (const evt of gameRef.current.events) {
          switch (evt.type) {
            case "bounce":
              playBounce(SFX_VOLUME, mutedRef.current);
              break;
            case "spring":
              playSpring(SFX_VOLUME, mutedRef.current);
              break;
            case "jetpack":
              playJetpack(SFX_VOLUME, mutedRef.current);
              break;
            case "shield":
              playShield(SFX_VOLUME, mutedRef.current);
              break;
            case "shieldBreak":
              playShieldBreak(SFX_VOLUME, mutedRef.current);
              break;
            case "coin":
              playCoin(SFX_VOLUME, mutedRef.current);
              break;
            case "crash":
              playCrash(SFX_VOLUME, mutedRef.current);
              break;
            default:
              break;
          }
        }
        gameRef.current.events.length = 0;
      }

      const currentScore = gameRef.current.score;
      setScore(currentScore);
      setJetpackActive(gameRef.current.jetpackTimer > 0);
      setShielded(gameRef.current.shielded);

      if (crashed) {
        setPhase("over");
        setBest((prevBest) => {
          const newBest = Math.max(prevBest, currentScore);
          if (newBest > prevBest) {
            localStorage.setItem(BEST_KEY, String(newBest));
            setIsNewBest(true);
            playRecord(SFX_VOLUME, mutedRef.current);
          }
          return newBest;
        });
        stopLoop();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop]);

  useEffect(() => stopLoop, [stopLoop]);

  // Keyboard: held left/right steer the character; only meaningful once
  // playing, but harmless to track at any phase.
  useEffect(() => {
    const onDown = (e) => {
      const key = KEY_MAP[e.code];
      if (!key || document.activeElement?.tagName === "INPUT") return;
      e.preventDefault();
      gameRef.current.input[key] = true;
    };
    const onUp = (e) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      gameRef.current.input[key] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (document.activeElement?.tagName === "INPUT") return;
      e.preventDefault();
      if (phase === "idle" && playerName.trim()) startGame();
      else if (phase === "over") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, startGame, playerName]);

  // Touch: left/right halves of the canvas, held.
  const onTouchStart = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    if (x < rect.width / 2) gameRef.current.input.left = true;
    else gameRef.current.input.right = true;
  };
  const onTouchEnd = () => {
    gameRef.current.input.left = false;
    gameRef.current.input.right = false;
  };

  return (
    <section id="jeu" data-bg="dark" className={styles.section}>
      <div className={styles.container}>
        <Reveal className={styles.head}>
          <div className={styles.eyebrow}>Mini-jeu</div>
          <h2 className={styles.title}>Monte le plus haut possible</h2>
          <p className={styles.intro}>
            Rebondis de plateforme en plateforme (<kbd>ZQSD</kbd> / <kbd>flèches</kbd>) — ne tombe pas de l'écran.
          </p>
          <ul className={styles.legend}>
            <li>🌀 Ressort → rebond géant</li>
            <li>🚀 Jetpack → vol temporaire</li>
            <li>🛡️ Bouclier → absorbe un ennemi</li>
            <li>🪙 Pièce → bonus de score</li>
            <li>👾 Ennemi → termine la partie sans bouclier</li>
          </ul>
        </Reveal>

        <Reveal delay={90} className={styles.stage}>
          <div className={styles.hud}>
            <div className={styles.hudScores}>
              <span>
                Score <strong>{score}</strong>
              </span>
              <span>
                Record <strong>{best}</strong>
              </span>
            </div>
            <button
              type="button"
              className={styles.muteBtn}
              onClick={toggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              title={muted ? "Activer le son" : "Couper le son"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.width}
              height={GAME_CONFIG.height}
              className={styles.canvas}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onTouchCancel={onTouchEnd}
            />

            {phase === "playing" && (jetpackActive || shielded) && (
              <div className={styles.hudPanel}>
                {jetpackActive && <span className={styles.jetpackTag}>🚀</span>}
                {shielded && <span className={styles.shieldTag}>🛡️</span>}
              </div>
            )}

            {phase === "idle" && (
              <div className={styles.overlay}>
                <input
                  type="text"
                  className={styles.nameInput}
                  placeholder="Ton pseudo Discord"
                  value={playerName}
                  onChange={onNameChange}
                  maxLength={20}
                  required
                />
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={startGame}
                  disabled={!playerName.trim()}
                >
                  Jouer
                </button>
                <p className={styles.hintText}>
                  {playerName.trim() ? "ou appuie sur Espace" : "Entre ton pseudo pour jouer"}
                </p>
              </div>
            )}

            {phase === "over" && (
              <div className={styles.overlay}>
                <p className={styles.overScore}>{score}</p>
                {isNewBest && <p className={styles.record}>Nouveau record !</p>}
                <div className={styles.overActions}>
                  <button type="button" className={styles.primaryBtn} onClick={startGame}>
                    Rejouer
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

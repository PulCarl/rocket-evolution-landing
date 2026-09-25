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
// Set by api/discord-callback.js alongside the name, so the UI can show a
// clear "connected" confirmation instead of silently pre-filling a field.
const DISCORD_CONNECTED_KEY = "re-discord-connected";
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
  const [discordError, setDiscordError] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const storedBest = Number(localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(storedBest)) setBest(storedBest);
    setPlayerName(localStorage.getItem(NAME_KEY) || localStorage.getItem(LEGACY_NAME_KEY) || "");
    setDiscordConnected(localStorage.getItem(DISCORD_CONNECTED_KEY) === "1");
    const storedMuted = localStorage.getItem(MUTED_KEY) === "1";
    setMuted(storedMuted);
    mutedRef.current = storedMuted;

    // api/discord-callback.js redirects here with this flag when the
    // Discord login attempt failed — surface it once, then clean the URL.
    if (window.location.search.includes("discord_error=1")) {
      setDiscordError(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
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
    // Editing by hand overrides whatever Discord login set — the
    // "connected" badge shouldn't keep claiming a name the visitor changed.
    if (discordConnected) {
      localStorage.removeItem(DISCORD_CONNECTED_KEY);
      setDiscordConnected(false);
    }
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

  // Touch: the character steers toward wherever the finger is, updated
  // continuously as it drags — reuses the same accelerate-toward-input
  // physics as the keyboard (left/right flags), just derived from "is the
  // finger left or right of the player" instead of a held key.
  const updateTouchInput = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const gameX = (touchX / rect.width) * GAME_CONFIG.width;
    const playerX = gameRef.current.player.x;
    const deadzone = 4;
    gameRef.current.input.left = gameX < playerX - deadzone;
    gameRef.current.input.right = gameX > playerX + deadzone;
  };
  const onTouchEnd = () => {
    gameRef.current.input.left = false;
    gameRef.current.input.right = false;
  };

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  // Lock background scroll while the fullscreen overlay is up, and let
  // Escape close it (handy when testing on desktop).
  useEffect(() => {
    if (!isFullscreen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.code === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isFullscreen]);

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
          <div className={`${styles.stageInner} ${isFullscreen ? styles.stageFullscreen : ""}`}>
          <div className={styles.hud}>
            <div className={styles.hudScores}>
              <span>
                Score <strong>{score}</strong>
              </span>
              <span>
                Record <strong>{best}</strong>
              </span>
            </div>
            <div className={styles.hudButtons}>
              <button
                type="button"
                className={styles.muteBtn}
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? "✕" : "⛶"}
              </button>
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
          </div>

          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.width}
              height={GAME_CONFIG.height}
              className={styles.canvas}
              onTouchStart={updateTouchInput}
              onTouchMove={updateTouchInput}
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
                {discordConnected && playerName ? (
                  <p className={styles.discordConnected}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.1a13.6 13.6 0 0 0-.63 1.28 18.3 18.3 0 0 0-5.53 0A13 13 0 0 0 8.6 3.1a19.7 19.7 0 0 0-4.93 1.47C.54 9.2-.32 13.7.11 18.15a19.9 19.9 0 0 0 6.03 3.03c.49-.66.92-1.36 1.29-2.09-.71-.26-1.39-.59-2.03-.97.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.16.14.33.28.5.4-.64.39-1.32.71-2.03.98.37.73.8 1.43 1.29 2.09a19.8 19.8 0 0 0 6.03-3.03c.5-5.16-.86-9.62-3.57-13.58ZM8.02 15.43c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.96 2.41-2.17 2.41Zm7.96 0c-1.19 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.95 2.41-2.17 2.41Z" />
                    </svg>
                    Connecté en tant que <strong>{playerName}</strong>
                  </p>
                ) : (
                  <a href="/api/discord-login" className={styles.discordBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.1a13.6 13.6 0 0 0-.63 1.28 18.3 18.3 0 0 0-5.53 0A13 13 0 0 0 8.6 3.1a19.7 19.7 0 0 0-4.93 1.47C.54 9.2-.32 13.7.11 18.15a19.9 19.9 0 0 0 6.03 3.03c.49-.66.92-1.36 1.29-2.09-.71-.26-1.39-.59-2.03-.97.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.16.14.33.28.5.4-.64.39-1.32.71-2.03.98.37.73.8 1.43 1.29 2.09a19.8 19.8 0 0 0 6.03-3.03c.5-5.16-.86-9.62-3.57-13.58ZM8.02 15.43c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.96 2.41-2.17 2.41Zm7.96 0c-1.19 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.95 2.41-2.17 2.41Z" />
                    </svg>
                    Se connecter avec Discord
                  </a>
                )}
                <p className={styles.orDivider}>{discordConnected && playerName ? "pas toi ?" : "ou entre ton pseudo"}</p>
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
                {discordError && <p className={styles.errorText}>La connexion Discord a échoué, réessaie.</p>}
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}

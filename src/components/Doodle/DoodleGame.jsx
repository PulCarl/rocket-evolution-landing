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
  playLevelUp,
  playRebirth,
} from "./sfx.js";
import {
  MAX_LEVEL,
  BONUS_TYPES,
  BONUS_ICONS,
  BONUS_LABELS,
  LEVEL_EFFECTS,
  levelUpCost,
  rebirthCost,
  rebirthMultiplier,
  REBIRTH_BONUS_RATE,
  defaultLevels,
  upgradesFromLevels,
} from "./levels.js";
import logoUrl from "../../assets/logo-rocket-evolution.svg";
import styles from "./DoodleGame.module.css";

const BEST_KEY = "re-doodle-best";
const NAME_KEY = "re-doodle-name";
const LEGACY_NAME_KEY = "re-runner-name";
const MUTED_KEY = "re-doodle-muted";
// Written by api/discord-callback.js alongside the name — the Discord user
// id and an HMAC proving this browser actually completed OAuth for it, used
// to sync coins/bonus-levels progression (api/player-progress.js).
const DISCORD_ID_KEY = "re-discord-id";
const DISCORD_SIG_KEY = "re-discord-sig";
const FULLSCREEN_SEEN_KEY = "re-doodle-fullscreen-seen";
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
  // Idle screen defaults to Discord-only — the manual pseudo field is
  // tucked behind this until explicitly requested, so there's one clear
  // path instead of two competing ones side by side.
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [discordId, setDiscordId] = useState(null);
  const discordSigRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Tracks whether this visitor has ever used fullscreen — until they
  // have, the button gets a pulse + a hint nudging them to try it.
  const [hasUsedFullscreen, setHasUsedFullscreen] = useState(false);
  // Coins + bonus levels, synced to the Discord account when connected
  // (api/player-progress.js) — local-only defaults otherwise.
  const [coins, setCoins] = useState(0);
  const [levels, setLevels] = useState(defaultLevels());
  // Which bonus just leveled up, for a brief pop/glow on its card — cleared
  // after the animation finishes.
  const [justUpgraded, setJustUpgraded] = useState(null);
  // Rebirth tier — an uncapped prestige loop bought with coins from the menu
  // (idle or game-over screen, never mid-run): resets bonus levels to 1 but
  // permanently raises the multiplier levels.js applies from then on.
  const [rebirths, setRebirths] = useState(0);
  // Brief pulse on the rebirth button right after a successful purchase.
  const [justRebirthed, setJustRebirthed] = useState(false);
  // Lifetime stats panel (Discord-synced players only).
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  // Top-10 by lifetime coins earned (api/player-progress.js) — a separate
  // ranking from the height-based leaderboard above.
  const [coinsLeaderboard, setCoinsLeaderboard] = useState(null);
  // Shared top-10 from the old 2D mini-game's leaderboard (api/leaderboard.js
  // — all-time, unrelated to this game's own local best) — kept visible as
  // a compact top-3 podium per user request even though that game itself
  // is gone. null = not loaded yet / unavailable.
  const [oldLeaderboard, setOldLeaderboard] = useState(null);
  // Top-10 by best score across every Discord-synced player of THIS game
  // (api/player-progress.js), replacing where the old game's full list
  // used to sit.
  const [newLeaderboard, setNewLeaderboard] = useState(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.leaderboard) return;
        setOldLeaderboard(data.leaderboard);
      })
      .catch(() => {});
    fetch("/api/player-progress?leaderboard=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.leaderboard) return;
        setNewLeaderboard(data.leaderboard);
      })
      .catch(() => {});
    fetch("/api/player-progress?coinsLeaderboard=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.leaderboard) return;
        setCoinsLeaderboard(data.leaderboard);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const storedBest = Number(localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(storedBest)) setBest(storedBest);
    setPlayerName(localStorage.getItem(NAME_KEY) || localStorage.getItem(LEGACY_NAME_KEY) || "");
    const storedMuted = localStorage.getItem(MUTED_KEY) === "1";
    setMuted(storedMuted);
    mutedRef.current = storedMuted;
    setHasUsedFullscreen(localStorage.getItem(FULLSCREEN_SEEN_KEY) === "1");

    const storedId = localStorage.getItem(DISCORD_ID_KEY);
    const storedSig = localStorage.getItem(DISCORD_SIG_KEY);
    if (storedId && storedSig) {
      discordSigRef.current = storedSig;
      setDiscordId(storedId);
      fetch(`/api/player-progress?discordId=${encodeURIComponent(storedId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((record) => {
          if (!record) return;
          setCoins(record.coins || 0);
          if (record.levels) setLevels(record.levels);
          if (typeof record.rebirths === "number") setRebirths(record.rebirths);
          if (typeof record.best === "number") setBest((prev) => Math.max(prev, record.best));
          if (typeof record.gamesPlayed === "number") setGamesPlayed(record.gamesPlayed);
          if (typeof record.totalScore === "number") setTotalScore(record.totalScore);
        })
        .catch(() => {});
    }

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
  };

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    unlockAudio();
    gameRef.current = createGame(upgradesFromLevels(levels, rebirths));
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
      setShielded(gameRef.current.shieldCharges > 0);

      if (crashed) {
        setPhase("over");
        const runCoins = gameRef.current.coinScore;

        if (discordId && discordSigRef.current) {
          // Connected: the server record is the source of truth for coins
          // and best score going forward — sync this run's result to it.
          fetch("/api/player-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              discordId,
              sig: discordSigRef.current,
              action: "finishRun",
              name: playerName,
              score: currentScore,
              coinsEarned: runCoins,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((record) => {
              if (!record) return;
              setCoins(record.coins);
              setGamesPlayed(record.gamesPlayed);
              setTotalScore(record.totalScore);
              setBest((prevBest) => {
                if (record.best > prevBest) {
                  setIsNewBest(true);
                  playRecord(SFX_VOLUME, mutedRef.current);
                }
                return Math.max(prevBest, record.best);
              });
            })
            .catch(() => {});
        } else {
          setBest((prevBest) => {
            const newBest = Math.max(prevBest, currentScore);
            if (newBest > prevBest) {
              localStorage.setItem(BEST_KEY, String(newBest));
              setIsNewBest(true);
              playRecord(SFX_VOLUME, mutedRef.current);
            }
            return newBest;
          });
        }
        stopLoop();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop, levels, rebirths, discordId, playerName]);

  useEffect(() => stopLoop, [stopLoop]);

  const levelUp = (bonus) => {
    if (!discordId || !discordSigRef.current) return;
    unlockAudio();
    fetch("/api/player-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId, sig: discordSigRef.current, action: "levelUp", bonus }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((record) => {
        if (!record) return;
        setCoins(record.coins);
        setLevels(record.levels);
        playLevelUp(SFX_VOLUME, mutedRef.current);
        setJustUpgraded(bonus);
        setTimeout(() => setJustUpgraded((cur) => (cur === bonus ? null : cur)), 700);
      })
      .catch(() => {});
  };

  // A menu-level purchase (idle or game-over screen, never mid-run): spends
  // coins for the next permanent rebirth tier, which resets bonus levels to
  // 1 but raises the multiplier levels.js applies from then on. Cost/levels
  // are enforced again server-side.
  const triggerRebirth = useCallback(() => {
    if (!discordId || !discordSigRef.current) return;
    if (coins < rebirthCost(rebirths)) return;
    unlockAudio();
    fetch("/api/player-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId, sig: discordSigRef.current, action: "rebirth", name: playerName }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((record) => {
        if (!record) return;
        setCoins(record.coins);
        setLevels(record.levels);
        setRebirths(record.rebirths);
        setJustRebirthed(true);
        setTimeout(() => setJustRebirthed(false), 800);
        playRebirth(SFX_VOLUME, mutedRef.current);
      })
      .catch(() => {});
  }, [discordId, playerName, coins, rebirths]);

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

  const toggleFullscreen = () => {
    setIsFullscreen((v) => !v);
    if (!hasUsedFullscreen) {
      localStorage.setItem(FULLSCREEN_SEEN_KEY, "1");
      setHasUsedFullscreen(true);
    }
  };

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
          <h2 className={styles.title}>Rocket Jump</h2>
          <p className={styles.intro}>
            Monte le plus haut possible en rebondissant de plateforme en plateforme (<kbd>ZQSD</kbd> /{" "}
            <kbd>flèches</kbd>) — ne tombe pas de l'écran.
          </p>
          <ul className={styles.legend}>
            <li>🌀 Ressort → rebond géant</li>
            <li>🚀 Jetpack → vol temporaire</li>
            <li>🛡️ Bouclier → absorbe un ennemi</li>
            <li>🪙 Pièce → bonus de score</li>
            <li>👾 Ennemi → termine la partie sans bouclier</li>
          </ul>
          {!hasUsedFullscreen && (
            <p className={styles.fullscreenHint}>
              💡 Astuce : passe en <strong>plein écran</strong> (⛶) pour une meilleure expérience, surtout sur
              mobile !
            </p>
          )}
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
                className={`${styles.fullscreenBtn} ${!hasUsedFullscreen && !isFullscreen ? styles.fullscreenBtnPulse : ""}`}
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

          <div className={styles.stageBody}>
            {discordId ? (
              <div className={`${styles.progress} ${styles.sidePanel}`}>
                <div className={styles.leaderboardHead}>
                  <h3 className={styles.leaderboardTitle}>🪙 Progression</h3>
                  <span className={styles.coinBalance}>{coins} pièces</span>
                </div>
                <p className={styles.leaderboardNote}>
                  Dépense les pièces ramassées en jeu pour améliorer tes bonus. Sauvegardé sur ton compte Discord.
                </p>

                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{gamesPlayed}</span>
                    <span className={styles.statLabel}>Parties</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{best}</span>
                    <span className={styles.statLabel}>Meilleur score</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0}</span>
                    <span className={styles.statLabel}>Score moyen</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{coins}</span>
                    <span className={styles.statLabel}>Pièces</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{playerName || "—"}</span>
                    <span className={styles.statLabel}>Pseudo Discord</span>
                  </div>
                </div>

                <div className={styles.rebirthInfo}>
                  <span className={styles.rebirthBadge}>✨ Renaissance {rebirths}</span>
                  <span className={styles.rebirthNext}>
                    Boost actuel : +{Math.round((rebirthMultiplier(rebirths) - 1) * 100)}%
                  </span>
                </div>
                {phase !== "playing" && (
                  <>
                    <button
                      type="button"
                      className={`${styles.rebirthPurchaseBtn} ${justRebirthed ? styles.rebirthPurchaseBtnPulse : ""}`}
                      onClick={triggerRebirth}
                      disabled={coins < rebirthCost(rebirths)}
                    >
                      ✨ Renaître ({rebirthCost(rebirths)} 🪙)
                    </button>
                    <p className={styles.rebirthHint}>
                      Réinitialise tes niveaux de bonus (tu gardes tes pièces) et augmente définitivement leur
                      puissance.
                    </p>
                  </>
                )}

                <div className={styles.upgradeGrid}>
                  {BONUS_TYPES.map((bonus) => {
                    const cfg = LEVEL_EFFECTS[bonus];
                    const level = levels[bonus] || 1;
                    const maxed = level >= MAX_LEVEL;
                    const cost = maxed ? null : levelUpCost(level + 1, rebirths);
                    const canAfford = !maxed && coins >= cost;
                    return (
                      <div
                        key={bonus}
                        className={`${styles.upgradeCard} ${justUpgraded === bonus ? styles.upgradeCardPulse : ""}`}
                      >
                        <span className={styles.upgradeIcon}>{BONUS_ICONS[bonus]}</span>
                        <span className={styles.upgradeName}>{BONUS_LABELS[bonus]}</span>
                        <span className={styles.upgradeLevel}>
                          Nv. {level}/{MAX_LEVEL}
                        </span>
                        <span className={styles.upgradeEffect}>{cfg.label(cfg.values[level - 1])}</span>
                        <button
                          type="button"
                          className={styles.upgradeBtn}
                          onClick={() => levelUp(bonus)}
                          disabled={maxed || !canAfford}
                        >
                          {maxed ? "Niveau max" : `Améliorer (${cost} 🪙)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className={`${styles.progressHint} ${styles.sidePanel}`}>
                🪙 Connecte-toi avec Discord pour débloquer la progression des bonus.
              </p>
            )}

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
                  {discordId && playerName ? (
                    // Connected: badge + Jouer grouped in one card, so it
                    // reads as "you're set, go" instead of a badge sitting
                    // above an otherwise-unchanged form.
                    <div className={styles.connectedCard}>
                      <p className={styles.discordConnected}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.1a13.6 13.6 0 0 0-.63 1.28 18.3 18.3 0 0 0-5.53 0A13 13 0 0 0 8.6 3.1a19.7 19.7 0 0 0-4.93 1.47C.54 9.2-.32 13.7.11 18.15a19.9 19.9 0 0 0 6.03 3.03c.49-.66.92-1.36 1.29-2.09-.71-.26-1.39-.59-2.03-.97.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.16.14.33.28.5.4-.64.39-1.32.71-2.03.98.37.73.8 1.43 1.29 2.09a19.8 19.8 0 0 0 6.03-3.03c.5-5.16-.86-9.62-3.57-13.58ZM8.02 15.43c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.96 2.41-2.17 2.41Zm7.96 0c-1.19 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.95 2.41-2.17 2.41Z" />
                        </svg>
                        Connecté en tant que <strong>{playerName}</strong>
                      </p>
                      <button type="button" className={styles.primaryBtn} onClick={startGame}>
                        Jouer
                      </button>
                      <p className={styles.hintText}>ou appuie sur Espace</p>
                    </div>
                  ) : showManualEntry ? (
                    // Manual path, opened on request — pseudo typed by hand,
                    // no Discord account needed.
                    <>
                      <input
                        type="text"
                        className={styles.nameInput}
                        placeholder="Ton pseudo Discord"
                        value={playerName}
                        onChange={onNameChange}
                        maxLength={20}
                        required
                        autoFocus
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
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setShowManualEntry(false)}
                      >
                        ← Se connecter avec Discord
                      </button>
                    </>
                  ) : (
                    // Default: Discord-only, so there's one clear path
                    // instead of two options competing for attention.
                    <>
                      <a href="/api/discord-login" className={styles.discordBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.1a13.6 13.6 0 0 0-.63 1.28 18.3 18.3 0 0 0-5.53 0A13 13 0 0 0 8.6 3.1a19.7 19.7 0 0 0-4.93 1.47C.54 9.2-.32 13.7.11 18.15a19.9 19.9 0 0 0 6.03 3.03c.49-.66.92-1.36 1.29-2.09-.71-.26-1.39-.59-2.03-.97.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.16.14.33.28.5.4-.64.39-1.32.71-2.03.98.37.73.8 1.43 1.29 2.09a19.8 19.8 0 0 0 6.03-3.03c.5-5.16-.86-9.62-3.57-13.58ZM8.02 15.43c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.96 2.41-2.17 2.41Zm7.96 0c-1.19 0-2.16-1.08-2.16-2.41 0-1.33.95-2.42 2.16-2.42 1.22 0 2.19 1.09 2.17 2.42 0 1.33-.95 2.41-2.17 2.41Z" />
                        </svg>
                        Se connecter avec Discord
                      </a>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setShowManualEntry(true)}
                      >
                        ou jouer sans te connecter
                      </button>
                    </>
                  )}
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

            {(oldLeaderboard !== null || newLeaderboard !== null || coinsLeaderboard !== null) && (
              <div className={`${styles.rightColumn} ${styles.sidePanel}`}>
                {oldLeaderboard !== null && oldLeaderboard.length > 0 && (
                  <div className={styles.leaderboard}>
                    <div className={styles.leaderboardHead}>
                      <h3 className={styles.leaderboardTitle}>🏆 Top 3 — ancien mini-jeu</h3>
                    </div>
                    <ol className={styles.leaderboardList}>
                      {oldLeaderboard.slice(0, 3).map((entry, i) => (
                        <li key={i} className={styles.leaderboardRow}>
                          <span className={styles.leaderboardRank}>{["🥇", "🥈", "🥉"][i]}</span>
                          <span className={styles.leaderboardName}>{entry.name}</span>
                          <span className={styles.leaderboardScore}>{entry.score}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {newLeaderboard !== null && (
                  <div className={styles.leaderboard}>
                    <div className={styles.leaderboardHead}>
                      <h3 className={styles.leaderboardTitle}>🏆 Top 10 — Rocket Jump</h3>
                    </div>
                    <p className={styles.leaderboardNote}>Les meilleurs scores des joueurs connectés à Discord.</p>
                    {newLeaderboard.length === 0 ? (
                      <p className={styles.leaderboardEmpty}>Personne n'a encore marqué de point.</p>
                    ) : (
                      <ol className={styles.leaderboardList}>
                        {newLeaderboard.map((entry, i) => (
                          <li key={i} className={styles.leaderboardRow}>
                            <span className={styles.leaderboardRank}>
                              {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                            </span>
                            <span className={styles.leaderboardName}>{entry.name}</span>
                            <span className={styles.leaderboardScore}>{entry.score}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}

                {coinsLeaderboard !== null && (
                  <div className={styles.leaderboard}>
                    <div className={styles.leaderboardHead}>
                      <h3 className={styles.leaderboardTitle}>🪙 Top 10 — Plus riches</h3>
                    </div>
                    <p className={styles.leaderboardNote}>Total de pièces gagnées à vie.</p>
                    {coinsLeaderboard.length === 0 ? (
                      <p className={styles.leaderboardEmpty}>Personne n'a encore gagné de pièce.</p>
                    ) : (
                      <ol className={styles.leaderboardList}>
                        {coinsLeaderboard.map((entry, i) => (
                          <li key={i} className={styles.leaderboardRow}>
                            <span className={styles.leaderboardRank}>
                              {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                            </span>
                            <span className={styles.leaderboardName}>{entry.name}</span>
                            <span className={styles.leaderboardScore}>{entry.score} 🪙</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

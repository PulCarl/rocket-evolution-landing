import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "../Reveal.jsx";
import Scene from "./Scene.jsx";
import { CHECKPOINTS } from "./trackData.js";
import { unlockAudio, playCountdownTick, playGo, playCheckpoint, playFinish } from "./sfx.js";
import styles from "./CircuitGame.module.css";

const BEST_KEY = "re-circuit-best";
const NAME_KEY = "re-circuit-name";
const LEGACY_NAME_KEY = "re-runner-name";
const MUTED_KEY = "re-circuit-muted";
const SFX_VOLUME = 0.55;
const TOTAL_GATES = CHECKPOINTS.length - 1;

// Physical key position (e.reachable via e.code), not the printed label —
// so this already supports WASD on QWERTY and ZQSD on AZERTY for free,
// since both press the same physical keys.
const KEY_MAP = {
  ArrowUp: "forward",
  KeyW: "forward",
  ArrowDown: "back",
  KeyS: "back",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "boost",
  ShiftLeft: "boost",
  ShiftRight: "boost",
};

function formatTime(seconds) {
  if (seconds == null) return "--:--.--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

export default function CircuitGame() {
  const [phase, setPhase] = useState("idle"); // idle | countdown | racing | finished
  const phaseRef = useRef("idle");
  phaseRef.current = phase;

  const [raceId, setRaceId] = useState(0);
  const [countdownLabel, setCountdownLabel] = useState(null);
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [boost, setBoost] = useState(100);
  const [finalTime, setFinalTime] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [best, setBest] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const keysRef = useRef({ forward: false, back: false, left: false, right: false, boost: false });

  useEffect(() => {
    const storedBest = Number(localStorage.getItem(BEST_KEY));
    if (Number.isFinite(storedBest) && storedBest > 0) setBest(storedBest);
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

  // Keyboard: only "drives" while racing (the ref is harmless to update at
  // any other phase, Scene/Car just ignores it outside phase "racing").
  useEffect(() => {
    const onDown = (e) => {
      const key = KEY_MAP[e.code];
      if (!key || document.activeElement?.tagName === "INPUT") return;
      e.preventDefault();
      keysRef.current[key] = true;
    };
    const onUp = (e) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      keysRef.current[key] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const startRace = useCallback(() => {
    unlockAudio();
    setRaceId((id) => id + 1);
    setCheckpointIndex(0);
    setElapsed(0);
    setBoost(100);
    setFinalTime(null);
    setIsNewBest(false);
    setPhase("countdown");
  }, []);

  // 3, 2, 1, GO — then hands control to the player. Re-runs fresh every time
  // `phase` becomes "countdown" (from "idle" or "finished").
  useEffect(() => {
    if (phase !== "countdown") return;
    let cancelled = false;
    const say = (label) => {
      if (cancelled) return;
      setCountdownLabel(label);
      if (label === "GO") playGo(SFX_VOLUME, mutedRef.current);
      else playCountdownTick(SFX_VOLUME, mutedRef.current);
    };
    say(3);
    const t2 = setTimeout(() => say(2), 700);
    const t1 = setTimeout(() => say(1), 1400);
    const tGo = setTimeout(() => {
      if (cancelled) return;
      say("GO");
      setPhase("racing");
    }, 2100);
    const tClear = setTimeout(() => {
      if (!cancelled) setCountdownLabel(null);
    }, 2600);
    return () => {
      cancelled = true;
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tGo);
      clearTimeout(tClear);
    };
  }, [phase]);

  const onCheckpoint = useCallback((idx) => {
    setCheckpointIndex(idx);
    playCheckpoint(SFX_VOLUME, mutedRef.current);
  }, []);

  const onFinish = useCallback((elapsedSeconds) => {
    setFinalTime(elapsedSeconds);
    setCheckpointIndex(TOTAL_GATES);
    setPhase("finished");
    playFinish(SFX_VOLUME, mutedRef.current);
    setBest((prevBest) => {
      if (prevBest != null && prevBest <= elapsedSeconds) return prevBest;
      localStorage.setItem(BEST_KEY, String(elapsedSeconds));
      setIsNewBest(true);
      return elapsedSeconds;
    });
  }, []);

  const onTick = useCallback((elapsedSeconds, boostValue) => {
    setElapsed(elapsedSeconds);
    setBoost(boostValue);
  }, []);

  return (
    <section id="jeu" data-bg="dark" className={styles.section}>
      <div className={styles.container}>
        <Reveal className={styles.head}>
          <div className={styles.eyebrow}>Mini-jeu</div>
          <h2 className={styles.title}>Fais le meilleur temps</h2>
          <p className={styles.intro}>
            Un tour de circuit avec la fennec, checkpoint par checkpoint. <kbd>ZQSD</kbd> / <kbd>flèches</kbd> pour
            conduire, <kbd>Espace</kbd> pour le boost.
          </p>
        </Reveal>

        <Reveal delay={90} className={styles.stage}>
          <div className={styles.hud}>
            <div className={styles.hudScores}>
              <span>
                Temps <strong>{formatTime(elapsed)}</strong>
              </span>
              <span>
                Record <strong>{formatTime(best)}</strong>
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
            <Scene
              phaseRef={phaseRef}
              keysRef={keysRef}
              raceId={raceId}
              nextCheckpointIndex={phase === "finished" ? -1 : checkpointIndex + 1 === CHECKPOINTS.length ? 0 : checkpointIndex + 1}
              onCheckpoint={onCheckpoint}
              onFinish={onFinish}
              onTick={onTick}
            />

            {phase === "racing" && (
              <>
                <div className={styles.gateProgress}>
                  Checkpoint {checkpointIndex}/{TOTAL_GATES}
                </div>
                <div className={styles.boostGauge} title="Boost">
                  <div className={styles.boostGaugeFill} style={{ width: `${boost}%` }} />
                </div>
              </>
            )}

            {countdownLabel !== null && (
              <div className={styles.countdown}>{countdownLabel === "GO" ? "GO !" : countdownLabel}</div>
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
                  onClick={startRace}
                  disabled={!playerName.trim()}
                >
                  Jouer
                </button>
                <p className={styles.hintText}>
                  {playerName.trim() ? "Un tour, checkpoint par checkpoint" : "Entre ton pseudo pour jouer"}
                </p>
              </div>
            )}

            {phase === "finished" && (
              <div className={styles.overlay}>
                <p className={styles.overTime}>{formatTime(finalTime)}</p>
                {isNewBest && <p className={styles.record}>Nouveau record !</p>}
                <div className={styles.overActions}>
                  <button type="button" className={styles.primaryBtn} onClick={startRace}>
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

import { useEffect, useRef, useState, useCallback } from "react";
import Reveal from "../Reveal.jsx";
import { createGame, jump, step, draw } from "./engine.js";
import { renderShareCardBlob, renderShareCard } from "./shareCard.js";
import { GAME_CONFIG } from "../../game/scoring.js";
import logoUrl from "../../assets/logo-rocket-evolution.svg";
import styles from "./RocketRunner.module.css";

const BEST_KEY = "re-runner-best";
const NAME_KEY = "re-runner-name";

export default function RocketRunner() {
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
  const [playerName, setPlayerName] = useState("");
  const [shareState, setShareState] = useState("idle"); // idle | copying | copied | downloaded | error

  // Shared top-10 leaderboard (see api/leaderboard.js). null = not loaded /
  // unavailable (e.g. the gist env vars aren't configured yet) — hidden in
  // that case rather than showing a broken-looking empty panel.
  const [leaderboard, setLeaderboard] = useState(null);
  const [justRanked, setJustRanked] = useState(false);
  const sessionTokenRef = useRef(null);

  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(stored)) setBest(stored);
    setPlayerName(localStorage.getItem(NAME_KEY) || "");
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.leaderboard && setLeaderboard(data.leaderboard))
      .catch(() => {});
  }, []);

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
    gameRef.current = createGame();
    setScore(0);
    setShareState("idle");
    setJustRanked(false);
    setPhase("playing");
    lastRef.current = performance.now();

    // Ask the server for a signed "run started now" token — checked against
    // the elapsed time claimed when the score is submitted at game over.
    sessionTokenRef.current = null;
    fetch("/api/game-session", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.token && (sessionTokenRef.current = data.token))
      .catch(() => {});

    const loop = (now) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const { crashed } = step(gameRef.current, dt);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx, gameRef.current, logoRef.current);
      const currentScore = Math.floor(gameRef.current.distance);
      setScore(currentScore);

      if (crashed) {
        setPhase("over");
        setBest((prevBest) => {
          const newBest = Math.max(prevBest, currentScore);
          localStorage.setItem(BEST_KEY, String(newBest));
          return newBest;
        });
        stopLoop();

        const token = sessionTokenRef.current;
        if (token && currentScore > 0) {
          fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: playerName,
              score: currentScore,
              elapsedSeconds: gameRef.current.t,
              token,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.leaderboard) setLeaderboard(data.leaderboard);
              if (data?.qualified) setJustRanked(true);
            })
            .catch(() => {});
        }
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop, playerName]);

  useEffect(() => stopLoop, [stopLoop]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      if (document.activeElement?.tagName === "INPUT") return;
      e.preventDefault();
      if (phase === "playing") jump(gameRef.current);
      else if (phase === "idle" || phase === "over") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, startGame]);

  // Only on the canvas itself (not the overlay/buttons layered on top of it),
  // so clicking "Rejouer" / "Copier" doesn't also bubble into a jump/restart.
  const onCanvasPress = () => {
    if (phase === "playing") jump(gameRef.current);
    else if (phase === "over") startGame();
  };

  const copyImage = async () => {
    setShareState("copying");
    const isRecord = score >= best && score > 0;
    const cardOpts = { score, best: Math.max(score, best), isRecord, playerName };

    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        // Pass the ClipboardItem a *pending* promise and call write()
        // synchronously (no await before it) — some browsers (notably
        // Safari) revoke the clipboard-write permission if there's an
        // await in between the click and the call, since that can look
        // like the user gesture has "expired".
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": renderShareCardBlob(cardOpts) }),
        ]);
        setShareState("copied");
      } else {
        throw new Error("clipboard-unavailable");
      }
    } catch (err) {
      console.warn("Clipboard copy failed, falling back to download:", err);
      try {
        const blob = await renderShareCardBlob(cardOpts).catch(() => null);
        const url = blob ? URL.createObjectURL(blob) : renderShareCard(cardOpts);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rocket-evolution-score-${score}.png`;
        a.click();
        if (blob) URL.revokeObjectURL(url);
        setShareState("downloaded");
      } catch {
        setShareState("error");
      }
    }
  };

  return (
    <section id="jeu" data-bg="dark" className={styles.section}>
      <div className={styles.container}>
        <Reveal className={styles.head}>
          <div className={styles.eyebrow}>Mini-jeu</div>
          <h2 className={styles.title}>Combien de points tu tiens ?</h2>
          <p className={styles.intro}>
            Saute par-dessus les obstacles avec <kbd>Espace</kbd> / clic. Ça accélère avec le temps — copie une image
            de ton score et colle-la dans notre salon Discord.
          </p>
        </Reveal>

        <Reveal delay={90} className={styles.stage}>
          <div className={styles.hud}>
            <span>
              Score <strong>{score}</strong>
            </span>
            <span>
              Record <strong>{best}</strong>
            </span>
          </div>

          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.width}
              height={GAME_CONFIG.height}
              className={styles.canvas}
              onPointerDown={onCanvasPress}
            />

            {phase === "idle" && (
              <div className={styles.overlay}>
                <input
                  type="text"
                  className={styles.nameInput}
                  placeholder="Ton pseudo (optionnel)"
                  value={playerName}
                  onChange={onNameChange}
                  maxLength={20}
                />
                <button type="button" className={styles.primaryBtn} onClick={startGame}>
                  Jouer
                </button>
                <p className={styles.hintText}>ou appuie sur Espace</p>
              </div>
            )}

            {phase === "over" && (
              <div className={styles.overlay}>
                <p className={styles.overScore}>{score}</p>
                {score >= best && score > 0 && <p className={styles.record}>Nouveau record !</p>}
                {justRanked && <p className={styles.record}>🏆 Top 10 du classement !</p>}
                <div className={styles.overActions}>
                  <button type="button" className={styles.primaryBtn} onClick={startGame}>
                    Rejouer
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={copyImage}
                    disabled={shareState === "copying"}
                  >
                    {shareState === "copying" && "Copie…"}
                    {shareState === "copied" && "Copié ✓"}
                    {shareState === "downloaded" && "Téléchargée ✓"}
                    {shareState === "error" && "Erreur, réessaie"}
                    {shareState === "idle" && "Copier l'image du score"}
                  </button>
                </div>
                {(shareState === "copied" || shareState === "downloaded") && (
                  <p className={styles.shareHint}>
                    {shareState === "copied"
                      ? "Colle-la (Ctrl+V) dans un salon Discord !"
                      : "Envoie le fichier téléchargé dans un salon Discord !"}
                  </p>
                )}
              </div>
            )}
          </div>

          {leaderboard !== null && (
            <div className={styles.leaderboard}>
              <div className={styles.leaderboardHead}>
                <h3 className={styles.leaderboardTitle}>🏆 Top 10 du mois</h3>
                <span className={styles.leaderboardSub}>Remis à zéro chaque mois</span>
              </div>
              {leaderboard.length === 0 ? (
                <p className={styles.leaderboardEmpty}>Sois le premier à marquer un point !</p>
              ) : (
                <ol className={styles.leaderboardList}>
                  {leaderboard.map((entry, i) => (
                    <li key={i} className={styles.leaderboardRow}>
                      <span className={styles.leaderboardRank}>{i + 1}</span>
                      <span className={styles.leaderboardName}>{entry.name}</span>
                      <span className={styles.leaderboardScore}>{entry.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

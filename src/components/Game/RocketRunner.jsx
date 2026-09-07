import { useEffect, useRef, useState, useCallback } from "react";
import Reveal from "../Reveal.jsx";
import { createGame, jump, step, draw } from "./engine.js";
import { renderShareCard } from "./shareCard.js";
import { GAME_CONFIG } from "../../game/scoring.js";
import logoUrl from "../../assets/logo-rocket-evolution.svg";
import styles from "./RocketRunner.module.css";

const BEST_KEY = "re-runner-best";

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
  const [shareState, setShareState] = useState("idle"); // idle | sending | done | error

  useEffect(() => {
    const stored = Number(localStorage.getItem(BEST_KEY) || 0);
    if (Number.isFinite(stored)) setBest(stored);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = createGame();
    setScore(0);
    setShareState("idle");
    setPhase("playing");
    lastRef.current = performance.now();

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
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop]);

  useEffect(() => stopLoop, [stopLoop]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" && e.code !== "ArrowUp") return;
      e.preventDefault();
      if (phase === "playing") jump(gameRef.current);
      else if (phase === "idle" || phase === "over") startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, startGame]);

  const onPress = () => {
    if (phase === "playing") jump(gameRef.current);
    else startGame();
  };

  const copyImage = async () => {
    setShareState("copying");
    try {
      const isRecord = score >= best && score > 0;
      const dataUrl = renderShareCard({ score, best: Math.max(score, best), isRecord });
      const blob = await (await fetch(dataUrl)).blob();

      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setShareState("copied");
      } else {
        // Clipboard image writes aren't supported everywhere (older Safari) —
        // fall back to a plain download so there's still a file to attach.
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `rocket-evolution-score-${score}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        setShareState("downloaded");
      }
    } catch {
      setShareState("error");
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

          <div className={styles.canvasWrap} onPointerDown={onPress}>
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.width}
              height={GAME_CONFIG.height}
              className={styles.canvas}
            />

            {phase === "idle" && (
              <div className={styles.overlay}>
                <p>Espace / clic pour démarrer</p>
              </div>
            )}

            {phase === "over" && (
              <div className={styles.overlay}>
                <p className={styles.overScore}>{score}</p>
                {score >= best && score > 0 && <p className={styles.record}>Nouveau record !</p>}
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
        </Reveal>
      </div>
    </section>
  );
}

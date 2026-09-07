// Renders a branded "game over" share card (player name + score) to an
// offscreen canvas.
function drawCard({ score, best, isRecord, playerName }) {
  const W = 900;
  const H = 500;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1d1d1d";
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W * 0.82, H * 0.1, 0, W * 0.82, H * 0.1, 420);
  halo.addColorStop(0, "rgba(216,34,78,.35)");
  halo.addColorStop(1, "rgba(216,34,78,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);
  const halo2 = ctx.createRadialGradient(W * 0.12, H * 0.95, 0, W * 0.12, H * 0.95, 380);
  halo2.addColorStop(0, "rgba(254,152,12,.28)");
  halo2.addColorStop(1, "rgba(254,152,12,0)");
  ctx.fillStyle = halo2;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.font = "700 20px Arial";
  ctx.letterSpacing = "4px";
  ctx.fillText("ROCKET EVOLUTION · MINI-JEU", W / 2, 74);

  const name = (playerName || "").trim();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = "700 24px Arial";
  ctx.letterSpacing = "1px";
  ctx.fillText(name ? name.toUpperCase() : "JOUEUR ANONYME", W / 2, 116);

  ctx.fillStyle = isRecord ? "#fe980c" : "rgba(255,255,255,.85)";
  ctx.font = "800 34px Arial";
  ctx.letterSpacing = "2px";
  ctx.fillText(isRecord ? "NOUVEAU RECORD !" : "GAME OVER", W / 2, 172);

  const grad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  grad.addColorStop(0, "#fe980c");
  grad.addColorStop(0.5, "#f4791c");
  grad.addColorStop(1, "#d8224e");
  ctx.fillStyle = grad;
  ctx.font = "800 150px Arial";
  ctx.letterSpacing = "0px";
  ctx.fillText(String(score), W / 2, 340);

  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.font = "600 22px Arial";
  ctx.fillText(`Meilleur score : ${best}`, W / 2, 405);

  ctx.fillStyle = "rgba(255,255,255,.35)";
  ctx.font = "500 16px Arial";
  ctx.fillText("rocketevolution.fr", W / 2, 450);

  return canvas;
}

// Preferred: resolves to a Blob via canvas.toBlob (no base64 round-trip).
export function renderShareCardBlob(opts) {
  return new Promise((resolve, reject) => {
    drawCard(opts).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob failed"));
    }, "image/png");
  });
}

// Fallback for environments without canvas.toBlob.
export function renderShareCard(opts) {
  return drawCard(opts).toDataURL("image/png");
}

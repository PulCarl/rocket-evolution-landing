import { useEffect, useState } from "react";

const POLL_MS = 2 * 60 * 1000;

// Returns the live stream info from /api/twitch-live while the channel is
// live, or null otherwise (offline, endpoint not configured, or unreachable —
// including `npm run dev`, where api/ doesn't run and the fetch just fails).
export function useTwitchLive() {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      fetch("/api/twitch-live")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data) setStream(data.live ? data : null);
        })
        .catch(() => {});
    };

    check();
    // No point polling a background tab; catch up as soon as it's visible again.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return stream;
}

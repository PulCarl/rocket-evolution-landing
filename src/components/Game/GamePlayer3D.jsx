import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrthographicCamera, Environment, Center } from "@react-three/drei";
import { GAME_CONFIG } from "../../game/scoring.js";
import styles from "./GamePlayer3D.module.css";

const MODEL_URL = new URL("../../assets/3d/fennec.glb", import.meta.url).href;
const { width: W, height: H } = GAME_CONFIG;
const SCALE = 7;

function Car({ gameRef }) {
  const group = useRef(null);
  const { scene } = useGLTF(MODEL_URL);

  useFrame(() => {
    if (!group.current) return;
    const p = gameRef.current.player;
    group.current.position.set(p.x, H - p.y + 2, 0);
    // Nose tilts up on the way up, down on the way down — a little jump flair.
    const tilt = Math.max(-0.35, Math.min(0.35, -p.vy * 0.00045));
    group.current.rotation.z = tilt;
  });

  return (
    <group ref={group}>
      <Center>
        <primitive object={scene} scale={SCALE} rotation={[0, Math.PI / 2, 0]} />
      </Center>
    </group>
  );
}

export default function GamePlayer3D({ gameRef }) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // react-three-fiber measures its own container via ResizeObserver to size
  // the drawing buffer — but this Canvas mounts lazily (React.lazy +
  // Suspense) inside a responsive aspect-ratio container, and that
  // measurement sometimes fires once too early and never gets a follow-up,
  // leaving it stuck at the 300x150 default. Sidestepping that entirely:
  // the inner wrapper below is a fixed, non-percentage W x H box (so r3f
  // always measures the same stable number), and *we* scale that whole box
  // visually to fit the actual responsive container, with our own
  // ResizeObserver.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) setScale(width / W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} className={styles.overlay}>
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Canvas
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => gl.setSize(W, H, false)}
        >
          <OrthographicCamera makeDefault left={0} right={W} top={H} bottom={0} near={0.1} far={1000} position={[0, 0, 10]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 4, 3]} intensity={1.3} />
          <Suspense fallback={null}>
            <Car gameRef={gameRef} />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);

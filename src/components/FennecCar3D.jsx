import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Center, Bounds } from "@react-three/drei";
import styles from "./FennecCar3D.module.css";

const MODEL_URL = new URL("../assets/3d/fennec.glb", import.meta.url).href;
const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DRAG_SENSITIVITY = 0.012;

function Car({ groupRef, drag }) {
  useFrame((_, delta) => {
    if (!groupRef.current || drag.current.dragging) return;
    if (Math.abs(drag.current.velocity) > 0.0004) {
      // Momentum: keep coasting after a flick, decaying each frame.
      groupRef.current.rotation.y += drag.current.velocity;
      drag.current.velocity *= 0.94;
    } else if (!reducedMotion) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  const { scene } = useGLTF(MODEL_URL);
  return (
    <group ref={groupRef} rotation={[0, Math.PI * 0.15, 0]}>
      <Center>
        {/* Static tilt: stands the car nose-up (vertical) — kept separate from
            the group's Y spin above so the two rotations don't compound. */}
        <primitive object={scene} rotation={[Math.PI / 2, 0, 0]} />
      </Center>
    </group>
  );
}

export default function FennecCar3D() {
  const groupRef = useRef(null);
  const drag = useRef({ dragging: false, lastX: 0, velocity: 0 });
  const [grabbing, setGrabbing] = useState(false);

  const onPointerDown = (e) => {
    drag.current.dragging = true;
    drag.current.lastX = e.clientX;
    drag.current.velocity = 0;
    setGrabbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.dragging || !groupRef.current) return;
    const deltaX = e.clientX - drag.current.lastX;
    drag.current.lastX = e.clientX;
    const rotationDelta = deltaX * DRAG_SENSITIVITY;
    groupRef.current.rotation.y += rotationDelta;
    drag.current.velocity = rotationDelta;
  };
  const endDrag = () => {
    drag.current.dragging = false;
    setGrabbing(false);
  };

  return (
    <div
      className={`${styles.canvasWrap} ${grabbing ? styles.grabbing : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <Canvas camera={{ fov: 32 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 3]} intensity={1.4} />
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.3}>
            <Car groupRef={groupRef} drag={drag} />
          </Bounds>
          <Environment preset="city" />
          <ContactShadows position={[0, -2.1, 0]} opacity={0.5} scale={8} blur={2.4} far={2} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Center, Bounds } from "@react-three/drei";
import styles from "./FennecCar3D.module.css";

const MODEL_URL = new URL("../assets/3d/fennec.glb", import.meta.url).href;
const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Car() {
  const group = useRef(null);

  useFrame((_, delta) => {
    if (reducedMotion || !group.current) return;
    group.current.rotation.y += delta * 0.4;
  });

  const { scene } = useGLTF(MODEL_URL);
  return (
    <group ref={group} rotation={[0, Math.PI * 0.15, 0]}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

export default function FennecCar3D() {
  return (
    <div className={styles.canvasWrap}>
      <Canvas camera={{ fov: 32 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 3]} intensity={1.4} />
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.3}>
            <Car />
          </Bounds>
          <Environment preset="city" />
          <ContactShadows position={[0, -1.05, 0]} opacity={0.5} scale={8} blur={2.4} far={2} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);

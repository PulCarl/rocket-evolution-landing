import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import { CHECKPOINTS, START_POSITION } from "./trackData.js";

const MODEL_URL = new URL("../../assets/3d/fennec.glb", import.meta.url).href;
useGLTF.preload(MODEL_URL);

// Arcade car physics (no physics engine): accelerate/brake, drag, and
// speed-scaled steering, tuned to feel snappy over one ~20-30s lap rather
// than simulate anything close to real car handling.
const ACCEL = 26;
const REVERSE_ACCEL = 16;
const MAX_SPEED = 24;
const REVERSE_MAX_SPEED = 10;
const DRAG = 1.1;
const TURN_SPEED = 2.5;
const BOOST_MULT = 1.5;
const BOOST_DRAIN = 45;
const BOOST_REGEN = 18;

// The Hero showcase tilts this model 90° to stand it up on its nose — that
// implies its native export orientation is already a normal grounded car
// (wheels down), which is what we want here undisturbed. Only a yaw
// correction (found by eye) is applied so "heading 0" faces +Z.
const MODEL_YAW_OFFSET = Math.PI;
// The raw export is huge (~20x14x31 units) and not centered on its own
// origin — measured once via a Box3 on the loaded model. Scaled down to a
// ~4-unit car length, and offset so it's centered on X/Z with its lowest
// point (wheels) sitting at local y=0.
const MODEL_BOX_CENTER = { x: -1.075, z: 2.4465 };
const MODEL_BOX_BOTTOM_Y = -3.034;
const CAR_SCALE = 0.13;

const CAM_DISTANCE = 9;
const CAM_HEIGHT = 4.4;
const CAM_LOOK_HEIGHT = 1.1;

function headingToForward(heading, out) {
  out.set(Math.sin(heading), 0, Math.cos(heading));
  return out;
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#141414" />
      </mesh>
      {/* Same arena-grid motif as the hero redesign, for visual continuity. */}
      <gridHelper args={[240, 48, "#fe980c", "#2a2a2a"]} position={[0, 0.01, 0]} />
    </group>
  );
}

function CheckpointGates({ nextIndex }) {
  return (
    <group>
      {CHECKPOINTS.map((cp, i) => {
        const isFinish = i === 0;
        const isNext = i === nextIndex;
        const color = isFinish ? "#ffffff" : isNext ? "#fe980c" : "#4a4a4a";
        return (
          <group key={i} position={[cp.x, 2.4, cp.z]} rotation={[0, cp.rotationY, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[3.2, 0.22, 12, 32]} />
              <meshStandardMaterial
                color={color}
                emissive={isNext ? "#fe980c" : isFinish ? "#666666" : "#000000"}
                emissiveIntensity={isNext ? 1.6 : isFinish ? 0.4 : 0}
              />
            </mesh>
            {isFinish && (
              <mesh position={[0, 4.4, 0]}>
                <boxGeometry args={[0.3, 2, 0.3]} />
                <meshStandardMaterial color="#d8224e" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Owns the car's physics state in a ref (not React state — updated every
// frame, read by the camera rig and reported up via throttled callbacks) and
// the visible mesh, imperatively moved each frame like the 2D game's canvas
// loop keeps physics decoupled from React re-renders.
function Car({ carStateRef, phaseRef, keysRef, raceId, onCheckpoint, onFinish, onTick }) {
  const groupRef = useRef(null);
  const { scene } = useGLTF(MODEL_URL);
  // useGLTF caches and returns the SAME Object3D every call — cloning avoids
  // stealing the model out of the Hero showcase's own <FennecCar3D>, which
  // mounts the same cached scene in a different Canvas.
  const cloned = useMemo(() => scene.clone(), [scene]);
  const tickAccum = useRef(0);

  useEffect(() => {
    carStateRef.current = {
      x: START_POSITION.x,
      z: START_POSITION.z,
      heading: START_POSITION.heading,
      speed: 0,
      boost: 100,
      nextCheckpoint: 1,
      elapsed: 0,
    };
    tickAccum.current = 0;
  }, [raceId, carStateRef]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = carStateRef.current;
    if (!s) return;

    if (phaseRef.current === "racing") {
      const keys = keysRef.current;
      const accelInput = keys.forward ? 1 : keys.back ? -1 : 0;
      const boosting = keys.boost && s.boost > 0 && accelInput > 0;
      const boostFactor = boosting ? BOOST_MULT : 1;

      if (accelInput > 0) {
        s.speed += ACCEL * boostFactor * dt;
      } else if (accelInput < 0) {
        s.speed -= REVERSE_ACCEL * dt;
      }
      s.speed *= Math.max(0, 1 - DRAG * dt);
      const topSpeed = MAX_SPEED * boostFactor;
      s.speed = Math.max(-REVERSE_MAX_SPEED, Math.min(topSpeed, s.speed));

      s.boost = boosting
        ? Math.max(0, s.boost - BOOST_DRAIN * dt)
        : Math.min(100, s.boost + BOOST_REGEN * dt);

      let steerInput = 0;
      if (keys.left) steerInput += 1;
      if (keys.right) steerInput -= 1;
      if (steerInput !== 0 && Math.abs(s.speed) > 0.05) {
        const speedFactor = Math.min(Math.abs(s.speed) / MAX_SPEED, 1) * 0.7 + 0.3;
        const dir = s.speed >= 0 ? 1 : -1;
        s.heading += steerInput * TURN_SPEED * dt * speedFactor * dir;
      }

      s.x += Math.sin(s.heading) * s.speed * dt;
      s.z += Math.cos(s.heading) * s.speed * dt;
      s.elapsed += dt;

      const target = CHECKPOINTS[s.nextCheckpoint];
      const dx = s.x - target.x;
      const dz = s.z - target.z;
      if (dx * dx + dz * dz < target.radius * target.radius) {
        if (s.nextCheckpoint === 0) {
          onFinish(s.elapsed);
        } else {
          onCheckpoint(s.nextCheckpoint);
          s.nextCheckpoint = (s.nextCheckpoint + 1) % CHECKPOINTS.length;
        }
      }

      // Throttle the React-facing tick to ~10/s — plenty smooth for a
      // stopwatch readout, far fewer re-renders than every frame.
      tickAccum.current += dt;
      if (tickAccum.current >= 0.1) {
        tickAccum.current = 0;
        onTick(s.elapsed, s.boost);
      }
    }

    if (groupRef.current) {
      groupRef.current.position.set(s.x, 0, s.z);
      groupRef.current.rotation.y = s.heading;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Recenter in the model's own local space first, THEN rotate/scale —
          keeps the two transforms from interfering with each other. */}
      <group scale={CAR_SCALE} rotation={[0, MODEL_YAW_OFFSET, 0]}>
        <primitive
          object={cloned}
          position={[-MODEL_BOX_CENTER.x, -MODEL_BOX_BOTTOM_Y, -MODEL_BOX_CENTER.z]}
        />
      </group>
    </group>
  );
}

const scratchForward = new THREE.Vector3();
const scratchDesired = new THREE.Vector3();
const scratchLook = new THREE.Vector3();

function CameraRig({ carStateRef }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(START_POSITION.x, CAM_HEIGHT, START_POSITION.z - CAM_DISTANCE);
  }, [camera]);

  useFrame((_, rawDelta) => {
    const s = carStateRef.current;
    if (!s) return;
    const dt = Math.min(rawDelta, 0.05);
    headingToForward(s.heading, scratchForward);
    scratchDesired.set(s.x, 0, s.z).addScaledVector(scratchForward, -CAM_DISTANCE);
    scratchDesired.y = CAM_HEIGHT;
    const followLerp = 1 - Math.pow(0.0025, dt);
    camera.position.lerp(scratchDesired, followLerp);
    scratchLook.set(s.x, CAM_LOOK_HEIGHT, s.z);
    camera.lookAt(scratchLook);
  });

  return null;
}

export default function Scene({ phaseRef, keysRef, raceId, nextCheckpointIndex, onCheckpoint, onFinish, onTick }) {
  const carStateRef = useRef(null);

  return (
    <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[24, 34, 12]} intensity={1.3} castShadow />
      <Suspense fallback={null}>
        <Ground />
        <CheckpointGates nextIndex={nextCheckpointIndex} />
        <Car
          carStateRef={carStateRef}
          phaseRef={phaseRef}
          keysRef={keysRef}
          raceId={raceId}
          onCheckpoint={onCheckpoint}
          onFinish={onFinish}
          onTick={onTick}
        />
        <Environment preset="city" />
      </Suspense>
      <CameraRig carStateRef={carStateRef} />
    </Canvas>
  );
}

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';

const SCALE = 80; // Perfect pixel-to-meter conversion

// Auto-rotating camera for demo effect
function CameraRig({ children }) {
  const group = useRef();
  useFrame((state, delta) => {
    group.current.rotation.y += delta * 0.1;
  });
  return <group ref={group}>{children}</group>;
}

// Perfectly positioned walls from backend data
const Wall = React.memo(({ wall }) => {
  const meshRef = useRef();
  const [x1, y1, x2, y2] = wall;
  
  // Calculate wall geometry
  const length = Math.max(Math.hypot(x2 - x1, y2 - y1) / SCALE, 0.1);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const centerX = (x1 + x2) / 2 / SCALE;
  const centerZ = (y1 + y2) / 2 / SCALE;

  return (
    <mesh 
      ref={meshRef}
      position={[centerX, 1.5, centerZ]} 
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, 1.5, 0.05]} />
      <meshLambertMaterial 
        color="#f8f8f8" 
        transparent 
        opacity={0.95}
      />
    </mesh>
  );
});

// Room floors with realistic materials
const RoomFloor = React.memo(({ polygon, type }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (polygon && polygon.length > 2) {
      polygon.forEach((pt, i) => {
        const x = pt[0] / SCALE;
        const z = pt[1] / SCALE;
        if (i === 0) s.moveTo(x, z);
        else s.lineTo(x, z);
      });
      s.closePath();
    }
    return s;
  }, [polygon]);

  const roomColors = {
    bedroom: '#7a9cc3',
    kitchen: '#f4d03f',
    bathroom: '#a3d8f4',
    living_room: '#d5a6bd',
    default: '#9b59b6'
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshLambertMaterial 
        color={roomColors[type] || roomColors.default}
        transparent 
        opacity={0.9}
      />
    </mesh>
  );
});

// Dynamic pitched roofs
const RoomRoof = React.memo(({ polygon, visible }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (polygon && polygon.length > 2) {
      polygon.forEach((pt, i) => {
        const x = pt[0] / SCALE;
        const z = pt[1] / SCALE;
        if (i === 0) s.moveTo(x, z);
        else s.lineTo(x, z);
      });
    }
    return s;
  }, [polygon]);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 3.1, 0]} 
      visible={visible}
      castShadow
    >
      <extrudeGeometry 
        args={[shape, { depth: 0.1, bevelEnabled: false }]} 
      />
      <meshLambertMaterial color="#4a5568" />
    </mesh>
  );
});

// Main scene with perfect lighting & camera
const SceneGenerator = ({ layoutData, showRoof }) => {
  const { walls = [], rooms = [] } = layoutData || {};

  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ 
        position: [0, 15, 25],  // PERFECT camera position
        fov: 65,
        near: 0.1,
        far: 100
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping
      }}
      shadows
      dpr={[1, 2]}
    >
      {/* Perfect 3-point lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-10, 10, -5]}
        intensity={0.5}
      />
      
      {/* Realistic environment */}
      <Sky sunPosition={[100, 20, 100]} />
      
      {/* House container - centered & scaled */}
      <CameraRig>
        <group position={[0, -0.1, 0]}>
          {/* Walls - limited for performance */}
          {walls.slice(0, 100).map((wall, i) => (
            <Wall key={`wall-${i}`} wall={wall} />
          ))}
          
          {/* Rooms */}
          {rooms.slice(0, 8).map((room, i) => (
            <React.Fragment key={`room-${i}`}>
              <RoomFloor polygon={room.polygon} type={room.type} />
              <RoomRoof polygon={room.polygon} visible={showRoof} />
            </React.Fragment>
          ))}
        </group>
      </CameraRig>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color="#2d3748" />
      </mesh>

      {/* Perfect orbit controls */}
      <OrbitControls 
        makeDefault
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.2}
        enablePan={true}
        panSpeed={0.8}
      />
    </Canvas>
  );
};

export default SceneGenerator;
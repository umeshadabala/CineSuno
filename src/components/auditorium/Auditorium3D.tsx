'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { ShowSeat, SeatCategory } from '@/types';
import { getSpatialAudioEngine, SeatSpatialMetrics } from '@/lib/spatial-audio';
import {
  Volume2Icon,
  VolumeXIcon,
  EyeIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XIcon,
} from '@/components/icons';

interface Auditorium3DProps {
  seats: ShowSeat[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
  maxSeats?: number;
  ticketPricePaise?: number;
  onSwitchTo2D?: () => void;
}

// Seat tier color palette matching monochromatic brand identity
const TIER_COLORS = {
  recliner: {
    available: 0x987b32, // Warm bronze gold
    hover: 0xc4a34b,
    selected: 0x34d399, // Bright emerald
    booked: 0x333b37,   // Muted charcoal
  },
  premium: {
    available: 0x356b62, // Brand accent green
    hover: 0x47857a,
    selected: 0x34d399,
    booked: 0x2b3330,
  },
  standard: {
    available: 0x4a635a, // Deep sage slate
    hover: 0x5e7a70,
    selected: 0x34d399,
    booked: 0x242b28,
  },
};

type CameraPreset = 'overview' | 'topdown' | 'front' | 'sweetspot' | 'recliner';

export default function Auditorium3D({
  seats,
  selectedSeatIds,
  onToggleSeat,
  maxSeats = 20,
  onSwitchTo2D,
}: Auditorium3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Seat data lookup memoized from props
  const seatDataMap = useMemo(() => {
    const map = new Map<string, ShowSeat>();
    seats.forEach((s) => map.set(s.id, s));
    return map;
  }, [seats]);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const seatMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animationFrameIdRef = useRef<number | null>(null);
  const selectedSeatIdsRef = useRef<string[]>(selectedSeatIds);

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;
  }, [selectedSeatIds]);

  // Camera state management
  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');
  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(false);
  const [isSeatViewActive, setIsSeatViewActive] = useState<boolean>(false);
  const [previewSeatId, setPreviewSeatId] = useState<string | null>(null);
  const [focusedSeatId, setFocusedSeatId] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<ShowSeat | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Spatial audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [acousticMetrics, setAcousticMetrics] = useState<SeatSpatialMetrics | null>(null);
  const audioEngine = useRef(getSpatialAudioEngine());

  // Orbit camera drag and transition state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 22,
    theta: Math.PI / 2,
    phi: Math.PI / 3.2,
  });

  // Smooth camera interpolation targets
  const isTransitioningRef = useRef<boolean>(false);
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetLookAtPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, -8));
  const currentLookAtPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, -8));

  // Volumetric beam ref for flicker animation
  const projectorBeamMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Calculate 3D coordinates for a seat based on its row and number
  // Screen is at z = -15
  // Row A (Standard) is nearest to screen at z = -2.0, y = 0.5
  // Row F (Recliners) is at the back of the auditorium at z = 5.5, y = 2.6
  const getSeatCoordinates = useCallback((seat: ShowSeat): { x: number; y: number; z: number } => {
    const rowChar = seat.row.toUpperCase();
    const rowIndex = Math.max(0, rowChar.charCodeAt(0) - 65); // 0 for A, 1 for B...
    const colIndex = seat.number;

    // Aisle offset: column 1-3 left, 4-7 center, 8-10 right
    let xOffset = (colIndex - 5.5) * 0.95;
    if (colIndex <= 3) xOffset -= 0.35;
    if (colIndex >= 8) xOffset += 0.35;

    // Stadium rake: rise 0.42m per row towards the rear
    const y = 0.5 + rowIndex * 0.42;
    // Distance from screen: Row A at z = -2, Row F at z = 5.5
    const z = -2 + rowIndex * 1.5;

    return { x: xOffset, y, z };
  }, []);

  // List of available seat IDs sorted for prev/next hopping
  const sortedSeatList = useMemo(() => {
    return [...seats].sort((a, b) => {
      if (a.row === b.row) return a.number - b.number;
      return a.row.localeCompare(b.row);
    });
  }, [seats]);

  // Create curved cinema screen texture
  const createScreenCanvasTexture = useCallback((): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark deep cinematic gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#091512');
      grad.addColorStop(0.5, '#132822');
      grad.addColorStop(1, '#091512');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Silver screen border glow
      ctx.strokeStyle = '#356b62';
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, 984, 472);

      // CineSuno laser projection branding
      ctx.fillStyle = '#83b5a8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CINESUNO LASER CINEMAS', 512, 220);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('IMMERSIVE 4K ATMOS', 512, 280);

      ctx.fillStyle = '#5e7a70';
      ctx.font = '600 20px sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('DOLBY ATMOS 64 CHANNELS • DUAL 4K LASER PROJECTION', 512, 330);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }, []);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a100e);
    scene.fog = new THREE.FogExp2(0x0a100e, 0.022);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Initial camera position
    const { radius, theta, phi } = cameraSphericalRef.current;
    camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.cos(theta) + 2;
    camera.lookAt(0, 2.5, -6);
    currentLookAtPosRef.current.set(0, 2.5, -6);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Dynamic Cinema Screen Glow
    const screenLight = new THREE.SpotLight(0x83b5a8, 4.2, 45, Math.PI / 2.8, 0.45, 1.2);
    screenLight.position.set(0, 8, -14);
    screenLight.target.position.set(0, 2, 4);
    scene.add(screenLight);
    scene.add(screenLight.target);

    // Warm hall rim accent
    const rimLight = new THREE.DirectionalLight(0x356b62, 0.7);
    rimLight.position.set(-15, 12, 10);
    scene.add(rimLight);

    // 5. Cinema Screen Mesh (Curved)
    const screenTexture = createScreenCanvasTexture();
    const screenGeometry = new THREE.CylinderGeometry(
      19,
      19,
      7.0,
      36,
      1,
      true,
      -Math.PI / 5.2,
      Math.PI / 2.6
    );
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.18,
      metalness: 0.05,
      emissive: 0x83b5a8,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });
    const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    screenMesh.position.set(0, 4.4, -15);
    screenMesh.rotation.y = Math.PI;
    scene.add(screenMesh);

    // Screen border frame
    const frameGeo = new THREE.BoxGeometry(15.2, 0.28, 0.35);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x83b5a8 });
    const topFrame = new THREE.Mesh(frameGeo, frameMat);
    topFrame.position.set(0, 7.9, -14.6);
    scene.add(topFrame);

    const bottomFrame = new THREE.Mesh(frameGeo, frameMat);
    bottomFrame.position.set(0, 0.9, -14.6);
    scene.add(bottomFrame);

    // 6. Volumetric Projector Light Cone
    // Originates from projection booth port at (0, 9.5, 16) towards screen (0, 4.4, -15)
    const beamLength = 31;
    const beamGeo = new THREE.ConeGeometry(5.6, beamLength, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x83b5a8,
      transparent: true,
      opacity: 0.075,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    projectorBeamMatRef.current = beamMat;

    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, 6.9, 0.5);
    beamMesh.rotation.x = Math.PI / 2 + 0.18;
    scene.add(beamMesh);

    // 7. Auditorium Floor (Stadium incline)
    const floorGeo = new THREE.PlaneGeometry(26, 30, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111916,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2 + 0.13;
    floor.position.set(0, -0.2, 3);
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Aisle LED Strips (Guidance lighting)
    const aisleStripGeo = new THREE.BoxGeometry(0.06, 0.03, 16);
    const aisleStripMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

    const leftAisle = new THREE.Mesh(aisleStripGeo, aisleStripMat);
    leftAisle.position.set(-2.8, 0.8, 2);
    leftAisle.rotation.x = 0.13;
    scene.add(leftAisle);

    const rightAisle = new THREE.Mesh(aisleStripGeo, aisleStripMat);
    rightAisle.position.set(2.8, 0.8, 2);
    rightAisle.rotation.x = 0.13;
    scene.add(rightAisle);

    // 8. Render Seats
    const seatMap = new Map<string, THREE.Group>();

    // Shared geometries for efficiency
    const stdCushionGeo = new THREE.BoxGeometry(0.66, 0.58, 0.62);
    const stdBackGeo = new THREE.BoxGeometry(0.66, 0.5, 0.18);
    const stdArmGeo = new THREE.BoxGeometry(0.1, 0.35, 0.55);

    // Recliner luxury geometries (Wider, plush leather, double armrests)
    const recCushionGeo = new THREE.BoxGeometry(0.9, 0.65, 0.72);
    const recBackGeo = new THREE.BoxGeometry(0.88, 0.65, 0.22);
    const recArmGeo = new THREE.BoxGeometry(0.18, 0.42, 0.68);
    const recFootrestGeo = new THREE.BoxGeometry(0.82, 0.25, 0.4);

    seats.forEach((seat) => {
      const coords = getSeatCoordinates(seat);
      const isSelected = selectedSeatIdsRef.current.includes(seat.id);
      const isBooked = seat.status === 'booked';
      const isRecliner = seat.category === 'recliner';
      const tier = (seat.category || 'standard') as SeatCategory;

      let baseColor = TIER_COLORS[tier].available;
      if (isBooked) baseColor = TIER_COLORS[tier].booked;
      else if (isSelected) baseColor = TIER_COLORS[tier].selected;

      const seatGroup = new THREE.Group();
      seatGroup.position.set(coords.x, coords.y, coords.z);

      const seatMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: isRecliner ? 0.35 : 0.55,
        metalness: isRecliner ? 0.25 : 0.15,
        emissive: isSelected ? 0x10b981 : 0x000000,
        emissiveIntensity: isSelected ? 0.65 : 0.0,
      });

      if (isRecliner) {
        // Luxury Recliner Model
        const cushion = new THREE.Mesh(recCushionGeo, seatMat);
        cushion.castShadow = true;
        cushion.receiveShadow = true;
        cushion.userData = { seatId: seat.id };
        seatGroup.add(cushion);

        const backrest = new THREE.Mesh(recBackGeo, seatMat);
        backrest.position.set(0, 0.5, -0.25);
        backrest.rotation.x = -0.15; // Plush reclined angle
        backrest.userData = { seatId: seat.id };
        seatGroup.add(backrest);

        const leftArm = new THREE.Mesh(recArmGeo, seatMat);
        leftArm.position.set(-0.5, 0.2, 0);
        leftArm.userData = { seatId: seat.id };
        seatGroup.add(leftArm);

        const rightArm = new THREE.Mesh(recArmGeo, seatMat);
        rightArm.position.set(0.5, 0.2, 0);
        rightArm.userData = { seatId: seat.id };
        seatGroup.add(rightArm);

        const footrest = new THREE.Mesh(recFootrestGeo, seatMat);
        footrest.position.set(0, -0.18, 0.42);
        footrest.userData = { seatId: seat.id };
        seatGroup.add(footrest);
      } else {
        // Standard / Premium Model
        const cushion = new THREE.Mesh(stdCushionGeo, seatMat);
        cushion.castShadow = true;
        cushion.receiveShadow = true;
        cushion.userData = { seatId: seat.id };
        seatGroup.add(cushion);

        const backrest = new THREE.Mesh(stdBackGeo, seatMat);
        backrest.position.set(0, 0.45, -0.2);
        backrest.userData = { seatId: seat.id };
        seatGroup.add(backrest);

        const leftArm = new THREE.Mesh(stdArmGeo, seatMat);
        leftArm.position.set(-0.35, 0.15, 0);
        leftArm.userData = { seatId: seat.id };
        seatGroup.add(leftArm);

        const rightArm = new THREE.Mesh(stdArmGeo, seatMat);
        rightArm.position.set(0.35, 0.15, 0);
        rightArm.userData = { seatId: seat.id };
        seatGroup.add(rightArm);
      }

      scene.add(seatGroup);
      seatMap.set(seat.id, seatGroup);
    });

    seatMeshesRef.current = seatMap;

    // 9. Animation & Render Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Subtle projector light flicker
      if (projectorBeamMatRef.current) {
        projectorBeamMatRef.current.opacity = 0.075 + Math.sin(Date.now() * 0.006) * 0.015;
      }

      // Smooth camera interpolation towards target
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCameraPosRef.current, 0.08);
        currentLookAtPosRef.current.lerp(targetLookAtPosRef.current, 0.08);
        camera.lookAt(currentLookAtPosRef.current);

        if (camera.position.distanceTo(targetCameraPosRef.current) < 0.04) {
          isTransitioningRef.current = false;
        }
      } else if (!isSeatViewActive && isAutoOrbit) {
        // Slow cinematic turntable rotation
        cameraSphericalRef.current.theta += 0.003;
        const { radius: r, theta: th, phi: ph } = cameraSphericalRef.current;
        camera.position.x = r * Math.sin(ph) * Math.sin(th);
        camera.position.y = r * Math.cos(ph);
        camera.position.z = r * Math.sin(ph) * Math.cos(th) + 2;
        camera.lookAt(0, 2.5, -6);
      }

      // Selected seats breathing glow animation
      if (selectedSeatIdsRef.current.length > 0) {
        const time = Date.now() * 0.0035;
        selectedSeatIdsRef.current.forEach((id) => {
          const group = seatMeshesRef.current.get(id);
          if (group) {
            group.children.forEach((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissiveIntensity = 0.45 + Math.sin(time) * 0.25;
              }
            });
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const audio = audioEngine.current;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      renderer.dispose();
      audio.stop();
    };
  }, [seats, getSeatCoordinates, createScreenCanvasTexture, isAutoOrbit, isSeatViewActive]);

  // Update camera coordinates directly from spherical parameters
  const updateCameraFromSpherical = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const { radius, theta, phi } = cameraSphericalRef.current;
    camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.cos(theta) + 2;
    camera.lookAt(0, 2.5, -6);
  }, []);

  // Update seat colors when selectedSeatIds changes
  useEffect(() => {
    seats.forEach((seat) => {
      const group = seatMeshesRef.current.get(seat.id);
      if (!group) return;

      const isSelected = selectedSeatIds.includes(seat.id);
      const isBooked = seat.status === 'booked';
      const tier = (seat.category || 'standard') as SeatCategory;

      let color = TIER_COLORS[tier].available;
      if (isBooked) color = TIER_COLORS[tier].booked;
      else if (isSelected) color = TIER_COLORS[tier].selected;

      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.setHex(color);
          child.material.emissive.setHex(isSelected ? 0x10b981 : 0x000000);
          child.material.emissiveIntensity = isSelected ? 0.65 : 0.0;
        }
      });
    });
  }, [selectedSeatIds, seats]);

  // Transition to "View from this seat" camera mode (Eye-level POV looking at screen)
  const transitionToSeatView = useCallback(
    (seatId: string) => {
      const seat = seatDataMap.get(seatId);
      const camera = cameraRef.current;
      if (!seat || !camera) return;

      const coords = getSeatCoordinates(seat);

      // Smoothly fly camera to seat eye-level: 1.15m above cushion
      targetCameraPosRef.current.set(coords.x, coords.y + 1.15, coords.z);
      // Look directly at cinema screen center (0, 4.4, -15)
      targetLookAtPosRef.current.set(0, 4.4, -15);
      isTransitioningRef.current = true;

      setIsSeatViewActive(true);
      setPreviewSeatId(seatId);
      setFocusedSeatId(seatId);
      setIsAutoOrbit(false);

      // Update spatial audio listener
      audioEngine.current.updateListenerPosition(coords.x, coords.y, coords.z);
      setAcousticMetrics(audioEngine.current.calculateMetrics(coords.x, coords.y, coords.z));
    },
    [getSeatCoordinates, seatDataMap]
  );

  // Apply Camera Preset with smooth lerping
  const handleApplyPreset = useCallback(
    (preset: CameraPreset) => {
      setActivePreset(preset);
      setIsSeatViewActive(false);
      setPreviewSeatId(null);

      if (preset === 'overview') {
        targetCameraPosRef.current.set(0, 11, 20);
        targetLookAtPosRef.current.set(0, 2.5, -6);
        cameraSphericalRef.current = { radius: 22, theta: Math.PI / 2, phi: Math.PI / 3.2 };
      } else if (preset === 'topdown') {
        targetCameraPosRef.current.set(0, 22, 1);
        targetLookAtPosRef.current.set(0, 0, 1);
        cameraSphericalRef.current = { radius: 22, theta: Math.PI / 2, phi: 0.05 };
      } else if (preset === 'front') {
        // Row A Center vantage
        targetCameraPosRef.current.set(0, 1.6, -1.8);
        targetLookAtPosRef.current.set(0, 4.8, -15);
      } else if (preset === 'sweetspot') {
        // Row D Center reference sweet spot
        targetCameraPosRef.current.set(0, 2.9, 2.5);
        targetLookAtPosRef.current.set(0, 4.4, -15);
      } else if (preset === 'recliner') {
        // Row F VIP Recliner Balcony
        targetCameraPosRef.current.set(0, 3.8, 5.5);
        targetLookAtPosRef.current.set(0, 4.2, -15);
      }

      isTransitioningRef.current = true;
    },
    []
  );

  // Navigate to previous or next seat while in POV mode
  const handleCycleSeat = useCallback(
    (direction: 'next' | 'prev') => {
      if (!previewSeatId || sortedSeatList.length === 0) return;
      const currentIndex = sortedSeatList.findIndex((s) => s.id === previewSeatId);
      if (currentIndex === -1) return;

      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0) nextIndex = sortedSeatList.length - 1;
      if (nextIndex >= sortedSeatList.length) nextIndex = 0;

      const nextSeat = sortedSeatList[nextIndex];
      if (nextSeat) transitionToSeatView(nextSeat.id);
    },
    [previewSeatId, sortedSeatList, transitionToSeatView]
  );

  // Reset back to auditorium overview
  const resetToOverview = useCallback(() => {
    handleApplyPreset('overview');
  }, [handleApplyPreset]);

  // Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Handle camera dragging
    if (e.buttons === 1) {
      isDraggingRef.current = true;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      if (isSeatViewActive) {
        // Look around mode inside the seat
        camera.rotation.y -= deltaX * 0.0035;
        camera.rotation.x = Math.max(-0.6, Math.min(0.6, camera.rotation.x - deltaY * 0.0035));
      } else {
        // Orbit mode
        cameraSphericalRef.current.theta -= deltaX * 0.006;
        cameraSphericalRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2.05, cameraSphericalRef.current.phi - deltaY * 0.006)
        );
        updateCameraFromSpherical();
      }

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast hover detection when not dragging
    if (!isSeatViewActive) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // Collect all child meshes from seat groups
      const meshes: THREE.Mesh[] = [];
      seatMeshesRef.current.forEach((group) => {
        group.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.userData.seatId) meshes.push(c);
        });
      });

      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const seatId = hit.userData.seatId;
        const seat = seatDataMap.get(seatId);
        setHoveredSeat(seat || null);
        canvas.style.cursor = seat && seat.status !== 'booked' ? 'pointer' : 'not-allowed';
      } else {
        setHoveredSeat(null);
        canvas.style.cursor = 'grab';
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    // Only process click if mouse did not drag
    if (!isDraggingRef.current) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const meshes: THREE.Mesh[] = [];
      seatMeshesRef.current.forEach((group) => {
        group.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.userData.seatId) meshes.push(c);
        });
      });

      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const seatId = hit.userData.seatId;
        const seat = seatDataMap.get(seatId);

        if (seat && seat.status !== 'booked') {
          // Open quick seat action card
          setFocusedSeatId(seatId);
        }
      } else {
        // Clicked empty space
        setFocusedSeatId(null);
      }
    }

    isDraggingRef.current = false;
  };

  // Zooming via wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isSeatViewActive) return;
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(
      8,
      Math.min(36, cameraSphericalRef.current.radius + e.deltaY * 0.02)
    );
    updateCameraFromSpherical();
  };

  // Audio Controls Handlers
  const handleToggleAudio = async () => {
    if (isAudioPlaying) {
      audioEngine.current.stop();
      setIsAudioPlaying(false);
    } else {
      await audioEngine.current.play();
      setIsAudioPlaying(true);
      if (previewSeatId) {
        const s = seatDataMap.get(previewSeatId);
        if (s) {
          const coords = getSeatCoordinates(s);
          setAcousticMetrics(audioEngine.current.calculateMetrics(coords.x, coords.y, coords.z));
        }
      } else {
        setAcousticMetrics(audioEngine.current.calculateMetrics(0, 1.2, 5));
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setAudioVolume(vol);
    audioEngine.current.setVolume(isMuted ? 0 : vol);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.current.setVolume(nextMute ? 0 : audioVolume);
  };

  // Active preview and focused seat details
  const previewSeat = previewSeatId ? seatDataMap.get(previewSeatId) : null;
  const focusedSeat = focusedSeatId ? seatDataMap.get(focusedSeatId) : null;

  return (
    <div className="relative w-full rounded-3xl border border-border-subtle bg-surface overflow-hidden shadow-sm select-none">
      {/* 3D Top Header & Camera Presets Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-border-subtle bg-surface-elevated/40">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-brand animate-pulse" />
          <h3 className="text-sm font-bold text-text-primary">
            {isSeatViewActive
              ? `Seat ${previewSeat?.row}${previewSeat?.number} POV Vantage`
              : 'Interactive 3D Cinema Hall'}
          </h3>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-secondary border border-border-subtle">
            WebGL 60 FPS
          </span>
        </div>

        {/* Camera Presets Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center rounded-xl bg-surface border border-border-subtle p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleApplyPreset('overview')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                activePreset === 'overview' && !isSeatViewActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('topdown')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                activePreset === 'topdown' && !isSeatViewActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Top Plan
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('front')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                activePreset === 'front' && !isSeatViewActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Row A (Front)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('sweetspot')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                activePreset === 'sweetspot' && !isSeatViewActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sweet Spot (D)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('recliner')}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                activePreset === 'recliner' && !isSeatViewActive
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              VIP Recliner (F)
            </button>
          </div>

          {/* Auto Orbit Turntable */}
          <button
            type="button"
            onClick={() => setIsAutoOrbit(!isAutoOrbit)}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold border transition shadow-2xs ${
              isAutoOrbit
                ? 'bg-brand text-white border-brand'
                : 'bg-surface text-text-secondary hover:text-text-primary border-border-subtle'
            }`}
            title="Auto-rotate auditorium turntable"
          >
            {isAutoOrbit ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
            <span className="hidden sm:inline">Orbit</span>
          </button>

          {/* Spatial Audio Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition shadow-2xs ${
              isAudioPlaying
                ? 'bg-brand text-white'
                : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
            title="Audition 3D spatial acoustics"
          >
            {isAudioPlaying ? (
              <Volume2Icon className="h-3.5 w-3.5 animate-bounce" />
            ) : (
              <VolumeXIcon className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">{isAudioPlaying ? 'Audio On' : 'Audio Test'}</span>
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={resetToOverview}
            className="rounded-xl border border-border-subtle bg-surface p-1.5 text-text-secondary hover:text-text-primary hover:border-brand transition shadow-2xs"
            title="Reset to default overview"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
          </button>

          {/* Switch to 2D Fallback */}
          {onSwitchTo2D && (
            <button
              type="button"
              onClick={onSwitchTo2D}
              className="rounded-xl border border-border-subtle bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:text-text-primary transition shadow-2xs"
            >
              2D Grid
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div ref={mountRef} className="relative h-[490px] w-full bg-[#0a100e]">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Floating Screen Orientation Banner */}
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black/65 px-4 py-1.5 border border-white/10 text-[11px] font-bold text-white/90 shadow-md backdrop-blur-md">
          <SparklesIcon className="h-3.5 w-3.5 text-brand" />
          <span>CURVED 4K SILVER SCREEN • PROJECTOR BEAM ACTIVE</span>
        </div>

        {/* Hover Seat Tooltip */}
        {hoveredSeat && !isSeatViewActive && !focusedSeat && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-14 rounded-xl border border-border-subtle bg-surface/95 px-3 py-1.5 shadow-md backdrop-blur-md transition-all"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-text-primary">
                Row {hoveredSeat.row} • Seat {hoveredSeat.number}
              </span>
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                {hoveredSeat.category}
              </span>
            </div>
            <p className="text-[10px] text-text-secondary mt-0.5">
              {hoveredSeat.status === 'booked'
                ? 'Unavailable'
                : `₹${(hoveredSeat.pricePaise / 100).toFixed(0)} • Click for Actions`}
            </p>
          </div>
        )}

        {/* Interactive Clicked Seat Quick Action Card */}
        {focusedSeat && !isSeatViewActive && (
          <div className="absolute top-4 right-4 z-20 w-72 rounded-2xl border border-border-subtle bg-surface/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  {focusedSeat.category === 'recliner' ? 'Rear Luxury Balcony' : 'Auditorium Seat'}
                </span>
                <h4 className="text-base font-black text-text-primary mt-0.5">
                  Seat {focusedSeat.row}{focusedSeat.number}
                </h4>
                <p className="text-xs font-semibold text-text-secondary">
                  ₹{(focusedSeat.pricePaise / 100).toFixed(0)} • {focusedSeat.category.toUpperCase()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFocusedSeatId(null)}
                className="rounded-lg p-1 text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-surface-elevated/60 p-2.5 border border-border-subtle/50 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-text-primary">
                <span className="text-text-secondary">Sightline Directivity:</span>
                <span className="font-bold text-brand">
                  {focusedSeat.category === 'recliner' ? '100% (Panoramic)' : '96% (Optimal)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-text-primary">
                <span className="text-text-secondary">Distance to Screen:</span>
                <span className="font-semibold">{focusedSeat.row === 'A' ? '7.5m' : '18.2m'}</span>
              </div>
              <div className="flex items-center justify-between text-text-primary">
                <span className="text-text-secondary">Sound Balancing:</span>
                <span className="font-semibold">Dolby 7.1 Aligned</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => transitionToSeatView(focusedSeat.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-xs transition"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Sit in This Seat (POV Preview)</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSeat(focusedSeat.id)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                  selectedSeatIds.includes(focusedSeat.id)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-border-subtle bg-surface text-text-primary hover:border-brand'
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>
                  {selectedSeatIds.includes(focusedSeat.id) ? 'Deselect Ticket' : 'Select This Seat'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Full Seat POV View HUD */}
        {isSeatViewActive && previewSeat && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2.5 rounded-2xl border border-border-subtle bg-surface/95 p-4 shadow-xl backdrop-blur-md max-w-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                  Eye-Level Vantage
                </span>
                <h4 className="text-sm font-black text-text-primary mt-0.5">
                  Seat {previewSeat.row}{previewSeat.number} ({previewSeat.category.toUpperCase()})
                </h4>
              </div>

              <button
                type="button"
                onClick={resetToOverview}
                className="rounded-lg bg-surface-elevated px-2.5 py-1 text-[11px] font-bold text-text-primary hover:bg-border-subtle transition"
              >
                Exit View
              </button>
            </div>

            <p className="text-[11px] text-text-secondary leading-tight">
              Drag on screen to look around 360°. Observe the screen elevation, directivity, and field of view.
            </p>

            {/* Quick Next/Prev Seat Hop */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle/50">
              <button
                type="button"
                onClick={() => handleCycleSeat('prev')}
                className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-[10px] font-bold text-text-secondary hover:text-text-primary"
              >
                <ChevronLeftIcon className="h-3 w-3" />
                <span>Prev Seat</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSeat(previewSeat.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                  selectedSeatIds.includes(previewSeat.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand text-white hover:bg-brand-hover'
                }`}
              >
                <CheckIcon className="h-3 w-3" />
                <span>{selectedSeatIds.includes(previewSeat.id) ? 'Selected' : 'Select'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCycleSeat('next')}
                className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-[10px] font-bold text-text-secondary hover:text-text-primary"
              >
                <span>Next Seat</span>
                <ChevronRightIcon className="h-3 w-3" />
              </button>
            </div>

            {/* Simulated Acoustic Metric Badge */}
            {acousticMetrics && (
              <div className="mt-1 rounded-xl bg-surface-elevated/60 p-2.5 border border-border-subtle/40 text-[10px] space-y-1">
                <div className="flex items-center justify-between font-semibold text-text-primary">
                  <span>Distance to Screen:</span>
                  <span>{acousticMetrics.distanceMeters}m</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-brand">
                  <span>Acoustic Zone:</span>
                  <span>{acousticMetrics.acousticZone}</span>
                </div>
                <p className="text-[9px] text-text-secondary italic">
                  {acousticMetrics.perceivedDirectivity}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selected Seats Bottom Floating Bar */}
        {selectedSeatIds.length > 0 && !isSeatViewActive && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface/90 p-2.5 shadow-lg backdrop-blur-md">
            <div className="px-2">
              <span className="text-[10px] text-text-secondary block">Selected</span>
              <span className="text-xs font-black text-brand">
                {selectedSeatIds.join(', ')} ({selectedSeatIds.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => transitionToSeatView(selectedSeatIds[0])}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-hover shadow-xs transition"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              <span>POV Preview</span>
            </button>
          </div>
        )}

        {/* Audio Volume Controller (When Playing) */}
        {isAudioPlaying && (
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={handleToggleMute}
              className="text-text-secondary hover:text-text-primary transition"
            >
              {isMuted ? <VolumeXIcon className="h-4 w-4 text-red-500" /> : <Volume2Icon className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : audioVolume}
              onChange={handleVolumeChange}
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-border-subtle accent-brand"
            />
            <span className="text-[10px] font-mono text-text-secondary w-7 text-right">
              {isMuted ? '0%' : `${Math.round(audioVolume * 100)}%`}
            </span>
          </div>
        )}
      </div>

      {/* Legend & Tier Pricing Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border-subtle bg-surface-elevated/20 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-md bg-[#987b32]" />
            <span className="text-text-secondary font-medium">Recliner (Rear)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-md bg-[#356b62]" />
            <span className="text-text-secondary font-medium">Prime (Middle)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-md bg-[#4a635a]" />
            <span className="text-text-secondary font-medium">Classic (Front)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-md bg-emerald-400 ring-2 ring-emerald-400/40" />
            <span className="font-bold text-text-primary">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-md bg-[#242b28]" />
            <span className="text-text-secondary line-through">Booked</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-secondary">
          <AlertCircleIcon className="h-3.5 w-3.5 text-brand" />
          <span>Click any seat for actions • Drag to rotate hall • Max {maxSeats} tickets</span>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Interactive3DInspectorCanvasProps {
  size?: number;
}

export const Interactive3DInspectorCanvas: React.FC<Interactive3DInspectorCanvasProps> = ({
  size = 170,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x10b981, 2.8);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xf59e0b, 2.5, 10);
    rimLight.position.set(-4, 3, -2);
    scene.add(rimLight);

    const softFillLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    softFillLight.position.set(2, -3, 3);
    scene.add(softFillLight);

    // ROOT HIERARCHY
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. TORSO / BODY (Vest with badges)
    const bodyGroup = new THREE.Group();
    rootGroup.add(bodyGroup);

    // Inner tech hoodie
    const hoodieGeo = new THREE.CylinderGeometry(0.85, 0.95, 1.4, 32);
    const hoodieMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5,
      metalness: 0.2,
    });
    const hoodie = new THREE.Mesh(hoodieGeo, hoodieMat);
    hoodie.position.y = -0.6;
    bodyGroup.add(hoodie);

    // Tech vest (Emerald green with orange straps)
    const vestGeo = new THREE.CylinderGeometry(0.92, 1.0, 1.2, 32);
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.3,
      metalness: 0.4,
    });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = -0.55;
    bodyGroup.add(vest);

    // Vest zipper / stripe
    const zipperGeo = new THREE.BoxGeometry(0.12, 1.22, 0.2);
    const zipperMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });
    const zipper = new THREE.Mesh(zipperGeo, zipperMat);
    zipper.position.set(0, -0.55, 0.92);
    bodyGroup.add(zipper);

    // Inspector Chest Badge (Hologram shield)
    const badgeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.05);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    });
    const chestBadge = new THREE.Mesh(badgeGeo, badgeMat);
    chestBadge.position.set(0.45, -0.4, 0.93);
    chestBadge.rotation.y = -0.2;
    bodyGroup.add(chestBadge);

    // 2. NECK & HEAD GROUP (Can rotate and look at mouse)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.4, 0);
    rootGroup.add(headGroup);

    // Face / Head mesh (Stylized 3D)
    const headGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfbd0b0, // warm anime/pixar skin tone
      roughness: 0.4,
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.scale.set(0.95, 1.05, 0.95);
    headGroup.add(head);

    // Hair (Stylized modern quiff/tuft)
    const hairGroup = new THREE.Group();
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // deep rich brown hair
      roughness: 0.6,
    });
    const mainHairGeo = new THREE.SphereGeometry(0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const mainHair = new THREE.Mesh(mainHairGeo, hairMat);
    mainHair.position.set(0, 0.15, -0.05);
    hairGroup.add(mainHair);

    // Front hair tuft
    const tuftGeo = new THREE.ConeGeometry(0.35, 0.7, 16);
    const tuft = new THREE.Mesh(tuftGeo, hairMat);
    tuft.position.set(0.2, 0.9, 0.5);
    tuft.rotation.set(-0.4, 0.2, -0.5);
    hairGroup.add(tuft);
    headGroup.add(hairGroup);

    // Headset / Comm Ear-piece with glowing LED
    const earComGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16);
    const earComMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const earCom = new THREE.Mesh(earComGeo, earComMat);
    earCom.position.set(0.88, 0, 0);
    earCom.rotation.z = Math.PI / 2;
    headGroup.add(earCom);

    const ledGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const earLed = new THREE.Mesh(ledGeo, ledMat);
    earLed.position.set(0.98, 0, 0.05);
    headGroup.add(earLed);

    // Mic boom
    const micGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45);
    const mic = new THREE.Mesh(micGeo, earComMat);
    mic.position.set(0.7, -0.15, 0.35);
    mic.rotation.set(0.8, 0.2, 0.6);
    headGroup.add(mic);

    // 3. EYES (EYE GROUP WITH PUPILS THAT ACTIVELY TRACK CURSOR)
    const eyeGroup = new THREE.Group();
    headGroup.add(eyeGroup);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.28, 0.08, 0.74);
    eyeGroup.add(leftEyeWhite);

    // Right Eye
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.28, 0.08, 0.74);
    eyeGroup.add(rightEyeWhite);

    // Pupils / Iris (Glowing Emerald Stylized Eyes)
    const irisGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x047857,
      emissive: 0x10b981,
      emissiveIntensity: 0.5,
    });

    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(-0.28, 0.08, 0.84);
    eyeGroup.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeo, irisMat);
    rightIris.position.set(0.28, 0.08, 0.84);
    eyeGroup.add(rightIris);

    // Cute Eye Specular Highlights
    const highlightGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(-0.25, 0.12, 0.91);
    eyeGroup.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    rightHighlight.position.set(0.31, 0.12, 0.91);
    eyeGroup.add(rightHighlight);

    // Friendly smile
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.18, -0.25, 0.8),
      new THREE.Vector3(0, -0.32, 0.85),
      new THREE.Vector3(0.18, -0.25, 0.8)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 16, 0.02, 8, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    headGroup.add(smile);

    // 4. FLOATING HOLOGRAPHIC CYBER-TABLET (QR SCANNER)
    const tabletGroup = new THREE.Group();
    tabletGroup.position.set(-1.1, -0.2, 1.1);
    tabletGroup.rotation.set(0.2, 0.4, -0.15);
    rootGroup.add(tabletGroup);

    // Tablet body
    const tabBodyGeo = new THREE.BoxGeometry(1.0, 0.7, 0.04);
    const tabBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const tabletBody = new THREE.Mesh(tabBodyGeo, tabBodyMat);
    tabletGroup.add(tabletBody);

    // Glowing Hologram Screen
    const screenGeo = new THREE.PlaneGeometry(0.92, 0.62);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.7,
      roughness: 0.1,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.025;
    tabletGroup.add(screen);

    // 5. ORBITING PARTICLES / RINGS AROUND INSPECTOR
    const ringGeo = new THREE.TorusGeometry(1.6, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.6,
    });
    const haloRing = new THREE.Mesh(ringGeo, ringMat);
    haloRing.rotation.x = Math.PI / 2.3;
    rootGroup.add(haloRing);

    // MOUSE TRACKING STATE (LERP SMOOTHING)
    const targetLook = { x: 0, y: 0 };
    const currentLook = { x: 0, y: 0 };

    const handleWindowMouseMove = (e: MouseEvent) => {
      // Get position relative to screen center
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;

      targetLook.x = ndcX;
      targetLook.y = ndcY;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);

    // ANIMATION LOOP (RUNS 60FPS AT ENGINE LEVEL)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth Lerp tracking for eyes and head
      currentLook.x += (targetLook.x - currentLook.x) * 0.08;
      currentLook.y += (targetLook.y - currentLook.y) * 0.08;

      // HEAD TURNS DIRECTLY TOWARDS MOUSE
      headGroup.rotation.y = currentLook.x * 0.65;
      headGroup.rotation.x = -currentLook.y * 0.45;

      // EYES LOOK EVEN FURTHER IN MOUSE DIRECTION (Active gaze!)
      const eyeOffsetX = currentLook.x * 0.06;
      const eyeOffsetY = currentLook.y * 0.04;
      leftIris.position.x = -0.28 + eyeOffsetX;
      leftIris.position.y = 0.08 + eyeOffsetY;
      rightIris.position.x = 0.28 + eyeOffsetX;
      rightIris.position.y = 0.08 + eyeOffsetY;

      leftHighlight.position.x = -0.25 + eyeOffsetX;
      leftHighlight.position.y = 0.12 + eyeOffsetY;
      rightHighlight.position.x = 0.31 + eyeOffsetX;
      rightHighlight.position.y = 0.12 + eyeOffsetY;

      // BODY SLIGHTLY TURNS
      bodyGroup.rotation.y = currentLook.x * 0.25;

      // WHOLE CHARACTER FLOATS / LEVITATES (Breathe motion)
      rootGroup.position.y = Math.sin(elapsedTime * 2.5) * 0.15;
      haloRing.rotation.z = elapsedTime * 0.6;

      // TABLET FLOATS GENTLY
      tabletGroup.position.y = -0.2 + Math.cos(elapsedTime * 3) * 0.08;
      tabletGroup.rotation.z = -0.15 + Math.sin(elapsedTime * 2) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className="relative flex items-center justify-center pointer-events-none select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

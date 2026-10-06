import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Interactive3DInspectorCanvasProps {
  size?: number;
}

export const Interactive3DInspectorCanvas: React.FC<Interactive3DInspectorCanvasProps> = ({
  size = 200,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    // Adjusted camera distance to capture full character with head, arms, and legs
    camera.position.set(0, 0, 7.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const emeraldRim = new THREE.PointLight(0x10b981, 3.5, 12);
    emeraldRim.position.set(-3.5, 2.5, -2);
    scene.add(emeraldRim);

    const warmAccent = new THREE.PointLight(0xf59e0b, 2.0, 10);
    warmAccent.position.set(3, -2, 2);
    scene.add(warmAccent);

    // ROOT HIERARCHY
    const rootGroup = new THREE.Group();
    // Center character vertically in camera frame
    rootGroup.position.y = -0.15;
    scene.add(rootGroup);

    // MATERIALS
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfcc79b,
      roughness: 0.35,
      metalness: 0.05,
    });
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.3,
      metalness: 0.2,
    });
    const darkClothMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.6,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x27170f,
      roughness: 0.5,
    });

    // 1. TORSO & BODY
    const bodyGroup = new THREE.Group();
    rootGroup.add(bodyGroup);

    // Upper chest/hoodie
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.1, 24);
    const torso = new THREE.Mesh(torsoGeo, vestMat);
    torso.position.y = -0.2;
    bodyGroup.add(torso);

    // Orange safety vest stripes
    const stripeGeo = new THREE.BoxGeometry(0.08, 1.05, 0.1);
    const stripeL = new THREE.Mesh(stripeGeo, goldMat);
    stripeL.position.set(-0.25, -0.2, 0.5);
    const stripeR = new THREE.Mesh(stripeGeo, goldMat);
    stripeR.position.set(0.25, -0.2, 0.5);
    bodyGroup.add(stripeL, stripeR);

    // Smart Badge on Chest
    const badgeGeo = new THREE.BoxGeometry(0.2, 0.18, 0.04);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.26, -0.05, 0.52);
    bodyGroup.add(badge);

    // 2. LEGS & BOOTS (Punya Kaki yang bergerak saat floating!)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.28, -0.75, 0);
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.28, -0.75, 0);
    rootGroup.add(leftLegGroup, rightLegGroup);

    const legGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.9, 16);
    const leftLeg = new THREE.Mesh(legGeo, darkClothMat);
    leftLeg.position.y = -0.45;
    leftLegGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, darkClothMat);
    rightLeg.position.y = -0.45;
    rightLegGroup.add(rightLeg);

    // Tech sneakers
    const bootGeo = new THREE.BoxGeometry(0.26, 0.22, 0.45);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.3 });
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(0, -0.92, 0.08);
    leftLegGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0, -0.92, 0.08);
    rightLegGroup.add(rightBoot);

    // 3. ARMS (Tangan Kiri memegang Hologram Tablet, Tangan Kanan bisa melambai/garuk kepala!)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.62, 0.15, 0);
    bodyGroup.add(leftArmGroup);

    const armGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.8, 16);
    const leftArm = new THREE.Mesh(armGeo, vestMat);
    leftArm.position.set(-0.15, -0.3, 0.2);
    leftArm.rotation.set(0.6, 0, -0.4);
    leftArmGroup.add(leftArm);

    // Tablet in left hand
    const tabletGeo = new THREE.BoxGeometry(0.7, 0.5, 0.03);
    const tabMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 });
    const tablet = new THREE.Mesh(tabletGeo, tabMat);
    tablet.position.set(-0.35, -0.45, 0.55);
    tablet.rotation.set(0.4, 0.3, -0.2);
    leftArmGroup.add(tablet);

    const screenGeo = new THREE.PlaneGeometry(0.64, 0.44);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-0.35, -0.45, 0.57);
    screen.rotation.copy(tablet.rotation);
    leftArmGroup.add(screen);

    // Right Arm (Interactive: bisa melambai ke arah cursor atau garuk kepala!)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.62, 0.15, 0);
    bodyGroup.add(rightArmGroup);

    const rightArm = new THREE.Mesh(armGeo, vestMat);
    rightArm.position.set(0.12, -0.3, 0.1);
    rightArm.rotation.set(0.2, 0, 0.2);
    rightArmGroup.add(rightArm);

    const rightHandGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const rightHand = new THREE.Mesh(rightHandGeo, skinMat);
    rightHand.position.set(0.18, -0.7, 0.2);
    rightArmGroup.add(rightHand);

    // 4. HEAD, EYES & MOUTH (Menoleh langsung ke kursor mouse & mulut bisa berbicara!)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.6, 0);
    rootGroup.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.62, 32, 32);
    const head = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(head);

    // Hair
    const hairCapGeo = new THREE.SphereGeometry(0.66, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.08, -0.04);
    headGroup.add(hairCap);

    // Cute modern hairstyle bang
    const bangGeo = new THREE.ConeGeometry(0.26, 0.55, 16);
    const bang = new THREE.Mesh(bangGeo, hairMat);
    bang.position.set(0.18, 0.6, 0.38);
    bang.rotation.set(-0.3, 0.15, -0.4);
    headGroup.add(bang);

    // Comm headset
    const headsetGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
    const headsetMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const headset = new THREE.Mesh(headsetGeo, headsetMat);
    headset.position.set(0.64, 0, 0);
    headset.rotation.z = Math.PI / 2;
    headGroup.add(headset);

    const headsetLedGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const led = new THREE.Mesh(headsetLedGeo, ledMat);
    led.position.set(0.7, 0, 0.04);
    headGroup.add(led);

    // 5. EYES & PUPILS
    const eyeWhiteGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-0.2, 0.05, 0.54);
    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(0.2, 0.05, 0.54);
    headGroup.add(leftEye, rightEye);

    // Vibrant Glowing Green Pupils
    const pupilGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x059669 });

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.2, 0.05, 0.62);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.2, 0.05, 0.62);
    headGroup.add(leftPupil, rightPupil);

    // Specular Highlight Dots
    const shineGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftShine = new THREE.Mesh(shineGeo, shineMat);
    leftShine.position.set(-0.17, 0.08, 0.67);
    const rightShine = new THREE.Mesh(shineGeo, shineMat);
    rightShine.position.set(0.23, 0.08, 0.67);
    headGroup.add(leftShine, rightShine);

    // 6. MOUTH (Talking & Smiling Animation)
    const mouthGeo = new THREE.TorusGeometry(0.09, 0.022, 12, 16, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.22, 0.58);
    mouth.rotation.set(0.2, 0, Math.PI);
    headGroup.add(mouth);

    // 7. ORBITING HALO
    const haloGeo = new THREE.TorusGeometry(1.4, 0.015, 12, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.5,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2.2;
    rootGroup.add(halo);

    // PRECISE REAL-TIME MOUSE TRACKING COMPUTATION
    const targetLook = { x: 0, y: 0 };
    const currentLook = { x: 0, y: 0 };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;

      // Vector pointing directly from character's center on screen to mouse cursor
      const dx = (e.clientX - charCenterX) / (window.innerWidth * 0.5);
      const dy = (e.clientY - charCenterY) / (window.innerHeight * 0.5);

      // Clamp to realistic human head turn angles
      targetLook.x = Math.max(-1.4, Math.min(1.4, dx));
      targetLook.y = Math.max(-1.2, Math.min(1.2, dy));
    };

    window.addEventListener('mousemove', handleWindowMouseMove);

    // ANIMATION ENGINE LOOP (60FPS)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Smooth Lerp tracking
      currentLook.x += (targetLook.x - currentLook.x) * 0.1;
      currentLook.y += (targetLook.y - currentLook.y) * 0.1;

      // HEAD TURNS ACCURATELY TOWARDS CURSOR
      headGroup.rotation.y = currentLook.x * 0.75;
      headGroup.rotation.x = currentLook.y * 0.5;

      // EYES LEAD THE GAZE FURTHER IN CURSOR DIRECTION
      const eyeDx = currentLook.x * 0.05;
      const eyeDy = -currentLook.y * 0.04;
      leftPupil.position.x = -0.2 + eyeDx;
      leftPupil.position.y = 0.05 + eyeDy;
      rightPupil.position.x = 0.2 + eyeDx;
      rightPupil.position.y = 0.05 + eyeDy;

      leftShine.position.x = -0.17 + eyeDx;
      leftShine.position.y = 0.08 + eyeDy;
      rightShine.position.x = 0.23 + eyeDx;
      rightShine.position.y = 0.08 + eyeDy;

      // TORSO LEANS SLIGHTLY TOWARDS CURSOR
      bodyGroup.rotation.y = currentLook.x * 0.25;

      // MOUTH TALKING ANIMATION (Subtle animated chatter)
      const talkScale = 1 + Math.sin(time * 6) * 0.25;
      mouth.scale.set(talkScale, talkScale, 1);

      // IDLE BEHAVIOR: GESTURE EVERY 6-8 SECONDS (Garuk kepala / Melambai / Cek tablet)
      const cycleTime = time % 8;
      if (cycleTime > 4.5 && cycleTime < 7.0) {
        // GESTURE: Garuk kepala / sentuh headset!
        const gestureProgress = (cycleTime - 4.5) / 2.5;
        const wave = Math.sin(gestureProgress * Math.PI);
        rightArmGroup.rotation.z = wave * 1.5;
        rightArmGroup.rotation.x = wave * 0.8;
      } else {
        // Idle gentle breathing arm swing
        rightArmGroup.rotation.z = Math.sin(time * 2) * 0.08;
        rightArmGroup.rotation.x = Math.cos(time * 1.5) * 0.06;
      }

      // LEGS SWAY WHILE FLOATING
      leftLegGroup.rotation.x = Math.sin(time * 2.2) * 0.15;
      rightLegGroup.rotation.x = -Math.sin(time * 2.2) * 0.15;

      // OVERALL LEVITATION BREATHING
      rootGroup.position.y = -0.15 + Math.sin(time * 2.5) * 0.12;
      halo.rotation.z = time * 0.5;

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
      className="relative flex items-center justify-center pointer-events-none select-none overflow-visible"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

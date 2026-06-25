import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Helper to create glowing circle texture
function createParticleTexture(colorStr: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // soft glow circle
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, colorStr);
    gradient.addColorStop(0.2, colorStr);
    // fade color with transparency
    gradient.addColorStop(0.5, 'rgba(0, 210, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: THREE.Color;
}

export const ThreeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // --- Scene Setup ---
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.z = 250;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // --- Create Particles ---
    const particleCount = 120;
    const particles: Particle[] = [];
    const colorChoices = [
      new THREE.Color('#00d2ff'), // Cyan
      new THREE.Color('#00e87a'), // Emerald
      new THREE.Color('#a855f7'), // Violet
    ];

    const boxSize = 350; // Size of floating space

    // Node Positions for Three.js geometry
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * boxSize;
      const y = (Math.random() - 0.5) * boxSize;
      const z = (Math.random() - 0.5) * boxSize;
      
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = (Math.random() - 0.5) * 0.4;
      const vz = (Math.random() - 0.5) * 0.4;

      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];

      particles.push({ x, y, z, vx, vy, vz, color });

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
    }

    // Geometry & Material for Particles
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Create particle systems
    const whiteGlowTexture = createParticleTexture('#ffffff');
    const colorsArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      colorsArray[i * 3] = particles[i].color.r;
      colorsArray[i * 3 + 1] = particles[i].color.g;
      colorsArray[i * 3 + 2] = particles[i].color.b;
    }
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 16,
      map: whiteGlowTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlePoints);

    // --- Connection Lines ---
    const maxConnections = 300;
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1,
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // --- Interactive Mouse tracking ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouse.targetX = (event.clientX - windowHalfX) * 0.08;
      mouse.targetY = (event.clientY - windowHalfY) * 0.08;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    let animationFrameId: number;
    const maxDist = 75; // Maximum distance to connect nodes

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Interpolate camera mouse target for smooth inertia/parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x;
      camera.position.y = -mouse.y;
      camera.lookAt(scene.position);

      // Update positions
      const positions = particleGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        
        // Gentle drift
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Boundary bounce
        const halfSize = boxSize / 2;
        if (p.x < -halfSize || p.x > halfSize) p.vx *= -1;
        if (p.y < -halfSize || p.y > halfSize) p.vy *= -1;
        if (p.z < -halfSize || p.z > halfSize) p.vz *= -1;

        // Write back to attribute array
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Update Connections (Lines)
      let lineIndex = 0;
      const linePosArray = lineGeometry.attributes.position.array as Float32Array;
      const lineColorArray = lineGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (lineIndex >= maxConnections) break;

          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDist) {
            // Draw connection
            const opacity = 1.0 - (dist / maxDist);
            const intensity = opacity * 0.25; // Keep it subtle and sleek

            // Set coordinates
            const idx1 = lineIndex * 6;
            const idx2 = idx1 + 3;

            linePosArray[idx1] = p1.x;
            linePosArray[idx1 + 1] = p1.y;
            linePosArray[idx1 + 2] = p1.z;

            linePosArray[idx2] = p2.x;
            linePosArray[idx2 + 1] = p2.y;
            linePosArray[idx2 + 2] = p2.z;

            // Set colors interpolated with intensity/distance opacity
            const col1 = p1.color;
            const col2 = p2.color;

            lineColorArray[idx1] = col1.r * intensity;
            lineColorArray[idx1 + 1] = col1.g * intensity;
            lineColorArray[idx1 + 2] = col1.b * intensity;

            lineColorArray[idx2] = col2.r * intensity;
            lineColorArray[idx2 + 1] = col2.g * intensity;
            lineColorArray[idx2 + 2] = col2.b * intensity;

            lineIndex++;
          }
        }
      }

      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIndex * 2);

      // Rotate group slightly for continuous movement
      particlePoints.rotation.y += 0.001;
      lineSegments.rotation.y += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handler ---
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    
    resizeObserver.observe(container);

    // --- Clean Up ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      // Dispose webgl resources
      particleGeometry.dispose();
      particleMaterial.dispose();
      whiteGlowTexture.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div className="three-canvas-container" ref={containerRef} />;
};

export default ThreeBackground;

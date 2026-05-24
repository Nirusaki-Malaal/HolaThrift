import React, { useEffect, useRef } from 'react';

type ThreeModule = typeof import('three');

interface SceneSetup {
  readonly animate: (time: number) => void;
  readonly dispose: () => void;
}

const disposeMaterial = (material: { dispose: () => void } | { dispose: () => void }[]): void => {
  if (Array.isArray(material)) material.forEach((item) => item.dispose());
  else material.dispose();
};

const createMobileScene = (THREE: ThreeModule, scene: InstanceType<ThreeModule['Scene']>): SceneSetup => {
  const group = new THREE.Group();
  scene.add(group);

  const palette = ['#a855f7', '#ec4899', '#38bdf8'];
  const lines: InstanceType<ThreeModule['LineLoop']>[] = [];

  palette.forEach((color, ringIndex) => {
    const points = [];
    const radius = 1.55 + ringIndex * 0.48;

    for (let i = 0; i < 96; i += 1) {
      const progress = i / 96;
      const angle = progress * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 2 + ringIndex) * 0.48,
        Math.sin(angle) * 0.72 - ringIndex * 0.2
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28 + ringIndex * 0.08,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.LineLoop(geometry, material);
    line.rotation.set(ringIndex * 0.32, ringIndex * 0.24, ringIndex * 0.55);
    group.add(line);
    lines.push(line);
  });

  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const colorPool = palette.map((color) => new THREE.Color(color));

  for (let i = 0; i < particleCount; i += 1) {
    const index = i * 3;
    positions[index] = (Math.random() - 0.5) * 7.2;
    positions[index + 1] = (Math.random() - 0.5) * 8.4;
    positions[index + 2] = (Math.random() - 0.5) * 3.6;

    const color = colorPool[i % colorPool.length];
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  return {
    animate: (time: number) => {
      group.rotation.y = Math.sin(time * 0.28) * 0.26;
      group.rotation.z = time * 0.045;
      particles.rotation.z = -time * 0.035;
      particles.position.y = Math.sin(time * 0.8) * 0.12;
      lines.forEach((line, index) => {
        line.rotation.x += 0.0018 + index * 0.0006;
        line.rotation.y -= 0.0012 + index * 0.0004;
      });
    },
    dispose: () => {
      lines.forEach((line) => {
        line.geometry.dispose();
        disposeMaterial(line.material);
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
    },
  };
};

const createDesktopScene = (THREE: ThreeModule, scene: InstanceType<ThreeModule['Scene']>): SceneSetup => {
  const group = new THREE.Group();
  scene.add(group);

  const palette = [new THREE.Color('#a855f7'), new THREE.Color('#ec4899'), new THREE.Color('#38bdf8'), new THREE.Color('#ffffff')];
  const particleCount = 1200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const index = i * 3;
    const angle = i * 0.11;
    const radius = 1.8 + Math.random() * 4.8;
    positions[index] = Math.cos(angle) * radius;
    positions[index + 1] = (Math.random() - 0.5) * 4.8;
    positions[index + 2] = Math.sin(angle) * radius - Math.random() * 3;

    const color = palette[i % palette.length];
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.25, 0.16, 220, 20),
    new THREE.MeshBasicMaterial({
      color: '#a855f7',
      wireframe: true,
      transparent: true,
      opacity: 0.26,
    })
  );
  knot.position.set(1.9, -0.15, -0.8);
  group.add(knot);

  const clothGeometry = new THREE.PlaneGeometry(5.8, 3.2, 80, 40);
  const clothMaterial = new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    wireframe: true,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
  });
  const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
  cloth.position.set(-1.3, -0.35, -2.4);
  cloth.rotation.set(-0.35, 0.15, -0.12);
  group.add(cloth);

  return {
    animate: (time: number) => {
      particles.rotation.y = time * 0.045;
      particles.rotation.x = Math.sin(time * 0.22) * 0.05;
      knot.rotation.x = time * 0.24;
      knot.rotation.y = time * 0.18;

      const positionAttribute = clothGeometry.attributes.position;
      for (let i = 0; i < positionAttribute.count; i += 1) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        positionAttribute.setZ(i, Math.sin(x * 1.4 + time * 1.2) * 0.12 + Math.cos(y * 2 + time) * 0.08);
      }
      positionAttribute.needsUpdate = true;
    },
    dispose: () => {
      particleGeometry.dispose();
      particleMaterial.dispose();
      knot.geometry.dispose();
      disposeMaterial(knot.material);
      clothGeometry.dispose();
      clothMaterial.dispose();
    },
  };
};

export default function HeroScene(): React.JSX.Element {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanupScene: (() => void) | undefined;

    const initScene = async (): Promise<void> => {
      const THREE = await import('three');
      const mount = mountRef.current;
      if (!mount || cancelled) return;

      const isMobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(isMobile ? 38 : 45, 1, 0.1, 100);
      camera.position.set(0, isMobile ? 0.15 : 0.2, isMobile ? 6.2 : 8);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const sceneSetup = isMobile ? createMobileScene(THREE, scene) : createDesktopScene(THREE, scene);

      const resize = (): void => {
        const width = mount.clientWidth || window.innerWidth;
        const height = mount.clientHeight || window.innerHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const startedAt = performance.now();
      let frameId = 0;

      const animate = (): void => {
        const time = (performance.now() - startedAt) / 1000;
        sceneSetup.animate(time);
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      };

      resize();
      window.addEventListener('resize', resize);
      animate();

      cleanupScene = () => {
        window.cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resize);
        sceneSetup.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    initScene();

    return () => {
      cancelled = true;
      cleanupScene?.();
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" />;
}

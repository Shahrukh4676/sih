"use client";

import React, { useEffect, useRef } from "react";

interface SpatialBackgroundProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  origX: number;
  origY: number;
  size: number;
  baseAlpha: number;
  color: string;
}

export function SpatialBackground({ className = "" }: SpatialBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;

    // Mouse coordinates with lerp inertia
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Particle system (optimized for 60fps/120fps zero-lag on #FAFAFA light canvas)
    const particles: Particle[] = [];
    const GRID_SPACING = 38;
    const ROWS = 26;
    const COLS = 42;

    const initParticles = () => {
      particles.length = 0;
      const startX = -((COLS * GRID_SPACING) / 2);
      const startY = -((ROWS * GRID_SPACING) / 2);

      // Colors from design.md: Secondary (#2640D9), Tertiary (#8A66E6), Slate, Cyan
      const colorPalette = [
        "rgba(38, 64, 217, ",   // Royal Blue (#2640D9)
        "rgba(138, 102, 230, ", // Electric Purple (#8A66E6)
        "rgba(30, 41, 59, ",    // Deep Slate (#1E293B)
        "rgba(2, 132, 199, ",   // Cyan Accent (#0284C7)
        "rgba(71, 85, 105, ",   // Mid Slate (#475569)
      ];

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const posX = startX + c * GRID_SPACING + (Math.random() - 0.5) * 5;
          const posY = startY + r * GRID_SPACING + (Math.random() - 0.5) * 5;
          const posZ = Math.random() * 320 + 80;

          const distFromCenter = Math.sqrt(posX * posX + posY * posY);
          const baseAlpha = Math.max(0.12, 0.52 - distFromCenter / 920);

          const rand = Math.random();
          let chosen = colorPalette[2]; // Deep slate
          if (rand < 0.35) {
            chosen = colorPalette[0]; // Royal Blue
          } else if (rand < 0.60) {
            chosen = colorPalette[1]; // Electric Purple
          } else if (rand < 0.75) {
            chosen = colorPalette[3]; // Cyan
          } else if (rand < 0.90) {
            chosen = colorPalette[4]; // Mid slate
          }

          particles.push({
            x: posX,
            y: posY,
            z: posZ,
            origX: posX,
            origY: posY,
            size: rand > 0.85 ? 2.4 : 1.5,
            baseAlpha,
            color: chosen,
          });
        }
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      // Clamp DPR to 1.5 to guarantee zero GPU lag while keeping dots sharp
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) {
        lastTime = performance.now();
        render(lastTime);
      }
    };

    handleResize();
    initParticles();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    let lastTime = performance.now();
    let pulseAngle = 0;

    const render = (currentTime: number) => {
      if (!isVisible) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Slow breathing pulse (design.md line 168)
      pulseAngle += delta * 1.1;
      const breathingScale = 1 + Math.sin(pulseAngle) * 0.04;
      const breathingAlpha = 0.88 + Math.sin(pulseAngle * 0.8) * 0.12;

      // Smooth pointer parallax drift
      mouseX += (targetMouseX - mouseX) * 0.045;
      mouseY += (targetMouseY - mouseY) * 0.045;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const cameraFov = 420;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const effX = p.origX * breathingScale + mouseX * 35;
        const effY = p.origY * breathingScale + mouseY * 35;
        const effZ = p.z + mouseY * 15;

        const scale = cameraFov / (cameraFov + effZ);
        const projX = centerX + effX * scale;
        const projY = centerY + effY * scale;

        if (projX < -15 || projX > width + 15 || projY < -15 || projY > height + 15) {
          continue;
        }

        const currentAlpha = Math.min(p.baseAlpha * breathingAlpha * scale * 1.5, 0.7);
        const currentRadius = Math.max(0.85, p.size * scale);

        ctx.fillStyle = `${p.color}${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(projX, projY, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle structural vector links between high-energy nodes
        if (i % 8 === 0 && currentAlpha > 0.32) {
          ctx.strokeStyle = `${p.color}${currentAlpha * 0.25})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(projX, projY);
          ctx.lineTo(projX + 20 * scale, projY + 12 * scale);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      {/* Light Canvas Background (#FAFAFA) */}
      <div className="absolute inset-0 bg-[#FAFAFA]" />

      {/* Hardware-Accelerated Dot Matrix Canvas */}
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        className="w-full h-full block relative z-10"
        aria-hidden="true"
      />

      {/* Atmospheric Spatial Mesh Gradients (from design.md line 77) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-r from-[#6633E6]/12 via-[#2640D9]/10 to-[#4059F0]/12 blur-3xl pointer-events-none z-0" />
      <div className="absolute top-40 right-10 w-[380px] h-[380px] bg-[#2640D9]/8 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-20 left-10 w-[380px] h-[380px] bg-[#8A66E6]/8 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Technical Grid Pattern Overlay on #FAFAFA */}
      <div
        className="absolute inset-0 opacity-35 pointer-events-none z-10"
        style={{
          backgroundImage: `radial-gradient(rgba(17, 24, 39, 0.12) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Soft Vignette on #FAFAFA */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFA]/60 via-transparent to-[#FAFAFA]/90 pointer-events-none z-20" />

      {/* Studio Spatial Interface Technical Coordinate Overlays */}
      <div className="absolute top-5 left-8 text-[10px] font-mono text-slate-500 tracking-wider hidden lg:flex items-center gap-2 select-none z-30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>[SYS: STUDIO-SPATIAL // COLOR: #FAFAFA // PRIMARY: #111827 // SECONDARY: #2640D9 // TERTIARY: #8A66E6]</span>
      </div>
      <div className="absolute top-5 right-8 text-[10px] font-mono text-slate-500 tracking-wider hidden lg:block select-none z-30">
        [MATRIX: 42x26 // BREATH_PULSE: ACTIVE // BORDER: 0.8PX #E5E7EB // 60-120 FPS]
      </div>
      <div className="absolute bottom-5 left-8 text-[10px] font-mono text-slate-500 tracking-wider hidden lg:block select-none z-30">
        [TYPOGRAPHY: DISPLAY-LG 72PX // RADIUS: 9999PX // DEPTH: GLASS 12PX]
      </div>
      <div className="absolute bottom-5 right-8 text-[10px] font-mono text-slate-500 tracking-wider hidden lg:block select-none z-30">
        [NEXUS_AI_SPATIAL_CORE // ZERO_TRUST // SHA-256 GENESIS]
      </div>
    </div>
  );
}

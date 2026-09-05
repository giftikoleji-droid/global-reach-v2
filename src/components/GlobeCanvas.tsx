import { useEffect, useRef } from "react";

type Pt = { x: number; y: number; z: number };

export function GlobeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let points: Pt[][] = [];
    const numLat = 18;
    const numLon = 24;
    let angleY = 0;
    let angleX = 0.12;
    let animId = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      if (!canvas) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx?.setTransform(1, 0, 0, 1, 0, 0);
      ctx?.scale(dpr, dpr);
    }

    function radius() {
      return Math.max(Math.min(W, H) * 0.26, 110);
    }

    function buildSphere() {
      points = [];
      const R = radius();
      for (let i = 0; i <= numLat; i++) {
        const phi = (i / numLat) * Math.PI;
        const ring: Pt[] = [];
        for (let j = 0; j <= numLon; j++) {
          const theta = (j / numLon) * 2 * Math.PI;
          ring.push({
            x: R * Math.sin(phi) * Math.cos(theta),
            y: R * Math.cos(phi),
            z: R * Math.sin(phi) * Math.sin(theta),
          });
        }
        points.push(ring);
      }
      for (let j = 0; j < numLon; j++) {
        const theta = (j / numLon) * 2 * Math.PI;
        const ring: Pt[] = [];
        for (let i = 0; i <= numLat; i++) {
          const phi = (i / numLat) * Math.PI;
          ring.push({
            x: R * Math.sin(phi) * Math.cos(theta),
            y: R * Math.cos(phi),
            z: R * Math.sin(phi) * Math.sin(theta),
          });
        }
        points.push(ring);
      }
    }

    function rotatePoint(p: Pt, ay: number, ax: number): Pt {
      let { x, y, z } = p;
      const c = Math.cos(ay);
      const s = Math.sin(ay);
      const x1 = x * c + z * s;
      const z1 = -x * s + z * c;
      x = x1;
      z = z1;
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);
      const y1 = y * cx - z * sx;
      const z2 = y * sx + z * cx;
      y = y1;
      z = z2;
      return { x, y, z };
    }

    function project(p: Pt) {
      const fov = 600;
      const dist = 700;
      const scale = fov / (dist + p.z);
      return { x: W / 2 + p.x * scale, y: H / 2 + p.y * scale, z: p.z };
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      if (points.length === 0) buildSphere();
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = "rgba(212, 175, 55, 0.18)";
      for (const ring of points) {
        const proj = ring.map((p) => project(rotatePoint(p, angleY, angleX)));
        ctx.beginPath();
        proj.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();

        for (const p of proj) {
          const alpha = 0.15 + 0.35 * (1 - Math.abs(p.z) / 800);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(245, 197, 24, ${alpha * 0.5})`;
          ctx.fill();
        }
      }
      const r = radius() * 0.6;
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, r);
      grad.addColorStop(0, "rgba(212, 175, 55, 0.025)");
      grad.addColorStop(1, "rgba(10, 38, 71, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, 2 * Math.PI);
      ctx.fill();
    }

    function animate() {
      angleY += 0.0026;
      angleX += 0.00035;
      draw();
      animId = requestAnimationFrame(animate);
    }

    function onResize() {
      resize();
      buildSphere();
    }

    window.addEventListener("resize", onResize);
    resize();
    buildSphere();
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas id="globeCanvas" ref={ref} aria-hidden="true" />;
}

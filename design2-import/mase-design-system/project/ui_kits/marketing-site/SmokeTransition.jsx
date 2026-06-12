/* SmokeTransition.jsx — canvas smoke overlay for theme switches.
   Usage: render <SmokeTransition trigger={n} toDark={bool} onMidpoint={flipTheme}/>
   Bumping `trigger` runs one animation: smoke billows in, fires `onMidpoint`
   when fully occluding the page (flip the theme there), then dissipates. */

const {
  useEffect: useSmokeEffect,
  useRef:    useSmokeRef,
  useState:  useSmokeState,
} = React;

function SmokeTransition({ trigger, toDark, onMidpoint, onComplete }) {
  const canvasRef = useSmokeRef(null);
  const lastTriggerRef = useSmokeRef(0);
  const [active, setActive] = useSmokeState(false);

  useSmokeEffect(() => {
    if (!trigger || trigger === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger;
    runSmoke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const runSmoke = () => {
    setActive(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Color palettes for incoming theme
    const palette = toDark
      ? [
          [13, 17, 23],      // ink near-black
          [10, 14, 39],      // ink-800 footer
          [15, 118, 110],    // teal-600 (signature)
          [11, 95, 88],      // teal-700
        ]
      : [
          [255, 255, 255],   // pure white
          [246, 249, 255],   // surface
          [102, 182, 255],   // light blue
          [167, 243, 208],   // teal-100
        ];

    // Puffs
    const puffs = [];
    const N = 60;
    for (let i = 0; i < N; i++) {
      const edge = Math.random();
      let x, y, vx, vy;
      if (edge < 0.55) {        // bottom
        x = Math.random() * w;
        y = h + 60 + Math.random() * 140;
        vx = (Math.random() - 0.5) * 0.4;
        vy = -(0.9 + Math.random() * 1.3);
      } else if (edge < 0.78) { // left
        x = -80 - Math.random() * 100;
        y = h * 0.2 + Math.random() * h * 0.8;
        vx = 1 + Math.random() * 1.2;
        vy = -(0.4 + Math.random() * 0.8);
      } else {                  // right
        x = w + 80 + Math.random() * 100;
        y = h * 0.2 + Math.random() * h * 0.8;
        vx = -(1 + Math.random() * 1.2);
        vy = -(0.4 + Math.random() * 0.8);
      }
      const colorIdx = Math.floor(Math.random() * palette.length);
      puffs.push({
        x0: x, y0: y, vx, vy,
        r0: 90 + Math.random() * 160,
        delay: Math.random() * 380,                // ms stagger
        seed: Math.random() * 1000,
        color: palette[colorIdx],
        peakAlpha: 0.55 + Math.random() * 0.35,
      });
    }

    const start = performance.now();
    const duration = 1600;  // total length
    const peakAt = 0.5;     // 0..1, when occlusion is max
    let midpointFired = false;

    const draw = (now) => {
      const elapsed = now - start;
      const progress = elapsed / duration;

      // Fire the theme flip just before full occlusion
      if (!midpointFired && progress >= peakAt) {
        midpointFired = true;
        try { onMidpoint && onMidpoint(); } catch (e) {}
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < puffs.length; i++) {
        const p = puffs[i];
        const tMs = elapsed - p.delay;
        if (tMs < 0) continue;
        const life = 1200;
        const t = tMs / life;
        if (t > 1.3) continue;

        // Bell-curve alpha so each puff fades in and back out around its own peak
        const center = 0.48;
        const width = 0.42;
        const bell = Math.exp(-Math.pow((t - center) / width, 2));
        const a = bell * p.peakAlpha;
        if (a < 0.01) continue;

        // Motion: drift along velocity + sine sway
        const drift = tMs * 0.06;
        const sway = Math.sin((elapsed + p.seed) * 0.0018) * 22;
        const x = p.x0 + p.vx * drift + sway;
        const y = p.y0 + p.vy * drift;

        // Growth
        const r = p.r0 * (0.7 + Math.min(1, t * 1.3) * 0.7);

        const [r0, g0, b0] = p.color;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0,    `rgba(${r0},${g0},${b0},${a})`);
        grad.addColorStop(0.55, `rgba(${r0},${g0},${b0},${a * 0.4})`);
        grad.addColorStop(1,    `rgba(${r0},${g0},${b0},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < 1.0) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
        setActive(false);
        try { onComplete && onComplete(); } catch (e) {}
      }
    };

    requestAnimationFrame(draw);
  };

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        pointerEvents: "none",
        display: active ? "block" : "none",
        filter: "blur(14px) contrast(1.08)",
        // The blur "leaks" past the canvas edges so the smoke looks like it
        // billows beyond the viewport too
        margin: "-40px",
        width: "calc(100% + 80px)",
        height: "calc(100% + 80px)",
      }}
    />
  );
}

window.SmokeTransition = SmokeTransition;

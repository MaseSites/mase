/* =============================================================
   Animations.jsx — hooks + helper components for the MASE kit
   ============================================================= */

const {
  useEffect: useAnimEffect,
  useRef: useAnimRef,
  useState: useAnimState,
} = React;

/* ----- useInView: IntersectionObserver hook ----- */
function useInView(opts) {
  const ref = useAnimRef(null);
  const [inView, setInView] = useAnimState(false);
  useAnimEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -60px 0px", ...(opts || {}) }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}
window.useInView = useInView;

/* ----- ScrollReveal: generic fade-up wrapper ----- */
function ScrollReveal({ as = "div", dir, delay = 0, children, ...rest }) {
  const [ref, inView] = useInView();
  const Tag = as;
  return (
    <Tag
      ref={ref}
      data-dir={dir}
      className={`reveal ${inView ? "is-in" : ""} ${rest.className || ""}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...(rest.style || {}) }}
      {...Object.fromEntries(Object.entries(rest).filter(([k]) => k !== "className" && k !== "style"))}
    >
      {children}
    </Tag>
  );
}
window.ScrollReveal = ScrollReveal;

/* ----- WordReveal: split a string into staggered words ----- */
function WordReveal({ text, as = "span", baseDelay = 0, step = 70, className = "", style }) {
  const Tag = as;
  const words = String(text).split(/(\s+)/); // keep whitespace
  let wordIndex = 0;
  return (
    <Tag className={`word-reveal ${className}`} style={style}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>&nbsp;</span>;
        const d = baseDelay + wordIndex * step;
        wordIndex += 1;
        return (
          <span key={i} className="word" style={{ animationDelay: `${d}ms` }}>
            {w}
          </span>
        );
      })}
    </Tag>
  );
}
window.WordReveal = WordReveal;

/* ----- TiltCard: 3D mouse-tilt with shine ----- */
function TiltCard({ max = 8, scale = 1, children, className = "", style }) {
  const wrapRef = useAnimRef(null);
  const cardRef = useAnimRef(null);

  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * (max * 2);
    const ry = (px - 0.5) * (max * 2);
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div
      ref={wrapRef}
      className={`tilt-wrap ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
    >
      <div ref={cardRef} className="tilt" style={{ position: "relative" }}>
        {children}
        <span className="tilt-shine" />
      </div>
    </div>
  );
}
window.TiltCard = TiltCard;

/* ----- Counter: count-up to value when value changes ----- */
function Counter({ value, duration = 600, format = (v) => Math.round(v).toLocaleString("de-CH") }) {
  const [display, setDisplay] = useAnimState(value);
  const fromRef = useAnimRef(value);
  const elRef = useAnimRef(null);

  useAnimEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setDisplay(v);
      if (t < 1) requestAnimationFrame(step);
      else {
        setDisplay(to);
        fromRef.current = to;
        const el = elRef.current;
        if (el) {
          el.classList.remove("counter-pop");
          // force reflow
          void el.offsetWidth;
          el.classList.add("counter-pop");
        }
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span ref={elRef} style={{ display: "inline-block" }}>{format(display)}</span>;
}
window.Counter = Counter;

/* ----- ScrollProgress: fixed top bar ----- */
function ScrollProgress() {
  const ref = useAnimRef(null);
  useAnimEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      el.style.width = `${p}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={ref} className="scroll-progress__bar" />
    </div>
  );
}
window.ScrollProgress = ScrollProgress;

/* ----- HeroMesh: animated gradient blobs ----- */
function HeroMesh() {
  return (
    <div className="hero-mesh" aria-hidden="true">
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
    </div>
  );
}
window.HeroMesh = HeroMesh;

/* Marquee — looping trust-signal row (i18n-fähig) */
function Marquee({ items }) {
  var ctx = (typeof window !== "undefined" && window.useT) ? window.useT() : null;
  var t = ctx ? ctx.t : function (k) { return k; };
  var list = items || [
    t("marquee_1"), t("marquee_2"), t("marquee_3"),
    t("marquee_4"), t("marquee_5"), t("marquee_6"),
    t("marquee_7"), t("marquee_8"), t("marquee_9")
  ];
  const row = (
    <React.Fragment>
      {list.map((it, i) => <span className="marquee__item" key={i}>{it}</span>)}
    </React.Fragment>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {row}{row}
      </div>
    </div>
  );
}
window.Marquee = Marquee;

/* ----- StickyCtaAnimated: appears after scroll threshold ----- */
function StickyCtaAnimated({ onClick }) {
  const [visible, setVisible] = useAnimState(false);
  useAnimEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a
      className={`sticky-cta ${visible ? "is-visible" : ""}`}
      href="#"
      onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      Projekt starten
    </a>
  );
}
window.StickyCtaAnimated = StickyCtaAnimated;

/* ----- StaggerGrid: applies .is-in to grid when it enters view ----- */
function StaggerGrid({ as = "div", className = "", children, ...rest }) {
  const [ref, inView] = useInView();
  const Tag = as;
  return (
    <Tag ref={ref} className={`${className} ${inView ? "is-in" : ""}`} {...rest}>
      {children}
    </Tag>
  );
}
window.StaggerGrid = StaggerGrid;

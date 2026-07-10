// Pale-blue hero strip — PT Sans title, light body, image-slot placeholder on the right.

const HeroSection = () => (
  <section style={heroStyles.wrap}>
    <div style={heroStyles.inner}>
      <div style={heroStyles.copy}>
        <h1 style={heroStyles.title}>
          Bring Joy to Teaching<br />
          Personal Finance.<br />
          <span style={{ color: "#275ce4" }}>No Prep Needed.</span>
        </h1>
        <p style={heroStyles.lede}>
          Free, ready-to-use lessons trusted by 100,000+ teachers across all 50 states. Pick a unit,
          print the activity, hit play on the video — done.
        </p>
        <div style={heroStyles.cta}>
          <a href="#" className="ngpf-btn">Get the FREE Curriculum</a>
          <a href="#" style={heroStyles.anchor}>Take a 60-second tour →</a>
        </div>
      </div>
      <div style={heroStyles.placeholder} aria-label="Hero image placeholder">
        <svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true">
          <rect x="6" y="10" width="48" height="38" rx="3" fill="none" stroke="#9aa9c7" strokeWidth="2" />
          <circle cx="19" cy="22" r="4" fill="#9aa9c7" />
          <path d="M10 44 L24 30 L34 38 L44 26 L54 36 L54 48 L10 48 Z" fill="#c7d3e8" />
        </svg>
        <div style={heroStyles.placeholderLabel}>Hero image</div>
        <div style={heroStyles.placeholderHint}>Drop a classroom photo or hero illustration here</div>
      </div>
    </div>
  </section>
);

const heroStyles = {
  wrap: { background: "#edfaff" },
  inner: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "72px 80px 96px",
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 48,
    alignItems: "center",
  },
  copy: { display: "flex", flexDirection: "column", gap: 24 },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 56,
    lineHeight: 1.05,
    color: "#0b1541",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  lede: {
    fontFamily: "var(--font-sans)",
    fontSize: 19,
    lineHeight: 1.5,
    color: "#231f20",
    margin: 0,
    maxWidth: 520,
  },
  cta: { display: "flex", alignItems: "center", gap: 20, marginTop: 6 },
  anchor: { color: "#275ce4", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, textDecoration: "none" },
  placeholder: {
    height: 380,
    borderRadius: 8,
    background: "#dfe9ff",
    border: "2px dashed #9aa9c7",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    textAlign: "center",
  },
  placeholderLabel: {
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: 14,
    color: "#1f3b9b",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginTop: 6,
  },
  placeholderHint: {
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    color: "#5f6c8c",
    maxWidth: 260,
    lineHeight: 1.4,
  },
};

window.HeroSection = HeroSection;

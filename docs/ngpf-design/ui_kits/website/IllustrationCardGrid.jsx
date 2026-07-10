// 4-col illustration grid — borderless 20px-radius cards centered around a full-color icon.

const IllustrationCardGrid = ({ items }) => (
  <section style={igStyles.section}>
    <div style={igStyles.inner}>
      <h2 style={igStyles.h2}>Nine Units. Real-World Personal Finance.</h2>
      <p style={igStyles.sub}>A full year of classroom-ready lessons across the topics teachers ask for most.</p>
      <div style={igStyles.grid}>
        {items.map((it) => (
          <article key={it.title} style={igStyles.card}>
            <img src={it.src} alt="" style={igStyles.icon} />
            <div style={igStyles.title}>{it.title}</div>
            <div style={igStyles.body}>{it.body}</div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

const igStyles = {
  section: { background: "#fff", padding: "80px 0 32px" },
  inner: { maxWidth: 1280, margin: "0 auto", padding: "0 80px" },
  h2: {
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 32,
    color: "#0b1541", margin: 0, textAlign: "center", lineHeight: 1.2,
  },
  sub: {
    fontFamily: "var(--font-sans)", fontSize: 17, color: "#424242",
    textAlign: "center", margin: "12px 0 40px",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "start" },
  card: {
    background: "#fff", borderRadius: 20, padding: "8px 12px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    cursor: "pointer", transition: "transform 160ms ease",
  },
  iconWrap: { padding: "8px 0" },
  icon: { width: 130, height: 130, objectFit: "contain", display: "block", marginBottom: 4 },
  title: {
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
    color: "#275ce4", textAlign: "center",
  },
  body: {
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, lineHeight: 1.25,
    color: "#231f20", textAlign: "center",
  },
};

window.IllustrationCardGrid = IllustrationCardGrid;

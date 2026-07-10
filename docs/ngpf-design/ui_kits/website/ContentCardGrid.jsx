// Signature 4-col content card — 1px #275ce4 border, drop shadow, bright-blue badge.

const ContentCardGrid = ({ items, title = "Featured Resources", sub }) => (
  <section style={ccStyles.section}>
    <div style={ccStyles.inner}>
      {title && <h2 style={ccStyles.h2}>{title}</h2>}
      {sub && <p style={ccStyles.sub}>{sub}</p>}
      <div style={ccStyles.grid}>
        {items.map((it, i) => (
          <article key={i} style={ccStyles.card}>
            <span style={ccStyles.badge}>{it.badge}</span>
            <div style={ccStyles.cardTitle}>{it.title}</div>
            <div style={ccStyles.cardBody}>{it.body}</div>
            {it.cta && (
              <a href="#" style={ccStyles.cardCta}>{it.cta} →</a>
            )}
          </article>
        ))}
      </div>
    </div>
  </section>
);

const ccStyles = {
  section: { background: "#fff", padding: "48px 0" },
  inner: { maxWidth: 1280, margin: "0 auto", padding: "0 80px" },
  h2: {
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 32,
    color: "#0b1541", margin: 0, lineHeight: 1.2,
  },
  sub: { fontFamily: "var(--font-sans)", fontSize: 17, color: "#424242", margin: "8px 0 28px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 },
  card: {
    background: "#fff",
    border: "1px solid #d9d9d9",
    boxShadow: "0 4px 4px rgba(0,0,0,0.18)",
    padding: "20px 16px",
    borderRadius: 5,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    background: "#275ce4",
    color: "#fff",
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "4px 10px",
    borderRadius: 999,
  },
  cardTitle: {
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
    lineHeight: 1.3, color: "#1f3b9b",
  },
  cardBody: {
    fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.45, color: "#231f20",
  },
  cardCta: {
    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
    color: "#275ce4", textDecoration: "none",
    marginTop: "auto",
  },
};

window.ContentCardGrid = ContentCardGrid;

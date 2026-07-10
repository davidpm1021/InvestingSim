// Related posts strip — three pale-blue cards, hero image + category + title.

const BlogStrip = ({ posts }) => (
  <section style={{ background: "#fff", padding: "64px 0" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 80px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 28,
          color: "#0b1541", margin: 0,
        }}>From the NGPF Blog</h2>
        <a href="#" style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
          color: "#275ce4", textDecoration: "none",
        }}>See all posts →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {posts.map((p, i) => (
          <article key={i} style={{ background: "#f0f4fe", borderRadius: 0, overflow: "hidden" }}>
            <div style={{
              height: 140,
              background: `linear-gradient(135deg, ${p.tint || "#275ce4"}, ${p.tint2 || "#1f3b9b"})`,
              display: "flex", alignItems: "flex-end", padding: 12,
              color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>{p.tagline}</div>
            <div style={{ padding: "16px 20px 22px" }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
                color: "#1f3b9b", letterSpacing: "0.04em", textTransform: "uppercase",
                marginBottom: 8,
              }}>{p.category}</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
                color: "#0b1541", lineHeight: 1.4,
              }}>{p.title}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

window.BlogStrip = BlogStrip;

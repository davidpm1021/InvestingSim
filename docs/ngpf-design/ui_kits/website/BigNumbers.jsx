// Big metrics strip — patterned bright-blue background, three big numbers across.

const BigNumbers = ({ items }) => (
  <section style={{
    background: "url('../../assets/pattern-bright-blue.png') center/600px repeat, #275ce4",
    padding: "72px 0",
  }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 32 }}>
        {items.map((it) => (
          <div key={it.label} style={{ textAlign: "center", color: "#fff" }}>
            <div style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 80,
              lineHeight: 1, letterSpacing: "-0.02em",
            }}>{it.value}</div>
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.4,
              marginTop: 14, maxWidth: 280, marginLeft: "auto", marginRight: "auto",
            }}>{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

window.BigNumbers = BigNumbers;

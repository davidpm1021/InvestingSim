// Pale-blue quote panel — quote card with the signature oversized blue glyph
// bleeding off the top, matching the preview "Quote + big number" card.

const QuoteBlock = ({ quote, speaker, school }) => (
  <section style={{ background: "#edfaff", padding: "120px 0 80px" }}>
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 80px" }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: "48px 44px 32px",
        position: "relative",
      }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 280,
          lineHeight: 0.7, color: "#1f3b9b",
          position: "absolute", top: -16, left: 36, pointerEvents: "none",
        }}>&ldquo;</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 24,
          lineHeight: 1.5, color: "#231f20", paddingTop: 18,
        }}>{quote}</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
          color: "#231f20", marginTop: 20, textAlign: "right",
        }}>
          — {speaker} · {school}
        </div>
      </div>
    </div>
  </section>
);

window.QuoteBlock = QuoteBlock;

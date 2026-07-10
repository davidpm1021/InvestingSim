// Dark-blue footer — KO logo, link columns, socials.

const Footer = () => (
  <footer style={{ background: "#0b1541", color: "#fff", padding: "72px 0 32px" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr", gap: 32 }}>
        <div>
          <img src="../../assets/ngpf-horizontal-primary-ko.png" alt="NGPF" style={{ width: 180 }} />
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.5,
            color: "#dfe9ff", marginTop: 18, maxWidth: 280,
          }}>
            Bringing joy to teaching personal finance with free, ready-to-use curriculum and
            professional development for K-12 teachers.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 20, fontSize: 18, color: "#fff" }}>
            <a href="#" style={fLink}><i className="fab fa-facebook-f"></i></a>
            <a href="#" style={fLink}><i className="fab fa-x-twitter"></i></a>
            <a href="#" style={fLink}><i className="fab fa-instagram"></i></a>
            <a href="#" style={fLink}><i className="fab fa-linkedin-in"></i></a>
            <a href="#" style={fLink}><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        {[
          { h: "Curriculum", links: ["Personal Finance", "Math", "All Resources", "Question of the Day", "Standards"] },
          { h: "PD & Community", links: ["On-Demand Modules", "Virtual PD", "Certification", "FinCamps", "Academy"] },
          { h: "Mission 2030", links: ["Advocacy", "Take Action", "State Tracker", "Press"] },
          { h: "Org", links: ["About Us", "Careers", "Contact", "Donate", "Privacy"] },
        ].map((c) => (
          <div key={c.h}>
            <div style={fHead}>{c.h}</div>
            {c.links.map((l) => (
              <a key={l} href="#" style={fLinkText}>{l}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 56, paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,0.15)",
        display: "flex", justifyContent: "space-between",
        fontFamily: "var(--font-sans)", fontSize: 13, color: "#a8b6e5",
      }}>
        <div>© 2026 Next Gen Personal Finance, Inc. 501(c)(3) non-profit.</div>
        <div>Made for teachers, by teachers.</div>
      </div>
    </div>
  </footer>
);

const fHead = {
  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
  color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase",
  marginBottom: 14,
};
const fLinkText = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 14,
  color: "#dfe9ff", textDecoration: "none", marginBottom: 8, lineHeight: 1.4,
};
const fLink = {
  width: 36, height: 36, borderRadius: "50%",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "rgba(255,255,255,0.08)", color: "#fff", textDecoration: "none",
};

window.Footer = Footer;

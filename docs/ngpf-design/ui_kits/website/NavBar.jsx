// NGPF Site Nav — 80px tall white bar with shadow.
// ngpf logo · Math (gold pill) · Arcade (bright-blue pill) · Curriculum ▾ ·
// Teacher PD & Community ▾ · Join Mission 2030 ▾ · 🔍 · Account (orange pill)

const NavBar = ({ active = "Curriculum" }) => {
  const navItems = ["Curriculum", "Teacher PD & Community", "Join Mission 2030"];
  return (
    <header style={navStyles.bar}>
      <a href="#" style={navStyles.logoLink}>
        <img src="../../assets/ngpf-horizontal-primary.png" alt="NGPF" style={navStyles.logo} />
      </a>

      <nav style={navStyles.center}>
        <a href="#" style={{ ...navStyles.pill, background: "#f09843" }}>
          <i className="fas fa-divide" style={{ marginRight: 6, fontSize: 13 }}></i> Math
        </a>
        <a href="#" style={{ ...navStyles.pill, background: "#275ce4", color: "#fff" }}>
          <i className="fas fa-gamepad" style={{ marginRight: 6, fontSize: 13 }}></i> Arcade
        </a>

        {navItems.map((label) => (
          <a key={label} href="#" style={{
            ...navStyles.link,
            color: active === label ? "#275ce4" : "#0b1541",
          }}>
            {label} <i className="fas fa-angle-down" style={{ fontSize: 11, marginLeft: 4 }}></i>
          </a>
        ))}
      </nav>

      <div style={navStyles.right}>
        <button style={navStyles.iconBtn} aria-label="Search">
          <i className="fas fa-magnifying-glass"></i>
        </button>
        <a href="#" style={navStyles.account}>
          <i className="fas fa-user-circle" style={{ marginRight: 6 }}></i> Account
        </a>
      </div>
    </header>
  );
};

const navStyles = {
  bar: {
    height: 80,
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
    borderBottom: "1px solid #e7ebee",
    display: "flex",
    alignItems: "center",
    padding: "0 50px",
    gap: 24,
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  logoLink: { display: "flex", alignItems: "center", textDecoration: "none" },
  logo: { width: 110, height: "auto" },
  center: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginLeft: 32,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "9px 14px",
    borderRadius: 9,
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: 15,
    color: "#0b1541",
    textDecoration: "none",
    lineHeight: 1,
  },
  link: {
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    padding: "8px 4px",
    lineHeight: 1,
  },
  right: { display: "flex", alignItems: "center", gap: 16 },
  iconBtn: {
    background: "#275ce4",
    color: "#fff",
    width: 38,
    height: 38,
    borderRadius: 8,
    border: 0,
    cursor: "pointer",
    fontSize: 15,
  },
  account: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f78219",
    color: "#0b1541",
    padding: "9px 16px",
    borderRadius: 9,
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    lineHeight: 1,
  },
};

window.NavBar = NavBar;

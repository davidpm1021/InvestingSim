// Inline-SVG NGPF full-color illustrations.
// These are PLACEHOLDERS that approximate the Figma /UI-LIbrary/Full-Color-Page-Icons.
// In production, swap the body of each component for the exported NGPF PNG/SVG.

const Folder = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Folder">
    <path d="M14 38 L48 38 L58 50 L116 50 L116 110 L14 110 Z" fill="#1db8e8" />
    <path d="M14 38 L48 38 L58 50 L116 50 L116 56 L14 56 Z" fill="#1f3b9b" />
    <rect x="32" y="58" width="78" height="50" rx="3" fill="#fff" stroke="#0b1541" strokeWidth="2" />
    <line x1="42" y1="72" x2="100" y2="72" stroke="#c3c3c3" strokeWidth="3" />
    <line x1="42" y1="84" x2="100" y2="84" stroke="#c3c3c3" strokeWidth="3" />
    <line x1="42" y1="96" x2="90" y2="96" stroke="#c3c3c3" strokeWidth="3" />
  </svg>
);

const Clipboard = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Clipboard">
    <rect x="38" y="14" width="50" height="14" rx="3" fill="#1db8e8" />
    <rect x="22" y="22" width="86" height="94" rx="6" fill="#e7ebee" stroke="#0b1541" strokeWidth="2" />
    <g stroke="#1f3b9b" strokeWidth="3" fill="none">
      <path d="M34 46 l6 6 l10 -12" />
      <path d="M34 66 l6 6 l10 -12" />
      <path d="M34 86 l6 6 l10 -12" />
    </g>
    <line x1="58" y1="50" x2="96" y2="50" stroke="#858585" strokeWidth="3" />
    <line x1="58" y1="70" x2="96" y2="70" stroke="#858585" strokeWidth="3" />
    <line x1="58" y1="90" x2="90" y2="90" stroke="#858585" strokeWidth="3" />
  </svg>
);

const Strategy = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Strategy">
    <rect x="38" y="14" width="50" height="14" rx="3" fill="#1db8e8" />
    <rect x="22" y="22" width="86" height="94" rx="6" fill="#e7ebee" stroke="#0b1541" strokeWidth="2" />
    <circle cx="48" cy="60" r="10" fill="none" stroke="#0b1541" strokeWidth="3" />
    <path d="M40 90 q12 -22 22 0" fill="none" stroke="#1f3b9b" strokeWidth="3" />
    <path d="M72 64 l16 16 m0 -16 l-16 16" stroke="#0b1541" strokeWidth="3" />
    <path d="M58 95 q14 -8 26 -22" fill="none" stroke="#1f3b9b" strokeWidth="3" />
    <polygon points="84,68 90,73 78,77" fill="#1f3b9b" />
  </svg>
);

const Calendar = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Calendar">
    <rect x="14" y="22" width="102" height="92" rx="3" fill="#fff" stroke="#0b1541" strokeWidth="2" />
    <rect x="14" y="22" width="102" height="22" fill="#275ce4" />
    <rect x="28" y="12" width="6" height="20" rx="2" fill="#0b1541" />
    <rect x="96" y="12" width="6" height="20" rx="2" fill="#0b1541" />
    {[0,1,2,3].map((row) =>
      [0,1,2,3].map((col) => (
        <text key={row+"-"+col}
          x={28 + col * 22}
          y={64 + row * 14}
          fontFamily="Montserrat, sans-serif"
          fontWeight="700"
          fontSize="11"
          fill="#0b1541">?</text>
      ))
    )}
  </svg>
);

const GraduationStar = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Graduation">
    <polygon points="65,12 78,46 114,46 84,68 96,104 65,82 34,104 46,68 16,46 52,46" fill="#1f3b9b" />
    <path d="M44 60 l21 -7 l21 7 v6 l-21 -5 l-21 5z" fill="#fff" />
    <rect x="63" y="60" width="4" height="12" fill="#f4ad00" />
    <circle cx="65" cy="74" r="2.5" fill="#f4ad00" />
  </svg>
);

const PlayFilm = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Documentary">
    <rect x="18" y="34" width="94" height="62" rx="4" fill="#a8b6e5" stroke="#0b1541" strokeWidth="2" />
    <rect x="18" y="38" width="94" height="6" fill="#0b1541" />
    <rect x="18" y="86" width="94" height="6" fill="#0b1541" />
    {[0,1,2,3,4,5,6].map(i => (
      <rect key={i} x={24 + i*12} y={40} width="6" height="2" fill="#fff" />
    ))}
    {[0,1,2,3,4,5,6].map(i => (
      <rect key={i} x={24 + i*12} y={88} width="6" height="2" fill="#fff" />
    ))}
    <polygon points="58,54 78,65 58,76" fill="#275ce4" />
  </svg>
);

const Bingo = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 130 130" aria-label="Bingo">
    <rect x="14" y="34" width="84" height="76" rx="3" fill="#2ec5b8" />
    <rect x="24" y="22" width="84" height="76" rx="3" fill="#43d9cc" stroke="#0b1541" strokeWidth="2" />
    <text x="38" y="40" fontFamily="Montserrat" fontWeight="800" fontSize="11" fill="#fff">BINGO</text>
    {[0,1,2,3].map(r =>
      [0,1,2,3].map(c => (
        <rect key={r+"-"+c} x={30 + c*16} y={46 + r*12} width="14" height="10" fill="#fff" stroke="#0b1541" strokeWidth="0.6" />
      ))
    )}
    <circle cx="44" cy="56" r="3" fill="#f78219" />
    <circle cx="76" cy="68" r="3" fill="#f78219" />
    <circle cx="60" cy="92" r="3" fill="#f78219" />
  </svg>
);

Object.assign(window, { Folder, Clipboard, Strategy, Calendar, GraduationStar, PlayFilm, Bingo });

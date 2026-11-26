export function LandscapeIllustration() {
  return (
    <svg
      viewBox="0 0 640 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      {/* Sky — warm pale ivory */}
      <rect width="640" height="480" fill="#F0EDE4" />

      {/* Distant hills — muted sage */}
      <ellipse cx="160" cy="340" rx="260" ry="130" fill="#C5D4B8" />
      <ellipse cx="500" cy="360" rx="220" ry="110" fill="#BAC9AA" />

      {/* Mid hills — olive */}
      <ellipse cx="80"  cy="420" rx="200" ry="100" fill="#8FA87A" />
      <ellipse cx="380" cy="430" rx="300" ry="120" fill="#7A9B6E" />
      <ellipse cx="600" cy="440" rx="180" ry="100" fill="#6B8C5F" />

      {/* Foreground ridge — forest */}
      <ellipse cx="320" cy="490" rx="400" ry="130" fill="#4E6B44" />

      {/* Lone tree — right */}
      <line x1="520" y1="390" x2="520" y2="310" stroke="#2E4028" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="520" cy="295" rx="22" ry="28" fill="#3D5435" />
      <ellipse cx="508" cy="305" rx="14" ry="18" fill="#4E6B44" />
      <ellipse cx="533" cy="308" rx="12" ry="16" fill="#4E6B44" />

      {/* Small tree cluster — left */}
      <line x1="130" y1="400" x2="130" y2="348" stroke="#2E4028" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="130" cy="338" rx="16" ry="20" fill="#3D5435" />
      <line x1="118" y1="400" x2="118" y2="362" stroke="#2E4028" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="118" cy="354" rx="12" ry="15" fill="#4E6B44" />

      {/* Floating product panel — left center */}
      <g transform="translate(60, 120)">
        <rect width="230" height="150" rx="10" fill="white" style={{ filter: 'drop-shadow(0 8px 24px rgba(26,25,22,0.10))' }} />
        {/* Panel header */}
        <rect width="230" height="38" rx="10" fill="#F7F5F0" />
        <rect width="230" height="10" y="28" fill="#F7F5F0" />
        <circle cx="20" cy="19" r="6" fill="#A8C49A" />
        <rect x="34" y="14" width="80" height="10" rx="3" fill="#D4D0C8" />
        {/* Diff rows */}
        <rect x="12" y="50" width="206" height="22" rx="4" fill="#EDF3EA" />
        <circle cx="22" cy="61" r="4" fill="#5B8A4A" />
        <rect x="32" y="56" width="90" height="10" rx="3" fill="#C2D9BC" />
        <rect x="150" y="56" width="55" height="10" rx="3" fill="#A8C49A" />
        <rect x="12" y="80" width="206" height="22" rx="4" fill="#F5EDD8" />
        <circle cx="22" cy="91" r="4" fill="#A07C2E" />
        <rect x="32" y="86" width="70" height="10" rx="3" fill="#D9C88C" />
        <rect x="130" y="86" width="75" height="10" rx="3" fill="#C8B87A" />
        <rect x="12" y="110" width="206" height="22" rx="4" fill="#F5E8E8" />
        <circle cx="22" cy="121" r="4" fill="#8A3A3A" />
        <rect x="32" y="116" width="80" height="10" rx="3" fill="#D9BCBC" />
        <rect x="140" y="116" width="65" height="10" rx="3" fill="#C8ACAC" />
      </g>

      {/* Floating product panel — right */}
      <g transform="translate(360, 80)">
        <rect width="200" height="130" rx="10" fill="white" style={{ filter: 'drop-shadow(0 8px 24px rgba(26,25,22,0.10))' }} />
        <rect width="200" height="36" rx="10" fill="#F7F5F0" />
        <rect width="200" height="10" y="26" fill="#F7F5F0" />
        <rect x="12" y="12" width="60" height="12" rx="3" fill="#D4D0C8" />
        <rect x="150" y="10" width="38" height="16" rx="8" fill="var(--ink-900)" />
        <rect x="155" y="14" width="28" height="8" rx="4" fill="#A8C49A" />
        {/* Policy rows */}
        <rect x="12" y="48" width="176" height="14" rx="3" fill="#EDF3EA" />
        <rect x="12" y="68" width="176" height="14" rx="3" fill="#EDF3EA" />
        <rect x="12" y="88" width="176" height="14" rx="3" fill="#F5EDD8" />
        <rect x="12" y="108" width="140" height="14" rx="3" fill="#F5E8E8" />
      </g>

      {/* Sun / moon disk — upper right */}
      <circle cx="560" cy="80" r="38" fill="#E8E0CC" opacity="0.6" />
      <circle cx="560" cy="80" r="28" fill="#DDD5BC" opacity="0.5" />

      {/* Thin horizon line */}
      <line x1="0" y1="380" x2="640" y2="370" stroke="#9AB08A" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

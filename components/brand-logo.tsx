type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${compact ? "is-compact" : ""}`}>
      <svg className="brand-logo-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="brand-shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d7268" />
            <stop offset="100%" stopColor="#0e5c51" />
          </linearGradient>
        </defs>
        <path
          d="M32 4c8.4 5 17 8.6 25.8 10.8v18.4c0 14.9-9.2 22.9-25.8 30.8C15.4 56.1 6.2 48.1 6.2 33.2V14.8C15 12.6 23.6 9 32 4Z"
          fill="url(#brand-shield-gradient)"
        />
        <path
          d="M32 12.8c5.8 3.1 11.8 5.4 17.9 6.9v13.1c0 10.5-6.3 16.3-17.9 21.9C20.4 49.1 14.1 43.3 14.1 32.8V19.7c6.1-1.5 12.1-3.8 17.9-6.9Z"
          fill="none"
          stroke="#dff4ef"
          strokeWidth="2.6"
        />
        <path
          d="M32 24.5a5.5 5.5 0 0 1 5.5 5.5c0 2.1-1.2 3.9-2.8 4.9l1.1 8.5a2.6 2.6 0 0 1-2.6 3h-2.4a2.6 2.6 0 0 1-2.6-3l1.1-8.5a5.5 5.5 0 0 1-2.8-4.9 5.5 5.5 0 0 1 5.5-5.5Z"
          fill="#0d1818"
        />
      </svg>
      <span className="brand-logo-wordmark">
        <span className="brand-logo-word brand-logo-word-primary">Entry</span>
        <span className="brand-logo-word brand-logo-word-accent">Guard</span>
      </span>
    </span>
  );
}

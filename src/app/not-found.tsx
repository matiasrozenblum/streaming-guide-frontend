import Link from 'next/link';

// Server component on purpose: `/_not-found` is prerendered at build time, and
// keeping it free of client components keeps that prerender independent of the
// rest of the app's client graph. Styles are inline for the same reason.
export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
                color: '#f1f5f9',
                textAlign: 'center',
                gap: '1.5rem',
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/img/text-white.png"
                alt="La Guía del Streaming"
                style={{ height: 36, width: 'auto' }}
            />

            <div
                style={{
                    width: 80,
                    height: 80,
                    background: 'rgba(59,130,246,0.15)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <svg
                    width="40"
                    height="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                </svg>
            </div>

            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Página no encontrada
                </h1>
                <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                    La página que buscás no existe o cambió de dirección.
                </p>
            </div>

            <Link
                href="/"
                style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    textDecoration: 'none',
                }}
            >
                Volver al inicio
            </Link>
        </div>
    );
}

'use client';

// global-error.tsx renders when the root layout itself fails.
// It must provide its own <html> and <body> since the normal layout is bypassed.
// Fonts and styles are embedded directly — do not rely on globals.css being loaded.

export default function GlobalError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es" style={{ colorScheme: 'dark' }}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Problemas técnicos – La Guía del Streaming</title>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Inter', system-ui, sans-serif;
                        background: #0f172a;
                        color: #f1f5f9;
                        min-height: 100dvh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 1.5rem;
                    }
                    .wrap {
                        max-width: 360px;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 1.5rem;
                        text-align: center;
                    }
                    .logo { height: 32px; width: auto; }
                    .icon-ring {
                        width: 80px;
                        height: 80px;
                        background: rgba(217,119,6,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.4rem; }
                    .sub {
                        color: #94a3b8;
                        font-size: 0.95rem;
                        line-height: 1.65;
                    }
                    .actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
                    .btn {
                        width: 100%;
                        padding: 0.75rem 1rem;
                        border-radius: 0.75rem;
                        font-family: inherit;
                        font-size: 0.925rem;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background 0.15s;
                    }
                    .btn-primary {
                        background: #3b82f6;
                        color: #fff;
                        border: none;
                    }
                    .btn-primary:hover { background: #2563eb; }
                    .btn-secondary {
                        background: transparent;
                        color: #cbd5e1;
                        border: 1px solid #334155;
                    }
                    .btn-secondary:hover { background: #1e293b; }
                `}</style>
            </head>
            <body>
                <div className="wrap">
                    <img
                        src="/img/text-white.png"
                        alt="La Guía del Streaming"
                        className="logo"
                    />

                    <div className="icon-ring">
                        <svg
                            width="40"
                            height="40"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                    </div>

                    <div>
                        <h1>Problemas técnicos</h1>
                        <p className="sub">
                            Estamos teniendo inconvenientes técnicos.
                            <br />
                            El sitio estará disponible nuevamente en breve.
                        </p>
                    </div>

                    <div className="actions">
                        <button className="btn btn-primary" onClick={() => reset()}>
                            Intentar de nuevo
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => window.location.reload()}
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}

'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled app error:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-sm w-full flex flex-col items-center gap-6">
                {/* Logo – theme-aware */}
                <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/img/text.png"
                        alt="La Guía del Streaming"
                        className="h-8 w-auto dark:hidden"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/img/text-white.png"
                        alt="La Guía del Streaming"
                        className="h-8 w-auto hidden dark:block"
                    />
                </div>

                {/* Icon */}
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-amber-500 dark:text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                        />
                    </svg>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Problemas técnicos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
                        Estamos teniendo inconvenientes técnicos.
                        <br />
                        El sitio estará disponible nuevamente en breve.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => reset()}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        Intentar de nuevo
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-4 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                        Recargar página
                    </button>
                </div>
            </div>
        </div>
    );
}

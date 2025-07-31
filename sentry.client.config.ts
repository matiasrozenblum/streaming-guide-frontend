import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Error Monitoring
  beforeSend(event) {
    // Filter out common errors that aren't actionable
    if (event.exception) {
      const exception = event.exception.values?.[0];
      if (exception?.value?.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
    }
    return event;
  },
}); 
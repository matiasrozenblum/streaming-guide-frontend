import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Error Monitoring
  beforeSend(event) {
    // Filter out health check and common errors
    if (event.request?.url?.includes('/health')) {
      return null;
    }
    return event;
  },
}); 
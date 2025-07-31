# Monitoring & Alerting Setup Guide

## Overview
This guide helps you set up comprehensive monitoring and alerting for your streaming guide application using Sentry, with integrations for Opsgenie and other alerting systems.

## 1. Sentry Setup

### Backend (Railway)
1. **Create Sentry Project**: Go to [sentry.io](https://sentry.io) and create a new project for your backend
2. **Get DSN**: Copy the DSN from your Sentry project settings
3. **Set Environment Variable**:
   ```bash
   # In Railway dashboard or .env file
   SENTRY_DSN=your-sentry-dsn-here
   ```

### Frontend (Vercel)
1. **Create Sentry Project**: Create a separate project for your frontend
2. **Get DSN**: Copy the DSN from your Sentry project settings
3. **Set Environment Variable**:
   ```bash
   # In Vercel dashboard or .env.local file
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
   ```

## 2. Alert Rules Configuration

### Critical Alerts (Immediate Response)
- **YouTube API 403 Errors**: Alert immediately when 403 errors occur
- **High Error Rate**: Alert when error rate > 5% for 5 minutes
- **Service Down**: Alert when service is unreachable

### Warning Alerts (Monitor)
- **YouTube API Quota**: Alert when quota usage > 80%
- **Performance Degradation**: Alert when response time > 2s
- **Memory Usage**: Alert when memory usage > 80%

## 3. Opsgenie Integration

### Setup Opsgenie Integration
1. **Create Opsgenie Account**: Sign up at [opsgenie.com](https://opsgenie.com)
2. **Create Team**: Set up your on-call team
3. **Configure Escalation**: Set up escalation policies

### Sentry → Opsgenie Integration
1. **In Sentry**: Go to Settings → Integrations → Opsgenie
2. **Configure**: Add your Opsgenie API key
3. **Set Up Rules**:
   - **Critical**: YouTube API 403 errors → P1 incident
   - **High**: High error rate → P2 incident
   - **Medium**: Performance issues → P3 incident

## 4. Environment Variables

### Backend (.env)
```bash
# Sentry
SENTRY_DSN=your-backend-sentry-dsn

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key

# Database
DATABASE_URL=your-database-url

# Redis
REDIS_URL=your-redis-url
```

### Frontend (.env.local)
```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=your-frontend-sentry-dsn

# API
NEXT_PUBLIC_API_URL=your-api-url
```

## 5. Alert Rules Examples

### Sentry Alert Rules

#### YouTube API 403 Errors
```javascript
// Rule: YouTube API 403 Forbidden
{
  "conditions": [
    {
      "id": "sentry.rules.conditions.first_seen_event.FirstSeenEventCondition",
      "value": 1
    },
    {
      "id": "sentry.rules.filters.event_attribute.EventAttributeFilter",
      "attribute": "message",
      "match": "contains",
      "value": "YouTube API 403 Forbidden"
    }
  ],
  "actions": [
    {
      "id": "sentry.integrations.opsgenie.notify_action.OpsgenieNotifyAction",
      "priority": "P1",
      "tags": ["youtube-api", "403-error"]
    }
  ]
}
```

#### High Error Rate
```javascript
// Rule: High Error Rate
{
  "conditions": [
    {
      "id": "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
      "value": 10,
      "comparisonType": "count",
      "interval": "5m"
    }
  ],
  "actions": [
    {
      "id": "sentry.integrations.opsgenie.notify_action.OpsgenieNotifyAction",
      "priority": "P2",
      "tags": ["high-error-rate"]
    }
  ]
}
```

## 6. Monitoring Dashboard

### Key Metrics to Monitor
1. **Error Rate**: Percentage of failed requests
2. **Response Time**: API response times
3. **YouTube API Quota**: Remaining quota
4. **Memory Usage**: Server memory consumption
5. **Database Connections**: Active DB connections

### Dashboard Setup
1. **Sentry Performance**: Monitor transaction times
2. **Error Trends**: Track error patterns over time
3. **User Impact**: Monitor user-facing errors
4. **Infrastructure**: Server health metrics

## 7. Incident Response

### P1 (Critical) - Immediate Response
- **YouTube API 403**: Check API key, quota, permissions
- **Service Down**: Check Railway/Vercel status, restart if needed
- **Database Issues**: Check connection, restart if needed

### P2 (High) - Response within 30 minutes
- **High Error Rate**: Investigate recent deployments, check logs
- **Performance Issues**: Check resource usage, optimize queries

### P3 (Medium) - Response within 2 hours
- **Quota Warnings**: Monitor usage, consider upgrading
- **Memory Issues**: Optimize code, increase resources

## 8. Testing Your Setup

### Test Error Reporting
```bash
# Backend test
curl -X POST http://localhost:3000/api/test-error

# Frontend test
# Add this to any component temporarily
throw new Error('Test error for Sentry');
```

### Test Alerting
1. **Trigger Test Alert**: Create a test incident in Sentry
2. **Verify Opsgenie**: Check if alert appears in Opsgenie
3. **Test Escalation**: Verify escalation policies work

## 9. Maintenance

### Regular Tasks
- **Weekly**: Review error trends and performance
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize alert rules

### Monitoring Health Checks
- **Daily**: Check Sentry is receiving events
- **Weekly**: Verify Opsgenie integration is working
- **Monthly**: Review and update alert thresholds

## 10. Cost Optimization

### Sentry Free Tier Limits
- **Errors**: 5,000/month
- **Performance**: 100 transactions/minute
- **Replays**: 100 sessions/month

### Optimization Tips
- **Filter Noise**: Exclude health checks and common errors
- **Sample Rates**: Adjust based on traffic volume
- **Clean Up**: Remove old projects and unused integrations

## Support

For issues with:
- **Sentry**: Check [Sentry Documentation](https://docs.sentry.io/)
- **Opsgenie**: Check [Opsgenie Documentation](https://docs.opsgenie.com/)
- **Railway**: Check [Railway Documentation](https://docs.railway.app/)
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs) 
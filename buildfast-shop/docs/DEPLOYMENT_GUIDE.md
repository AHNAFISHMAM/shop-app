# Deployment Guide

## Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository connected
- Environment variables configured

### Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_LOOPS_API_KEY=your-loops-key (optional)
VITE_LOOPS_TRANSACTIONAL_EMAIL_ID=your-email-id (optional)
```

### Deployment Configuration

The `vercel.json` file is configured for:
- Build command: `cd buildfast-shop && npm install && npm run build`
- Output directory: `buildfast-shop/dist`
- SPA routing: All routes redirect to `index.html` (via rewrites)
- Security headers: XSS, clickjacking, MIME sniffing protection
- Caching: 1-year cache for static assets with immutable flag

See [Deployment Improvements](./DEPLOYMENT_IMPROVEMENTS.md) for details.

### Post-Deployment Checklist

- [ ] Verify environment variables are set in Vercel dashboard
- [ ] Test SPA routing (direct URL access to `/menu`, `/checkout`, etc.)
- [ ] Verify realtime connections work (test cart updates, order status)
- [ ] Check Web Vitals in production (browser DevTools → Lighthouse)
- [ ] Monitor error logs for first 24 hours
- [ ] Verify automatic reconnection after 2+ hours (leave app open, check console)

## Production Monitoring

### Realtime Connection Health
- Channels automatically reconnect on timeout
- Health checks run every 30 minutes
- Monitor console logs for reconnection attempts (development mode)
- Production errors logged via error handler

### Performance Metrics
- Web Vitals tracked automatically (LCP, INP, CLS, TTFB)
- Bundle size monitored in CI/CD
- Error tracking via logger utility
- Ready for analytics integration (Google Analytics, Vercel Analytics)

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/frontend-ci.yml`) runs:
- Lint & Type Check on every push/PR
- Tests on Ubuntu and Windows
- Build & Bundle Analysis
- Security Audit

## Troubleshooting

### App Breaks After Few Hours
✅ **Fixed**: Automatic reconnection implemented in `useRealtimeChannel`
- Channels now reconnect automatically with exponential backoff
- Health checks prevent timeouts
- See [Realtime Reconnection Fix](./REALTIME_RECONNECTION_FIX.md)

### SPA Routing Issues
- Verify `vercel.json` has rewrites configured:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- Check that all routes serve `index.html`
- Test direct URL access (e.g., `/menu`, `/checkout`)

### Environment Variables Not Working
- Verify variables are set in Vercel dashboard (not just `.env` file)
- Check variable names start with `VITE_` prefix
- Rebuild after adding new variables
- Check build logs for variable access errors

### Realtime Not Working
- Verify Supabase Realtime is enabled on tables:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  ALTER TABLE public.orders REPLICA IDENTITY FULL;
  ```
- Check browser console for connection errors
- Verify RLS policies allow realtime subscriptions
- Check Supabase dashboard → Realtime logs

### Bundle Size Warnings
- Run `npm run build:analyze` to visualize bundle
- Check for large dependencies
- Consider code splitting for large pages
- Review manual chunks in `vite.config.ts`

## Deployment Best Practices

1. **Always test locally first:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Check bundle size:**
   ```bash
   npm run build:analyze
   ```

3. **Verify environment variables:**
   - All required vars set in Vercel
   - No hardcoded secrets in code
   - `.env.example` documents all variables

4. **Monitor after deployment:**
   - Check Vercel logs for errors
   - Test critical user flows
   - Monitor Web Vitals
   - Verify realtime connections

5. **Use preview deployments:**
   - Vercel creates preview URLs for PRs
   - Test preview before merging
   - Verify environment variables in preview

## Related Documentation

- [Deployment Improvements](./DEPLOYMENT_IMPROVEMENTS.md) - Security headers, caching, SPA routing
- [Frontend Health Improvements](./FRONTEND_HEALTH_IMPROVEMENTS.md)
- [Realtime Reconnection Fix](./REALTIME_RECONNECTION_FIX.md)
- [Vite Configuration](./vite-lazy-import-analysis.md)
- [Testing Infrastructure](./PHASE13_TESTING_INFRASTRUCTURE.md)


# Implementation Plan - Fix Vercel Deployment Warnings

Address the two Vercel warnings encountered during deployment by updating `vercel.json` and `package.json` to modern, explicit configuration standards.

## Cause Analysis

1. **`builds` Configuration Warning**:
   - **Message**: `WARNING! Due to builds existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply.`
   - **Reason**: The `builds` field in `vercel.json` is legacy syntax. Modern Vercel deployments automatically detect serverless functions and static routes using top-level `rewrites` instead of the legacy `builds` builder array.

2. **Node.js Engine Version Warning**:
   - **Message**: `Warning: Detected "engines": { "node": ">=18" } in your package.json that will automatically upgrade when a new major Node.js Version is released.`
   - **Reason**: An unpinned, open-ended version specifier (`>=18`) flags an auto-upgrade warning in Vercel's build pipeline.

---

## Planned Changes

### 1. Update `vercel.json`
Replace legacy `builds` array with modern `rewrites` routing:
```json
{
  "rewrites": [
    { "source": "/api/farm-assistant", "destination": "/server.js" },
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
```

### 2. Update `package.json`
Pin Node.js engine version explicitly:
```json
"engines": {
  "node": "20.x"
}
```

### 3. Update `README.md`
Sync Node.js prerequisites documentation to reflect Node.js `20.x` engine targeting.

---

## Verification Plan

1. Run syntax check on `server.js` (`node -c server.js`).
2. Run `compile_applet` and `lint_applet` to confirm zero build errors.
3. Verify local dev server status via `curl http://localhost:3000/`.

// Vercel serverless entry — wraps the Express app from /backend so the same
// codebase serves API routes in production without a separate Node host.
//
// The Express app is constructed lazily on first invocation. Firebase Admin
// is initialized via `FIREBASE_SERVICE_ACCOUNT` (stringified JSON) so the
// service-account file does not need to be checked into git.

const path = require('path');

// Resolve backend modules relative to repo root regardless of CWD.
const backendRoot = path.join(__dirname, '..', 'backend');

// Reuse the same Express app the local dev server uses.
const appPromise = (async () => {
  const expressAppPath = path.join(backendRoot, 'src', 'app.js');
  let mod;
  try {
    mod = require(expressAppPath);
  } catch (err) {
    // Fallback: legacy layout where index.js calls listen() — re-export `app`.
    mod = require(path.join(backendRoot, 'src', 'index.js'));
  }
  return mod.app || mod.default || mod;
})();

module.exports = async (req, res) => {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/index] handler error:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};

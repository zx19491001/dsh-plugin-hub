/**
 * Host half of the Plugin Hub bundle.
 *
 * The panel installs bundles through two same-origin routes on this Host
 * process, because the browser cannot reach the profile's package manager on
 * its own:
 *
 *   POST /plugin-hub/install  { spec, requestId } -> { ok: true, result }
 *   POST /plugin-hub/cancel   { requestId }       -> { ok: true, outcome }
 *
 * `spec` is restricted to a `github:owner/repo` address, and the routes call
 * `pluginManager.installBundle` / `cancelInstall` — the same operations the
 * Plugins page and the `plugin_manager` tool use, so the package lands in the
 * profile beside every other bundle.
 *
 * Requests must be same-origin: a loopback Host header, the exact server
 * Origin when one is attached, and the custom `x-plugin-hub` header (which a
 * cross-site form cannot send without a CORS preflight this route never
 * grants).
 */

const INSTALL_PATH = '/plugin-hub/install';
const CANCEL_PATH = '/plugin-hub/cancel';
const MAX_BODY_BYTES = 4096;
const SPEC_PATTERN = /^github:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

function readService(ctx, name) {
  try {
    if (!ctx || typeof ctx.get !== 'function') return undefined;
    const value = ctx.get(name);
    return value === null ? undefined : value;
  } catch (error) {
    console.error('[plugin-hub]', name, error);
    return undefined;
  }
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body-too-large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', function () {
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(new Error('invalid-json'));
      }
    });
    req.on('error', reject);
  });
}

function isLoopbackHost(host) {
  const text = String(host || '').trim();
  if (!text) return false;
  const name = text.replace(/:\d+$/, '');
  return name === '127.0.0.1' || name === 'localhost' || name === '[::1]' || name === '::1';
}

function isTrusted(req, origin) {
  if (!isLoopbackHost(req.headers.host)) return false;
  const source = req.headers.origin;
  if (source && origin && source !== origin) return false;
  if (String(req.headers['sec-fetch-site'] || '') === 'cross-site') return false;
  if (req.headers['x-plugin-hub'] !== '1') return false;
  return true;
}

export function apply(ctx) {
  const webServer = readService(ctx, 'webServer');
  if (!webServer || typeof webServer.register !== 'function') {
    console.error('[plugin-hub] webServer service unavailable; install routes are disabled');
    return;
  }

  let origin = '';
  try {
    origin = typeof webServer.getOrigin === 'function' ? String(webServer.getOrigin()) : '';
  } catch (error) {
    console.error('[plugin-hub] getOrigin failed', error);
  }

  function manager() {
    return readService(ctx, 'pluginManager');
  }

  async function handleInstall(req, res) {
    if (req.method !== 'POST') {
      send(res, 405, { ok: false, error: 'method-not-allowed' });
      return;
    }
    if (!isTrusted(req, origin)) {
      send(res, 403, { ok: false, error: 'untrusted-request' });
      return;
    }
    const pluginManager = manager();
    if (!pluginManager || typeof pluginManager.installBundle !== 'function') {
      send(res, 503, { ok: false, error: 'plugin-manager-unavailable' });
      return;
    }
    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      send(res, 400, { ok: false, error: String(error && error.message ? error.message : error) });
      return;
    }
    const spec = typeof body.spec === 'string' ? body.spec.trim() : '';
    if (!SPEC_PATTERN.test(spec)) {
      send(res, 400, { ok: false, error: 'invalid-spec' });
      return;
    }
    const requestId =
      typeof body.requestId === 'string' && REQUEST_ID_PATTERN.test(body.requestId)
        ? body.requestId
        : 'ph-' + Date.now().toString(36);
    try {
      const result = await pluginManager.installBundle(spec, { requestId: requestId });
      send(res, 200, { ok: true, result: result });
    } catch (error) {
      send(res, 500, { ok: false, error: String(error && error.message ? error.message : error) });
    }
  }

  async function handleCancel(req, res) {
    if (req.method !== 'POST') {
      send(res, 405, { ok: false, error: 'method-not-allowed' });
      return;
    }
    if (!isTrusted(req, origin)) {
      send(res, 403, { ok: false, error: 'untrusted-request' });
      return;
    }
    const pluginManager = manager();
    if (!pluginManager || typeof pluginManager.cancelInstall !== 'function') {
      send(res, 503, { ok: false, error: 'plugin-manager-unavailable' });
      return;
    }
    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      send(res, 400, { ok: false, error: String(error && error.message ? error.message : error) });
      return;
    }
    const requestId = typeof body.requestId === 'string' ? body.requestId : '';
    if (!REQUEST_ID_PATTERN.test(requestId)) {
      send(res, 400, { ok: false, error: 'invalid-request-id' });
      return;
    }
    try {
      const outcome = await pluginManager.cancelInstall(requestId);
      send(res, 200, { ok: true, outcome: outcome });
    } catch (error) {
      send(res, 500, { ok: false, error: String(error && error.message ? error.message : error) });
    }
  }

  ctx.effect(function () {
    const disposers = [
      webServer.register({ kind: 'exact', path: INSTALL_PATH, handler: handleInstall }),
      webServer.register({ kind: 'exact', path: CANCEL_PATH, handler: handleCancel }),
    ];
    return function () {
      disposers.forEach(function (dispose) {
        try {
          dispose();
        } catch (error) {
          console.error('[plugin-hub] route dispose failed', error);
        }
      });
    };
  });
}

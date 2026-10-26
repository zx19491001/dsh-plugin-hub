import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hostPath = path.join(root, 'index.js');

const loaded = import(pathToFileURL(hostPath).href);

async function bootstrap(options = {}) {
  const mod = await loaded;
  const routes = [];
  const calls = { installed: [], cancelled: [] };
  const webServer = {
    getOrigin: () => 'http://127.0.0.1:8151',
    register(route) {
      routes.push(route);
      return () => {};
    },
  };
  const pluginManager =
    options.pluginManager === null
      ? undefined
      : options.pluginManager || {
          async installBundle(spec, opts) {
            calls.installed.push({ spec, opts });
            return { application: 'applied', stage: 'enable', version: '1.0.0' };
          },
          async cancelInstall(id) {
            calls.cancelled.push(id);
            return { status: 'cancelled' };
          },
        };
  const services = { webServer, pluginManager };
  const ctx = {
    get(name) {
      return services[name];
    },
    effect(callback) {
      return callback();
    },
  };
  mod.apply(ctx);
  const route = (routePath) => routes.find((item) => item.path === routePath);
  return { routes, route, calls };
}

function invoke(route, options = {}) {
  const req = new PassThrough();
  req.method = options.method || 'POST';
  req.headers = Object.assign(
    {
      host: '127.0.0.1:8151',
      origin: 'http://127.0.0.1:8151',
      'x-plugin-hub': '1',
      'content-type': 'application/json',
    },
    options.headers || {},
  );
  const res = {
    statusCode: 0,
    headers: {},
    body: '',
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers;
    },
    end(text) {
      this.body = text;
    },
  };
  const settled = route.handler(req, res);
  req.end(options.body === undefined ? '' : options.body);
  return Promise.resolve(settled).then(() => res);
}

test('registers the install and cancel routes', async () => {
  const { routes } = await bootstrap();
  const paths = routes.map((item) => item.path).sort();
  assert.deepEqual(paths, ['/plugin-hub/cancel', '/plugin-hub/install']);
  for (const route of routes) assert.equal(route.kind, 'exact');
});

test('installs a github spec through the plugin manager', async () => {
  const { route, calls } = await bootstrap();
  const res = await invoke(route('/plugin-hub/install'), {
    body: JSON.stringify({ spec: 'github:zx19491001/dsh-game-studio', requestId: 'ph-abc123' }),
  });
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.ok, true);
  assert.equal(payload.result.application, 'applied');
  assert.equal(calls.installed.length, 1);
  assert.equal(calls.installed[0].spec, 'github:zx19491001/dsh-game-studio');
  assert.equal(calls.installed[0].opts.requestId, 'ph-abc123');
});

test('rejects specs that are not github:owner/repo', async () => {
  const { route, calls } = await bootstrap();
  for (const spec of ['npm:lodash', 'https://example.com/x', 'github:../../etc', 'github:a/b/c', '']) {
    const res = await invoke(route('/plugin-hub/install'), { body: JSON.stringify({ spec }) });
    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.body).error, 'invalid-spec');
  }
  assert.equal(calls.installed.length, 0);
});

test('refuses requests without the plugin hub header', async () => {
  const { route, calls } = await bootstrap();
  const res = await invoke(route('/plugin-hub/install'), {
    headers: { 'x-plugin-hub': '' },
    body: JSON.stringify({ spec: 'github:a/b' }),
  });
  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'untrusted-request');
  assert.equal(calls.installed.length, 0);
});

test('refuses cross-origin and non-loopback requests', async () => {
  const { route } = await bootstrap();
  const crossOrigin = await invoke(route('/plugin-hub/install'), {
    headers: { origin: 'https://evil.example' },
    body: JSON.stringify({ spec: 'github:a/b' }),
  });
  assert.equal(crossOrigin.statusCode, 403);
  const remoteHost = await invoke(route('/plugin-hub/install'), {
    headers: { host: 'example.com:8151' },
    body: JSON.stringify({ spec: 'github:a/b' }),
  });
  assert.equal(remoteHost.statusCode, 403);
});

test('rejects other methods and reports a missing plugin manager', async () => {
  const { route } = await bootstrap();
  const wrongMethod = await invoke(route('/plugin-hub/install'), { method: 'GET' });
  assert.equal(wrongMethod.statusCode, 405);

  const bare = await bootstrap({ pluginManager: null });
  const unavailable = await invoke(bare.route('/plugin-hub/install'), {
    body: JSON.stringify({ spec: 'github:a/b' }),
  });
  assert.equal(unavailable.statusCode, 503);
  assert.equal(JSON.parse(unavailable.body).error, 'plugin-manager-unavailable');
});

test('surfaces an install failure as 500 with the reason', async () => {
  const { route } = await bootstrap({
    pluginManager: {
      async installBundle() {
        throw new Error('boom');
      },
      async cancelInstall() {
        return { status: 'not-running' };
      },
    },
  });
  const res = await invoke(route('/plugin-hub/install'), { body: JSON.stringify({ spec: 'github:a/b' }) });
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.parse(res.body).ok, false);
  assert.equal(JSON.parse(res.body).error, 'boom');
});

test('cancels by request id', async () => {
  const { route, calls } = await bootstrap();
  const res = await invoke(route('/plugin-hub/cancel'), { body: JSON.stringify({ requestId: 'ph-xyz' }) });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body).outcome, { status: 'cancelled' });
  assert.deepEqual(calls.cancelled, ['ph-xyz']);

  const invalid = await invoke(route('/plugin-hub/cancel'), { body: JSON.stringify({ requestId: '' }) });
  assert.equal(invalid.statusCode, 400);
});

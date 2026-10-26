import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = path.join(root, 'client.js');

function fakeReact() {
  return {
    createElement: () => null,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    useMemo: (compute) => compute(),
    useRef: (value) => ({ current: value }),
  };
}

/** The bundle registers itself on import, so load it once and reuse the spec. */
const loaded = (async () => {
  const captured = { spec: null };
  globalThis.window = {
    __ModuleLoader__: {
      load(spec) {
        captured.spec = spec;
      },
    },
  };
  await import(pathToFileURL(clientPath).href);
  delete globalThis.window;
  return captured.spec;
})();

function instantiate(spec) {
  return spec.factory((name) => {
    if (name === 'react') return fakeReact();
    throw new Error('unexpected require: ' + name);
  });
}

function bootstrap(mod, locale) {
  const registrations = [];
  const ctx = {
    get(name) {
      if (name !== 'locale') return undefined;
      return { getLocale: () => ({ active: locale }), subscribe: () => () => {} };
    },
    slots: {
      inject(key, callback) {
        registrations.push({ key, value: callback() });
        return () => {};
      },
      register(slotSpec, component) {
        return { spec: slotSpec, component };
      },
    },
  };
  mod.apply(ctx);
  return registrations;
}

test('client bundle loads through the module loader and registers both slot halves', async () => {
  const spec = await loaded;
  assert.ok(spec, 'the bundle must call window.__ModuleLoader__.load');
  assert.equal(spec.id, '@local/dsh-plugin-hub');
  assert.equal(typeof spec.factory, 'function');

  const mod = instantiate(spec);
  assert.deepEqual(mod.inject, ['slots']);
  assert.equal(typeof mod.apply, 'function');

  const registrations = bootstrap(mod, 'zh');
  assert.equal(registrations.length, 2);
  const sidebar = registrations.find((item) => item.key === 'sidebar.panellist');
  const main = registrations.find((item) => item.key === 'main');
  assert.ok(sidebar, 'sidebar.panellist must be injected');
  assert.ok(main, 'main must be injected');
  assert.equal(sidebar.value.spec.name, 'sidebar.panellist');
  assert.equal(sidebar.value.spec.id, 'plugin-hub');
  assert.equal(sidebar.value.spec.order, 30);
  assert.equal(typeof sidebar.value.component, 'function');
  assert.equal(main.value.spec.name, 'main');
  assert.equal(main.value.spec.key, 'plugin-hub');
  assert.equal(typeof main.value.component, 'function');
  assert.equal(sidebar.value.spec.label(), '插件下载中心');
});

test('sidebar label follows the active locale', async () => {
  const mod = instantiate(await loaded);
  const registrations = bootstrap(mod, 'en');
  const sidebar = registrations.find((item) => item.key === 'sidebar.panellist');
  assert.equal(sidebar.value.spec.label(), 'Plugin Hub');
});

test('a throwing remote entry never stops slot registration', async () => {
  const mod = instantiate(await loaded);
  const registrations = [];
  mod.apply({
    get(name) {
      if (name !== 'locale') return undefined;
      return { getLocale: () => ({ active: 'zh' }), subscribe: () => () => {} };
    },
    get remote() {
      throw new Error('remote unavailable');
    },
    slots: {
      inject(key, callback) {
        registrations.push({ key, value: callback() });
        return () => {};
      },
      register(slotSpec, component) {
        return { spec: slotSpec, component };
      },
    },
  });
  assert.equal(registrations.length, 2);
  assert.equal(registrations[0].value.spec.id, 'plugin-hub');
  assert.equal(registrations[1].value.spec.key, 'plugin-hub');
});

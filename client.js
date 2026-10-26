/**
 * Plugin Hub — a GitHub download centre contributed to the Harness Web UI.
 *
 * The sidebar entry is a `sidebar.panellist` cell whose id addresses the
 * matching `main` panel key, so clicking the entry opens this page.
 *
 * The page lists installable DSH plugins hosted on GitHub with repo links,
 * ZIP downloads and copyable clone / install commands. Live star counts and
 * update times come from the public GitHub API and degrade quietly when the
 * network or a content-security policy denies the request.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-plugin-hub',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    const PANEL_ID = 'plugin-hub';
    const OWNER = 'zx19491001';
    const SELF_REPO = 'dsh-plugin-hub';
    const SELF_URL = 'https://github.com/zx19491001/dsh-plugin-hub';
    const SELF_CLONE = 'git clone https://github.com/zx19491001/dsh-plugin-hub.git';
    const STORAGE_KEY = 'dsh.plugin-hub.sources.v1';
    const API_BASE = 'https://api.github.com/repos/';
    const MAX_CUSTOM = 30;
    const ACCENTS = ['#4f83cc', '#3f9d8a', '#b4703f', '#8a6fc4', '#c05a6a', '#5f8f3f'];

    const SEEDS = [
      {
        builtin: true,
        owner: OWNER,
        repo: SELF_REPO,
        title: { zh: '插件下载中心', en: 'Plugin Hub' },
        desc: {
          zh: '从 GitHub 浏览并安装 DSH 左侧栏插件：仓库直链、ZIP 下载、克隆与安装命令。',
          en: 'Browse and install DSH sidebar plugins from GitHub: repo links, ZIP downloads, clone and install commands.',
        },
      },
      {
        builtin: true,
        owner: OWNER,
        repo: 'dsh-game-studio',
        title: { zh: '游戏工坊', en: 'Game Studio' },
        desc: {
          zh: '游戏制作工作台：项目定位、阶段清单、工具链、美术设定，以及本地 GLB/glTF 预算检查。',
          en: 'Game production workspace: positioning, stage checklists, toolchain, art direction, and a local GLB/glTF budget inspector.',
        },
      },
    ];

    const TEXT = {
      zh: {
        'panel.label': '插件下载中心',
        'panel.title': '插件下载中心',
        'panel.subtitle': '从 GitHub 下载 DSH 插件或任意仓库：粘贴地址即可选版本下载 ZIP，也能直接复制安装说明符。',
        'panel.repo': '本插件的 GitHub 仓库',
        'quick.title': '快速下载',
        'quick.placeholder': '粘贴 GitHub 链接或 owner/repo，例如 zx19491001/dsh-game-studio',
        'quick.resolve': '解析',
        'quick.resolving': '正在读取仓库…',
        'quick.invalid': '地址无效：请填 owner/repo 或 GitHub 链接',
        'quick.missing': '仓库不存在，或不是公开仓库',
        'quick.version': '版本',
        'quick.download': '下载 ZIP',
        'quick.spec': '复制安装说明符',
        'quick.add': '加入列表',
        'quick.isPlugin': 'DSH 插件',
        'quick.notPlugin': '普通仓库',
        'refs.default': '默认分支 · {name}',
        'refs.branch': '分支 · {name}',
        'refs.tag': '标签 · {name}',
        'refs.loading': '读取分支…',
        'refs.empty': '这个仓库没有其它分支或标签',
        'card.version': '选版本',
        'card.spec': '安装说明符',
        'card.install': '安装到 DSH',
        'install.confirm': '确认安装？',
        'install.running': '安装中 {s}s',
        'install.cancel': '取消',
        'install.retry': '重试',
        'install.done': '已安装',
        'install.restart': '已安装，重启后生效',
        'install.overridden': '已安装，被覆盖',
        'install.cancelled': '已取消',
        'install.failed': '安装失败',
        'install.self': '当前在运行',
        'install.tooLate': '安装已进入应用阶段，无法取消',
        'install.unavailable': '当前客户端没有提供远程安装入口，请用「安装说明符」或下载 ZIP。',
        'install.hint': '安装会直接从 GitHub 拉取并在本机启用；首次约 1–2 分钟，过程中可取消。',
        'notice.spec': '已复制安装说明符 github:{repo}，可粘到插件管理的安装框，或交给 Agent 安装',
        'notice.added': '已加入列表 {repo}',
        'toolbar.search': '搜索插件、仓库或描述…',
        'toolbar.add': '添加仓库',
        'toolbar.refresh': '刷新',
        'toolbar.count': '共 {n} 个插件',
        'toolbar.filtered': '筛出 {n} / {total} 个',
        'card.download': '下载 ZIP',
        'card.clone': '复制克隆命令',
        'card.open': '打开仓库',
        'card.remove': '从列表移除',
        'card.noDesc': '暂无描述',
        'card.updated': '更新于 {when}',
        'card.stars': '{n} 星',
        'tag.builtin': '内置',
        'tag.private': '私有',
        'tag.missing': '私有或不存在',
        'tag.archived': '已归档',
        'add.title': '仓库地址',
        'add.nameLabel': '显示名称',
        'add.hint': '支持 owner/repo、GitHub 网页链接，或 git@github.com:owner/repo.git 形式的 SSH 地址',
        'add.placeholder': 'owner/repo',
        'add.namePlaceholder': '留空则用仓库名',
        'add.confirm': '添加',
        'add.cancel': '取消',
        'add.dup': '这个仓库已经在列表里了',
        'add.invalid': '看不懂这个地址：请填 owner/repo 或 GitHub 链接',
        'add.done': '已添加 {repo}',
        'add.full': '自定义仓库最多 30 个，先移除几个再添加',
        'steps.title': '安装步骤',
        'steps.one': '在上面粘地址或选卡片，选好分支/标签后点「下载 ZIP」，文件进入浏览器的下载目录。',
        'steps.two': '解压后，把目录的绝对路径交给 plugin_manager 的 install_bundle。',
        'steps.three': '也可以复制安装说明符 github:owner/repo，直接粘到插件管理的安装框里。',
        'steps.copy': '复制命令',
        'steps.timeout': '安装说明符若提示 github.com 超时，调大插件管理器配置的 githubConnectionTimeoutMs（本 profile 已设为 20000，安装说明符可直装）。',
        'notice.copied': '已复制克隆命令',
        'notice.copyFailed': '复制失败：请手动选中命令复制',
        'notice.removed': '已从列表移除 {repo}',
        'note.storage': '自定义仓库保存在本机浏览器的 localStorage（dsh.plugin-hub.sources.v1），不会上传。',
        'empty.title': '没有匹配的插件',
        'empty.hint': '换个关键词，或添加一个 GitHub 仓库。',
      },
      en: {
        'panel.label': 'Plugin Hub',
        'panel.title': 'Plugin Hub',
        'panel.subtitle': 'Download DSH plugins or any GitHub repository: paste a link, pick a version, grab the ZIP, or copy the install spec.',
        'panel.repo': 'This plugin on GitHub',
        'quick.title': 'Quick download',
        'quick.placeholder': 'Paste a GitHub link or owner/repo, e.g. zx19491001/dsh-game-studio',
        'quick.resolve': 'Read',
        'quick.resolving': 'Reading repository…',
        'quick.invalid': 'Cannot read that address: use owner/repo or a GitHub URL',
        'quick.missing': 'Repository missing or not public',
        'quick.version': 'Version',
        'quick.download': 'Download ZIP',
        'quick.spec': 'Copy install spec',
        'quick.add': 'Add to list',
        'quick.isPlugin': 'DSH plugin',
        'quick.notPlugin': 'Plain repo',
        'refs.default': 'Default branch · {name}',
        'refs.branch': 'Branch · {name}',
        'refs.tag': 'Tag · {name}',
        'refs.loading': 'Reading branches…',
        'refs.empty': 'This repository has no other branches or tags',
        'card.version': 'Version',
        'card.spec': 'Install spec',
        'card.install': 'Install',
        'install.confirm': 'Confirm install?',
        'install.running': 'Installing {s}s',
        'install.cancel': 'Cancel',
        'install.retry': 'Retry',
        'install.done': 'Installed',
        'install.restart': 'Installed — restart to apply',
        'install.overridden': 'Installed, overridden',
        'install.cancelled': 'Cancelled',
        'install.failed': 'Install failed',
        'install.self': 'Running now',
        'install.tooLate': 'The install already reached the apply phase',
        'install.unavailable': 'This client exposes no remote install entry; use the install spec or the ZIP download.',
        'install.hint': 'Install pulls from GitHub and enables the plugin on this machine; the first run takes 1–2 minutes and can be cancelled.',
        'notice.spec': 'Copied install spec github:{repo}; paste it into the plugin manager install box, or hand it to the Agent',
        'notice.added': 'Added {repo} to the list',
        'toolbar.search': 'Search plugins, repos or descriptions…',
        'toolbar.add': 'Add repo',
        'toolbar.refresh': 'Refresh',
        'toolbar.count': '{n} plugins',
        'toolbar.filtered': '{n} of {total} shown',
        'card.download': 'Download ZIP',
        'card.clone': 'Copy clone command',
        'card.open': 'Open repo',
        'card.remove': 'Remove from list',
        'card.noDesc': 'No description yet',
        'card.updated': 'Updated {when}',
        'card.stars': '{n} stars',
        'tag.builtin': 'Built in',
        'tag.private': 'Private',
        'tag.missing': 'Private or missing',
        'tag.archived': 'Archived',
        'add.title': 'Repository',
        'add.nameLabel': 'Display name',
        'add.hint': 'Accepts owner/repo, a GitHub web URL, or an SSH address such as git@github.com:owner/repo.git',
        'add.placeholder': 'owner/repo',
        'add.namePlaceholder': 'Defaults to the repo name',
        'add.confirm': 'Add',
        'add.cancel': 'Cancel',
        'add.dup': 'That repository is already in the list',
        'add.invalid': 'Cannot read that address: use owner/repo or a GitHub URL',
        'add.done': 'Added {repo}',
        'add.full': 'Up to 30 custom repos; remove a few first',
        'steps.title': 'Install steps',
        'steps.one': 'Paste a link above or pick a card, choose a branch or tag, then hit Download ZIP; the file lands in your browser downloads folder.',
        'steps.two': 'Unpack it and hand the absolute directory path to plugin_manager install_bundle.',
        'steps.three': 'Or copy the install spec github:owner/repo and paste it into the plugin manager install box.',
        'steps.copy': 'Copy',
        'steps.timeout': 'If an install spec reports a github.com timeout, raise githubConnectionTimeoutMs in the plugin manager config (this profile uses 20000, so install specs work directly).',
        'notice.copied': 'Clone command copied',
        'notice.copyFailed': 'Copy failed: select the command and copy it manually',
        'notice.removed': 'Removed {repo}',
        'note.storage': 'Custom repositories live in this browser’s localStorage (dsh.plugin-hub.sources.v1) and are never uploaded.',
        'empty.title': 'No matching plugin',
        'empty.hint': 'Try another keyword, or add a GitHub repository.',
      },
    };

    const CSS = `
.ph-root {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.55;
}
.ph-inner {
  max-width: 1040px;
  margin: 0 auto;
  padding: 26px 30px 64px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ph-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.ph-head-text { min-width: 0; }
.ph-head-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.ph-title { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.ph-subtitle { margin: 6px 0 0; font-size: 12.5px; color: var(--dsw-alias-label-secondary); max-width: 62ch; }
.ph-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ph-search {
  flex: 1 1 280px;
  min-width: 180px;
  box-sizing: border-box;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  padding: 7px 10px;
  font: inherit;
  font-size: 12.5px;
  outline: none;
}
.ph-search::placeholder { color: var(--dsw-alias-label-secondary); }
.ph-search:focus { border-color: var(--dsw-alias-brand-primary); }
.ph-count { margin-left: auto; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ph-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}
.ph-btn:hover { border-color: var(--dsw-alias-border-l2); }
.ph-btn-primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
.ph-btn-primary:hover { filter: brightness(1.06); }
.ph-btn-ghost { background: transparent; }
.ph-btn-small { padding: 3px 8px; font-size: 11.5px; margin-left: auto; }
.ph-btn-quiet { margin-left: auto; width: 26px; justify-content: center; padding: 5px 0; color: var(--dsw-alias-label-secondary); }
.ph-btn-quiet:hover { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); }
.ph-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; align-items: start; }
.ph-card {
  display: flex;
  flex-direction: column;
  gap: 11px;
  min-width: 0;
  padding: 16px;
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
}
.ph-card-top { display: flex; align-items: flex-start; gap: 10px; }
.ph-avatar {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid;
  background: var(--dsw-alias-bg-layer-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
}
.ph-card-id { flex: 1 1 auto; min-width: 0; }
.ph-name { margin: 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.ph-repo { display: inline-flex; align-items: center; gap: 3px; margin-top: 2px; font-size: 12px; color: var(--dsw-alias-label-secondary); text-decoration: none; overflow-wrap: anywhere; }
.ph-repo:hover { color: var(--dsw-alias-brand-primary); text-decoration: underline; }
.ph-ext { font-size: 11px; opacity: 0.7; }
.ph-stars { flex: none; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ph-desc { margin: 0; font-size: 12.5px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.ph-card-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.ph-tag { border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; padding: 0 7px; font-size: 11px; line-height: 18px; white-space: nowrap; }
.ph-tag-warn { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.ph-updated { margin-left: auto; white-space: nowrap; }
.ph-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
.ph-add {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.ph-add-fields { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 10px; }
.ph-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.ph-label { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.ph-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  padding: 7px 10px;
  font: inherit;
  font-size: 12.5px;
  outline: none;
}
.ph-input::placeholder { color: var(--dsw-alias-label-secondary); }
.ph-input:focus { border-color: var(--dsw-alias-brand-primary); }
.ph-hint { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.ph-error { margin: 0; font-size: 12px; color: var(--dsw-alias-state-error-primary); }
.ph-add-actions { display: flex; gap: 8px; }
.ph-notice {
  align-self: flex-start;
  padding: 5px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  font-size: 12px;
  color: var(--dsw-alias-state-success-primary);
}
.ph-steps {
  margin-top: 6px;
  padding: 16px 18px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ph-steps-title { margin: 0; font-size: 13px; font-weight: 600; }
.ph-steps-list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.ph-steps-list li { overflow-wrap: anywhere; }
.ph-code {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
}
.ph-code code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; overflow-wrap: anywhere; }
.ph-empty {
  padding: 30px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 12px;
  color: var(--dsw-alias-label-secondary);
}
.ph-empty p { margin: 0; }
.ph-empty-hint { font-size: 12px; }
.ph-note { margin: 4px 0 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.ph-quick {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.ph-quick-title { margin: 0; font-size: 13px; font-weight: 600; }
.ph-quick-row { display: flex; gap: 8px; flex-wrap: wrap; }
.ph-quick-input { flex: 1 1 320px; min-width: 200px; }
.ph-quick-result { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; border-top: 1px dashed var(--dsw-alias-border-l1); }
.ph-quick-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ph-quick-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; }
.ph-quick-size { font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.ph-quick-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ph-select { width: auto; min-width: 160px; max-width: 100%; }
.ph-tag-ok { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
.ph-btn:disabled { opacity: 0.6; cursor: default; }
.ph-install-group { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ph-install-result { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.ph-install-result[data-tone="warn"] { color: var(--dsw-alias-state-warn-primary); }
.ph-install-result[data-tone="error"] { color: var(--dsw-alias-state-error-primary); }
.ph-refs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 2px 0 2px 44px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.ph-search:focus-visible, .ph-input:focus-visible, .ph-btn:focus-visible,
.ph-repo:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
@media (max-width: 760px) {
  .ph-inner { padding: 20px 16px 48px; }
  .ph-add-fields { grid-template-columns: minmax(0, 1fr); }
  .ph-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .ph-btn { transition: none; }
}
`;

    function isChinese(lang) {
      return String(lang || '').toLowerCase().indexOf('zh') === 0;
    }

    function translate(lang, key, vars) {
      const dict = isChinese(lang) ? TEXT.zh : TEXT.en;
      const fallback = TEXT.en;
      let text = typeof dict[key] === 'string' ? dict[key] : fallback[key];
      if (typeof text !== 'string') text = key;
      if (vars) {
        Object.keys(vars).forEach(function (name) {
          text = text.split('{' + name + '}').join(String(vars[name]));
        });
      }
      return text;
    }

    function detectLanguage(locale) {
      if (locale && typeof locale.getLocale === 'function') {
        try {
          const snapshot = locale.getLocale();
          const active = snapshot && snapshot.active ? String(snapshot.active) : '';
          if (active) return active;
        } catch (error) {
          console.error(error);
        }
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.language) return String(navigator.language);
      } catch (error) {
        console.error(error);
      }
      return 'en';
    }

    function readService(ctx, name) {
      try {
        if (!ctx || typeof ctx.get !== 'function') return undefined;
        const value = ctx.get(name);
        return value === null ? undefined : value;
      } catch (error) {
        console.error(error);
        return undefined;
      }
    }

    function useLocaleRefresh(locale) {
      const setVersion = useState(0)[1];
      useEffect(
        function () {
          if (!locale || typeof locale.subscribe !== 'function') return undefined;
          return locale.subscribe(function () {
            setVersion(function (value) {
              return value + 1;
            });
          });
        },
        [locale],
      );
    }

    function keyOf(entry) {
      return entry.owner + '/' + entry.repo;
    }

    function displayName(entry, lang) {
      if (entry.title && typeof entry.title === 'object') {
        return (isChinese(lang) ? entry.title.zh : entry.title.en) || entry.repo;
      }
      if (typeof entry.title === 'string' && entry.title.trim()) return entry.title.trim();
      return entry.repo;
    }

    function displayDesc(entry, lang) {
      if (entry.desc && typeof entry.desc === 'object') {
        return (isChinese(lang) ? entry.desc.zh : entry.desc.en) || '';
      }
      if (typeof entry.desc === 'string') return entry.desc.trim();
      return '';
    }

    function accentOf(key) {
      let hash = 0;
      const text = String(key);
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) % 100000;
      }
      return ACCENTS[hash % ACCENTS.length];
    }

    function initialOf(name) {
      const text = String(name || '').trim();
      if (!text) return '?';
      return text.charAt(0).toUpperCase();
    }

    function formatStars(value) {
      const count = Number(value) || 0;
      if (count < 1000) return String(count);
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }

    function timeAgo(iso, lang) {
      const then = Date.parse(String(iso || ''));
      if (!isFinite(then)) return '';
      const chinese = isChinese(lang);
      const diff = Math.max(0, Date.now() - then);
      const minute = 60000;
      const hour = 3600000;
      const day = 86400000;
      if (diff < hour) {
        const minutes = Math.max(1, Math.round(diff / minute));
        return chinese ? minutes + ' 分钟前' : minutes + 'm ago';
      }
      if (diff < day) {
        const hours = Math.round(diff / hour);
        return chinese ? hours + ' 小时前' : hours + 'h ago';
      }
      if (diff < 30 * day) {
        const days = Math.round(diff / day);
        return chinese ? days + ' 天前' : days + 'd ago';
      }
      try {
        return new Date(then).toLocaleDateString(chinese ? 'zh-CN' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch (error) {
        return new Date(then).toISOString().slice(0, 10);
      }
    }

    function parseRepo(input) {
      let text = String(input || '').trim();
      if (!text) return null;
      text = text.replace(/^git\+/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
      const ssh = text.match(/^git@github\.com:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/i);
      if (ssh) return { owner: ssh[1], repo: ssh[2] };
      const url = text.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/i);
      if (url) return { owner: url[1], repo: url[2] };
      const bare = text.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/);
      if (bare) return { owner: bare[1], repo: bare[2] };
      return null;
    }

    function loadSources() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter(function (item) {
            return item && typeof item.owner === 'string' && typeof item.repo === 'string';
          })
          .map(function (item) {
            return {
              owner: item.owner,
              repo: item.repo,
              title: typeof item.title === 'string' ? item.title : '',
              addedAt: Number(item.addedAt) || 0,
            };
          })
          .slice(0, MAX_CUSTOM);
      } catch (error) {
        console.error(error);
        return [];
      }
    }

    function saveSources(list) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            list.map(function (item) {
              return {
                owner: item.owner,
                repo: item.repo,
                title: item.title || '',
                addedAt: item.addedAt || 0,
              };
            }),
          ),
        );
      } catch (error) {
        console.error(error);
      }
    }

    function copyText(text) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).then(
          function () {
            return true;
          },
          function (error) {
            console.error(error);
            return false;
          },
        );
      }
      return Promise.resolve(false);
    }

    function readMeta(owner, repo, signal) {
      const url = API_BASE + encodeURIComponent(owner) + '/' + encodeURIComponent(repo);
      return fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: signal })
        .then(function (response) {
          if (response.status === 404) return { status: 'missing' };
          if (!response.ok) return { status: 'error', code: response.status };
          return response.json().then(function (json) {
            return {
              status: 'ok',
              stars: typeof json.stargazers_count === 'number' ? json.stargazers_count : 0,
              pushedAt: typeof json.pushed_at === 'string' ? json.pushed_at : '',
              isPrivate: Boolean(json.private),
              archived: Boolean(json.archived),
              description: typeof json.description === 'string' ? json.description : '',
              url: typeof json.html_url === 'string' ? json.html_url : '',
              size: typeof json.size === 'number' ? json.size : 0,
              branch: typeof json.default_branch === 'string' && json.default_branch ? json.default_branch : 'main',
            };
          });
        })
        .catch(function () {
          return { status: 'error' };
        });
    }

    function readRefs(owner, repo, signal) {
      const base = API_BASE + encodeURIComponent(owner) + '/' + encodeURIComponent(repo);
      const headers = { Accept: 'application/vnd.github+json' };
      function names(path, key) {
        return fetch(base + path, { headers: headers, signal: signal })
          .then(function (response) {
            return response.ok ? response.json() : [];
          })
          .then(function (list) {
            if (!Array.isArray(list)) return [];
            return list
              .map(function (item) {
                return item && typeof item[key] === 'string' ? item[key] : '';
              })
              .filter(Boolean)
              .slice(0, 60);
          })
          .catch(function () {
            return [];
          });
      }
      return Promise.all([names('/branches?per_page=100', 'name'), names('/tags?per_page=100', 'name')]).then(function (lists) {
        return { branches: lists[0], tags: lists[1] };
      });
    }

    function readManifest(owner, repo, branch, signal) {
      const url =
        'https://raw.githubusercontent.com/' +
        encodeURIComponent(owner) +
        '/' +
        encodeURIComponent(repo) +
        '/' +
        encodeRef(branch || 'main') +
        '/package.json';
      return fetch(url, { signal: signal })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (json) {
          if (!json || typeof json !== 'object') return { status: 'no' };
          const dsh = json.dsh;
          const isPlugin = Boolean(dsh && dsh.bundle && dsh.bundle.patch);
          return { status: isPlugin ? 'yes' : 'no', name: typeof json.name === 'string' ? json.name : '' };
        })
        .catch(function () {
          return { status: 'unknown' };
        });
    }

    function encodeRef(name) {
      return String(name || '')
        .split('/')
        .map(function (segment) {
          return encodeURIComponent(segment);
        })
        .join('/');
    }

    function archiveUrl(key, ref) {
      if (!ref) return 'https://github.com/' + key + '/archive/refs/heads/main.zip';
      const at = ref.indexOf(':');
      const kind = ref.slice(0, at);
      const name = ref.slice(at + 1);
      const section = kind === 'tag' ? 'tags' : 'heads';
      return 'https://github.com/' + key + '/archive/refs/' + section + '/' + encodeRef(name) + '.zip';
    }

    function formatSize(kilobytes) {
      const value = Number(kilobytes) || 0;
      if (!value) return '';
      if (value < 1024) return value + ' KB';
      return (value / 1024).toFixed(1).replace(/\.0$/, '') + ' MB';
    }

    function readRemote(ctx) {
      const viaService = readService(ctx, 'remote');
      if (viaService) return viaService;
      try {
        return ctx && ctx.remote ? ctx.remote : undefined;
      } catch (error) {
        console.error(error);
        return undefined;
      }
    }

    function entriesInstalling(states) {
      return Object.keys(states || {}).some(function (key) {
        const state = states[key];
        return Boolean(state && state.phase === 'running');
      });
    }

    function truncate(text, max) {
      const value = String(text || '');
      if (!value) return '';
      if (value.length <= max) return value;
      return value.slice(0, max - 1) + '…';
    }

    function DownloadGlyph() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('path', { d: 'M12 4v10' }),
        h('path', { d: 'm7.5 10.5 4.5 4.5 4.5-4.5' }),
        h('path', { d: 'M4.5 17v.5a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5V17' }),
      );
    }

    function CopyGlyph() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('rect', { x: 9, y: 9, width: 11, height: 11, rx: 2.5 }),
        h('path', { d: 'M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15' }),
      );
    }

    function BranchGlyph() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('circle', { cx: 6.5, cy: 5.5, r: 2.5 }),
        h('circle', { cx: 6.5, cy: 18.5, r: 2.5 }),
        h('circle', { cx: 17.5, cy: 8.5, r: 2.5 }),
        h('path', { d: 'M6.5 8v8' }),
        h('path', { d: 'M17.5 11a5 5 0 0 1-5 5h-2.5' }),
      );
    }

    function RefreshGlyph() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('path', { d: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3' }),
        h('path', { d: 'M19.5 4.5V9H15' }),
      );
    }

    function PlusGlyph() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('path', { d: 'M12 5v14' }),
        h('path', { d: 'M5 12h14' }),
      );
    }

    function SearchGlyph() {
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('circle', { cx: 10.5, cy: 10.5, r: 6.5 }),
        h('path', { d: 'm15.5 15.5 4.5 4.5' }),
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const locale = readService(ctx, 'locale');
        const remote = readRemote(ctx);
        const manager = remote && remote.pluginManager;
        const canInstall = Boolean(manager && typeof manager.installBundle === 'function');

        function PanelIcon(props) {
          const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 22;
          const active = Boolean(props && props.active);
          return h(
            'svg',
            {
              width: size,
              height: size,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.7,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': true,
              focusable: false,
              style: { color: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)' },
            },
            h('path', { d: 'M12 3.5v11' }),
            h('path', { d: 'm7.6 10.1 4.4 4.4 4.4-4.4' }),
            h('path', { d: 'M4.6 16.4v.6a3 3 0 0 0 3 3h8.8a3 3 0 0 0 3-3v-.6' }),
          );
        }

        function Panel() {
          useLocaleRefresh(locale);
          const lang = detectLanguage(locale);
          const t = function (key, vars) {
            return translate(lang, key, vars);
          };

          const [custom, setCustom] = useState(loadSources);
          const [query, setQuery] = useState('');
          const [adding, setAdding] = useState(false);
          const [draftRepo, setDraftRepo] = useState('');
          const [draftName, setDraftName] = useState('');
          const [draftError, setDraftError] = useState('');
          const [notice, setNotice] = useState('');
          const [live, setLive] = useState({});
          const [tick, setTick] = useState(0);
          const [quickText, setQuickText] = useState('');
          const [quickStatus, setQuickStatus] = useState('idle');
          const [quickError, setQuickError] = useState('');
          const [quickRepo, setQuickRepo] = useState('');
          const [quickMeta, setQuickMeta] = useState(null);
          const [quickRefs, setQuickRefs] = useState(null);
          const [quickRef, setQuickRef] = useState('');
          const [quickPlugin, setQuickPlugin] = useState('');
          const [refChoice, setRefChoice] = useState({});
          const [refsByRepo, setRefsByRepo] = useState({});
          const [openRefs, setOpenRefs] = useState('');
          const [install, setInstall] = useState({});
          const [clock, setClock] = useState(0);
          const noticeTimer = useRef(0);
          const confirmTimer = useRef(0);

          useEffect(
            function () {
              saveSources(custom);
            },
            [custom],
          );

          useEffect(function () {
            return function () {
              if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
              if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
            };
          }, []);

          const installingAny = entriesInstalling(install);

          useEffect(
            function () {
              if (!installingAny) return undefined;
              const handle = window.setInterval(function () {
                setClock(Date.now());
              }, 1000);
              return function () {
                window.clearInterval(handle);
              };
            },
            [installingAny],
          );

          const entries = useMemo(
            function () {
              const ordered = custom.slice().sort(function (left, right) {
                return (right.addedAt || 0) - (left.addedAt || 0);
              });
              return SEEDS.concat(ordered);
            },
            [custom],
          );

          const keys = entries.map(keyOf).join('|');

          useEffect(
            function () {
              let cancelled = false;
              const controller = typeof AbortController === 'function' ? new AbortController() : null;
              const signal = controller ? controller.signal : undefined;
              keys.split('|').forEach(function (key) {
                const parts = key.split('/');
                readMeta(parts[0], parts[1], signal).then(function (result) {
                  if (cancelled) return;
                  setLive(function (current) {
                    const next = Object.assign({}, current);
                    next[key] = result;
                    return next;
                  });
                });
              });
              return function () {
                cancelled = true;
                if (controller) controller.abort();
              };
            },
            [keys, tick],
          );

          function flash(message) {
            setNotice(message);
            if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
            noticeTimer.current = window.setTimeout(function () {
              setNotice('');
            }, 2600);
          }

          function copy(text, okKey) {
            copyText(text).then(function (ok) {
              flash(t(ok ? okKey : 'notice.copyFailed'));
            });
          }

          function addSource() {
            const parsed = parseRepo(draftRepo);
            if (!parsed) {
              setDraftError(t('add.invalid'));
              return;
            }
            const key = parsed.owner + '/' + parsed.repo;
            const duplicate = entries.some(function (entry) {
              return keyOf(entry).toLowerCase() === key.toLowerCase();
            });
            if (duplicate) {
              setDraftError(t('add.dup'));
              return;
            }
            if (custom.length >= MAX_CUSTOM) {
              setDraftError(t('add.full'));
              return;
            }
            const title = draftName.trim().slice(0, 60);
            setCustom(function (current) {
              return current.concat([{ owner: parsed.owner, repo: parsed.repo, title: title, addedAt: Date.now() }]);
            });
            setDraftRepo('');
            setDraftName('');
            setDraftError('');
            setAdding(false);
            flash(t('add.done', { repo: key }));
          }

          function removeSource(key) {
            setCustom(function (current) {
              return current.filter(function (item) {
                return keyOf(item) !== key;
              });
            });
            flash(t('notice.removed', { repo: key }));
          }

          function resolveQuick() {
            const parsed = parseRepo(quickText);
            if (!parsed) {
              setQuickStatus('error');
              setQuickError(t('quick.invalid'));
              return;
            }
            const key = parsed.owner + '/' + parsed.repo;
            setQuickStatus('loading');
            setQuickError('');
            setQuickRepo(key);
            setQuickMeta(null);
            setQuickRefs(null);
            setQuickPlugin('');
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const signal = controller ? controller.signal : undefined;
            Promise.all([readMeta(parsed.owner, parsed.repo, signal), readRefs(parsed.owner, parsed.repo, signal)]).then(
              function (results) {
                const meta = results[0];
                if (!meta || meta.status !== 'ok') {
                  setQuickStatus('error');
                  setQuickError(t('quick.missing'));
                  return;
                }
                setQuickMeta(meta);
                setQuickRefs(results[1]);
                setQuickStatus('ready');
                const branch = meta.branch || 'main';
                setQuickRef('branch:' + branch);
                readManifest(parsed.owner, parsed.repo, branch, signal).then(function (manifest) {
                  setQuickPlugin(manifest.status);
                });
              },
            );
          }

          function addQuick() {
            if (!quickRepo) return;
            const exists = entries.some(function (entry) {
              return keyOf(entry).toLowerCase() === quickRepo.toLowerCase();
            });
            if (exists) {
              flash(t('add.dup'));
              return;
            }
            if (custom.length >= MAX_CUSTOM) {
              flash(t('add.full'));
              return;
            }
            const parts = quickRepo.split('/');
            setCustom(function (current) {
              return current.concat([{ owner: parts[0], repo: parts[1], title: '', addedAt: Date.now() }]);
            });
            flash(t('notice.added', { repo: quickRepo }));
          }

          function setInstallState(key, patch) {
            setInstall(function (current) {
              const next = Object.assign({}, current);
              next[key] = Object.assign({}, current[key] || {}, patch);
              return next;
            });
          }

          function beginInstall(key) {
            if (!canInstall || !manager) return;
            const state = install[key];
            if (state && state.phase === 'running') return;
            if (!state || state.phase !== 'confirm') {
              setInstallState(key, { phase: 'confirm', message: '', requestId: '', startedAt: 0 });
              if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
              confirmTimer.current = window.setTimeout(function () {
                setInstall(function (current) {
                  const entry = current[key];
                  if (!entry || entry.phase !== 'confirm') return current;
                  const next = Object.assign({}, current);
                  next[key] = Object.assign({}, entry, { phase: 'idle' });
                  return next;
                });
              }, 5000);
              return;
            }
            if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
            const requestId = 'ph-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
            setClock(Date.now());
            setInstallState(key, { phase: 'running', message: '', requestId: requestId, startedAt: Date.now() });
            manager.installBundle('github:' + key, { requestId: requestId }).then(
              function (result) {
                const application = result && result.application ? result.application : 'failed';
                const error = result && result.error;
                const diagnostic = error ? String(error.diagnostic || error.code || '') : '';
                const phase =
                  application === 'applied'
                    ? 'done'
                    : application === 'restart-required'
                      ? 'restart'
                      : application === 'overridden'
                        ? 'overridden'
                        : application === 'cancelled'
                          ? 'cancelled'
                          : 'failed';
                setInstallState(key, { phase: phase, message: diagnostic, requestId: '' });
              },
              function (error) {
                setInstallState(key, {
                  phase: 'failed',
                  message: String((error && error.message) || error || ''),
                  requestId: '',
                });
              },
            );
          }

          function cancelInstall(key) {
            const state = install[key];
            if (!state || !state.requestId || !manager || typeof manager.cancelInstall !== 'function') return;
            manager.cancelInstall(state.requestId).then(
              function (outcome) {
                if (outcome && outcome.status === 'too-late') {
                  setInstallState(key, { phase: 'failed', message: t('install.tooLate') });
                }
              },
              function (error) {
                console.error(error);
              },
            );
          }

          function installButton(key) {
            if (!canInstall) return null;
            if (key === SELF_REPO) return h('span', { className: 'ph-tag ph-tag-ok' }, t('install.self'));
            const state = install[key] || { phase: 'idle' };
            if (state.phase === 'running') {
              const seconds = state.startedAt ? Math.max(0, Math.round((clock - state.startedAt) / 1000)) : 0;
              return h(
                'span',
                { className: 'ph-install-group' },
                h('button', { type: 'button', className: 'ph-btn ph-btn-primary', disabled: true }, t('install.running', { s: seconds })),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ph-btn',
                    onClick: function () {
                      cancelInstall(key);
                    },
                  },
                  t('install.cancel'),
                ),
              );
            }
            if (state.phase === 'confirm') {
              return h(
                'button',
                {
                  type: 'button',
                  className: 'ph-btn ph-btn-primary',
                  onClick: function () {
                    beginInstall(key);
                  },
                },
                t('install.confirm'),
              );
            }
            if (state.phase === 'done') return h('span', { className: 'ph-tag ph-tag-ok' }, t('install.done'));
            if (state.phase === 'restart') return h('span', { className: 'ph-tag' }, t('install.restart'));
            if (state.phase === 'overridden') return h('span', { className: 'ph-tag' }, t('install.overridden'));
            if (state.phase === 'cancelled') return h('span', { className: 'ph-tag' }, t('install.cancelled'));
            if (state.phase === 'failed') {
              return h(
                'span',
                { className: 'ph-install-group' },
                h('span', { className: 'ph-tag ph-tag-warn', title: state.message || '' }, t('install.failed')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ph-btn ph-btn-small',
                    onClick: function () {
                      beginInstall(key);
                    },
                  },
                  t('install.retry'),
                ),
              );
            }
            return h(
              'button',
              {
                type: 'button',
                className: 'ph-btn ph-btn-primary',
                onClick: function () {
                  beginInstall(key);
                },
              },
              t('card.install'),
            );
          }

          function installNote(key) {
            const state = install[key];
            if (!state || !state.message) return null;
            if (state.phase !== 'failed' && state.phase !== 'restart') return null;
            return h(
              'p',
              { className: 'ph-install-result', 'data-tone': state.phase === 'failed' ? 'error' : 'warn' },
              truncate(state.message, 240),
            );
          }

          function toggleRefs(key) {
            if (openRefs === key) {
              setOpenRefs('');
              return;
            }
            setOpenRefs(key);
            if (refsByRepo[key]) return;
            setRefsByRepo(function (current) {
              const next = Object.assign({}, current);
              next[key] = { status: 'loading', branches: [], tags: [] };
              return next;
            });
            const parts = key.split('/');
            readRefs(parts[0], parts[1]).then(function (refs) {
              setRefsByRepo(function (current) {
                const next = Object.assign({}, current);
                next[key] = { status: 'ready', branches: refs.branches, tags: refs.tags };
                return next;
              });
            });
          }

          function defaultRefOf(key) {
            const meta = live[key];
            const branch = meta && meta.status === 'ok' && meta.branch ? meta.branch : 'main';
            return 'branch:' + branch;
          }

          function chosenRefOf(key) {
            return refChoice[key] || defaultRefOf(key);
          }

          function refOptions(key) {
            const refs = refsByRepo[key];
            const meta = live[key];
            const def = meta && meta.status === 'ok' && meta.branch ? meta.branch : 'main';
            const options = [h('option', { key: 'default', value: 'branch:' + def }, t('refs.default', { name: def }))];
            if (refs && refs.status === 'ready') {
              (refs.branches || []).forEach(function (name) {
                if (name === def) return;
                options.push(h('option', { key: 'b:' + name, value: 'branch:' + name }, t('refs.branch', { name: name })));
              });
              (refs.tags || []).forEach(function (name) {
                options.push(h('option', { key: 't:' + name, value: 'tag:' + name }, t('refs.tag', { name: name })));
              });
            }
            return options;
          }

          const needle = query.trim().toLowerCase();
          const visible = entries.filter(function (entry) {
            if (!needle) return true;
            const meta = live[keyOf(entry)];
            const haystack = [
              keyOf(entry),
              displayName(entry, lang),
              displayDesc(entry, lang),
              meta && meta.description ? meta.description : '',
            ]
              .join(' ')
              .toLowerCase();
            return haystack.indexOf(needle) >= 0;
          });

          function renderCard(entry) {
            const key = keyOf(entry);
            const meta = live[key];
            const name = displayName(entry, lang);
            const liveDesc = meta && meta.status === 'ok' && meta.description ? meta.description : '';
            const desc = displayDesc(entry, lang) || liveDesc || t('card.noDesc');
            const repoUrl = meta && meta.status === 'ok' && meta.url ? meta.url : 'https://github.com/' + key;
            const tags = [];
            if (entry.builtin) tags.push(h('span', { key: 'builtin', className: 'ph-tag' }, t('tag.builtin')));
            if (meta && meta.status === 'missing') {
              tags.push(h('span', { key: 'missing', className: 'ph-tag ph-tag-warn' }, t('tag.missing')));
            }
            if (meta && meta.status === 'ok' && meta.isPrivate) {
              tags.push(h('span', { key: 'private', className: 'ph-tag ph-tag-warn' }, t('tag.private')));
            }
            if (meta && meta.status === 'ok' && meta.archived) {
              tags.push(h('span', { key: 'archived', className: 'ph-tag ph-tag-warn' }, t('tag.archived')));
            }
            const stars = meta && meta.status === 'ok' && typeof meta.stars === 'number' ? formatStars(meta.stars) : '';
            const updated = meta && meta.status === 'ok' && meta.pushedAt ? timeAgo(meta.pushedAt, lang) : '';
            return h(
              'article',
              { key: key, className: 'ph-card', 'aria-label': name },
              h(
                'div',
                { className: 'ph-card-top' },
                h(
                  'span',
                  {
                    className: 'ph-avatar',
                    style: { color: accentOf(key), borderColor: accentOf(key) },
                    'aria-hidden': true,
                  },
                  initialOf(name),
                ),
                h(
                  'div',
                  { className: 'ph-card-id' },
                  h('h3', { className: 'ph-name' }, name),
                  h(
                    'a',
                    { className: 'ph-repo', href: repoUrl, target: '_blank', rel: 'noreferrer noopener' },
                    key,
                    h('span', { className: 'ph-ext', 'aria-hidden': true }, '↗'),
                  ),
                ),
                stars ? h('span', { className: 'ph-stars', title: t('card.stars', { n: stars }) }, '★ ', stars) : null,
              ),
              h('p', { className: 'ph-desc' }, desc),
              tags.length || updated
                ? h(
                    'div',
                    { className: 'ph-card-meta' },
                    tags,
                    updated ? h('span', { className: 'ph-updated' }, t('card.updated', { when: updated })) : null,
                  )
                : null,
              h(
                'div',
                { className: 'ph-actions' },
                installButton(key),
                h(
                  'a',
                  {
                    className: canInstall && key !== SELF_REPO ? 'ph-btn' : 'ph-btn ph-btn-primary',
                    href: archiveUrl(key, chosenRefOf(key)),
                    target: '_blank',
                    rel: 'noreferrer noopener',
                  },
                  h(DownloadGlyph, null),
                  t('card.download'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ph-btn',
                    'aria-expanded': openRefs === key ? 'true' : 'false',
                    onClick: function () {
                      toggleRefs(key);
                    },
                  },
                  t('card.version'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ph-btn',
                    onClick: function () {
                      copy('github:' + key, 'notice.spec');
                    },
                  },
                  h(CopyGlyph, null),
                  t('card.spec'),
                ),
                h(
                  'a',
                  { className: 'ph-btn ph-btn-ghost', href: repoUrl, target: '_blank', rel: 'noreferrer noopener' },
                  t('card.open'),
                ),
                entry.builtin
                  ? null
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'ph-btn ph-btn-quiet',
                        title: t('card.remove'),
                        'aria-label': t('card.remove'),
                        onClick: function () {
                          removeSource(key);
                        },
                      },
                      '×',
                    ),
              ),
              installNote(key),
              openRefs === key
                ? h(
                    'div',
                    { className: 'ph-refs' },
                    h(
                      'select',
                      {
                        className: 'ph-input ph-select',
                        value: chosenRefOf(key),
                        'aria-label': t('card.version'),
                        onChange: function (event) {
                          const value = event.target.value;
                          setRefChoice(function (current) {
                            const next = Object.assign({}, current);
                            next[key] = value;
                            return next;
                          });
                        },
                      },
                      refOptions(key),
                    ),
                    refsByRepo[key] && refsByRepo[key].status === 'loading'
                      ? h('span', null, t('refs.loading'))
                      : refsByRepo[key] &&
                          refsByRepo[key].status === 'ready' &&
                          !(refsByRepo[key].branches.length + refsByRepo[key].tags.length)
                        ? h('span', null, t('refs.empty'))
                        : null,
                  )
                : null,
            );
          }

          return h(
            'div',
            { className: 'ph-root' },
            h('style', null, CSS),
            h(
              'div',
              { className: 'ph-inner' },
              h(
                'header',
                { className: 'ph-head' },
                h(
                  'div',
                  { className: 'ph-head-text' },
                  h('h1', { className: 'ph-title' }, t('panel.title')),
                  h('p', { className: 'ph-subtitle' }, t('panel.subtitle')),
                ),
                h(
                  'div',
                  { className: 'ph-head-actions' },
                  h(
                    'a',
                    {
                      className: 'ph-btn ph-btn-ghost',
                      href: SELF_URL,
                      target: '_blank',
                      rel: 'noreferrer noopener',
                      title: t('panel.repo'),
                    },
                    h(BranchGlyph, null),
                    'GitHub',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'ph-btn',
                      onClick: function () {
                        setTick(function (value) {
                          return value + 1;
                        });
                      },
                    },
                    h(RefreshGlyph, null),
                    t('toolbar.refresh'),
                  ),
                ),
              ),
              h(
                'section',
                { className: 'ph-quick' },
                h('h2', { className: 'ph-quick-title' }, t('quick.title')),
                h(
                  'form',
                  {
                    className: 'ph-quick-row',
                    onSubmit: function (event) {
                      event.preventDefault();
                      resolveQuick();
                    },
                  },
                  h('input', {
                    className: 'ph-input ph-quick-input',
                    value: quickText,
                    placeholder: t('quick.placeholder'),
                    'aria-label': t('quick.placeholder'),
                    onChange: function (event) {
                      setQuickText(event.target.value);
                    },
                  }),
                  h('button', { type: 'submit', className: 'ph-btn ph-btn-primary' }, h(SearchGlyph, null), t('quick.resolve')),
                ),
                quickStatus === 'loading' ? h('p', { className: 'ph-hint' }, t('quick.resolving')) : null,
                quickStatus === 'error' ? h('p', { className: 'ph-error', role: 'alert' }, quickError) : null,
                quickStatus === 'ready' && quickRepo
                  ? h(
                      'div',
                      { className: 'ph-quick-result' },
                      h(
                        'div',
                        { className: 'ph-quick-info' },
                        h(
                          'div',
                          { className: 'ph-quick-name' },
                          h('strong', null, quickRepo),
                          quickPlugin === 'yes' ? h('span', { className: 'ph-tag ph-tag-ok' }, t('quick.isPlugin')) : null,
                          quickPlugin === 'no' ? h('span', { className: 'ph-tag' }, t('quick.notPlugin')) : null,
                          quickMeta && quickMeta.size
                            ? h('span', { className: 'ph-quick-size' }, formatSize(quickMeta.size))
                            : null,
                        ),
                        quickMeta && quickMeta.description ? h('p', { className: 'ph-desc' }, quickMeta.description) : null,
                      ),
                      h(
                        'div',
                        { className: 'ph-quick-actions' },
                        installButton(quickRepo),
                        h(
                          'select',
                          {
                            className: 'ph-input ph-select',
                            value: quickRef,
                            'aria-label': t('quick.version'),
                            onChange: function (event) {
                              setQuickRef(event.target.value);
                            },
                          },
                          h(
                            'option',
                            { value: 'branch:' + (quickMeta && quickMeta.branch ? quickMeta.branch : 'main') },
                            t('refs.default', { name: quickMeta && quickMeta.branch ? quickMeta.branch : 'main' }),
                          ),
                          (quickRefs && quickRefs.branches ? quickRefs.branches : []).map(function (name) {
                            if (name === (quickMeta && quickMeta.branch ? quickMeta.branch : 'main')) return null;
                            return h('option', { key: 'b:' + name, value: 'branch:' + name }, t('refs.branch', { name: name }));
                          }),
                          (quickRefs && quickRefs.tags ? quickRefs.tags : []).map(function (name) {
                            return h('option', { key: 't:' + name, value: 'tag:' + name }, t('refs.tag', { name: name }));
                          }),
                        ),
                        h(
                          'a',
                          {
                            className: canInstall && quickRepo !== SELF_REPO ? 'ph-btn' : 'ph-btn ph-btn-primary',
                            href: archiveUrl(quickRepo, quickRef),
                            target: '_blank',
                            rel: 'noreferrer noopener',
                          },
                          h(DownloadGlyph, null),
                          t('quick.download'),
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'ph-btn',
                            onClick: function () {
                              copy('github:' + quickRepo, 'notice.spec');
                            },
                          },
                          h(CopyGlyph, null),
                          t('quick.spec'),
                        ),
                        h('button', { type: 'button', className: 'ph-btn ph-btn-ghost', onClick: addQuick }, t('quick.add')),
                      ),
                      installNote(quickRepo),
                      h('p', { className: 'ph-hint' }, canInstall ? t('install.hint') : t('install.unavailable')),
                    )
                  : null,
              ),
              h(
                'div',
                { className: 'ph-toolbar' },
                h('input', {
                  className: 'ph-search',
                  type: 'search',
                  value: query,
                  placeholder: t('toolbar.search'),
                  'aria-label': t('toolbar.search'),
                  onChange: function (event) {
                    setQuery(event.target.value);
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ph-btn',
                    'aria-expanded': adding ? 'true' : 'false',
                    onClick: function () {
                      setAdding(!adding);
                      setDraftError('');
                    },
                  },
                  h(PlusGlyph, null),
                  t('toolbar.add'),
                ),
                h(
                  'span',
                  { className: 'ph-count' },
                  needle
                    ? t('toolbar.filtered', { n: visible.length, total: entries.length })
                    : t('toolbar.count', { n: entries.length }),
                ),
              ),
              adding
                ? h(
                    'form',
                    {
                      className: 'ph-add',
                      onSubmit: function (event) {
                        event.preventDefault();
                        addSource();
                      },
                    },
                    h(
                      'div',
                      { className: 'ph-add-fields' },
                      h(
                        'label',
                        { className: 'ph-field' },
                        h('span', { className: 'ph-label' }, t('add.title')),
                        h('input', {
                          className: 'ph-input',
                          value: draftRepo,
                          placeholder: t('add.placeholder'),
                          autoFocus: true,
                          onChange: function (event) {
                            setDraftRepo(event.target.value);
                            setDraftError('');
                          },
                        }),
                      ),
                      h(
                        'label',
                        { className: 'ph-field' },
                        h('span', { className: 'ph-label' }, t('add.nameLabel')),
                        h('input', {
                          className: 'ph-input',
                          value: draftName,
                          placeholder: t('add.namePlaceholder'),
                          onChange: function (event) {
                            setDraftName(event.target.value);
                          },
                        }),
                      ),
                    ),
                    h('p', { className: 'ph-hint' }, t('add.hint')),
                    draftError ? h('p', { className: 'ph-error', role: 'alert' }, draftError) : null,
                    h(
                      'div',
                      { className: 'ph-add-actions' },
                      h('button', { type: 'submit', className: 'ph-btn ph-btn-primary' }, t('add.confirm')),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'ph-btn ph-btn-ghost',
                          onClick: function () {
                            setAdding(false);
                            setDraftError('');
                          },
                        },
                        t('add.cancel'),
                      ),
                    ),
                  )
                : null,
              notice ? h('div', { className: 'ph-notice', role: 'status', 'aria-live': 'polite' }, notice) : null,
              visible.length
                ? h('div', { className: 'ph-grid' }, visible.map(renderCard))
                : h(
                    'div',
                    { className: 'ph-empty' },
                    h('p', null, t('empty.title')),
                    h('p', { className: 'ph-empty-hint' }, t('empty.hint')),
                  ),
              h(
                'section',
                { className: 'ph-steps' },
                h('h2', { className: 'ph-steps-title' }, t('steps.title')),
                h(
                  'ol',
                  { className: 'ph-steps-list' },
                  h('li', null, t('steps.one')),
                  h('li', null, t('steps.two')),
                  h('li', null, t('steps.three')),
                ),
                h(
                  'div',
                  { className: 'ph-code' },
                  h('code', null, SELF_CLONE),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'ph-btn ph-btn-small',
                      onClick: function () {
                        copy(SELF_CLONE, 'notice.copied');
                      },
                    },
                    t('steps.copy'),
                  ),
                ),
                h('p', { className: 'ph-hint' }, t('steps.timeout')),
              ),
              h('p', { className: 'ph-note' }, t('note.storage')),
            ),
          );
        }

        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 30,
              label: function () {
                return translate(detectLanguage(locale), 'panel.label');
              },
            },
            PanelIcon,
          );
        });

        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: PANEL_ID }, Panel);
        });
      },
    };
  },
});

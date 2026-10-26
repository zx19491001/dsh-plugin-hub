# 插件下载中心 · DSH Plugin Hub

左侧栏里的 GitHub 下载器：粘一个仓库地址就能选版本、下载 ZIP；常用插件摆成卡片，随手取用。

![plugin-hub](icon.svg)

- 仓库：<https://github.com/zx19491001/dsh-plugin-hub>
- 下载：<https://github.com/zx19491001/dsh-plugin-hub/archive/refs/heads/main.zip>
- 版本发布：<https://github.com/zx19491001/dsh-plugin-hub/releases>
- 许可：MIT

## 功能

- **左侧栏入口**：和「插件」「自动化任务」同一组，点图标打开中央面板。
- **快速下载**：粘贴 `owner/repo` 或任意 GitHub 链接 → 解析仓库 → 选默认分支 / 其它分支 / 标签 → 下载 ZIP；顺手标出它是不是 DSH 插件（读仓库里的 `package.json`）。
- **插件卡片**：内置常用插件，也可自己加；每张卡片能选版本再下载、复制安装说明符、打开仓库。
- **安装说明符**：一键复制 `github:owner/repo`，粘到插件管理的安装框，或直接交给 Agent 执行 `install_bundle`。
- **搜索过滤**：按名称、仓库、描述即时筛选；自定义列表存在本机 `localStorage`（键 `dsh.plugin-hub.sources.v1`），不会上传。
- **实时信息**：星标、更新时间、默认分支、体积走 GitHub 公共 API；离线、限流或被 CSP 拦截时自动退回静态信息，下载链接照常可用。

## 安装

### 方式一：ZIP（推荐）

1. 打开 <https://github.com/zx19491001/dsh-plugin-hub> ，点 **Code → Download ZIP**。
2. 解压到任意目录。
3. 在 DSH 里用插件管理器安装这个目录：`plugin_manager` 的 `install_bundle`，`target` 填**解压目录的绝对路径**。
4. 刷新页面，左侧栏出现「插件下载中心」。

### 方式二：安装说明符

```text
github:zx19491001/dsh-plugin-hub
```

粘到插件管理的安装框，或让 Agent 执行 `install_bundle`。

> 本机 `git ls-remote github.com` 要约 6 秒，而插件管理器探测默认 5000ms 就超时。本 profile 已把 `githubConnectionTimeoutMs` 调到 `20000`（在 `cordis.patch.yml` 里覆盖 `plugin-manager` 行），实测 `github:` 说明符可以直装（约 1–2 分钟，含拉取与校验）。换一台机器还是默认 5000 时，需要做同样的覆盖。

### 方式三：本地开发

本仓库就是插件目录。改完 `client.js` 后刷新 DSH 页面即可生效——本地安装是目录链接，不需要重新打包，也不需要重启。

## 使用

- **快速下载**：顶部输入框粘地址 → 「解析」→ 选版本 → 「下载 ZIP」。文件由浏览器下载，落在系统下载目录。
- **卡片**：「下载 ZIP」按当前所选版本下载；「选版本」展开分支/标签下拉（首次展开才请求，省 API 次数）；「安装说明符」复制 `github:owner/repo`。
- **添加 / 移除**：搜索框右侧「添加仓库」接受 `owner/repo`、GitHub 网页链接、`git@github.com:owner/repo.git`；自定义卡片右上角 `×` 移除。
- **刷新**：右上角「刷新」重新拉取仓库信息。

## 结构

| 文件 | 作用 |
| --- | --- |
| `client.js` | 唯一的 Web 实现：注册 `sidebar.panellist`（id `plugin-hub`）与 `main`（key `plugin-hub`），快速下载、卡片、版本选择、搜索都在这里。 |
| `index.js` | Host 半边，不注册任何东西。 |
| `cordis.patch.yml` | 插入 `plugin-hub` 行。 |
| `locale/zh.json`、`locale/en.json` | 插件管理页显示的标题与描述。 |
| `icon.svg` | 插件图标（原创）。 |
| `test/client.test.mjs` | 结构测试：清单、补丁、注册、链接、文案、图标。 |
| `test/wiring.test.mjs` | 装载测试：用假 `__ModuleLoader__` 与假 React 跑一遍 `apply()`，确认两个槽位和侧栏文案。 |

## 测试

```bash
npm test
```

无依赖，Node 22+ 直接运行；GitHub Actions 在 push / PR 时跑同一套测试。

## 已知限制

- 下载由浏览器接管：面板负责选版本和拼地址，文件进系统下载目录，拿不到保存路径回填。
- 列表是「内置种子 + 手动添加」，不做全站插件搜索。
- GitHub 未认证 API 每小时 60 次；超限或网络不可用时，星标与更新时间不显示，其余功能不受影响。
- 私有仓库对其他人不可下载：卡片会标出「私有」或「私有或不存在」。
- 安装说明符受 Git 探测超时影响：默认 5000ms 在本机会超时，本 profile 已调到 20000。

## 许可

[MIT](LICENSE)

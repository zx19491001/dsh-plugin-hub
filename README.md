# 插件下载中心 · DSH Plugin Hub

左侧栏里的 GitHub 插件下载中心：把可安装的 DSH 插件摆在一页里，仓库直链、ZIP 下载、克隆与安装命令随手可取。

![plugin-hub](icon.svg)

- 仓库：<https://github.com/zx19491001/dsh-plugin-hub>
- 下载：<https://github.com/zx19491001/dsh-plugin-hub/archive/refs/heads/main.zip>
- 版本发布：<https://github.com/zx19491001/dsh-plugin-hub/releases>
- 许可：MIT

## 功能

- **左侧栏入口**：和「插件」「自动化任务」同一组，点图标打开中央面板。
- **插件卡片**：名称、仓库地址、描述、星标数与最近更新时间；一键下载 ZIP、复制 `git clone` 命令、打开仓库。
- **实时信息（可选）**：通过 GitHub 公共 API 读取星标、更新时间、私有/归档状态；离线、限流或被 CSP 拦截时自动退回静态信息，面板照常可用。
- **搜索过滤**：按名称、仓库、描述即时筛选。
- **添加仓库**：支持 `owner/repo`、`https://github.com/owner/repo`、`git@github.com:owner/repo.git` 三种写法；自定义列表存在本机浏览器 `localStorage`（键 `dsh.plugin-hub.sources.v1`），不会上传。
- **内置安装步骤**：三步装好一个插件，克隆命令一键复制。

## 安装

### 方式一：ZIP（推荐）

1. 打开 <https://github.com/zx19491001/dsh-plugin-hub> ，点 **Code → Download ZIP**（或直接用上面的下载直链）。
2. 解压到任意目录。
3. 在 DSH 里用插件管理器安装这个目录：`plugin_manager` 的 `install_bundle`，`target` 填**解压目录的绝对路径**。
4. 刷新页面，左侧栏出现「插件下载中心」。

### 方式二：git clone

```bash
git clone https://github.com/zx19491001/dsh-plugin-hub.git
```

克隆完成后，同样把该目录的绝对路径交给 `plugin_manager` 的 `install_bundle`。

### 方式三：本地开发

本仓库就是插件目录。改完 `client.js` 后刷新 DSH 页面即可生效——本地安装是目录链接，不需要重新打包，也不需要重启。

## 使用

- 点左侧栏的下载图标打开面板。
- 每张卡片：**下载 ZIP**、**复制克隆命令**、**打开仓库**；自己添加的仓库右上角有 `×` 可以移除。
- 右上角「刷新」重新拉取 GitHub 信息；面板顶部搜索框即时过滤。
- 「添加仓库」把任意 GitHub 上的 DSH 插件加进列表，刷新页面后仍在。

## 结构

| 文件 | 作用 |
| --- | --- |
| `client.js` | 唯一的 Web 实现：注册 `sidebar.panellist`（id `plugin-hub`）与 `main`（key `plugin-hub`），面板、卡片、搜索、添加仓库都在这里。 |
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

- 列表是「内置种子 + 手动添加」，不做全站插件搜索。
- GitHub 未认证 API 每小时 60 次；超限或网络不可用时，星标与更新时间不显示，其余功能不受影响。
- 私有仓库对其他人不可下载：卡片会标出「私有」或「私有或不存在」。

## 许可

[MIT](LICENSE)

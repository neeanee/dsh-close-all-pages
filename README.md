# dsh-close-all-pages

右侧栏「一键关闭所有页面」——DeepSeek Harness (DSH) 的插件包。

右侧面板里常常堆了文件预览、终端、浏览器等一堆页面，逐个点 × 太麻烦。这个插件在
**右侧面板顶部标签条的最右端**（全屏/收起按钮左边）加一个图标按钮，点一次就关闭当前
会话右侧栏里的全部页面；同时给页面标签的右键菜单加一行「关闭所有页面」。

![icon](./icon.svg)

## 行为

- 按钮只在右侧栏确实有可关闭页面时出现；只剩「引导页」或没有页面时隐藏。
- 关闭走的是 DSH 自己的逐页关闭通道，所以终端、文件预览等页面各自的清理逻辑照常执行；
  与手动点 × 完全一致（关掉最后一个页面时，右侧栏按原生规则收起）。
- 「引导页」是右侧栏的空状态，本身不可关闭。
- 悬停显示「关闭右侧栏的所有页面」；不占额外布局位置，随面板宽度、全屏切换、滑入滑出
  一起移动。

## 安装

要求 DSH `>= 0.2.1-rc.3`（`package.json` 的 `engines.dsh` 会在安装前检查）。

本插件**没有发布到 npm**，从 GitHub 仓库或本地目录安装。

**从 GitHub 装**

让 Agent 装，或直接调用工具：

```
plugin_manager(action: "install_bundle", target: "github:neeanee/dsh-close-all-pages#v0.1.0")
```

`#v0.1.0` 是固定版本；换成 `#main` 则跟随最新提交。

**从本地目录装**

把仓库下载到本地后，`target` 填目录的绝对路径（或 `link:<绝对路径>`）：

```
plugin_manager(action: "install_bundle", target: "link:C:/path/to/dsh-close-all-pages")
```

安装后默认启用，改动立即生效（HMR）。

## 卸载

侧边栏 → 插件 → 找到本插件 → 移除。

## 它是怎么工作的

- **没有构建步骤**：`client.js` 是一个自包含的 `window.__ModuleLoader__.load({...})`
  模块，只依赖页面自带的 `react` / `react-dom`。
- **Host 半边是空的**（`index.js` 导出 `apply() {}`）：所有逻辑在浏览器里，`cordis.patch.yml`
  只负责插入一行插件条目。
- **关闭操作**调用 `ctx.sidebarRight` 的公开面：用 `openTabs` 观察当前会话打开了哪些页面，
  用 `closeIn(sessionId, tabId)` 逐页关闭，因此复用产品自己的清理与布局规则。
- **按钮位置**：面板标签条最右端是产品内部结构（dock kit 的 `data-dockkit-strip-chrome`），
  没有公开插槽。插件用 React portal 把按钮挂进那个容器，并用 flex `order:-1` 排在全屏按钮
  之前，这样宽度变化、全屏、面板滑入滑出都由产品自己的布局负责。
- **降级**：若某个 DSH 版本不再暴露上述标记，按钮会在约 2 秒后自动改挂到会话标题栏
  右侧（`conversation.session.header.utilities` 插槽），不会静默消失。

## 已知限制

- 面板角落的位置依赖产品内部 DOM 标记；DSH 若调整右侧栏结构，可能退回到标题栏位置。
- 没有「撤销」：一次点击会记录为多次逐页关闭，不产生单条撤销历史。
- 关闭是立即执行的，不弹确认框；如果开着终端页，等于直接结束该终端。

## 发布（维护者）

**没有配置自动发布。** `.github/workflows/publish.yml` 只支持手动触发
（Actions → publish → Run workflow），默认勾着 `dry_run`，只跑检查和打包预览，不会发布。

如果以后要发到 npm，需要下面其一：

- 仓库 Secret `NPM_TOKEN`：对该包有读写权限的 npm token；
- 或 npm Trusted Publishing（OIDC）：在 npm 包设置里绑定本仓库与 `publish.yml`，
  然后删掉 workflow 里的 `NODE_AUTH_TOKEN` 与 `registry-url`。

仓库根目录就是包根目录。`files` 已限定打包内容（`client.js`、`index.js`、
`cordis.patch.yml`、`locale/*.json`、`icon.svg`、`README.md`、`LICENSE`），
`.github/` 不会进 tarball。

## License

MIT

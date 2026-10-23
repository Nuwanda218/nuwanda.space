# 首页 v0.1 验收报告

日期：2026-10-15（Asia/Shanghai）。项目：`F:\website\Nuwanda-space`。

## 已开发

- 暖白、衬线英文标题、细线文字入口的首页；About/Life/Notes/Timeline 四页。
- 升旗照片为首页封面，朋友照片为 Explore 后生活片段；栏目页分别复用对应照片。
- 原图移入 `src/assets/photos/`，SHA256 与根目录原文件相同；环境文件、旧 HTML 备份也已逐字节哈希核对。
- Astro SSG + Picture 响应式 WebP/JPEG；首页无客户端脚本，SSR/API 验收保留，旧浏览器按钮移至 `/environment/browser/`。
- title/description/lang/canonical/OG/favicon/robots/sitemap；栏目 noindex；可见焦点、跳至内容、reduced-motion。

## 已测试

| 项目 | 实际结果 |
|---|---|
| Astro / TypeScript | 13 文件，0 errors / 0 warnings / 0 hints |
| 安全边界单元测试 | 5/5 PASS |
| 最终生产 build | PASS，日志 `.local/homepage-v01/build.log` |
| 产物检查 | PASS，39 client files，SSR/API 在 dist/server |
| 生产 HTTP | PASS，真实构建 HTML、5正式页面、资源、404/敏感路径、每次变化 SSR/API |
| 开发 HTTP | PASS；冷启动先探测静态资源；XML MIME 与 Vite CSS direct 请求按实际协议验收 |
| 安全扫描 | PASS，忽略规则、已跟踪敏感路径、当前源码及产物检查；不覆盖完整 Git 历史 |
| 浏览器 | Chrome + bundled Playwright，375/768/1440px；图片加载、页面无横向溢出、禁用 JS 主要导航和返回首页、可见键盘焦点；无加载错误 |
| 原浏览器 JS 能力 | `/environment/browser/` 点击按钮实测 PASS |
| 小字颜色对比度 | #687064 / #F7F5F0 为 4.71:1；正文 13.61:1，accent 4.61:1；未宣称完整 WCAG 审计 |
| 图片保全 | 2 原图、.env.local、旧站 index.html 哈希与开工前一致 |

图片实际选取资源（Chrome，DPR=1）：375px 时封面 48,778 字节、朋友图 34,336 字节；1440px 时封面 340,688 字节、朋友图 59,212 字节。此为实际选中构建文件的大小，不是 Lighthouse 或全网络性能评分。

最终截图：`.local/homepage-v01/local/home-1440.png`、`home-768.png`、`home-375.png`。浏览器结构化证据：同目录 `visual-check.json`。没有运行 Lighthouse，不报告分数。

## 部署状态

生产包：`20261015-v01-9905306602`，56 文件，5,304,672 字节，压缩包 SHA256：`126e6e27ae90066bcc9fc1478a2b2d1b0fa55ef71449996d413fa820e01bb51c`。

已上传、通过压缩包及每个包内文件 SHA256 校验；Node 官方包服务器直连 180 秒超时（只收到 12,609,218 / 32,015,600 字节，发生在切换前），改为本机下载并匹配官方 SHA256 后上传，随后完成 Linux 运行依赖准备。已完成 Linux npm ci（226 个运行依赖包，24 秒，未复制 Windows node_modules），并成功上线。

旧站 `/srv/nuwanda-blog/web` 保留；博客旧 Nginx 配置备份 `/srv/nuwanda-blog/backups/20261015-v01-9905306602/nginx.conf`。与 weihua 共用服务器，生产切换仅限博客站点。

回滚脚本：`deploy/rollback-astro.sh`，通过 SSH stdin 执行，参数 `20261015-v01-9905306602`。恢复博客原配置、nginx -t + reload、停新服务、校验旧站与无关配置。

## 未完成 / 范围边界

三个栏目仍为真实可访问占位页，未编造文章或经历。账号、数据库业务、评论、OSS 不在本次范围；未连接生产 PostgreSQL，未改真实 OSS。Git 既有迁移尚未提交，本次未强制覆盖、提交或推送；远端 master 与本地 HEAD 均为 dca80bc839a0ebdf20591de5e3f6f4ed59234c84。

下一步建议：先整理真实生活与队伍内容，再做 Markdown/MDX 技术笔记集合。将来需要会话或动态图片功能时，另行配置 Linux 路径与对应功能测试。


## 已部署与公网验证

- 正式地址：https://nuwanda.space/。
- 运行结构：Nginx TLS → 博客专用 nuwanda-space.service → 127.0.0.1:4323，Node v24.22.0 standalone；哈希资源由 Nginx 直接提供，immutable 一年。
- `current` 指向 `/srv/nuwanda-blog/releases/20261015-v01-9905306602`。服务已 enabled，active/running，NRestarts=0；检查时 MemoryCurrent=31,805,440 字节。Nginx、博客、weihua-test 三服务均 active。
- 公网 **47/47 PASS**：首页与栏目及所有首页图片候选资源/样式的 SHA256 等于本机构建产物，favicon/robots/sitemap、SSR/API 每次变化与 no-store、HTTP/www HTTPS 跳转与查询参数、404/敏感路径、weihua 两页内容哈希。
- 公网 Chrome **375/768/1440px 全部 PASS**：无横向溢出、图片加载、禁用 JS 导航、焦点及原浏览器脚本验收；错误数组为空，已目视确认截图。
- 公网证据 `.local/homepage-v01/public-http.json`（47项）、`public-http.log`、`public/visual-check.json` 和 `public/home-{375,768,1440}.png`。
- 部署状态独立确认：`.local/homepage-v01/deployed-state.log`，SSH 正常退出码0。备份及 weihua/default 配置哈希仍一致，旧 web/index.html 保持原样。
- 一次 PowerShell 文本管道在部署脚本完成、解除 trap 后追加独立 CR，导致末尾 `$'\r': command not found` / 退出127；不把该退出码当成功证据。已改为 `deploy/remote-astro.mjs` 以精确 LF 字节传 SSH stdin，并重新执行独立状态检查、47项公网验证和线上浏览器验证，均退出0。
- 本次 owned 本地生产预览已停止；未停止用户本地数据库或其他服务。

### 主要变更文件

- 页面：`src/pages/index.astro`、`about.astro`、`[section].astro`、`environment/browser.astro`。
- 布局与样式：`src/layouts/SiteLayout.astro`、`src/components/Header.astro`、`Footer.astro`、`src/styles/site.css`、`src/data/site.ts`。
- 两张原图：`src/assets/photos/friends.jpg`、`new-year-flag-2026.jpeg`。
- 公共元数据：`public/favicon.svg`、`robots.txt`、`sitemap.xml`。
- 验证：`scripts/smoke.mjs`、`check-output.mjs`、`check-homepage-browser.mjs`、`deploy/verify_homepage.py`。
- 部署：`deploy/package-astro.mjs`、`remote-astro.mjs`、`prepare-and-publish-astro.sh`、`rollback-astro.sh`、`nginx/nuwanda-astro.conf`、`systemd/nuwanda-space.service`。
- 文档：本报告、`docs/homepage-v01.md`、`deployment-homepage-v01.md`、`design/homepage-v01.md`，以及 README/旧部署与开发指南的状态提示。

### 回滚命令

在项目根目录执行（仅在需要退回本次上线前的旧静态首页时）：

```powershell
& '.\.local\tools\node-v24.22.0-win-x64\node.exe' deploy/remote-astro.mjs --rollback
```

流程：先校验旧 web 哈希，恢复本版备份 Nginx 配置，nginx -t + reload，有界等待公网首页等于旧站，再停用 Node，校验无关站点配置。备份存在、脚本语法已检查；本次没有为测试而主动切回旧站。不应重复执行首次上线的 --publish；后续发布需要上一 Node 版本的 current/service 回滚策略。

独立代码审查发现并修复一项 P2：reload 后立即停 Node 的时序问题。未发现其他阻断项。

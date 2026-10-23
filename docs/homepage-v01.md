# 首页 v0.1 使用与维护

首页：`src/pages/index.astro`；About：`src/pages/about.astro`；三个栏目统一由 `src/pages/[section].astro` 静态生成。

共享文件：`src/layouts/SiteLayout.astro`（SEO/文档骨架）、`src/components/Header.astro`、`Footer.astro`、`src/styles/site.css`。导航名称和简介在 `src/data/site.ts` 修改。

## 两张照片

用户明确提供并授权用于本次网站的照片已移动，文件字节未修改：

| 原位置 | 新位置 | 首页用途 |
|---|---|---|
| 根目录 `2026元旦升旗.jpeg` | `src/assets/photos/new-year-flag-2026.jpeg` | 首屏大封面；也用于 Timeline |
| 根目录 `我和朋友们.jpg` | `src/assets/photos/friends.jpg` | Explore 后的生活片段；也用于 Life |

升旗图在桌面采用 8:5，object-position 50% 62%，保留完整队伍；手机保持 1600:2508 原始比例。朋友图保留 3:4 原始比例、完整合影与水印。日期来自文件标题和照片上的时间；不推测未提供的地点、活动详情或人物身份。

图片通过 Astro Picture 输出带哈希的 WebP/JPEG 和 srcset；原始 4920×6560 朋友照片不会直接发给浏览器。封面 eager/high；朋友图 lazy。参考 [Astro 图片文档](https://docs.astro.build/en/guides/images/)。所有正式页面无客户端 JS，旧浏览器脚本验收迁至 `/environment/browser/`，SSR/API 路由保持可用。

任务书原始 muted 色值 #70776E 保留为变量，但小字使用 #687064，与背景对比度 4.71:1；其余主配色沿用任务书。栏目占位页 noindex，sitemap 仅含首页和 About。旧站没有发现备案编号或站点验证信息，未添加虚构信息。

## 本地验证

PowerShell 使用 `scripts/local.ps1` 选择项目 Node：

```powershell
.\scripts\local.ps1 run check
.\scripts\local.ps1 test
.\scripts\local.ps1 run build
.\scripts\local.ps1 run test:output
.\scripts\local.ps1 run test:production
.\scripts\local.ps1 run test:dev
.\scripts\local.ps1 run check:security
.\scripts\local.ps1 start
# 另一个终端：运行浏览器检查（默认使用本机已装 Chrome 与 Codex bundled Playwright）
& '.\.local\tools\node-v24.22.0-win-x64\node.exe' scripts/check-homepage-browser.mjs
```

类型检查、build、dev 均涉及 Vite 缓存，顺序运行。Playwright 与 Chrome 是此机器测试工具，不是生产依赖；其他机器通过 PLAYWRIGHT_MODULE 和 BROWSER_EXECUTABLE 指定安装路径。脚本保存 375/768/1440px 截图，检查无溢出、图片加载、无 JS 导航、可见键盘焦点、真实栏目与返回首页，以及浏览器脚本验收按钮。

测试记录和截图保存在被忽略的 `.local/homepage-v01/`，不进入仓库或服务器。未测 Lighthouse 分数，不声称已有性能评分。

## 部署与回滚

见 [生产部署方案](deployment-homepage-v01.md) 与 [验收报告](homepage-v01-report.md)。生产使用 Astro standalone，Node 仅监听回环 4323，Nginx 保持原 TLS 和 www/HTTP 跳转。用户注册、评论、数据库业务、OSS、正式文章与完整时间线均不在本版范围。

下一步适合先整理真实的 Life/Timeline 内容，再引入 Markdown/MDX 笔记集合；需要会话或动态图片服务时，应单独配置 Linux 可写会话目录并补对应验收。

# 第一阶段：个人博客框架（2026-10-18）

> 本文记录第一阶段交付。后续同日已补齐独立 `materials/` 素材库与自动接入；**新增/更新素材以 [素材区使用指南](素材区使用指南.md) 为准**，不再按下文旧方法修改 data 数组。原图和既有正文保留，展示层从自动读取接口获取内容。

## 实现与验收顺序

- [x] 记录原有工作区及 SSR/API、依赖与部署文件基线。
- [x] 复用 SiteLayout 作为 HTML/SEO 基础，新增 BlogLayout 和模块导航。
- [x] 将品牌文案、封面配置与演示内容放进 data，建立首页、生活、笔记、专题页面。
- [x] 保留生活原始记录，旧 timeline 静态入口兼容到 guard。
- [x] 更新展示层相关验收，执行 check、test、build、产物、开发/生产 HTTP、安全检查。
- [x] 实测浏览器桌面/移动布局、导航、键盘、无 JS、图片与减少动画；记录截图。
- [x] 对比基线，记录结果和素材交接方法。

## 设计与边界

Astro 静态生成四个主要页面；SiteLayout 负责 HTML、元信息和全局样式，BlogLayout 负责内页外壳。封面摄影与生活图集、笔记列表、专题时间线各自独立。SiteLayout 继续支持 about；environment/ssg、environment/ssr、environment/browser、api/health 不修改。沿用 Node Adapter、版本锁文件与本地数据库配置，不部署、不提交、不推送。

夜骑照为可替换封面，CSS 深色背景在图片缺失时仍保留内容与入口。图集及事件图片按原始比例呈现；封面作为环境背景允许响应式裁切。所有新增笔记和事件均标明演示，示例日期不代表真实经历。

## 文件职责

- `src/data/site.ts`：品牌、介绍、关键词、导航、封面及模块引言。
- `src/data/content.ts`：类型化演示文章、专题事件、生活选图。
- `src/data/life.ts`：已有真实生活记录，保留原文。
- `src/layouts/SiteLayout.astro`、`BlogLayout.astro`：基础文档与博客外壳。
- `src/components/`：Header、Footer、HeroCover、BlogNavigation、PageIntro、LifeGallery、NoteList、EventTimeline。
- `src/styles/site.css`：色彩、排版、响应式、焦点和减少动态效果。
- `src/pages/`：index、life、notes、guard；动态 section 仅兼容 timeline。

## 素材交接

直接在聊天上传原图，或提供本机绝对路径/文件夹。建议首页横图 2400×1600 以上，手机专用竖图可另附；生活每组 3–8 张，专题每事件 1–5 张。无需预压缩或改名。附用途、标题、真实日期（不确定可注明）、简短说明、需要完整保留的人物/水印/主体、是否允许公开。个人介绍可直接提供一两句话和关键词。

开发者将原图放在 `src/assets/photos/` 并在 data 文件中导入；Astro 构建生成 WebP/JPEG 多尺寸，不使用外部图片接口。封面替换编辑 site.cover；新增生活内容编辑 life.ts；替换文章/事件编辑 content.ts。新文章尚无详情路由，原生 details 只展开演示片段。

## 实际验证结果

| 检查 | 实际结果 |
| --- | --- |
| `npm run check` | 25 个文件，0 错误、0 警告、0 提示 |
| `npm test` | 原有 5 项本地环境安全测试全部通过 |
| `npm run build` | 成功；四个主路由均静态生成，SSR/API 仍在 Node 服务产物中 |
| `npm run test:output` | 50 个客户端产物及原有静态/动态边界通过 |
| `npm run test:framework` | 模块导航、SEO、本地图片、示例标注、原生展开和旧入口通过 |
| `npm run test:dev` | 开发 HTTP、逐请求 SSR/API、资源、404、敏感路径通过 |
| `npm run test:production` | 最终构建的同组 HTTP 验收通过 |
| Chrome / Playwright | 四页 × 320/375/768/1440px：直接访问、刷新、无横向溢出、图片加载、当前导航、键盘跳转、无 JS 导航通过；笔记键盘展开通过 |
| 额外浏览器检查 | 开启 JS 后无页面脚本错误；原有 browser 验收按钮通过；阻断图片时封面背景与入口仍可用；减少动态效果生效 |
| 工作区保护 | 11 个受保护文件哈希未变：4 张原图、生活数据、4 个验收路由、Astro 配置、依赖锁文件；相对开工基线无新增删除 |
| Git / 源码安全 | `git diff --check` 通过；敏感信息扫描覆盖当前源码和构建产物 |

浏览器截图、JSON 报告以及本轮日志在 `.local/phase1/`，该目录被 Git 忽略。四页桌面/手机截图均已实际打开复核；截图流程会先滚动并解码懒加载图片，再拍完整页面，避免把未触发加载误认为缺图。入口测试中关闭 JavaScript，图片故障与减少动画效果分别验证；未实测 Safari、Firefox、实体手机、屏幕阅读器或自动 WCAG 审计。

首次并行 check/build 发生 Windows Vite 缓存重命名冲突，顺序执行后通过。本机网络受沙箱限制，最初 HTTP/Chrome 请求失败；将预览及验收置于获准的同一本机回环网络环境后通过。未修改系统代理、端口防火墙或浏览器设置。

## 本轮创建与修改

新增 `BlogLayout.astro`；`HeroCover`、`BlogNavigation`、`PageIntro`、`LifeGallery`、`NoteList`、`EventTimeline` 六个组件；`data/content.ts`；`pages/notes.astro`、`pages/guard.astro`；`scripts/check-framework.mjs`、`scripts/check-framework-browser.mjs`；本文档。

调整 `SiteLayout`、`Header`、`data/site.ts`、首页、生活页、about 文案和 timeline 兼容入口、`site.css`、`check-output.mjs`、`smoke.mjs`；旧 `check-homepage-browser.mjs` 现在复用四页验收。`package.json` 仅增加 `test:framework` 和 `test:browser` 两条命令，依赖与锁文件不变。

开始时 Astro 源码本来就在 Git 未跟踪目录中，旧静态站文件也已处于删除状态；本轮用额外 SHA-256 基线核对实际修改，未把原有 Git 状态误算为本次删除。未提交、推送、部署，未设计业务表或运行数据库测试。

## 本地查看与下一步

当前构建预览：`http://127.0.0.1:4322/`，生活、笔记、专题分别为 `/life/`、`/notes/`、`/guard/`。如预览进程结束，运行 `.\scripts\local.ps1 run dev`，访问终端输出地址（默认 4321）。构建后可运行 `test:framework`；浏览器检查使用 `test:browser -- http://127.0.0.1:4322`，需先运行对应服务，并具备脚本所用 Playwright/Chrome（可通过环境变量覆盖路径）。

优先细化生活模块：提供 2–3 组真实照片及说明，确认封面与手机裁切，再决定是否需要独立相册页。之后为 notes 增加真实文章与详情路由，最后用真实事件替换 guard 演示时间线。当前笔记和专题保留 noindex，真实内容准备好后再加入 sitemap 并开放索引；旧 timeline 是静态迁移提示及可点击入口，不依赖 JS。

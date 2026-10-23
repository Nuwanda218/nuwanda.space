# 开源博客 / 大事记页面设计调研

> 调研日期：2026-10-14
> 数据来源：GitHub Search API + Repos API（star 数、许可证、默认分支、demo 可达性均已实测）
> 原始数据：本目录下 `*.json`

## 0. 本项目约束（筛选标准）

| 约束 | 影响 |
|---|---|
| 纯静态 HTML + CSS + JS，无构建工具、无框架 | Hugo / Jekyll / Astro / Hexo 主题**不能直接落地**，只能借鉴其 HTML 结构与 CSS |
| 服务器只放运行代码（`index.html`/`post.html`/`about.html`/`assets/`/`data/`） | 引入的东西必须是**静态资源**，不能有 Node 运行时 |
| 中文内容为主 | 中文排版细节（行高、标点、字体栈）比英文主题更重要 |
| 大事记是博客的子页面 | 需要能塞进单页、数据可放在 `data/*.json` |

因此本调研按「**能否直接抄**」而不是「star 数」排序。

---

## A. 博客页面设计

### A1. 可直接抄（纯 HTML/CSS，无需构建）★ 优先看

| 项目 | Star | 许可证 | Demo | 说明 |
|---|---|---|---|---|
| [poole/poole](https://github.com/poole/poole) | 2.8k | MIT ✅ | https://getpoole.com | Mark Otto（Bootstrap 作者）写的极简博客骨架。**本质就是 HTML + 一个 `styles.scss`**，排版基线（字号阶梯、行宽 42rem、留白）非常干净，最适合拿来当自己 CSS 的起点 |
| [mzlogin/mzlogin.github.io](https://github.com/mzlogin/mzlogin.github.io) | 1.7k | MIT ✅ | https://mazhuang.org | 中文博客（马壮），有归档页、标签页、阅读进度、代码高亮。**中文排版可直接参考**，是目前中文技术博客里最耐看的一类 |
| [bradfrost/project-hub](https://github.com/bradfrost/project-hub) | 910 | MIT ✅ | — | 纯 HTML + CSS 的项目时间轴模板，见 B2 |

### A2. 设计参考（需构建，但设计值得抄）

这些都是 Hugo / Astro 主题，**不能直接放进你的站点**，但它们的 CSS 变量、配色、卡片结构可以整段借鉴。

| 项目 | Star | 许可证 | Demo | 风格 |
|---|---|---|---|---|
| [adityatelange/hugo-PaperMod](https://github.com/adityatelange/hugo-PaperMod) | 14.0k | MIT ✅ | https://adityatelange.github.io/hugo-PaperMod/ | 极简、信息密度高、明暗双主题。**最值得抄的信息架构**（首页列表 + 归档 + 标签 + 搜索） |
| [CaiJimmy/hugo-theme-stack](https://github.com/CaiJimmy/hugo-theme-stack) | 6.5k | ⚠️ GPL-3.0 | https://stack.cai.im | 卡片式、封面图、右侧目录。**许可证是 GPL-3.0，抄代码会传染，只建议看设计** |
| [satnaing/astro-paper](https://github.com/satnaing/astro-paper) | 5.1k | MIT ✅ | https://astro-paper.pages.dev/ | 无障碍 + SEO 做得最好的极简博客，适合参考语义化标签与 meta |
| [luizdepra/hugo-coder](https://github.com/luizdepra/hugo-coder) | 3.1k | MIT ✅ | — | 极简单栏，等宽字体，偏极客风 |
| [panr/hugo-theme-terminal](https://github.com/panr/hugo-theme-terminal) | 2.8k | MIT ✅ | — | 复古终端风，绿字黑底，辨识度极高 |
| [nanxiaobei/hugo-paper](https://github.com/nanxiaobei/hugo-paper) | 2.4k | MIT ✅ | https://hugo-paper.vercel.app | 极简中的极简，几乎没有装饰，纯靠排版 |
| [CuteLeaf/Firefly](https://github.com/CuteLeaf/Firefly) | 2.3k | MIT ✅ | https://firefly.cuteleaf.cn | 中文社区维护，清新二次元风，动效丰富 |
| [LyraVoid/Mizuki](https://github.com/LyraVoid/Mizuki) | 1.9k | Apache-2.0 ✅ | https://mizuki.mysqil.com | Material Design 3，配色系统完整 |
| [chrismwilliams/astro-theme-cactus](https://github.com/chrismwilliams/astro-theme-cactus) | 1.7k | MIT ✅ | https://astro-cactus.chriswilliams.dev/ | 简洁、暗色优先 |
| [sergiokopplin/indigo](https://github.com/sergiokopplin/indigo) | 2.7k | MIT ✅ | https://sergiokopplin.github.io/indigo/ | **极简窄栏 + 明暗自动切换**。许可证写在 README 里（链接到作者的 MIT 许可页），仓库内无 LICENSE 文件，故 GitHub API 误报为 NONE。**体积极小、最适合移植**：84 个文件、22 个小 Sass、设计令牌只有 8 个颜色变量 |

### A3. 中文 / 亚洲风格备选

| 项目 | Star | 许可证 | 说明 |
|---|---|---|---|
| [LIlGG/halo-theme-sakura](https://github.com/LIlGG/halo-theme-sakura) | 963 | — | 樱花主题，Halo 博客系统 |
| [theme-nexmoe/hexo-theme-nexmoe](https://github.com/theme-nexmoe/hexo-theme-nexmoe) | 1.7k | — | 图片叙事型，视觉冲击强 |
| [iblh/hexo-theme-material](https://github.com/iblh/hexo-theme-material) | 4.0k | — | Hexo Material 风，2022 年后停更 |

---

## B. 大事记（时间轴）呈现方式

大事记有两种典型形态，选型取决于你想讲「故事」还是「列表」：

- **叙事型**：横向、可左右翻页、每条带大图和说明 → 适合有照片的里程碑
- **列表型**：纵向单列、滚动阅读、轻量 → 适合纯文字年表

### B1. 叙事型：开箱即用

| 项目 | Star | 许可证 | Demo | 说明 |
|---|---|---|---|---|
| [NUKnightLab/TimelineJS3](https://github.com/NUKnightLab/TimelineJS3) | 3.2k | MPL-2.0 ✅ | https://timeline.knightlab.com | **大事记首选**。Northwestern 大学 Knight Lab 出品，一个 `<script>` + 一份 JSON（或 Google Sheet）就能渲染出横向故事化时间轴，支持图片/视频/地图/维基链接。数据放 `data/timeline.json` 即可，完全契合你的静态栈。注意 MPL-2.0 是文件级 copyleft：改它的源码要开源改动，调用不受影响 |

### B2. 列表型：纯 CSS/HTML，可直接抄 ★

| 项目 | Star | 许可证 | Demo | 说明 |
|---|---|---|---|---|
| [bradfrost/project-hub](https://github.com/bradfrost/project-hub) | 910 | MIT ✅ | — | 纯 HTML + CSS 的垂直时间轴，`index.html` 不到 1KB，CSS 单独一个文件。**改配色和字号就能直接用**，是最省事的方案 |
| [NigelOToole/progress-tracker](https://github.com/NigelOToole/progress-tracker) | 513 | MIT ✅ | http://nigelotoole.github.io/progress-tracker/ | 纯 HTML/CSS 步骤条，横向节点 + 连线，适合「阶段式」大事记 |
| [squarechip/timeline](https://github.com/squarechip/timeline) | 373 | MIT ✅ | https://squarechip.github.io/timeline/ | jQuery 插件，垂直/水平双向，有 dist 产物可直接引用 |
| [codrops/Blueprint-VerticalTimeline](https://github.com/codrops/Blueprint-VerticalTimeline) | 465 | ⚠️ Codrops 自有许可 | 原 demo 已 403 | 设计参考价值高（图标节点 + 响应式媒体查询），但**不是开源许可证**，只能看不能抄 |
| [codyhouse/vertical-timeline](https://github.com/codyhouse/vertical-timeline) | 577 | ⚠️ CodyHouse 自有许可 | https://codyhouse.co/demo/vertical-timeline | 同上，仅作设计参考 |

### B3. 交互型：功能强但依赖框架

| 项目 | Star | 许可证 | 说明 |
|---|---|---|---|
| [visjs/vis-timeline](https://github.com/visjs/vis-timeline) | 2.6k | MIT / Apache-2.0 双许可 ✅ | 可缩放、可拖拽、支持**区间事件**（一件事持续多年）。纯 JS 无框架依赖，但体积较大（~400KB），适合事件量大、需要筛选的场景 |
| [prabhuignoto/react-chrono](https://github.com/prabhuignoto/react-chrono) | 4.2k | MIT | React 组件，当前技术栈不适用 |
| [evilrabbit/lifeline](https://github.com/evilrabbit/lifeline) | 540 | MIT | shadcn 注册表组件，需 React |
| [LeCoupa/vuetimeline](https://github.com/LeCoupa/vuetimeline) | 350 | MIT | Vue 组件，当前技术栈不适用 |

---

## C. 建议

### 博客

以 **poole** 的排版骨架（行宽、字号阶梯、留白）为基线，参考 **hugo-PaperMod** 的信息架构（首页列表 / 归档 / 标签），中文排版细节参考 **mzlogin**。三者都是 MIT，且都是「读 CSS 就能懂」的量级，不需要引入任何构建工具。

不建议直接套 Hugo/Astro 主题：它们依赖模板引擎和构建流程，会和你「服务器只放静态文件、无 Node 运行时」的边界冲突。若将来走 Cloudflare Pages 路线（见 `docs/roadmap.md`），再考虑整体迁移到 Astro。

### 大事记

- 想做成**有图有故事**的里程碑 → **TimelineJS3**，数据独立成 `data/timeline.json`，页面只放一个容器 div
- 想做成**轻量年表** → 抄 **bradfrost/project-hub** 的垂直时间轴，自己重写 CSS，零依赖

两种都能保持「大事记是博客子页面」的形态（例如 `timeline.html`），并与现有 `assets/` + `data/` 目录结构一致。

---

## D. 许可证速查

| 可安全使用 | 需谨慎 |
|---|---|
| MIT：poole、mzlogin、PaperMod、hugo-paper、hugo-coder、terminal、astro-paper、cactus、Firefly、project-hub、progress-tracker、squarechip/timeline、**indigo**（README 声明） | GPL-3.0：hugo-theme-stack（传染性） |
| Apache-2.0：Mizuki、vis-timeline（双许可） | 自有许可：codrops、codyhouse（仅可看设计） |
| MPL-2.0：TimelineJS3（文件级 copyleft，调用无影响） | |

> **勘误（2026-10-14）**：初版把 indigo 记为「无许可证」，依据是 GitHub API 的 `license: NONE`。
> 实际该仓库 README 明确声明 MIT 并链接作者许可页 `https://kopplin.mit-license.org/`（已实测可达）。
> 原因是仓库内没有 LICENSE 文件，GitHub 的自动识别因此失败。indigo 可安全使用。

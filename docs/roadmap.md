# Nuwanda Space

个人博客学习项目。目标不是一次做成复杂系统，而是用 GitHub 和 Cloudflare 的免费能力，按阶段学会网站从本地文件到线上访问、自动部署、公开评论数据、对象存储和 Serverless API 的完整路径。

## 项目目标

- 用 GitHub 管理代码、文章和版本记录。
- 用 Cloudflare Pages 免费部署静态博客。
- 第一版直接做可部署博客，不再重复“如何部署静态页面”的入门练习。
- 评论第一版使用公开 JSON 文件，先完成展示，不处理访客在线提交。
- 后期再进入 Cloudflare R2、Pages Functions 或 Workers。

## 当前推荐路线

你已经部署过静态页面，所以本项目跳过“账号注册、工具安装、静态部署概念入门”等前置学习，直接进入实操版流程：

```text
创建第一版博客文件 -> 本地预览 -> 推送 GitHub -> Cloudflare Pages 部署 -> 写文章和公开评论 JSON
```

第二阶段再扩展为：

```text
浏览器 -> Cloudflare Pages 静态页面 -> Pages Functions 或 Workers API -> R2 数据/图片
```

第一版暂时不做登录、在线评论提交、数据库和独立 Worker API。这样可以把学习重点放在静态站点结构、数据渲染、GitHub 自动部署和 Cloudflare Pages 上。

## 已有前提

本流程默认你已经具备：

- 有 GitHub 账户。
- 有 Cloudflare 账户。
- 知道如何把静态页面部署到 Cloudflare Pages 或类似平台。
- 本地可以使用 VS Code 编辑文件。
- 本地安装了 Git，或愿意在开始前安装。
- 本地安装了 Node.js 更好，但第一版不是强制要求。

如果某项暂时没有，也可以补上，但不再作为 README 的主要阶段。

## 免费工具分工

| 工具 | 用途 | 本项目怎么用 |
| --- | --- | --- |
| GitHub Free | 代码仓库、版本管理、公开项目协作 | 保存博客源码、文章数据、评论 JSON、README 和学习笔记 |
| Cloudflare Pages Free | 静态网站托管、自动部署、预览部署 | 每次 push 到 GitHub 后自动发布博客 |
| Cloudflare Workers Free | Serverless API | 后期提供文章 API、评论 API 或管理接口 |
| Cloudflare R2 Free tier | 对象存储 | 后期存放图片、文章 JSON、附件或评论数据 |
| Cloudflare DNS Free | 域名解析 | 如果以后购买域名，用 Cloudflare 管理 DNS |
| VS Code | 编辑器 | 写 HTML、CSS、JS、Markdown |
| Git | 版本控制工具 | 提交、回滚、同步代码 |
| Node.js / npm | 前端工具运行环境 | 后期本地预览、安装 Wrangler 或静态站点工具 |
| Wrangler | Cloudflare 命令行工具 | 后期管理 Workers、Pages Functions、R2 绑定 |

说明：自定义域名本身通常需要购买，不属于免费工具范围。没有域名时可以先使用 Cloudflare Pages 提供的 `*.pages.dev` 地址。

## 第一版目录结构

第一版使用根目录 `index.html`。这样 Cloudflare Pages 不需要额外入口配置，访问站点根路径时可以直接打开首页。

```text
Nuwanda-space/
├── index.html                  # 首页，显示文章列表
├── post.html                   # 文章详情页，显示正文和公开评论
├── about.html                  # 关于页面，可选
├── assets/
│   ├── css/
│   │   └── style.css           # 第一版统一样式
│   ├── js/
│   │   ├── main.js             # 首页文章列表渲染
│   │   ├── post.js             # 文章详情和评论渲染
│   │   └── utils.js            # 公共工具函数
│   └── images/                 # 本地图片，后期可迁移到 R2
├── data/
│   ├── posts.json              # 文章索引和正文数据
│   └── comments/
│       ├── first-post.json     # 某篇文章的公开评论
│       └── second-post.json
├── README.md
├── learn.md
└── .gitignore
```

暂时不创建：

- `auth.js`：第一版不做登录。
- `worker/`：第一版不做独立 Worker。
- `functions/`：等需要在线提交评论或读取 R2 时再加。
- 多个 CSS 文件：第一版用一个 `style.css` 更容易维护。

## 评论模块第一版设计

第一版评论是公开 JSON 文件，不支持访客直接提交。你手动编辑评论文件，然后通过 GitHub 和 Cloudflare Pages 发布。

评论文件路径按文章 slug 命名：

```text
data/comments/first-post.json
```

示例：

```json
[
  {
    "id": "c-001",
    "author": "访客",
    "date": "2026-05-18",
    "content": "写得不错。"
  },
  {
    "id": "c-002",
    "author": "Nuwanda",
    "date": "2026-05-18",
    "content": "谢谢阅读。"
  }
]
```

这个方案的特点：

- 评论内容公开，符合博客评论的展示属性。
- 不需要数据库、Worker、R2 或登录系统。
- 没有在线提交入口，所以不会产生垃圾评论写入问题。
- 每次新增评论都需要改 JSON、提交 Git、等待 Pages 部署。

安全边界：

- 评论 `content` 第一版按纯文本渲染，不直接当 HTML 插入页面。
- 不把任何 GitHub token、Cloudflare token、R2 密钥写进前端文件。
- 后期如果开放在线评论提交，必须通过 Pages Functions 或 Workers 控制写入。

## 文章数据设计

第一版把文章直接放在 `data/posts.json`。

示例：

```json
[
  {
    "slug": "first-post",
    "title": "第一篇博客",
    "date": "2026-05-18",
    "tags": ["start"],
    "summary": "项目第一篇文章。",
    "content": "<p>这是我的第一篇博客。</p>"
  }
]
```

字段说明：

| 字段 | 作用 |
| --- | --- |
| `slug` | 文章唯一标识，也用于匹配评论文件 |
| `title` | 文章标题 |
| `date` | 发布时间 |
| `tags` | 标签列表 |
| `summary` | 首页摘要 |
| `content` | 文章正文，第一版可先使用简单 HTML |

## 阶段 1：创建第一版文件结构

目标：先拥有可以部署的博客骨架。

任务：

1. 创建 `index.html`、`post.html`、`about.html`。
2. 创建 `assets/css/style.css`。
3. 创建 `assets/js/main.js`、`assets/js/post.js`、`assets/js/utils.js`。
4. 创建 `data/posts.json`。
5. 创建 `data/comments/first-post.json`。
6. 本地打开 `index.html`，确认首页能加载。

产出：

- 根目录有 `index.html`。
- 首页能显示文章列表。
- 详情页能根据文章 slug 显示正文。
- 详情页能加载对应的公开评论 JSON。

预计时间：

- 由 Codex 协助创建第一版：2-4 小时。
- 自己边学边写：4-8 小时。

## 阶段 2：实现本地数据渲染

目标：让页面从 JSON 读取数据，而不是把文章写死在 HTML 里。

任务：

1. `main.js` 读取 `data/posts.json`。
2. 首页渲染文章标题、日期、标签、摘要。
3. 首页文章链接跳转到 `post.html?slug=first-post`。
4. `post.js` 从 URL 读取 `slug`。
5. `post.js` 在 `posts.json` 中找到对应文章。
6. `post.js` 读取 `data/comments/<slug>.json`。
7. 页面渲染正文和评论。

产出：

- 新增文章只需要修改 `posts.json`。
- 新增评论只需要修改 `data/comments/<slug>.json`。
- 页面结构和数据分离。

预计时间：

- 2-4 小时。

## 阶段 3：推送到 GitHub 并部署到 Cloudflare Pages

目标：直接进入你已经熟悉的静态部署流程。

任务：

1. 如果当前项目还不是 Git 仓库，初始化：

```bash
git init
git add .
git commit -m "Initialize blog"
git branch -M main
```

2. 在 GitHub 创建仓库，例如 `Nuwanda-space`。
3. 连接远程仓库并推送：

```bash
git remote add origin https://github.com/<your-name>/Nuwanda-space.git
git push -u origin main
```

4. 在 Cloudflare Pages 创建项目。
5. 连接 GitHub 仓库。
6. 选择 `main` 分支。
7. 第一版无构建工具时：
   - Build command 留空。
   - Output directory 使用项目根目录。
8. 部署完成后访问 `*.pages.dev` 地址。

产出：

- 博客可以通过公网 URL 访问。
- 每次 `git push` 后 Cloudflare Pages 自动重新部署。

预计时间：

- 第一次配置：1-2 小时。
- 之后每次发布：几分钟。

## 阶段 4：形成文章和评论发布流程

目标：让写文章和添加评论变成固定动作。

新增文章：

1. 在 `data/posts.json` 添加文章对象。
2. 为文章准备一个 slug，例如 `second-post`。
3. 如需评论展示，创建 `data/comments/second-post.json`。
4. 本地打开首页和详情页检查。
5. 提交并推送：

```bash
git status
git add .
git commit -m "Add second post"
git push
```

新增公开评论：

1. 打开 `data/comments/<slug>.json`。
2. 添加评论对象。
3. 本地打开对应 `post.html?slug=<slug>` 检查。
4. 提交并推送：

```bash
git add data/comments/<slug>.json
git commit -m "Add comments for <slug>"
git push
```

产出：

- 有稳定的文章发布流程。
- 有稳定的公开评论维护流程。
- 理解 Git commit、push、自动部署的关系。

预计时间：

- 第一次整理流程：1-2 小时。
- 以后每篇文章发布：5-20 分钟。
- 手动添加评论：3-10 分钟。

## 阶段 5：完善博客体验

目标：让博客更像可长期使用的网站。

建议按优先级做：

1. 响应式布局：手机、平板、桌面都能阅读。
2. 文章标签：按主题分类。
3. 搜索：先在前端搜索 `posts.json`。
4. 归档页：按年份或月份显示文章。
5. 评论空状态：没有评论时显示简短提示。
6. SEO 基础：标题、描述、语义化 HTML。
7. 404 页面：处理不存在的路径。
8. RSS 或 sitemap：后期再做，不影响第一版。

预计时间：

- 基础优化：2-4 小时。
- 搜索、归档、RSS 等增强：4-8 小时。

## 阶段 6：引入 R2 存储

目标：学习对象存储，把大文件或动态数据从代码仓库中分离。

建议先用 R2 存图片，不要一开始就存全部文章和评论。

任务：

1. 在 Cloudflare R2 创建 bucket，例如 `nuwanda-space-assets`。
2. 上传博客图片。
3. 配置公开访问方式或绑定自定义域名。
4. 在文章内容中引用 R2 图片地址。

后期可以考虑：

- 把文章图片迁移到 R2。
- 把评论 JSON 迁移到 R2。
- 用 Pages Functions 或 Workers 读取 R2 数据。

产出：

- 理解对象存储和 Git 仓库的区别。
- 图片不再占用代码仓库空间。

预计时间：

- 2-4 小时。

## 阶段 7：引入 Pages Functions 或 Workers

目标：学习 Serverless API，并为在线评论提交做准备。

建议触发条件：

- 你想让访客在线提交评论。
- 你想从 R2 动态读取文章或评论。
- 你想做管理接口。
- 你想隐藏部分配置或密钥。

优先选择 Pages Functions，因为它和 Cloudflare Pages 在同一个项目里，路径更直接。Worker 适合后期拆成独立 API 服务。

可能接口：

```text
GET /api/posts
GET /api/posts/:slug
GET /api/comments?post=first-post
POST /api/comments
```

后期目录可以扩展为：

```text
Nuwanda-space/
├── functions/
│   └── api/
│       ├── posts.js
│       └── comments.js
└── wrangler.toml
```

产出：

- 理解前端页面和 API 的分工。
- 理解 Request、Response、JSON、环境变量、绑定。
- 评论从“手动维护 JSON”升级为“接口控制写入”。

预计时间：

- 最小 API：3-5 小时。
- 接入 R2：4-8 小时。
- 在线评论提交：8 小时以上。

## 推荐总工期

| 范围 | 内容 | 预计时间 |
| --- | --- | --- |
| 实操 MVP | 文件结构、文章 JSON、公开评论 JSON、本地渲染、Cloudflare Pages 部署 | 6-10 小时 |
| 可长期写作版 | MVP + 样式优化 + 标签 + 搜索 + 文章/评论发布流程 | 10-18 小时 |
| 动态增强版 | 可长期写作版 + R2 + Pages Functions 或 Workers API + 在线评论提交 | 18-32 小时 |

如果你每天投入 1-2 小时，推荐节奏：

```text
第 1 天：创建文件结构、文章 JSON、评论 JSON
第 2 天：完成首页和详情页渲染
第 3 天：部署到 Cloudflare Pages
第 4 天：补样式、移动端、第一篇正式文章和评论展示
第 5 天以后：再学 R2、Functions、Workers
```

## 免费额度和限制快照

以下信息按 2026-05-18 查阅官方文档记录，实际使用前应再次确认：

- GitHub Pages 可从仓库托管静态 HTML、CSS、JavaScript 网站。
- Cloudflare Pages Free：每月 500 次构建、单站最多 20,000 个文件、单个静态资源最大 25 MiB。
- Cloudflare Workers Free：每天 100,000 次请求，单次调用 CPU time 限制为 10 ms。
- Cloudflare R2 Free tier：每月 10 GB-month 存储、100 万次 Class A 操作、1000 万次 Class B 操作，公网出口流量免费。

官方来源：

- <https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages>
- <https://developers.cloudflare.com/pages/platform/limits/>
- <https://developers.cloudflare.com/workers/platform/pricing/>
- <https://developers.cloudflare.com/r2/pricing/>

## 重要取舍

- 第一版不做登录系统。登录会引入认证、安全、权限和数据保护问题。
- 第一版不做在线评论提交。公开 JSON 评论足够验证展示流程。
- 第一版不做独立 Worker。等需要 API 或 R2 写入时再加。
- 第一版不把文章和评论全部放 R2。静态博客阶段把数据放仓库更容易学习和回滚。
- 第一版不引入复杂框架。HTML、CSS、JavaScript 足够完成。
- 等静态博客稳定后，再考虑 Astro、Hugo、Eleventy、React 等工具。

## 下一步执行建议

如果要继续实施，建议下一步让 Codex 做这件事：

```text
请帮我创建第一版静态博客项目结构，包括 index.html、post.html、about.html、assets/css/style.css、assets/js/main.js、assets/js/post.js、assets/js/utils.js、data/posts.json、data/comments/first-post.json，并保证可以本地打开预览文章和公开评论。
```

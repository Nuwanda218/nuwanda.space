# Nuwanda Space

个人博客学习项目。目标不是一次做成复杂系统，而是用 GitHub 和 Cloudflare 的免费能力，按阶段学会网站从本地文件到线上访问、自动部署、动态数据、对象存储的完整路径。

## 项目目标

- 用 GitHub 管理代码、文章和版本记录。
- 用 Cloudflare Pages 免费部署静态博客。
- 先完成可访问、可维护的静态博客，再进入 Cloudflare R2、Workers 或 Pages Functions。
- 通过这个过程学习 HTML、CSS、JavaScript、Git、部署、DNS、HTTP、Serverless 和对象存储。

## 当前推荐路线

推荐先使用：

```text
本地项目 -> GitHub 仓库 -> Cloudflare Pages -> 线上博客
```

第二阶段再扩展为：

```text
浏览器 -> Cloudflare Pages 静态页面 -> Pages Functions 或 Workers API -> R2 数据/图片
```

暂时不建议一开始就采用“GitHub Pages + Worker + R2”的完整动态方案。它能实现目标，但新手会同时遇到仓库、部署、跨域、Worker、R2、接口设计等问题，排查成本高。先用 GitHub 负责版本管理，Cloudflare Pages 负责部署，路径更短，也更适合学习。

## 免费工具分工

| 工具 | 用途 | 本项目怎么用 |
| --- | --- | --- |
| GitHub Free | 代码仓库、版本管理、公开项目协作 | 保存博客源码、文章数据、README 和学习笔记 |
| Cloudflare Pages Free | 静态网站托管、自动部署、预览部署 | 每次 push 到 GitHub 后自动发布博客 |
| Cloudflare Workers Free | Serverless API | 后期提供文章 API、评论 API 或管理接口 |
| Cloudflare R2 Free tier | 对象存储 | 后期存放图片、文章 JSON、附件或备份 |
| Cloudflare DNS Free | 域名解析 | 如果以后购买域名，用 Cloudflare 管理 DNS |
| VS Code | 编辑器 | 写 HTML、CSS、JS、Markdown |
| Git | 版本控制工具 | 提交、回滚、同步代码 |
| Node.js / npm | 前端工具运行环境 | 后期本地预览、安装 Wrangler 或静态站点工具 |
| Wrangler | Cloudflare 命令行工具 | 后期管理 Workers、Pages Functions、R2 绑定 |

说明：自定义域名本身通常需要购买，不属于免费工具范围。没有域名时可以先使用 Cloudflare Pages 提供的 `*.pages.dev` 地址。

## 阶段 0：准备账户和工具

目标：具备最小开发环境。

任务：

1. 注册 GitHub 账户。
2. 注册 Cloudflare 账户。
3. 安装 VS Code。
4. 安装 Git。
5. 安装 Node.js LTS。
6. 在本地确认命令可用：

```bash
git --version
node --version
npm --version
```

产出：

- 本地可以编辑项目文件。
- Git 可以提交代码。
- GitHub 和 Cloudflare 账户可登录。

预计时间：

- 有账号和工具基础：30-60 分钟。
- 完全从零开始：1-2 小时。

## 阶段 1：创建最小静态博客

目标：先做一个不用后端、可以直接部署的博客。

建议目录：

```text
Nuwanda-space/
  README.md
  learn.md
  index.html
  assets/
    css/
      site.css
    js/
      main.js
  data/
    posts.json
```

第一版只需要实现：

1. 首页显示博客名称。
2. 从 `data/posts.json` 读取文章列表。
3. 点击文章后在页面内显示标题、日期、正文。
4. 页面在手机和电脑上都能正常阅读。

`data/posts.json` 可以先用这种结构：

```json
[
  {
    "slug": "first-post",
    "title": "第一篇博客",
    "date": "2026-05-18",
    "tags": ["start"],
    "content": "<p>这是我的第一篇博客。</p>"
  }
]
```

产出：

- 本地能打开 `index.html` 看到文章。
- 初步理解 HTML、CSS、JavaScript、JSON、Fetch API。

预计时间：

- 由 Codex 协助生成第一版：2-4 小时。
- 自己边学边写：4-8 小时。

## 阶段 2：放入 GitHub 仓库

目标：把项目纳入版本管理，并推送到 GitHub。

任务：

1. 在 GitHub 创建仓库，例如 `Nuwanda-space`。
2. 在本地初始化 Git：

```bash
git init
git add .
git commit -m "Initialize static blog"
git branch -M main
git remote add origin https://github.com/<your-name>/Nuwanda-space.git
git push -u origin main
```

3. 确认 GitHub 仓库中能看到项目文件。

产出：

- GitHub 上有完整源码。
- 以后每次改文章或样式，都可以通过 commit 记录变化。

预计时间：

- 1-2 小时。

## 阶段 3：部署到 Cloudflare Pages

目标：让博客拥有线上访问地址。

任务：

1. 登录 Cloudflare Dashboard。
2. 进入 Workers & Pages。
3. 创建 Pages 项目。
4. 连接 GitHub 仓库。
5. 选择 `main` 分支。
6. 第一版无构建工具时：
   - Build command 留空。
   - Output directory 使用项目根目录，或按 Cloudflare 页面提示设置为 `/`。
7. 部署完成后访问 `*.pages.dev` 地址。

产出：

- 博客可以通过公网 URL 访问。
- 每次 `git push` 后 Cloudflare Pages 自动重新部署。

预计时间：

- 第一次配置：1-2 小时。
- 之后每次发布：几分钟。

## 阶段 4：形成日常写作流程

目标：让写博客变成固定动作，而不是每次重新想流程。

推荐流程：

1. 在 `data/posts.json` 添加新文章。
2. 本地打开页面检查显示。
3. 提交变更：

```bash
git status
git add .
git commit -m "Add new post"
git push
```

4. 等 Cloudflare Pages 自动部署。
5. 打开线上地址确认文章可访问。

产出：

- 有稳定的写作和发布习惯。
- 了解 Git commit、push、自动部署的关系。

预计时间：

- 第一次整理流程：1-2 小时。
- 以后每篇文章发布：5-20 分钟。

## 阶段 5：完善博客体验

目标：让博客更像可长期使用的网站。

建议按优先级做：

1. 响应式布局：手机、平板、桌面都能阅读。
2. 文章标签：按主题分类。
3. 搜索：先在前端搜索 `posts.json`。
4. 归档页：按年份或月份显示文章。
5. SEO 基础：标题、描述、语义化 HTML。
6. 404 页面：处理不存在的路径。
7. RSS 或 sitemap：后期再做，不影响 MVP。

预计时间：

- 基础优化：2-4 小时。
- 搜索、归档、RSS 等增强：4-8 小时。

## 阶段 6：引入 R2 存储

目标：学习对象存储，把大文件或动态数据从代码仓库中分离。

建议先用 R2 存图片，不要一开始就存全部文章。

任务：

1. 在 Cloudflare R2 创建 bucket，例如 `nuwanda-space-assets`。
2. 上传博客图片。
3. 配置公开访问方式或绑定自定义域名。
4. 在文章内容中引用 R2 图片地址。

产出：

- 理解对象存储和 Git 仓库的区别。
- 图片不再占用代码仓库空间。

预计时间：

- 2-4 小时。

## 阶段 7：引入 Pages Functions 或 Workers

目标：学习 Serverless API。

建议触发条件：

- 你想做评论。
- 你想从 R2 动态读取文章。
- 你想做管理接口。
- 你想隐藏部分配置或密钥。

优先选择 Pages Functions，因为它和 Cloudflare Pages 在同一个项目里，路径更直接。Worker 适合后期拆成独立 API 服务。

可能接口：

```text
GET /api/posts
GET /api/posts/:slug
GET /api/tags
POST /api/comments
```

产出：

- 理解前端页面和 API 的分工。
- 理解 Request、Response、JSON、环境变量、绑定。

预计时间：

- 最小 API：3-5 小时。
- 接入 R2：4-8 小时。
- 评论或管理功能：8 小时以上。

## 推荐总工期

| 范围 | 内容 | 预计时间 |
| --- | --- | --- |
| MVP | 静态博客、本地预览、GitHub 仓库、Cloudflare Pages 部署 | 6-10 小时 |
| 可长期写作版 | MVP + 样式优化 + 标签 + 搜索 + 写作流程 | 10-18 小时 |
| 动态增强版 | 可长期写作版 + R2 + Pages Functions 或 Workers API | 18-30 小时 |

如果你每天投入 1-2 小时，推荐节奏：

```text
第 1 天：装工具、建仓库、理解 Git 基础
第 2 天：完成静态页面和 posts.json
第 3 天：部署到 Cloudflare Pages
第 4 天：补样式、移动端、第一篇正式文章
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

- 先不要做登录系统。登录会引入认证、安全、权限和数据保护问题。
- 先不要做评论系统。评论需要防垃圾内容、存储、审核和接口安全。
- 先不要上复杂框架。HTML、CSS、JavaScript 足够完成第一版。
- 先不要把文章全部放 R2。静态博客阶段把文章放仓库更容易学习和回滚。
- 等静态博客稳定后，再考虑 Astro、Hugo、Eleventy、React 等工具。

## 下一步执行建议

如果要继续实施，建议下一步让 Codex 做这件事：

```text
请帮我创建第一版静态博客项目结构，包括 index.html、assets/css/site.css、assets/js/main.js、data/posts.json，并保证可以本地打开预览。
```

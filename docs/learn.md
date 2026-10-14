# 学习笔记

这份文档用于记录搭建个人博客过程中会接触到的技术。建议按项目阶段学习，不要一开始把所有概念都学完。

## 学习方式

- 每完成一个项目阶段，再补对应知识。
- 先知道“它解决什么问题”，再学语法和细节。
- 每个概念都用本项目做一次小练习。
- 遇到新名词先写一句自己的解释，后面再修正。

## 阶段 0：基础环境

需要理解：

- 文件和目录：项目为什么要有固定结构。
- 编辑器：VS Code 如何打开文件夹、搜索文件、安装扩展。
- 命令行：终端、当前目录、命令、参数。
- Git：记录文件变化。
- GitHub：远程保存代码。

重点命令：

```bash
git --version
git init
git remote add
git status
git add .
git commit -m "message"
git remote -v
git push
```

练习：

1. 创建一个测试文件。
2. 用 `git status` 查看变化。
3. 提交一次 commit。
4. 修改文件后再次查看差异。

## 终端创建文件和文件夹

你当前环境是 Windows，终端大概率是 PowerShell。下面先记 PowerShell 命令，再记 Git Bash / macOS / Linux 对照。

### PowerShell 常用命令

查看当前所在目录：

```powershell
Get-Location
```

查看当前目录下的文件和文件夹：

```powershell
Get-ChildItem
```

进入某个文件夹：

```powershell
Set-Location F:\website\Nuwanda-space
```

也可以用短命令：

```powershell
cd F:\website\Nuwanda-space
```

创建一个文件夹：

```powershell
New-Item -ItemType Directory -Path assets
```

创建多层文件夹：

```powershell
New-Item -ItemType Directory -Path assets\css
New-Item -ItemType Directory -Path assets\js
New-Item -ItemType Directory -Path data\comments
```

创建一个空文件：

```powershell
New-Item -ItemType File -Path index.html
```

创建多个空文件：

```powershell
New-Item -ItemType File -Path index.html
New-Item -ItemType File -Path post.html
New-Item -ItemType File -Path about.html
New-Item -ItemType File -Path assets\css\style.css
New-Item -ItemType File -Path assets\js\main.js
New-Item -ItemType File -Path assets\js\post.js
New-Item -ItemType File -Path assets\js\utils.js
New-Item -ItemType File -Path data\posts.json
New-Item -ItemType File -Path data\comments\first-post.json
```

如果文件已经存在，`New-Item` 可能报错。可以先用 `Test-Path` 检查：

```powershell
Test-Path index.html
```

删除空文件：

```powershell
Remove-Item index.html
```

删除文件夹：

```powershell
Remove-Item assets -Recurse
```

注意：删除命令要小心，尤其是带 `-Recurse` 时会删除文件夹里的所有内容。

### Git Bash / macOS / Linux 对照

查看当前所在目录：

```bash
pwd
```

查看当前目录下的文件和文件夹：

```bash
ls
```

进入某个文件夹：

```bash
cd /f/website/Nuwanda-space
```

创建一个文件夹：

```bash
mkdir assets
```

创建多层文件夹：

```bash
mkdir -p assets/css assets/js data/comments
```

创建一个空文件：

```bash
touch index.html
```

创建多个空文件：

```bash
touch index.html post.html about.html
touch assets/css/style.css
touch assets/js/main.js assets/js/post.js assets/js/utils.js
touch data/posts.json data/comments/first-post.json
```

删除文件：

```bash
rm index.html
```

删除文件夹：

```bash
rm -r assets
```

注意：`rm -r` 会递归删除文件夹内容，执行前要确认路径正确。

### 本项目第一版结构创建命令

PowerShell 版本：

```powershell
New-Item -ItemType Directory -Path assets\css
New-Item -ItemType Directory -Path assets\js
New-Item -ItemType Directory -Path assets\images
New-Item -ItemType Directory -Path data\comments
New-Item -ItemType File -Path index.html
New-Item -ItemType File -Path post.html
New-Item -ItemType File -Path about.html
New-Item -ItemType File -Path assets\css\style.css
New-Item -ItemType File -Path assets\js\main.js
New-Item -ItemType File -Path assets\js\post.js
New-Item -ItemType File -Path assets\js\utils.js
New-Item -ItemType File -Path data\posts.json
New-Item -ItemType File -Path data\comments\first-post.json
New-Item -ItemType File -Path .gitignore
```

Git Bash / macOS / Linux 版本：

```bash
mkdir -p assets/css assets/js assets/images data/comments
touch index.html post.html about.html
touch assets/css/style.css
touch assets/js/main.js assets/js/post.js assets/js/utils.js
touch data/posts.json data/comments/first-post.json .gitignore
```

## 阶段 1：网页基础

需要理解：

- HTML：网页内容结构。
- CSS：网页样式。
- JavaScript：网页交互和数据加载。
- DOM：JavaScript 操作网页元素的接口。
- JSON：前后端常用的数据格式。
- Fetch API：浏览器请求数据的方式。

本项目会用到：

```text
index.html        页面结构
site.css          视觉样式
main.js           加载文章、渲染文章
posts.json        文章数据
```

优先学习点：

- HTML：`head`、`body`、`header`、`main`、`article`、`section`、`footer`。
- CSS：选择器、盒模型、颜色、字体、间距、Flexbox、Grid、媒体查询。
- JavaScript：变量、函数、数组、对象、事件、`fetch()`、`async/await`。
- JSON：数组、对象、字符串、数字、布尔值。

练习：

1. 写一个只有标题和正文的 HTML 页面。
2. 用 CSS 改字体、宽度、行高和颜色。
3. 用 JavaScript 把一段文字插入页面。
4. 用 `fetch()` 读取 `data/posts.json` 并显示标题。

## 阶段 2：网站发布

需要理解：

- 静态网站：只由 HTML、CSS、JS、图片等文件组成。
- 托管：把文件放到服务器或平台，让别人能访问。
- CDN：把网站文件分发到离用户更近的节点。
- CI/CD：代码变化后自动构建和部署。
- Cloudflare Pages：静态网站托管和自动部署工具。

本项目流程：

```text
本地修改 -> git commit -> git push -> GitHub -> Cloudflare Pages 自动部署
```

重点概念：

- Build command：构建命令。第一版没有构建工具，可以留空。
- Output directory：部署目录。第一版可以使用项目根目录。
- Production deployment：正式部署。
- Preview deployment：预览部署。

练习：

1. 推送一次小修改到 GitHub。
2. 观察 Cloudflare Pages 是否自动部署。
3. 打开线上地址确认变化。
4. 回到 GitHub 查看 commit 记录。

## 阶段 3：互联网基础

需要理解：

- URL：网页地址。
- Domain：域名。
- DNS：把域名解析到服务地址。
- HTTPS：加密访问。
- HTTP Request：浏览器发出的请求。
- HTTP Response：服务器返回的响应。
- Status code：状态码，例如 `200`、`404`、`500`。
- Cache：缓存。

本项目会遇到：

- `*.pages.dev` 是 Cloudflare Pages 提供的免费访问地址。
- 自定义域名需要购买域名，但 DNS 可以交给 Cloudflare 管理。
- 静态资源可能被 CDN 缓存，更新后有时需要等待。

练习：

1. 打开浏览器开发者工具。
2. 查看 Network 面板。
3. 刷新博客页面。
4. 找到 `index.html`、`site.css`、`main.js`、`posts.json` 的请求。

## 阶段 4：内容管理

需要理解：

- 文章元数据：标题、日期、标签、slug、摘要。
- Slug：用于 URL 或文章标识的短名称。
- 标签：按主题组织文章。
- 归档：按时间组织文章。
- Markdown：适合写文章的纯文本格式。

第一版建议先用 JSON 管理文章。等你熟悉流程后，再考虑 Markdown 或静态站点生成器。

文章字段建议：

```json
{
  "slug": "first-post",
  "title": "第一篇博客",
  "date": "2026-05-18",
  "tags": ["start"],
  "summary": "项目第一篇文章。",
  "content": "<p>正文内容。</p>"
}
```

练习：

1. 添加第二篇文章。
2. 给文章加标签。
3. 在页面上显示标签。
4. 增加一个只显示某个标签文章的筛选按钮。

## 阶段 5：Cloudflare R2

需要理解：

- 对象存储：保存图片、文件、JSON 等对象。
- Bucket：对象存储中的容器。
- Object key：对象路径或文件名。
- Public access：公开访问。
- Binding：Worker 或 Pages Function 访问 Cloudflare 资源的绑定配置。

本项目建议用途：

- 先把博客图片放到 R2。
- 再考虑把文章 JSON 或附件放到 R2。
- 不要第一版就依赖 R2，否则调试复杂度会上升。

练习：

1. 创建一个 R2 bucket。
2. 上传一张博客图片。
3. 获取可访问地址。
4. 在文章中引用这张图片。

## 阶段 6：Workers 和 Pages Functions

需要理解：

- Serverless：不用自己管理服务器的后端函数。
- API：前端通过固定路径请求数据。
- Request / Response：函数接收请求并返回响应。
- Environment variables：环境变量。
- Bindings：把 R2、KV 等资源绑定给函数。
- CORS：跨域请求限制。

优先学习 Pages Functions：

```text
Cloudflare Pages 项目
  functions/
    api/
      posts.js
```

未来可能接口：

```text
GET /api/posts
GET /api/posts/first-post
GET /api/tags
POST /api/comments
```

练习：

1. 写一个返回 `{ "ok": true }` 的 API。
2. 前端用 `fetch('/api/health')` 请求它。
3. 再让 API 返回文章列表。
4. 最后尝试让 API 读取 R2。

## 阶段 7：安全和维护

需要理解：

- XSS：不要把不可信 HTML 直接插入页面。
- 输入校验：用户提交的数据不能直接信任。
- Rate limit：限制请求频率。
- Secret：密钥不能写进前端代码。
- 备份：文章和配置要可恢复。
- 依赖更新：如果后期使用 npm 包，需要关注安全更新。

本项目注意：

- 第一版不要开放用户提交内容。
- 评论系统需要审核、防垃圾内容和接口保护。
- 管理后台需要认证，不要公开写入接口。

## 后期可选技术

静态站点生成器：

- Astro：适合内容站和组件化。
- Hugo：速度快，适合 Markdown 博客。
- Eleventy：轻量，适合静态内容。

前端框架：

- React：生态大，但第一版不是必须。
- Vue：上手友好，但第一版也不是必须。

数据工具：

- Cloudflare KV：键值存储，适合小配置或缓存。
- D1：Cloudflare SQLite 数据库，适合结构化数据。
- R2：对象存储，适合图片、附件、大 JSON。

不要过早学习：

- 登录系统。
- OAuth。
- 数据库设计。
- 前端框架全家桶。
- 服务端渲染。
- 复杂构建工具。

先把静态博客发布上线，再逐步补这些知识。

## 关键词索引

- HTML：网页结构。
- CSS：网页样式。
- JavaScript：网页交互。
- DOM：页面对象模型。
- JSON：数据交换格式。
- Fetch API：浏览器请求数据。
- Git：版本控制。
- GitHub：远程代码仓库。
- Cloudflare Pages：静态网站部署。
- Cloudflare Workers：Serverless 后端函数。
- Pages Functions：Cloudflare Pages 内置函数。
- R2：Cloudflare 对象存储。
- DNS：域名解析。
- CDN：内容分发网络。
- API：程序之间交换数据的接口。
- CORS：浏览器跨域安全机制。
- CI/CD：自动构建和部署。

# 本地开发指南

本工程只建立开发环境，不含登录、评论、投稿、正式内容或 OSS 上传。源码在仓库根目录的 `src/` 与 `public/`；根目录旧 HTML 已备份至 `.local/legacy-site-20261015/`。历史文档仍保留。

## 首次准备

Windows PowerShell，工作目录 `F:\website\Nuwanda-space`：

```powershell
# 安装项目内绿色版 Node 24.22.0，校验官方 SHA256；已有则直接复用
.\scripts\setup-node.ps1
# 使用该 Node 执行 npm；仅改变子进程 PATH
.\scripts\local.ps1 ci
.\scripts\local.ps1 run setup
.\scripts\local.ps1 run db:up
.\scripts\local.ps1 run verify
```

`npm ci` 使用已提交的 `package-lock.json`。本次首次搭建先用 `npm install` 生成锁文件，后续统一用 `ci`。仓库不保存 Node 二进制或依赖目录；其他电脑须自行获取这些依赖。

若已用版本管理器安装 `.node-version` 指定的 Node，可直接执行以下 npm 命令。在 Windows 当前系统 Node 仍为 24.15.0，所以请使用 `local.ps1` 包装命令，如 `npm run build` 对应 `.\scripts\local.ps1 run build`。Linux/macOS 使用自己的 Node 版本管理器和 Docker，本工程的 `.mjs` 脚本、Compose 不依赖 PowerShell；跨平台运行尚未实测。

本机已有 Docker Desktop，CLI 位于 `D:\Docker\resources\bin\docker.exe`。数据库脚本会优先查找 PATH，然后查找此已知路径及默认安装路径；凭证助手 PATH 仅对子进程补充。其他安装位置可把 Docker 的 `resources/bin` 加入当前终端 PATH。只接受本地 named pipe / Unix socket 的 Docker context，拒绝 `DOCKER_HOST` 覆盖，不会启动或安装 Docker Desktop。

## 日常启动与停止

```sh
npm run dev         # 仅 Astro：http://127.0.0.1:4321
npm run dev:full    # 等待 PostgreSQL 健康，再以前台运行 Astro
```

前台 Astro 用 `Ctrl+C` 停止，再执行 `npm run stop` 停止开发数据库。`dev:full` 不会在 Ctrl+C 后自动停数据库。没有后台进程管理器，也没有修改 Windows 服务。

可用验收路径：`/`、`/environment/ssg/`、`/environment/ssr/`、`/api/health`、`/local-mark.svg`。浏览器 JS 检查按钮现位于 `/environment/browser/`；首页已替换为正式 v0.1 页面。SSR/API 请求标识每次变化。API 只表示运行时可用，数据库需单独测试。

## 环境文件

`npm run setup` 创建被 Git 忽略的 `.env.local`，生成独立随机数据库密码、管理员密码和 SESSION_SECRET。重复运行只校验，绝不覆盖已有文件。`.env.example` 仅是可分享的字段说明，不能直接用于启动数据库。

- `DATABASE_URL` 固定到回环地址、账号 `nuwanda_dev`、数据库 `nuwanda_dev`，端口及密码必须与 `DB_PORT` / `DB_PASSWORD` 相符。
- `SESSION_SECRET` 仅为本地开发预备，目前没有认证逻辑使用它。
- `OSS_MODE=mock`，其他 OSS 项仅为模拟占位。当前没有 OSS 网络请求，没有真实 AccessKey，禁止将凭证改成 `PUBLIC_*`。
- 数据库脚本只读取文件中的本地配置，不采用终端中的 `DATABASE_URL` / `PG*` 连接配置。Compose 子进程也显式使用文件值。
- Astro/Vite 自动读取开发环境文件；未来 Node 生产业务要显式注入服务端环境变量。当前 `npm start` 的验收路由不需要密钥，不代表生产环境变量、认证、数据库集成已完成。

## 数据库

```sh
npm run db:up       # 创建/启动独立 Compose 项目并等待健康
npm run db:status   # 查看容器与健康状态
npm run db:test     # TCP 密码认证、SELECT、账号权限、临时表写入与回滚
npm run db:logs     # 最近 60 行数据库日志
npm run db:stop     # 停止但保留数据
npm run db:test:persistence # 可选：写入随机测试记录，停机并重建此容器后验证，再移除自己的测试表
```

Compose 项目固定为 `nuwanda-space-local`，仅包含 PostgreSQL `18.6-alpine`。命名卷 `nuwanda-space-local_postgres_data` 挂载 `/var/lib/postgresql`（PostgreSQL 18 的目录约定）。开发账号无 superuser/createdb/createrole 权限，仅拥有自己的开发数据库。容器内另设独立初始化管理员。

`db:test:persistence` 会短暂中断这个本地实例，故不包含在日常 `verify` 中。它不删除数据卷，只删除自己本次创建的随机测试 schema 和表；失败后若数据库无法连接，需按报错检查实例并清理该测试 schema。

首次生成配置会实际尝试绑定 5432、5433、5434，选择可用端口。本次为 `127.0.0.1:5433`。端口已在环境文件生成后被其他程序占用时，人工同时修改 `DB_PORT` 与 `DATABASE_URL` 的端口，再执行 `db:up`；不要停止其他项目占用端口的进程。

以下命令会**删除此开发卷内的全部数据**，需要自己明确选择；本次验收没有执行：

```sh
npm run db:reset -- --confirm-local-reset
```

该脚本先限制本地 Docker context 和数据库配置，再只对固定 Compose 项目执行 `down --volumes` 和重新启动。不带确认参数会拒绝。不要用全局 `docker system prune`。密码只在空数据卷初始化时生效；有数据后改 `.env.local` 不会自动修改数据库内密码，需要保留旧密码或手动维护此本地数据库。

## 检查、构建与测试

```sh
npm ls --depth=0
npm run check             # Astro + TypeScript
npm test                  # 5 项：本地数据库/重置、异常脱敏、严格本地 Docker socket 等安全边界
npm run build             # 生产构建
npm run test:output       # HTML/CSS/JS/SVG + 静态/服务端边界
npm run test:dev          # 自动启停一个回环临时端口的 dev server
npm run test:production   # 自动启停真正的构建后 Node 服务
npm run check:security    # 当前 Git 工作区、忽略规则和构建产物中的密钥检查
npm run verify            # 顺序执行以上检查，最后执行 db:test
npm start                 # 手工预览生产产物：http://127.0.0.1:4322；Ctrl+C 停止
```

`verify` 不安装依赖，也不自动启动数据库；先执行 `ci`、`setup`、`db:up`。失败即非零退出，不跳过数据库后宣称全通过。HTTP smoke 检查状态码、MIME、内容、每次请求标识、静态资源和敏感路径；没有引入端到端测试框架。Git 敏感检查仅是启发式扫描当前文件和已跟踪路径，不覆盖完整 Git 历史或所有密钥格式。

`output: 'static'` 默认预渲染；仅 SSR 验收页和 API 设置 `prerender=false`，无需使用旧的 `hybrid` 配置。`dist/client/` 包含静态 HTML、CSS、浏览器 JS、SVG；`dist/server/entry.mjs` 与服务端 chunks 需要 Node。只复制 `dist/client/` 到 Nginx 会丢失 SSR/API。

验收工程关闭小 CSS/JS 的自动内联，便于独立检查文件和 HTTP MIME；后续可按性能需求调整。Vite 开发服务拒绝环境文件、Git、本地备份、证书和运维文档路径，仍只绑定回环地址。Windows 命令包装器仅对子进程禁用 Astro 匿名遥测。

本次只验证 Windows 本地生产构建的启动能力；正式 Linux 服务的 v0.1 方案和实测状态见 `docs/deployment-homepage-v01.md` 与 `docs/homepage-v01-report.md`。**不要执行现有旧部署脚本，它仍使用旧 HTML 白名单。**

## 常见问题

- `EBADENGINE`：当前终端使用了系统旧 Node。改用 `local.ps1` 或正确选择 `.node-version` 的 Node；不要关闭 engine-strict。
- npm 缓存报 `EEXIST` / `ENOTDIR`：项目 `.npmrc` 已隔离到 `.local/npm-cache`。确认从仓库根目录执行，不要删除全局缓存。
- `docker` 找不到：检查上述已有安装路径；不意味着 Docker 没安装。
- `docker-credential-desktop` 找不到：脚本会给子进程补充 CLI 所在目录；手工运行 Docker 时也需此 PATH。
- Docker 引擎不可用：手动打开已有 Docker Desktop，待其运行再重试。不要贸然安装或重置 Docker。
- Docker 拉取超时：保留日志，检查当前 Docker 代理/网络；不改全局 daemon 配置，不把 HTTP 成功当镜像可用。
- 数据库连接失败：先看 `db:status` / `db:logs`，确认端口和初始化密码一致；不要尝试生产连接串。
- `EADDRINUSE`：开发端口 4321 严格拒绝自动漂移，换空闲端口 `npm run dev -- --port 4325`；生产可在当前终端设置 `PORT`，主机仍被强制为 127.0.0.1。
- PowerShell 执行策略拒绝脚本：可直接用项目 Node 运行 npm-cli.js，或在理解原因后仅为当前终端调整策略。本次未改执行策略。

## 后续工作

登录与角色权限、会话存储/CSRF/审核流程；数据库 schema、迁移和备份恢复；MD/MDX 内容组织；OSS 最小权限临时凭证、上传校验、容量/类型限制与分发策略；Linux 生产运行时和部署方案；Git 变更审阅及与远端同步。本次只列建议，不实施。

参考：[Astro 混合渲染](https://docs.astro.build/en/guides/on-demand-rendering/)、[Node Adapter](https://docs.astro.build/en/guides/integrations-guide/node/)、[PostgreSQL 官方镜像](https://hub.docker.com/_/postgres)、[Node 官方发布索引](https://nodejs.org/dist/index.json)。

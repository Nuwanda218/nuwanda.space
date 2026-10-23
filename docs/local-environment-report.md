# 本地开发环境检查与验收报告

日期：2026-10-15（Asia/Shanghai）。目录：`F:\website\Nuwanda-space`。

本次在原仓库根目录建立 Astro 环境。用户在检查后明确授权替换旧页面架构，远端 Git 冲突留待后续。本次没有 SSH、部署、修改 DNS/HTTPS/生产数据库、访问真实 OSS 或提交/推送 Git。

## A. 环境检查

| 项目 | 检查结果 |
|---|---|
| 系统 | Windows 11 家庭版中文版，10.0.26200，x64 |
| CPU | Intel Core i7-14650HX，16 核 / 24 逻辑处理器 |
| 内存 | 总计 15.78 GiB，检查时可用 2.90 GiB（瞬时值） |
| 磁盘 | 开工 C/D/F 剩余 11.31/73.97/19.73 GiB；搭建后 11.10/72.46/18.99 GiB（瞬时值） |
| 系统 Node/npm | `D:\nodejs\node.exe` v24.15.0 / npm 11.12.1，未修改 |
| 项目 Node/npm | 官方当前 24 LTS v24.22.0 / npm 11.19.1；项目内绿色版，未改系统 PATH |
| Node 校验 | 官方 ZIP SHA256：`f9683a19877e12a9b167305c8db71040d812876359de21f0d2e97c3f321f80c3`，与官方 SHASUMS256.txt 相符 |
| 版本管理器 | PATH 中未发现 fnm/nvm/volta；使用 `.node-version` 和项目内启动包装器 |
| 包管理器 | 原站无 package.json/锁文件；本次选择 npm 单一 package-lock，固定直接依赖；本机另有 pnpm，未改动 |
| Git | 2.47.1.windows.2；已有仓库与 master 历史，未重新初始化、切分支、提交、推送或改远端 |
| 原项目 | 根目录静态 HTML，占位首页 367 字节，其余站点文件为空；未发现 Astro、构建/测试脚本、本地环境文件或数据库配置 |
| 原工作区 | 已有未提交的 `.gitignore`、README、deployment 文档修改，以及设计/研究文档；均保留 |
| Astro | 7.3.8，Node Adapter 11.1.7 standalone；`output: static`，2 个预渲染页面 + 1 个 SSR 页 + 1 个动态 API |
| 类型/SQL工具 | @astrojs/check 0.9.10，TypeScript 5.9.3，@types/node 24.19.2，pg 8.23.1 |
| Docker | 实际已安装并运行；CLI 不在 PATH，位于 `D:\Docker\resources\bin\docker.exe` |
| Docker 版本 | Desktop 4.67.0，Engine/CLI 29.3.1，Compose v5.1.1，desktop-linux 本地 named pipe |
| Docker 服务 | `com.docker.service` 显示 Stopped，但现有 Desktop 后端与 Engine 已正常运行；未启动或改动此 Windows 服务 |
| 原 PostgreSQL | PATH 未发现 psql/pg_ctl、未发现 PostgreSQL Windows 服务；Docker 有另一个缓存镜像 18.3-alpine，未动其数据 |
| 新开发 PostgreSQL | 官方镜像 `postgres:18.6-alpine`，SQL 返回 server_version=18.6；命名卷、健康检查、384 MiB 容器内存上限 |
| 本地 DB | `nuwanda_dev` 数据库及同名账号；初始化管理员另设；仅映射 `127.0.0.1:5433` |
| 端口 | setup 实测绑定选择 5433；5432 当时不可绑定。没有终止占用进程或开放局域网端口 |

版本核实使用官方 npm registry、[Node 发布索引](https://nodejs.org/dist/index.json)、[Astro 官方说明](https://docs.astro.build/en/guides/on-demand-rendering/)、[PostgreSQL 版本支持表](https://www.postgresql.org/support/versioning/)和容器实际运行结果，不能用搜索缓存里的旧版本代替。

## B. 文件变更

| 文件 | 操作与目的 |
|---|---|
| `.gitignore` | 在原内容后追加依赖、构建、Astro 缓存、本地环境文件、数据库目录、日志与临时文件的排除项，放行 `.env.example` |
| `README.md` | 顶部加入当前开发入口、架构更新和旧部署脚本不适用的说明；保留原文及原有未提交修改 |
| `package.json`、`package-lock.json` | 新增 npm 工程、精确依赖与统一开发/构建/测试/数据库命令 |
| `.node-version`、`.npmrc` | Node LTS 版本约束、官方 registry、严格引擎检查、项目内缓存，避免异常全局缓存 |
| `astro.config.mjs` | 默认 SSG + Node Adapter，回环监听，严格端口；CSS/JS 独立输出；开发服务拒绝本地/运维敏感路径 |
| `tsconfig.json` | Astro strict 类型检查，只包含项目源码，排除本地备份/依赖/产物 |
| `.env.example` | 无真实密钥的 DATABASE_URL/SESSION_SECRET/OSS 占位说明 |
| `compose.yaml` | 固定独立项目、PostgreSQL 18.6、回环端口、命名卷、健康检查和资源限制 |
| `scripts/postgres-init.sh` | 初始化独立、非超级用户开发角色及数据库 |
| `scripts/setup-node.ps1` | 下载固定官方 Node ZIP、校验 SHA256，安装到项目 `.local/tools/` |
| `scripts/local.ps1` | 用项目 Node 执行 npm，临时设置 PATH/关闭 Astro 匿名遥测，然后恢复原环境 |
| `scripts/local-env.mjs` | 集中解析本地环境，限制数据库地址/角色/库名、拒绝远端 Docker、定位现有 CLI、固定 Compose 操作范围 |
| `scripts/setup.mjs` | 检测可用端口、生成本地随机密钥；已有配置只校验，不覆盖 |
| `scripts/db.mjs` | 启动、停止、状态、日志、需要显式确认的本地卷重置 |
| `scripts/db-test.mjs` | TCP 密码认证、角色权限、SQL 计算及临时表读写回滚 |
| `scripts/db-persistence-test.mjs` | 随机测试 schema 内写入记录，停止并重建此容器，验证命名卷保留数据，再清理自己创建的测试对象 |
| `scripts/serve.mjs` | 生产 Node 入口，强制回环主机，默认端口 4322 |
| `scripts/check-output.mjs` | 检查真正的静态与服务端构建产物及资源边界 |
| `scripts/smoke.mjs` | 自动启停 dev 或构建后生产服务，检查 HTTP、资源、每次请求 SSR/API 标识及敏感路径 |
| `scripts/check-security.mjs` | 当前 Git 工作区敏感路径、忽略规则和本地密钥/典型密钥格式扫描；扫描构建产物 |
| `tests/local-safety.test.mjs` | 5 项轻量测试：本地 DB 边界、开发密钥/模拟 OSS、重置确认、异常脱敏和严格本地 Docker socket |
| `src/layouts/LocalLayout.astro` | 简洁共用验收布局与样式 |
| `src/pages/index.astro` | 环境验收入口及浏览器脚本按钮，无正式业务 |
| `src/pages/environment/{ssg,ssr}.astro` | 分别验证预渲染和每次请求渲染 |
| `src/pages/api/health.ts` | 最小动态 API，不读取数据库或暴露环境信息 |
| `public/local-mark.svg`、`public/robots.txt` | 本地静态资源验收及禁止搜索索引 |
| `docs/local-development.md` | 首次安装、日常命令、数据库、构建和排错指南 |
| `docs/local-environment-plan.md` | 范围、选择、边界与实施检查表 |
| `docs/local-environment-report.md` | 本报告 |

移动旧站的 9 个文件：`index.html`、`about.html`、`post.html`、`assets/css/style.css`、`assets/js/{main,post,utils}.js`、`data/posts.json`、`data/comments/first-post.json`。备份目录为 `.local/legacy-site-20261015/`，逐文件 SHA256 与开工基线一致。Git 显示这些旧路径为删除，待以后人工审阅与远端处理。

本地生成但不入库：`.env.local`、`.local/tools/`、`.local/npm-cache/`、`.local/baseline/`、`.astro/`、`node_modules/`、`dist/` 和 Docker 命名卷。未覆盖系统软件、Docker 设置或现有运维配置。

保全检查：除明确追加说明的 README/.gitignore 与旧站迁移外，52 个既有文件哈希不变；11 个既有容器 ID 全部保留。既有 `docs/deployment.md` 的未提交变化为开工前已有，不属于本次修改。

## C. 实际测试

下表的 npm 命令均经 `scripts/local.ps1` 调用项目 Node，例如 `npm run verify` 实际为 `.\scripts\local.ps1 run verify`。

| 命令或检查 | 结果 | 验证依据 |
|---|---|---|
| 官方 Node 下载、Get-FileHash SHA256 比对 | 通过 | 官方 ZIP 校验一致，项目 node --version 为 v24.22.0 |
| `npm install` / 最终依赖的 `npm ci` | 通过 | 最终 ci 安装 301 个包，审计 302 个包，0 vulnerabilities |
| `npm ls --depth=0` | 通过 | 6 个固定直接依赖均满足，无缺失/invalid |
| `npm run setup` 重复运行 + 环境文件 SHA256 对比 | 通过 | Existing .env.local validated；文件哈希保持不变 |
| Docker version / compose version / context inspect | 通过 | 本地 Linux Engine 可达，endpoint 为 named pipe |
| `docker compose … config --quiet` | 通过 | Compose 解析退出 0；未打印包含密码的展开配置 |
| `npm run db:up` | 通过 | 独立实例启动，health=healthy |
| `docker inspect … PortBindings/Mounts` | 通过 | 仅 127.0.0.1:5433，命名卷挂载 /var/lib/postgresql，初始化脚本只读挂载 |
| `npm run check` | 通过 | 6 个 Astro/TS 文件，0 errors / 0 warnings / 0 hints |
| `npm test` | 通过 | 5 tests，5 pass，0 fail（包含审查后补充的安全回归测试） |
| `npm run build` | 通过 | 2 页预渲染完成，同时输出 Node 服务端入口；最终构建约 0.58 秒 |
| `npm run test:output` | 通过 | 6 个 client 文件；SSG HTML/CSS/JS/SVG 存在，SSR/API 无静态 HTML |
| `npm run test:dev` | 通过 | 实际 HTTP：首页/SSG/SSR/API/资源、每请求标识、404、敏感路径拒绝；测试自行停服务 |
| `npm run test:production` | 通过 | 实际启动构建后的 entry.mjs；首页响应等于 dist/client/index.html，SSR/API 每请求变化，资源 MIME 正确 |
| `npm run check:security` | 通过 | 本地密钥与敏感路径被忽略；当前源码和生产产物未发现本次随机密钥/私钥/典型 OSS AccessKey |
| `npm run db:test` | 通过 | 主机 TCP 密码认证；SELECT 1+1=2；开发账号 rolsuper/rolcreatedb/rolcreaterole 均 false；临时表写入读取并回滚 |
| `npm run db:test:persistence` | 通过 | 写入 SQL 标记，stop + --force-recreate 后仍可读取；只清理自己本次创建的随机测试表/schema，未删除卷 |
| `npm run db:reset`（不带确认） | 通过（预期拒绝） | 退出 1，提示必须 --confirm-local-reset，未调用数据卷删除 |
| `npm run verify` 整条流水线 | 通过 | 按顺序运行所有日常检查，最后 DB 测试成功，整体退出 0 |
| 原文件哈希 / 其他容器 ID 保全 | 通过 | 9 个旧站备份一致；52 个其他既有文件一致；11 个原容器 ID 保留 |
| `git diff --check` | 通过 | 未报告空白错误 |
| `scripts/setup-node.ps1`、PS Parser、`node --check scripts/*.mjs tests/*.mjs` | 通过 | 已有绿色版 Node 复用成功；PowerShell 和 JavaScript 源码语法通过 |
| 只读代码审查及复审 | 通过 | 两项安全边界问题经回归复现并修复；复审再次运行 5/5 测试通过 |
| `npm run stop`、`npm run db:status`、本次 Node 进程/端口检查 | 通过 | 开发数据库 Exited (0)，卷保留；本次测试启动的 Node 进程已退出，4321/4322/5433 未监听 |

完整运行输出保存在 `.local/ci.log`、`.local/verify.log`、`.local/persistence.log`、`.local/stop.log`；基线在 `.local/baseline/`。以上日志和基线不包含环境文件正文或密码。最终 verify 记录于本地时间 22:21–22:22；收尾时已停止数据库，以节省内存。再次启动请执行指南中的 db:up 或 dev:full。

### 已执行但曾失败，随后修复

| 命令 | 原始问题 | 修复和复验 |
|---|---|---|
| 初次 `npm install` | 全局 npm-cache 的 mkdir EEXIST/ENOTDIR | `.npmrc` 改为项目缓存；install、最终 ci 均成功，未删除全局缓存 |
| 初次 `db:up` | docker-credential-desktop 不在 PATH | 给 Docker 子进程补充其 bin 目录；镜像拉取、启动、重建均成功 |
| 首次 `check` | ts2307，node:crypto 缺少类型声明 | 固定加入 @types/node，最终 0 errors |
| 首次 `test:output` | 预期独立 CSS 文件，但 Astro 默认将小资源内联 | 最小配置独立输出 CSS/JS；文件与 HTTP 资源检查通过 |
| 首次 `test:dev` | 将敏感路径的正常 403 错当成失败 | 改为接受 403/404，仍拒绝 200 |
| 后续 `test:dev` | Vite 默认能返回 compose.yaml（200） | 添加根目录敏感材料拒绝规则；开发和生产均复验通过 |
| 实现前的安全测试 | local-env.mjs 尚不存在 | 用于建立失败基线；实现后 3 项测试全通过 |
| 审查后的 2 项回归测试 | 无效 URL 异常携带原输入；原 endpoint 前缀检查不能排除远程命名管道 | 固定脱敏异常；仅接受本机 `npipe:////./pipe/...` 或无主机名的绝对 Unix socket；回归复验通过 |

### 未执行或未覆盖

- 未执行带确认参数的 `db:reset`，避免删除已验证的数据卷；只验证其拒绝保护。
- 未运行 Linux/macOS、正式服务器、反向代理、线上 TLS/DNS、真实 OSS、认证/业务接口或数据库业务模型测试；按本次边界留待后续。
- 未安装复杂浏览器测试框架；按钮点击、视觉效果、移动端兼容尚未做真实浏览器自动验收。当前页面、资源和路由结果来自 HTTP 与构建产物检查，不冒充浏览器交互实测。
- 未扫描完整 Git 历史；敏感检查覆盖当前文件与已跟踪路径，不能证明所有历史版本不存在其他密钥。

## D. 混合渲染边界

静态资源实际输出：`dist/client/index.html`、`dist/client/environment/ssg/index.html`、`dist/client/_astro/*.css`、`dist/client/_astro/*.js`、`dist/client/local-mark.svg`、`dist/client/robots.txt`。`dist/server/` 约 505 KB / 15 个文件，入口为 `entry.mjs`，包含动态路由及服务端 chunks，需要 Node 和适用的运行依赖。

适配器安装在新工程中，没有改造旧页面渲染逻辑。日志中的 `output: static` + `mode: server` 是默认静态页面并存在动态路由的正常构建结果。Node Adapter 提示启用 filesystem sessions 是适配器默认能力，不代表已实现统一登录或会话业务。

旧部署脚本上传旧根目录白名单，本次没有运行或修改；它不能发布此 Astro 工程。未来部署须明确静态资源和 Node 服务的分工，不能只复制 client 就宣称 SSR/API 已上线。

## E. 后续建议

先审阅本地变更并处理 Git，再逐项实现内容模型/Markdown/MDX、PostgreSQL schema 与迁移、身份角色和审核、OSS 临时凭证上传。生产阶段再确定 Linux Node 运行依赖、环境变量注入、反向代理、进程管理、备份恢复与回滚。上述业务和生产配置本次均未实施。

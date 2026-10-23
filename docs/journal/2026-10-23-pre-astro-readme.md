# Astro 工程首次提交前的 README 快照

> 归档日期：2026-10-23。以下为整理前原文，包含不同阶段的历史状态、旧命令和旧目录；当前开发请以根目录 README 和现行源码为准。归档不代表本日重新核验了线上状态。

# Nuwanda Space

> **2026-10-18 素材区更新**：新增内容请放在根目录 `materials/`，每条一个文件夹，内含 `index.md` 和照片。系统自动发现、排序、渲染；不用改 TypeScript 数组或图片导入。操作说明：[本机素材使用指南](docs/素材区使用指南.md) · [素材入口](materials/README.md)。页面与样式位于 `src/`，换风格不需要移动素材。以下 v0.1 内容为历史说明。

> **首页 v0.1（2026-10-15）**：暖白摄影首页与 About / Life / Notes / Timeline 已实现，两张用户照片已整理至 `src/assets/photos/`。当前使用 Astro SSG + Node standalone，保留 SSR/API。设计、维护说明：[首页使用与维护](docs/homepage-v01.md)；部署：[v0.1 部署方案](docs/deployment-homepage-v01.md)；实际状态和测试证据以 [v0.1 验收报告](docs/homepage-v01-report.md) 为准。
>
> 本地启动：`.\scripts\local.ps1 run dev`。所有下文的纯 HTML 目录、旧部署命令与“无应用进程”状态属于 **v0.1 之前的历史记录**，新工程不要调用 `deploy/deploy-site.ps1`。当前源码入口为 `src/pages/index.astro`，公共页面样式为 `src/styles/site.css`。


> **2026-10-15 本地架构更新**：仓库根目录现采用 Astro + Node Adapter + PostgreSQL Compose。源码为 `src/`、`public/`，构建产物为 `dist/client/` 和 `dist/server/`。旧页面已备份至被忽略的 `.local/legacy-site-20261015/`，本次未部署、未提交、未推送。
>
> 当前开发入口：[本地开发指南](docs/local-development.md) · [环境与测试报告](docs/local-environment-report.md) · [实施方案](docs/local-environment-plan.md)。
>
> 下文保留此前部署记录，反映旧站状态。**旧 `deploy/deploy-site.ps1` 不支持新 Astro 产物，请勿用于此次工程。** 新的生产部署方案需另行设计和授权。

个人博客项目。域名 `nuwanda.space`，部署在自建服务器 `weihua` 上，由 Nginx 直接托管静态文件。

## 当前状态

| 项 | 状态 |
|---|---|
| 域名与 HTTPS | ✅ 已上线，`https://nuwanda.space/` 返回 200 |
| 服务器部署 | ✅ Nginx 静态托管，无应用进程 |
| 证书到期检查 | ✅ `nuwanda-cert-check.timer` 已启用（**不自动续期**） |
| 博客本体 | ⚠️ 仅占位页，`post.html`、`about.html`、`assets/`、`data/` 仍为空 |
| 图片存储 | ✅ OSS bucket `nuwanda-blog-assets` 已创建（华北3 张家口，公共读），待上传与防盗链配置 |
| GitHub 远程 | ✅ `Nuwanda218/nuwanda.space`，已同步 |

## 文档索引

所有开发文档、日志、脚本**只保存在本地**，不上传服务器。

| 文档 | 内容 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 服务器架构、两个项目的并存关系、隔离边界、备份回滚 |
| [docs/deployment.md](docs/deployment.md) | 部署规范：服务器只放项目代码；同步流程与验证 |
| [docs/storage.md](docs/storage.md) | 对象存储（OSS）规范：Bucket 信息、访问端点、路径约定、资源包、上传与验证 |
| [.archify/dataflow-nuwanda-topology-20261014-143606/topology.html](.archify/dataflow-nuwanda-topology-20261014-143606/topology.html) | 数据拓扑图（交互式 HTML）：开发者 · 服务器 · 对象存储 · 使用者 四端数据流 |
| [docs/roadmap.md](docs/roadmap.md) | 学习路线（阶段 1–7，含 Cloudflare Pages / R2 / Workers 备选路线） |
| [docs/learn.md](docs/learn.md) | 学习笔记：网页基础、Git、网络、内容管理、安全 |
| [docs/journal/2026-10-14-https-deploy.md](docs/journal/2026-10-14-https-deploy.md) | 开发日志：HTTPS 部署验收记录 |

## 目录结构

```
Nuwanda-space/
├── README.md                  # 本文件（本地）
├── .gitignore
│
├── index.html                 # ┐
├── post.html                  # │ 站点代码
├── about.html                 # │ 唯一会被同步到服务器的内容
├── assets/                    # │ → /srv/nuwanda-blog/web/
├── data/                      # ┘
│
├── docs/                      # 📍 开发文档，不上传
│   ├── architecture.md
│   ├── deployment.md
│   ├── storage.md
│   ├── roadmap.md
│   ├── learn.md
│   └── journal/
│       └── 2026-10-14-https-deploy.md
│
├── deploy/                    # 📍 运维资产，不上传
│   ├── deploy-site.ps1        # 只同步站点代码的部署脚本
│   ├── install_tls.py
│   ├── verify_tls.py
│   ├── verification-20261014.json
│   ├── nginx/nuwanda.space.conf
│   └── systemd/nuwanda-cert-check.{service,timer}
│
└── .deploy-private/           # 🔒 证书私钥暂存（已 gitignore）
```

## 核心规则

> **服务器资源宝贵，只放运行所需的项目代码。**
> 所有开发文档、日志、验收记录、脚本一律留在本地。

- 上传白名单：`index.html`、`post.html`、`about.html`、`assets/`、`data/`
- 其余一切（`README.md`、`docs/`、`deploy/`、`.git/`）**永不上传**
- 服务器上不允许出现 `.md`、`.txt`、`.log` 形式的开发文档或日志

详见 [docs/deployment.md](docs/deployment.md)。

## 常用命令

```powershell
# 预览将要同步的文件（不实际执行）
.\deploy\deploy-site.ps1 -DryRun

# 同步站点代码到服务器
.\deploy\deploy-site.ps1

# 公网只读验证
$env:PYTHONIOENCODING='utf-8'
& 'D:\python310\python.exe' '.\deploy\verify_tls.py'
```

## 待办

1. **编写博客本体**：填充 `post.html`、`about.html`、`assets/css/style.css`、`assets/js/*.js`、`data/posts.json`。
2. **证书续期**：`nuwanda.space` 证书 2027-01-11 23:59:59 UTC 到期，需提前从原签发渠道换证。
3. **OSS 收尾**（详见 [docs/storage.md](docs/storage.md) 第 11 节）：
   - 确认资源包抵扣项与 bucket 冗余类型匹配
   - 配置防盗链 Referer 白名单
   - 设置资源包 80% 用量预警
   - 上传测试图并验证响应头

## 仓库信息

| 项 | 值 |
|---|---|
| 远程地址 | `git@github.com:Nuwanda218/nuwanda.space.git` |
| 分支 | `master`（已设置上游跟踪） |
| 可见性 | ⚠️ 公开仓库 |

> 2026-10-14：仓库名曾误拼为 `nuwanda.sapce`，已在 GitHub 改名修正。
> 旧地址 `nuwanda.sapce` 由 GitHub 自动 301 重定向到新地址。

## 技术栈

纯静态：HTML + CSS + JavaScript，无构建工具、无框架、无服务端进程。

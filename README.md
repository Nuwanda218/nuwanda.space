# Nuwanda Space

个人博客项目。域名 `nuwanda.space`，部署在自建服务器 `weihua` 上，由 Nginx 直接托管静态文件。

## 当前状态

| 项 | 状态 |
|---|---|
| 域名与 HTTPS | ✅ 已上线，`https://nuwanda.space/` 返回 200 |
| 服务器部署 | ✅ Nginx 静态托管，无应用进程 |
| 证书到期检查 | ✅ `nuwanda-cert-check.timer` 已启用（**不自动续期**） |
| 博客本体 | ⚠️ 仅占位页，`post.html`、`about.html`、`assets/`、`data/` 仍为空 |
| GitHub 远程 | ✅ `Nuwanda218/nuwanda.space`，已同步 |

## 文档索引

所有开发文档、日志、脚本**只保存在本地**，不上传服务器。

| 文档 | 内容 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 服务器架构、两个项目的并存关系、隔离边界、备份回滚 |
| [docs/deployment.md](docs/deployment.md) | 部署规范：服务器只放项目代码；同步流程与验证 |
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

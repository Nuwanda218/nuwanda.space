# 2026-10-14 文档整理与部署边界建立

## 背景

用户要求：

1. 修正错误的 Git 信息。
2. 检查并整理本机项目文档。
3. 服务器上只放项目代码，开发日志与文档全部留在本地，不上传服务器。

## 本次变更

### 文档重组

整理前，文档散落在根目录和 `deploy/` 里，且 README 只描述了 Cloudflare Pages 路线，与线上实际架构（自建服务器 + Nginx）脱节。

整理后：

| 变更 | 说明 |
|---|---|
| `learn.md` → `docs/learn.md` | 学习笔记归入 `docs/` |
| `README.md` → 复制为 `docs/roadmap.md` | 原 440 行 Cloudflare 学习路线完整保留为备选路线 |
| `README.md` 重写 | 改为项目总览：当前状态、文档索引、目录结构、核心规则、待办 |
| `deploy/2026-10-14_HTTPS部署验收记录.md` → `docs/journal/2026-10-14-https-deploy.md` | 开发日志归入 `docs/journal/` |
| 新增 `docs/architecture.md` | 服务器架构与两个项目的并存关系 |
| 新增 `docs/deployment.md` | 部署规范：服务器只放项目代码 |

### 部署边界

- 新增 `deploy/deploy-site.ps1`：同步白名单硬编码为 `index.html`、`post.html`、`about.html`、`assets/`、`data/`。
  - 拒绝 0 字节文件（避免把线上页面同步成白页）。
  - 拒绝 `.md`/`.txt`/`.log`/`verification-*`/`.key`/`.pem` 混入。
  - 支持 `-DryRun` 预览。
- `.gitignore` 补充编辑器与暂存目录规则。

### 站点根文件统一

原状态：根目录 `index.html` 为 0 字节，而线上跑的是 `deploy/site-ready/index.html` 占位页 —— 本地与线上不一致，容易误部署成白页。

处理：把占位页内容提升为根目录 `index.html`，删除冗余的 `deploy/site-ready/`。
此后「本地站点根文件 == 服务器站点文件」，部署边界清晰。

## 服务器合规核查

核实时间：2026-10-14。

| 检查项 | 结果 |
|---|---|
| `/srv/nuwanda-blog/web/` | ✅ 仅 `index.html`（367 B） |
| `/srv/weihua/` | ✅ 仅 `index.html`、`proto/index.html` |
| 网页根目录是否存在文档/日志 | ✅ 不存在 |
| 服务器上是否有 `.git` | ✅ 无 |
| 服务器上是否有开发文档 | ✅ 无 |

非代码内容仅存在于 `/root/nuwanda-backup/`（132 KB）和 `/root/weihua-backup/`（132 KB），为部署前的配置快照与回滚基线，位于 `/root` 下、非 Web 可访问，属于运维安全资产而非上传的开发文档。

## Git 状态

本地 remote 指向 `git@github.com:Nuwanda218/nuwanda.sapce.git`。

经 `git ls-remote` 核实：

- `nuwanda.sapce`（拼写错误）→ **仓库真实存在**，含提交 `5e7e6b2`。
- `nuwanda.space`（正确拼写）→ **仓库不存在**（`ERROR: Repository not found`）。

因此问题不在本地 URL 写错，而在 GitHub 上的仓库名本身拼错。
修正需在 GitHub 仓库 Settings 中改名，之后执行：

```powershell
git remote set-url origin git@github.com:Nuwanda218/nuwanda.space.git
```

本机无 `gh` CLI、无 GitHub token，此步骤需人工在浏览器完成。

**2026-10-14 已修正。** 用户在 GitHub 网页将仓库改名为 `nuwanda.space`，随后完成：

```powershell
git remote set-url origin git@github.com:Nuwanda218/nuwanda.space.git
git push -u origin master
```

验证结果：

| 检查项 | 结果 |
|---|---|
| 新地址 SSH 连通性 | ✅ `git ls-remote` 成功 |
| 旧地址 `nuwanda.sapce` | ✅ GitHub 自动 301 重定向到新地址 |
| 推送 | ✅ `5e7e6b2..d452865  master -> master` |
| 本地 HEAD vs 远程 master | ✅ 均为 `d452865`，无差异 |
| 上游跟踪 | ✅ `master` 已跟踪 `origin/master` |

⚠️ 附带发现：该仓库为**公开仓库**（未登录 HTTPS 访问返回 200）。
`docs/architecture.md` 中含服务器公网 IP，但该 IP 本身已通过 `nuwanda.space` 的 DNS A 记录公开，不构成新增信息泄露。仓库内无任何密钥（`.gitignore` 已排除 `*.key`、`*.pem`、`.deploy-private/`）。

## 备份处置决定

**2026-10-14 决定：保留 `/root/nuwanda-backup/` 与 `/root/weihua-backup/`。**

理由：合计仅 264 KB，位于 `/root` 下且 Web 不可访问，是当前唯一的配置回滚依据。
它们属于运维安全资产，不是上传到服务器的开发文档，不违反「服务器只放项目代码」原则。

## 未执行的操作

- 未删除 `/root/*-backup/` 备份目录（用户决定保留）。
- 未执行任何服务器端写入。

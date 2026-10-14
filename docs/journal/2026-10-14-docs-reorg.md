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

## 未执行的操作

- 未删除 `/root/*-backup/` 备份目录（回滚安全网，需用户确认后再动）。
- 未执行任何服务器端写入。
- 未重命名 GitHub 仓库。

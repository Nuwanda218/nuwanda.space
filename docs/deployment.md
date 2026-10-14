# 部署规范：服务器只放项目代码

> 核心原则：**服务器资源宝贵，只放运行所需的项目代码。所有开发文档、日志、验收记录、脚本一律留在本地。**

## 1. 边界规则

### 允许上传到服务器

只有「网站运行必须存在的文件」：

| 类别 | 本地位置 | 服务器位置 |
|---|---|---|
| 站点页面与资源 | `index.html`、`post.html`、`about.html`、`assets/`、`data/` | `/srv/nuwanda-blog/web/` |
| Nginx 站点配置 | `deploy/nginx/nuwanda.space.conf` | `/etc/nginx/sites-available/nuwanda.space` |
| systemd 单元 | `deploy/systemd/nuwanda-cert-check.*` | `/etc/systemd/system/` |

### 禁止上传到服务器

| 类别 | 本地位置 | 原因 |
|---|---|---|
| 项目说明 | `README.md` | 开发文档 |
| 学习笔记 | `docs/learn.md` | 开发文档 |
| 学习路线 | `docs/roadmap.md` | 开发文档 |
| 架构说明 | `docs/architecture.md` | 开发文档 |
| 部署规范 | `docs/deployment.md` | 开发文档 |
| 开发日志 | `docs/journal/` | 开发日志 |
| 验收记录与结果 | `deploy/verification-*.json` | 开发日志 |
| 运维脚本 | `deploy/install_tls.py`、`deploy/verify_tls.py` | 本地工具 |
| 证书私钥暂存 | `.deploy-private/` | 密钥，且已在 `.gitignore` |
| Git 元数据 | `.git/` | 无必要 |

> 服务器上**不允许出现任何 `.md`、`.txt`、`.log`、`.json` 形式的开发文档或日志**（`data/` 下的站点数据 JSON 除外，那是网站内容）。

## 2. 当前合规状态

核实时间：2026-10-14。

| 检查项 | 结果 |
|---|---|
| `/srv/nuwanda-blog/web/` 内容 | ✅ 仅 `index.html` 一个站点文件 |
| `/srv/weihua/` 内容 | ✅ 仅 `index.html`、`proto/index.html` |
| 网页根目录是否有文档/日志 | ✅ 无 |
| 服务器上的开发文档 | ✅ 无（`/root/*-backup/` 内为部署备份，非上传文档） |
| 服务器上的 Git 仓库 | ✅ 无 |

## 3. 部署流程

### 3.1 同步站点代码

只同步站点文件，不同步任何文档：

```powershell
# 在项目根目录执行
.\deploy\deploy-site.ps1
```

该脚本的同步范围被硬编码为白名单：`index.html`、`post.html`、`about.html`、`assets/`、`data/`。
`README.md`、`docs/`、`deploy/`、`.git/` 等**永远不会被同步**。

### 3.2 首次配置服务器（仅需一次）

```bash
# Nginx 站点
cp /path/to/nuwanda.space.conf /etc/nginx/sites-available/nuwanda.space
ln -s /etc/nginx/sites-available/nuwanda.space /etc/nginx/sites-enabled/nuwanda.space
nginx -t && systemctl reload nginx

# 证书到期检查
cp nuwanda-cert-check.service nuwanda-cert-check.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now nuwanda-cert-check.timer
```

### 3.3 改动 Nginx 后的强制检查

```bash
nginx -t          # 必须先通过
systemctl reload nginx
```

⚠️ **禁止 `systemctl restart nginx`，禁止重启整机** —— 会影响同机的年画项目。

## 4. 验证

```powershell
# 公网只读验证（本地执行）
$env:PYTHONIOENCODING='utf-8'
& 'D:\python310\python.exe' '.\deploy\verify_tls.py'
```

验证项覆盖：主域名 HTTPS 与内容哈希、HTTP 跳转、参数保留、www 证书及跳转、年画项目页面哈希不变、`.git`/私钥/证书包路径拦截。

## 5. 服务器资源约束

- 磁盘：49G，已用约 15%。上传前先确认体积。
- 不做服务器端构建：博客是纯静态文件，本地编辑后直接同步。
- 不在服务器上保存历史版本：版本管理由本地 Git 负责。
- 部署备份（`/root/*-backup/`）仅保留最近一次，用于回滚，不作为长期归档。

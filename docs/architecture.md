# 架构说明：服务器与两个项目的并存关系

> 本文记录线上真实架构。最后核实时间：2026-10-14。

## 1. 服务器

| 项 | 值 |
|---|---|
| SSH 别名 | `weihua`（见本机 `~/.ssh/config`） |
| 公网地址 | `39.98.83.105` |
| 主机名 | `iZ8vb58va7daj0vq2mmtx0Z` |
| 系统 | Ubuntu / Linux 6.8.0-63-generic x86_64 |
| 登录 | `root`，密钥 `~/.ssh/id_ed25519` |
| 磁盘 | `/dev/vda3` 49G，已用约 15% |
| 公网端口 | 22 (SSH)、80 (HTTP)、443 (HTTPS) |
| 回环端口 | 8000（年画项目后端）、53（systemd-resolved） |

服务器上**没有任何 Git 仓库**。两个项目都是「本地 Git + SSH 同步文件」模式，服务器只保存运行所需的最终文件。

## 2. 两个站点

服务器上同时运行两个互相独立的站点，靠 **Nginx 虚拟主机（`server_name`）** 分流。

### 项目 A：`weihua.art` —— 杨柳青年画非遗文化平台（既有项目）

| 项 | 值 |
|---|---|
| 站点根 | `/srv/weihua/` |
| 页面 | `index.html`（156 KB）、`proto/index.html`（30 KB） |
| 架构 | Nginx 反向代理 → Python 进程 |
| 后端 | `weihua-test.service`：`python3 -m http.server 8000` |
| Nginx 配置 | `/etc/nginx/sites-available/weihua.art` |
| 证书 | `/etc/ssl/weihua.art/`，CN=`weihua.art` |
| 证书到期 | 2027-01-07 23:59:59 UTC（北京时间 2027-01-08 07:59:59） |
| 到期检查 | `weihua-cert-check.timer` |

### 项目 B：`nuwanda.space` —— 个人博客（本项目）

| 项 | 值 |
|---|---|
| 站点根 | `/srv/nuwanda-blog/web/` |
| 架构 | Nginx 直接托管静态文件，**无应用进程** |
| Nginx 配置 | `/etc/nginx/sites-available/nuwanda.space` |
| 证书 | `/etc/ssl/nuwanda.space/`，CN=`nuwanda.space`（SAN 含 `www`） |
| 证书到期 | 2027-01-11 23:59:59 UTC（北京时间 2027-01-12 07:59:59） |
| 到期检查 | `nuwanda-cert-check.timer` |

## 3. 请求流向

```
                       ┌──────────────────────────────────────────────┐
    公网 80/443 ─────► │  Nginx（单一实例，唯一入口，唯一 TLS 终结者）  │
                       └───────────────┬──────────────┬───────────────┘
                                       │              │
                 server_name=weihua.art│              │server_name=nuwanda.space
                                       ▼              ▼
                       ┌───────────────────┐  ┌────────────────────────┐
                       │ proxy_pass        │  │ root /srv/nuwanda-blog │
                       │ 127.0.0.1:8000    │  │        /web            │
                       └─────────┬─────────┘  └────────────────────────┘
                                 ▼                    静态文件直出
                       ┌───────────────────┐         无应用进程
                       │ weihua-test.service│
                       │ python3 http.server│
                       │ /srv/weihua        │
                       └───────────────────┘
```

## 4. 隔离边界

| 维度 | 是否共享 | 说明 |
|---|---|---|
| 服务器 | 共享 | 同一台 `39.98.83.105` |
| Nginx 实例 | 共享 | 同一份 `nginx.conf`、同一批 worker |
| 公网端口 80/443 | 共享 | 按 `Host` 头分流，不是按端口 |
| 站点根目录 | 独立 | `/srv/weihua` ↔ `/srv/nuwanda-blog/web` |
| TLS 证书 | 独立 | `/etc/ssl/weihua.art` ↔ `/etc/ssl/nuwanda.space` |
| 应用进程 | 独立 | A 有 Python 进程；B 无进程 |
| systemd 单元 | 独立 | `weihua-*` ↔ `nuwanda-*` |
| 代码仓库 | 独立 | 本地两个不同目录 |
| 访问日志 | 独立 | `weihua.art.*.log` ↔ `nuwanda.space.*.log` |

**结论：两个项目是「同机、同 Nginx、同端口」的邻居，通过域名做虚拟主机分流，彼此不共享任何代码、数据、进程或证书。**

## 5. 唯一的耦合点

两者共用同一个 Nginx 主进程。因此：

- 博客的 Nginx 配置写错会导致 `nginx -t` 失败或 reload 异常，**可能影响年画项目**。
- 任何 Nginx 改动必须先 `nginx -t` 通过再 `reload`，禁止直接重启整机。
- 部署脚本必须做「reload 后握手就绪检测」，失败自动回滚（参见部署验收记录中首次安装的真实回退案例）。

## 6. 依赖方向

博客项目**单向依赖**年画项目所在的服务器环境：

- 博客复用了已装好的 Nginx、已开放的 80/443、已配置的 systemd 环境。
- 年画项目完全不知道博客的存在。
- 反向不成立。

## 7. 备份与回滚

| 路径 | 内容 |
|---|---|
| `/root/nuwanda-backup/20261014-ssl/` | 博客部署前的 Nginx 配置快照、证书暂存、`weihua.sha256` 基线 |
| `/root/weihua-backup/20261010-https/` | 年画项目部署前的 Nginx 配置快照、TLS 检查记录 |

回滚博客（**仅在确认要撤下时执行**）：

```bash
systemctl disable --now nuwanda-cert-check.timer
mv /etc/nginx/sites-enabled/nuwanda.space /root/nuwanda-backup/20261014-ssl/backup/nuwanda.space.disabled
nginx -t && systemctl reload nginx
```

停用后该域名会回到既有默认虚拟主机行为，**不能**把回滚视为「未知域名拒绝策略」。

## 8. 已知注意点

- **证书不自动续期**。两个 `cert-check.timer` 只做「剩余不足 30 天时让 service 失败并写 journal」，不发通知。到期前需从原签发渠道取得新证书并手动安装。
- **本机 hosts 干扰**：`C:\Windows\System32\drivers\etc\hosts` 第 23 行有 `127.0.0.1 www.nuwanda.space`，导致本机访问 www 会连到本机。主域名不受影响。
- **`/var/www/html/index.nginx-debian.html`** 是 Nginx 默认页，未被任何站点使用。

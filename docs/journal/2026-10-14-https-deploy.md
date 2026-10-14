# nuwanda.space HTTPS 部署验收记录

核验时间：2026-10-14 12:17–12:26（北京时间）。本次按用户提供证书并要求配置完毕的指示，在已有服务器上新增独立站点。没有修改现有项目的路由、页面、服务或防火墙，没有重启整机。

## 实际结果

- `https://nuwanda.space/`：公网 200，系统信任与域名校验通过。
- `http://nuwanda.space/`：301 到 HTTPS；路径、查询参数与编码保留。
- `https://www.nuwanda.space/`：301 到主域名；服务器侧真实 DNS 和 HTTPS 请求验证通过。
- 两个域名的公开 A 记录均指向 `39.98.83.105`。博客采用 Nginx 直接提供静态文件，不新增应用进程。
- 首页是明确标注“HTTPS 已配置，个人博客准备中”的占位页，不是已完成的博客。原有 `index.html`、`post.html`、`about.html`、JS/CSS/JSON 都是空文件，未上传这些文件，也未改写它们。
- `weihua.art` 首页、`/proto/` 均为 HTTPS 200，页面和项目 Nginx 配置的 SHA-256 与部署前一致。原 `weihua-test.service` 仍运行；撤掉该 Python 临时服务需要另行迁移项目静态托管，本次没有执行。

## 证书及权限

- 输入包：`27832570_nuwanda.space_nginx.zip`，CRC 通过；证书和私钥公钥一致。
- SAN：`nuwanda.space`、`www.nuwanda.space`。
- 签发者：DigiCert Encryption Everywhere DV TLS CA - G2。
- 有效期：2026-10-14 00:00:00 UTC 至 2027-01-11 23:59:59 UTC。
- 北京时间到期：**2027-01-12 07:59:59**。
- 证书 PEM SHA-256：`69ab4d0a6857c8eef32563513d999247361e1512a2d283efa796c77e9b16cd23`。
- 服务器证书目录：`/etc/ssl/nuwanda.space`，root:root、0700。
- 私钥：`/etc/ssl/nuwanda.space/nuwanda.space.key`，root:root、0600；未打印私钥内容。
- 本地 `.gitignore` 已排除 `*.key`、`*.pem`、`*.crt`、`*_nginx.zip` 和 `.deploy-private/`；忽略检查通过。原证书包保持原路径，没有提交证书或私钥。

每日到期检查 `nuwanda-cert-check.timer` 已启用；手动执行检查成功。剩余不足 30 天时 service 会失败并写入 journal。**此机制不自动续期，也不发送聊天或邮件提醒。** 后续需要从原签发渠道取得新证书、验证匹配后安装，并通过 `nginx -t`、reload 和在线证书检查完成换证。

## 文件清单与验证

本地 Git 基线为 `5e7e6b2`。原有 README、learn.md 修改和空的博客文件均保留；本次部署辅助文件尚未提交，没有推送或创建远程仓库。

| 本地文件 | 线上位置 / 用途 |
|---|---|
| `nginx/nuwanda.space.conf` | `/etc/nginx/sites-available/nuwanda.space`，sites-enabled 中建立链接 |
| `site-ready/index.html` | `/srv/nuwanda-blog/web/index.html` |
| `systemd/nuwanda-cert-check.service` | `/etc/systemd/system/nuwanda-cert-check.service` |
| `systemd/nuwanda-cert-check.timer` | `/etc/systemd/system/nuwanda-cert-check.timer` |
| `install_tls.py` | 首次安装与同次失败回退后的受控恢复，文件白名单经 SSH 传输；不是续期脚本 |
| `verify_tls.py` | 公网验证脚本，只读 |
| `verification-20261014.json` | 10 项公网检查结果 |

10 项检查覆盖：主域名 HTTPS 与内容哈希、HTTP 跳转、参数保留、www 证书及跳转、原项目两页面哈希不变、博客无项目 `/proto/` 页面、`.git`/私钥/证书包路径拦截。

服务器另外验证：Nginx 配置检查成功；TLS 1.2/1.3 握手及证书链、域名校验通过；Nginx 和原项目服务 active；新 timer active/enabled；没有失败的 systemd unit。公网新增站点仍只使用既有 80/443 端口。站点错误日志中的记录是规则拦截请求，其中三条来自上述安全路径验收，另一条是公网 `.env.example` 扫描被拒绝，不代表应用崩溃。

首次安装在 reload 后立即握手，仍命中旧 worker 的证书，触发自动回退。确认原项目正常后，安装脚本增加了有界 HTTPS 就绪检测；恢复安装在第 2 次握手通过。Nginx reload 通过信号启动新 worker，命令返回与新 worker 就绪不是同一时刻，参见 [Nginx 官方说明](https://nginx.org/en/docs/control.html)。没有通过忽略证书错误来完成验收。

复查命令（PowerShell）：

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'D:\python310\python.exe' 'F:\website\Nuwanda-space\deploy\verify_tls.py'
```

## 本机 www 访问差异

当前电脑 `C:\Windows\System32\drivers\etc\hosts` 第 23 行已有：

```text
127.0.0.1 www.nuwanda.space
```

这条既有映射会让当前电脑访问 www 时连接本机，与公开 DNS 不同。本次没有更改 hosts。主域名不受这条映射影响。www 的服务器配置用显式目标地址完成校验，另由服务器使用 DNS 解析及真实域名请求完成核验。如要在本机正常访问 www，可在不再需要本地开发映射时移除该行。

## 备份与回滚

备份：`/root/nuwanda-backup/20261014-ssl/backup/`，权限 0700。其中 `nginx/` 是新增博客前的 Nginx 配置快照，`weihua.sha256` 是原项目文件校验基线。证书传输暂存目录位于 `/root/nuwanda-backup/20261014-ssl/`，0700，私钥文件 0600，不在 Web 根目录内。

若决定撤下博客，先确认操作范围，再在服务器执行以下命令；仅停用新增站点和到期 timer，保留证书、页面和原项目。**这些回滚命令没有执行。**

```bash
systemctl disable --now nuwanda-cert-check.timer
mv /etc/nginx/sites-enabled/nuwanda.space /root/nuwanda-backup/20261014-ssl/backup/nuwanda.space.disabled
nginx -t && systemctl reload nginx
```

停用后该域名会回到既有默认虚拟主机行为，不能把回滚视为未知域名拒绝策略。

# 首页 v0.1 生产部署方案

依据 2026-10-15 实地核验：Ubuntu 24.04 x86_64；Nginx 1.24；博客旧目录 `/srv/nuwanda-blog/web`；weihua 使用 127.0.0.1:8000；服务器未安装 Node。Node 官方 v24.22.0 Linux x64 包可达，SHA256 为 `cc2f601cee82d9a5a233302fe307abc600727035fd7d2c3a3571755989e95008`。本次任务书已授权条件允许时安全上线。

1. 本机顺序完成 check、test、build、test:output、test:production、test:dev、check:security 和浏览器检查；首页使用静态生成与优化图片。
2. `deploy/package-astro.mjs` 仅打包 dist、package.json、package-lock.json、MANIFEST.sha256。压缩包和包内每个文件有 SHA256，服务器抽查清单并验证。
3. 独立版本目录 `/srv/nuwanda-blog/releases/<release>`；Node 仅放本项目 `/srv/nuwanda-blog/runtime/`，不改全局 PATH、Node 或 npm；Linux 执行 npm ci --omit=dev --ignore-scripts，绝不复制 Windows node_modules。安装所需锁文件和运行依赖属于生产必需材料。
4. 专用非登录账号 nuwanda-web + systemd，监听 127.0.0.1:4323，无生产数据库、环境文件、OSS 或密钥。日志只到 journal，不上传本地日志/说明文档。
5. 旧 web 目录保持原样，备份博客原 Nginx 配置与另外两个站点配置哈希。先检查新服务环回首页、栏目、SSR/API 和静态资源，再原子切换 current，安装仅博客的新 Nginx 配置，nginx -t 成功后 reload。
6. 验证公网 TLS、页面哈希、栏目、图片、SSR/API 动态行为、重定向、敏感路径及 weihua 两页内容与配置哈希。失败即恢复旧配置并 reload，停用新服务，旧 web 继续提供服务。
7. 保留本次版本、旧站目录与上线前博客配置用于回滚。部署不会自动提交或推送现有未提交迁移。

回滚：在本地运行项目 Node 执行 `deploy/remote-astro.mjs --rollback`；该工具读取 `.local/homepage-v01/package.json` 的 release 并以精确 LF 字节传入 `deploy/rollback-astro.sh`（SSH stdin）；脚本先验证备份存在，恢复博客原配置，nginx -t + reload，停用 nuwanda-space 服务。其他站点不变。

这是首次从旧静态站迁移的方案。后续 Node 版本间更新需扩展上一版本服务/current 的回滚处理，不应无条件沿用首次上线回滚脚本。

实测生产状态与47项公网检查均通过，见 [验收报告](homepage-v01-report.md)。官方运行时直连下载超时后，已改成本机校验包上传；PowerShell 文本管道追加 CR 的问题由 remote-astro.mjs 避免。

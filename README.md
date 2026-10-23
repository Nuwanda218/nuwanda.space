# Nuwanda Space

个人博客，记录生活与摄影、学习与思考，以及国旗护卫队的共同经历。站点域名：<https://nuwanda.space/>。

## 当前工程

- Astro + TypeScript，使用原生 Astro 组件与 CSS。
- 博客页面静态生成；Node standalone 保留 SSR/API 验收入口。
- 内容从 `materials/` 自动发现，图片通过 Astro 生成响应式资源。
- PostgreSQL Compose 用于本地环境验证；当前博客内容由 Markdown 与照片提供。
- 标有演示的条目用于验证展示结构，不代表已发表文章或真实事件。

线上发布的历史证据见验收报告。提交或推送 Git 不等于执行生产部署。

## 本地开发

版本与依赖以 `.node-version`、`package.json` 和 `package-lock.json` 为准。首次配置按[本地开发指南](docs/local-development.md)执行，私有环境变量留在被忽略的 `.env.local` 中。

已配置好的本机使用项目 Node 包装脚本：

```powershell
# 开发服务，访问终端输出的地址
.\scripts\local.ps1 run dev

# 顺序检查、测试、构建
.\scripts\local.ps1 run check
.\scripts\local.ps1 run test
.\scripts\local.ps1 run build

# 构建产物、页面框架、敏感信息检查
.\scripts\local.ps1 run test:output
.\scripts\local.ps1 run test:framework
.\scripts\local.ps1 run check:security

# 构建预览
.\scripts\local.ps1 run start
```

`verify` 还包含本地数据库检查，运行前需准备对应 Docker/数据库环境。浏览器验收要求见[框架验收记录](docs/phase1-framework.md)。

## 写作与素材

在对应栏目中新建文件夹，放入 `index.md` 和照片即可。开发服务自动发现变化，正式构建会重新收集内容。

| 内容 | 入口 |
| --- | --- |
| 个人介绍、标语与关键词 | `materials/site/profile.json` |
| 生活记录与摄影 | `materials/life/` |
| 学习笔记与文章 | `materials/notes/` |
| 国旗护卫队专题 | `materials/guard/` |
| 新内容模板，默认草稿 | `materials/_templates/` |

无需修改页面注册表或手动导入每张图片。完整操作见[素材区使用指南](docs/素材区使用指南.md)和[素材入口说明](materials/README.md)。

## 目录

```text
src/          页面、布局、组件、样式与素材读取逻辑
materials/    Markdown 正文、原始照片与个人文案
public/       直接发布的公共资源
scripts/      本地开发、环境和验收工具
tests/        自动化测试
deploy/       部署、验证与回滚工具
docs/         设计、操作指南、历史记录与调研
.local/       本地运行时、私有环境与验收输出，Git 忽略
dist/         Astro 构建产物，Git 忽略
```

## 文档入口

- [前端设计、开发与优化流程草案](docs/design/frontend-workflow-20261023.md)
- [素材区使用指南](docs/素材区使用指南.md)
- [本地开发指南](docs/local-development.md)
- [框架与素材接入验收记录](docs/phase1-framework.md)
- [Astro 部署说明](docs/deployment-homepage-v01.md)
- [首页 v0.1 历史验收报告](docs/homepage-v01-report.md)
- [部署边界与历史说明](docs/deployment.md)
- [对象存储资料](docs/storage.md)
- [设计参考与原始调研](docs/research/open-source-designs.md)
- [整理前 README 归档](docs/journal/2026-10-23-pre-astro-readme.md)

历史文档按其记录日期理解，旧纯静态目录、Cloudflare 备选路线和旧部署脚本不替代当前源码与 Astro 部署说明。

## Git 与发布边界

源码、内容素材、配置、依赖锁文件、部署工具与文档纳入 Git。依赖目录、构建产物、本地缓存、测试输出、私有环境与证书由 `.gitignore` 排除。

生产发布使用现有 Astro 部署与回滚流程，包含 `dist/client/` 和 `dist/server/`。旧 `deploy/deploy-site.ps1` 的纯静态白名单不适用于当前工程。开发文档和本地缓存不随运行产物上传生产服务器。

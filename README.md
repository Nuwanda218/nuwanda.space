# Nuwanda Space

[Nuwanda Space](https://nuwanda.space/) 是我的个人网站，用于组织文章、摄影、生活记录及国旗护卫队相关内容。展示上将时间、文字、图片和手绘资料组合起来，让不同类型的记录保留各自的阅读方式。

## 内容与展示设计

站点将生活、笔记与团队资料分别组织，而不是把所有内容放进同一种文章列表。摄影条目可以关联多张照片、说明文字与手绘素材，再由页面组件按内容组合展示。

![Nuwanda Space 实际首页](https://raw.githubusercontent.com/Nuwanda218/nuwanda218/main/projects/assets/nuwanda-space-home.png)

截图为实际网站页面；本地素材和页面扩展的进度与线上内容分别维护。

## 工程实现

- **内容数据管理**：使用 Astro 内容集合，以目录发现规则读取 Markdown，并通过 schema 检查标题、日期、分类、草稿状态和图片描述等字段。
- **内容与页面分离**：正文及素材放在内容目录中，页面和组件决定展示方式，减少新增条目时修改布局代码的需要。
- **展示组件复用**：图库复用图片、手绘和导航组件，统一图片说明及交互方式。
- **构建与维护**：通过类型检查、Node 测试、构建输出检查和部署脚本维护站点。

## 本地运行

当前 `package.json` 要求 Node.js `>=24.22.0 <25`、npm `>=11 <12`。

```bash
npm ci
npm run dev
```

开发服务器监听本机。常用检查和生产命令：

```bash
npm run check
npm test
npm run build
npm run start
```

`check` 运行 Astro 检查，`test` 运行 Node 测试，`build` 生成构建结果，`start` 使用仓库的启动脚本运行。数据库相关功能另有 `db:*` 及 `dev:full` 脚本，配置和运行条件见源码说明。

## 当前状态与限制

公开代码包含 Astro 站点工程，线上入口可访问。本地仍有未提交的内容、组件和样式修改，不能以本地工作树代替实际部署结果；内容更新频率也与网站工程实现分别看待。

项目持续使用 AI 辅助开发与人工检查，素材公开范围和许可证还需逐项维护。

[网站](https://nuwanda.space/) · [源代码](https://github.com/Nuwanda218/nuwanda.space) · [返回项目索引](https://github.com/Nuwanda218/nuwanda218/blob/main/projects/README.md)

更新：2026-11-25

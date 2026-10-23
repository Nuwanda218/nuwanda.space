# 对象存储（OSS）规范

> 本文记录博客图片与附件所使用的阿里云 OSS 存储空间。最后核实时间：2026-10-14。
> 所有信息均来自控制台配置与公网实测，**未经验证的项已明确标注**。

## 1. 为什么用 OSS 而不是服务器磁盘

服务器的瓶颈**不是存储，是出口带宽和流量费**。40G 磁盘放几万张图都够，但图片走 ECS 会同时吃掉公网带宽和流量费。

| | 放 ECS | 放 OSS |
|---|---|---|
| 文字 / JSON（几十 KB） | ✅ 首屏快，不依赖外部服务 | 没必要 |
| 图片（100KB ~ 5MB） | ❌ 吃公网带宽；按量计费约 0.8 元/GB | ✅ 带宽充足，20GB/月流量包基本覆盖 |

**分工结论：**

```
访客浏览器
  ├─ HTML / CSS / JS / 文章JSON / 评论JSON  →  https://nuwanda.space        （ECS Nginx 直出）
  └─ 图片 / 附件 / 大文件                    →  https://nuwanda-blog-assets.oss-cn-zhangjiakou.aliyuncs.com/...  （OSS）
```

## 2. Bucket 基本信息

| 项 | 值 | 状态 |
|---|---|---|
| Bucket 名称 | `nuwanda-blog-assets` | ✅ 已创建（2026-10-14） |
| 地域 | 华北3（张家口）`cn-zhangjiakou` | ✅ 与 ECS 同地域 |
| 存储类型 | 标准存储 | ✅ |
| 冗余类型 | 本地冗余（LRS） | ✅ 已确认与标准存储包抵扣项匹配 |
| 读写权限 | 公共读 | ✅ 实测生效 |
| 阻止公共访问 | 已关闭 | ✅（开着则公共读无法生效） |
| 版本控制 | 未开通 | ✅ 省存储费 |
| 服务端加密 | 无 | ✅ |
| 实时日志 / 定时备份 / 传输加速 | 均未开启 | ✅ 均为额外收费项 |

> **名称不可更改**。`nuwanda-blog-assets` 创建后即为最终名称。

## 3. 访问端点

| 访问端口 | HTTPS | Endpoint（地域节点） | Bucket 域名 | 实测结果 |
|---|---|---|---|---|
| 外网访问 | 支持 | `oss-cn-zhangjiakou.aliyuncs.com` | `nuwanda-blog-assets.oss-cn-zhangjiakou.aliyuncs.com` | ✅ 2026-10-14 公网实测可达 |
| CNAME 域名 | 支持 | `cn-zhangjiakou.taihangpkx.cn` | `nuwanda-blog-assets.cn-zhangjiakou.taihangpkx.cn` | ⚠️ **不可直接访问**，见下 |
| ECS 的经典网络访问（内网） | 支持 | `oss-cn-zhangjiakou-internal.aliyuncs.com` | `nuwanda-blog-assets.oss-cn-zhangjiakou-internal.aliyuncs.com` | ✅ 从 `weihua` 实测可达（63ms） |
| ECS 的 VPC 网络访问（内网） | 支持 | `oss-cn-zhangjiakou-internal.aliyuncs.com` | `nuwanda-blog-assets.oss-cn-zhangjiakou-internal.aliyuncs.com` | ✅ 同上 |
| 传输加速域名 | 支持 | 未开启 | 未开启 | ❌ 收费，不启用 |
| HDFS 服务 | 支持 | 未开启 | 未开启 | ❌ 不启用 |

### 3.1 CNAME 域名不可直接访问（实测）

```
GET http://nuwanda-blog-assets.cn-zhangjiakou.taihangpkx.cn/images/test.png
→ 403 HostForbidden
  "The specific host can only be used for custom domain mapping."

TLS 证书 Subject = CN=cn-zhangjiakou.oss.aliyuncs.com
→ 与主机名不匹配，HTTPS 握手失败（SEC_E_WRONG_PRINCIPAL）
```

**结论：** `taihangpkx.cn` 域名是**未来绑定自定义域名时的 CNAME 目标**，不是给访客用的地址。
将来要绑 `img.nuwanda.space` 时：DNS 加 CNAME `img.nuwanda.space` → `nuwanda-blog-assets.cn-zhangjiakou.taihangpkx.cn`，并在 OSS 控制台绑定该自定义域名。

### 3.2 端点选用规则

| 场景 | 用哪个端点 | 流量费 |
|---|---|---|
| 访客浏览博客图片 | **外网** | 消耗 20GB/月 下行流量包 |
| 本地（Windows）上传 | **外网** | 入方向免费 |
| ECS 上脚本上传 / 备份 | **内网** | 免费，且不消耗流量包 |
| 未来绑自定义域名 | CNAME → `taihangpkx.cn` | 同外网 |

> ⚠️ **内网端点从本机必然访问失败**（解析到 `100.118.90.x`，是阿里云内网地址，公网无路由）。
> 这是正常现象，不是配置错误，不要去排查。

## 4. 对象路径规范

```
images/posts/<slug>/cover.webp     文章封面
images/posts/<slug>/01.webp        文章配图（按序号）
images/avatar.webp                 头像
images/common/                     站点通用图（logo、图标）
files/<slug>/<name>.pdf            附件
temp/                              临时文件（配生命周期 30 天自动删除）
```

- 全部使用**小写 + 短横线**，不用中文、空格
- 文件名带内容哈希或版本号，便于设置永久缓存（如 `cover.a1b2c3.webp`）

## 5. 前端集成约定

`posts.json` 里**只存相对 key，不存完整 URL**：

```json
{
  "slug": "first-post",
  "cover": "images/posts/first-post/cover.webp"
}
```

渲染时统一拼接：

```js
const IMG_BASE = 'https://nuwanda-blog-assets.oss-cn-zhangjiakou.aliyuncs.com/';
// 用法：IMG_BASE + post.cover
```

**好处：** 以后换自定义域名或接 CDN，只改 `IMG_BASE` 一行，不用动任何文章数据。

## 6. 资源包

| 资源包 | 规格 | 类型 | 有效期 | 抵扣内容 |
|---|---|---|---|---|
| 下行流量包（中国内地） | 20GB | **自然月周期型** | 2026-09-17 → 2027-09-17 | OSS → 访客 的外网流出流量 |
| 标准存储包（中国大陆） | 40GB | 总量恒定型 | 同上 | 标准存储容量（**需确认本地冗余**）；**也可抵扣 ECS 快照存储费** |
| 低频存储包（中国大陆） | 100GB | 总量恒定型 | 同上 | 低频访问存储容量 |

### 6.1 抵扣规则（阿里云官方文档）

- **下行流量包只抵扣外网流出流量**，不抵扣存储费、请求费。
- 挂 CDN 后产生的是「**CDN 回源流出流量**」，**下行流量包不抵扣**，需另买「回源流量包」。
- **自然月周期型每月重置，未用完不累积。**
- 资源包用完或到期后，超出部分**自动转按量付费**。
- 低频访问：**最低存储 30 天**（不足 30 天删除/覆盖要补收）、**最小计量单位 64KB**、**有数据取回费**。

### 6.2 使用策略

| 资源 | 怎么用 |
|---|---|
| 20GB/月 下行流量包 | **主力，也是最该省着用的**。按单图 150KB 算 ≈ 13 万次图片加载/月，个人博客远用不完；但若放 5MB 原图，只够 4000 张 |
| 40GB 标准存储包 | 存**经常访问**的博客配图、头像。若 ECS 开了自动快照，也可用同一份包抵扣快照存储费 |
| 100GB 低频存储包 | 只放**归档类**（历年原图备份、视频源文件）。**不要把文章配图放低频**——每次访客访问都要取回，既慢又产生取回费 |

### 6.3 为什么暂时不上 CDN

手上是 **OSS 下行流量包**，不是 CDN 流量包。挂 CDN 后流量拆成「CDN→访客」+「OSS→CDN 回源」，**下行流量包不抵扣回源部分**，反而多一层费用。个人博客访问量小，CDN 收益抵不上复杂度。等访问量起来再加，届时需同时购买 CDN 流量包和回源流量包。

## 7. 权限与安全

| 设置 | 值 | 说明 |
|---|---|---|
| 读写权限 | **公共读** | 访客无需任何凭证即可看图 |
| 阻止公共访问 | **关闭** | 开着则无法设为公共读 |
| 防盗链 Referer 白名单 | `https://nuwanda.space`、`https://www.nuwanda.space`、`http://localhost:*` | ⚠️ **待配置** |
| 允许空 Referer | **开启** | 否则直接粘贴图片 URL 会打不开 |
| CORS | 暂不需要 | 前端不 `fetch` OSS 上的 JSON；若将来需要，来源填 `https://nuwanda.space` |
| 公共写 | **绝对不开启** | 等于允许任何人往 bucket 塞文件 |

> **防盗链是保护流量包的关键。** 没有它，别人盗链你的图，20GB/月流量包会被刷爆。

### 7.1 上传凭证（RAM，绝不用主账号）

主账号 AccessKey 泄露 = 整个阿里云账号沦陷（ECS、域名、账单全在里面）。必须用 RAM 子用户，且权限只限本 bucket：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject", "oss:GetObject", "oss:DeleteObject", "oss:ListObjects", "oss:GetBucketInfo"],
      "Resource": [
        "acs:oss:*:*:nuwanda-blog-assets",
        "acs:oss:*:*:nuwanda-blog-assets/*"
      ]
    }
  ]
}
```

> AccessKey Secret 只显示一次，且**不得写入任何会被提交进 Git 的文件**。

## 8. 上传操作

### 8.1 本地（Windows）配置 ossutil

```powershell
ossutil config
#   endpoint        → oss-cn-zhangjiakou.aliyuncs.com
#   accessKeyID     → RAM 用户的 AccessKey ID
#   accessKeySecret → RAM 用户的 AccessKey Secret

# 验证
ossutil ls oss://nuwanda-blog-assets
```

### 8.2 上传图片（带缓存头）

```powershell
ossutil cp -r .\assets\images\ oss://nuwanda-blog-assets/images/ `
  --meta "Cache-Control:public,max-age=31536000,immutable"
```

### 8.3 ECS 上走内网（免流量费）

```bash
# 在 weihua 上，endpoint 换成内网地址
ossutil cp -r /path/to/images oss://nuwanda-blog-assets/images/ \
  -e oss-cn-zhangjiakou-internal.aliyuncs.com
```

## 9. 验证方法

### 9.1 文件可访问性

```powershell
curl.exe -sS -I "https://nuwanda-blog-assets.oss-cn-zhangjiakou.aliyuncs.com/images/test.png"
```

预期结果：

| 检查项 | 期望值 | 含义 |
|---|---|---|
| 状态码 | `HTTP/1.1 200 OK` | 文件可读 |
| `Content-Type` | `image/png` | 浏览器按图片渲染 |
| `Content-Disposition` | **不应出现** | 出现 `attachment` 会被强制下载 |
| `Cache-Control` | `public, max-age=31536000, immutable` | 缓存策略正确 |

### 9.2 Bucket 状态探测（无需凭证）

```powershell
# 根路径：403 Forbidden = bucket 存在（匿名无 ListObjects 权限，属正常）
curl.exe -sS -o NUL -w "%{http_code}`n" "https://nuwanda-blog-assets.oss-cn-zhangjiakou.aliyuncs.com/"

# 不存在的对象：404 NoSuchKey = bucket 存在且公共读生效
#                 403 AccessDenied = 权限没配对
#                 404 NoSuchBucket = bucket 不存在
curl.exe -sS "https://nuwanda-blog-assets.oss-cn-zhangjiakou.aliyuncs.com/images/__probe__.png"
```

## 10. 已知坑

1. **根路径返回 403 是正常的**，不是故障——匿名用户没有 `ListObjects` 权限，列不了目录。
2. **内网端点从本机访问必然失败**，`100.118.90.x` 是阿里云内网地址。
3. **`taihangpkx.cn` CNAME 域名不能直接访问**，只能作为自定义域名的 CNAME 目标。
4. **同城冗余存储不抵扣本地冗余存储包**，反之亦然。创建 bucket 时选错会导致资源包作废。
5. **默认域名访问 html / apk 类文件会强制下载**（图片不受影响）。阿里云建议生产环境绑自定义域名。
6. **低频存储不是"便宜的标准存储"**：有 30 天最低存储、64KB 最小计量、数据取回费三重约束。
7. **资源包用完不会提醒**，会自动转按量付费，需自行设置 80% 用量预警。

## 11. 待确认 / 待办

| 项 | 说明 | 状态 |
|---|---|---|
| 冗余类型与资源包是否匹配 | 已确认：本地冗余（LRS），与「标准存储包(中国大陆)」抵扣项一致 | ✅ 2026-10-14 确认 |
| 防盗链配置 | Bucket → 数据安全 → 防盗链，加白名单并打开「允许空 Referer」 | ⚠️ 待配置 |
| 资源包用量预警 | 费用中心 → 资源包 → 预警设置，设 80% | ⚠️ 待配置 |
| 测试图上传与验证 | 上传 `images/test.png` 后跑第 9.1 节命令 | ⚠️ 待执行 |
| 自定义域名 `img.nuwanda.space` | 需域名已备案；DNS CNAME → `nuwanda-blog-assets.cn-zhangjiakou.taihangpkx.cn`，并在 OSS 绑定 | ⏸️ 后期 |

## 12. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-10-14 | 创建 bucket `nuwanda-blog-assets`（华北3 张家口，标准存储，公共读）；实测外网与内网端点可达；确认 CNAME 域名不可直接访问 |
| 2026-10-14 | 确认冗余类型为本地冗余（LRS），与标准存储包抵扣项匹配 |

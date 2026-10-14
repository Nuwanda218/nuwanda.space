# deploy-site.ps1 — 只把「站点代码」同步到服务器
#
# 设计原则：服务器资源宝贵，只放运行所需的项目代码。
# 本脚本的同步范围是硬编码白名单，README、docs/、deploy/、.git 等永远不会被上传。
#
# 用法：在项目根目录执行
#   .\deploy\deploy-site.ps1              # 正式同步
#   .\deploy\deploy-site.ps1 -DryRun      # 只列出将要同步的文件

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$AllowEmpty,
    [string]$SshHost = 'weihua',
    [string]$RemoteRoot = '/srv/nuwanda-blog/web'
)

$ErrorActionPreference = 'Stop'

# ── 同步白名单：只有这些会离开本机 ────────────────────────────────
$SiteFiles = @('index.html', 'post.html', 'about.html')
$SiteDirs  = @('assets', 'data')

$root = Split-Path -Parent $PSScriptRoot   # 项目根目录
Set-Location $root

Write-Host "项目根目录 : $root"
Write-Host "目标服务器 : ${SshHost}:${RemoteRoot}"
Write-Host ''

# ── 1. 收集文件 ──────────────────────────────────────────────────
$files = @()
foreach ($f in $SiteFiles) {
    $p = Join-Path $root $f
    if (Test-Path $p) { $files += Get-Item $p }
    else { Write-Warning "缺少站点文件：$f" }
}
foreach ($d in $SiteDirs) {
    $p = Join-Path $root $d
    if (Test-Path $p) { $files += Get-ChildItem $p -Recurse -File }
    else { Write-Warning "缺少站点目录：$d" }
}

# ── 2. 安全检查：拒绝空文件 ──────────────────────────────────────
# 空文件会把线上页面变成白页，必须拦住。确需同步空文件时显式加 -AllowEmpty。
$empty = $files | Where-Object { $_.Length -eq 0 }
if ($empty -and -not $AllowEmpty) {
    Write-Host '❌ 检测到 0 字节文件，已中止部署：' -ForegroundColor Red
    $empty | ForEach-Object { Write-Host ("   {0}" -f $_.FullName.Substring($root.Length + 1)) }
    Write-Host ''
    Write-Host '空文件同步到线上会导致页面空白。请先补内容。'
    Write-Host '若确认这些文件应当为空，请显式加 -AllowEmpty 重新执行。'
    exit 1
}
if ($empty) {
    Write-Warning ("-AllowEmpty 已启用，将同步 {0} 个空文件。" -f $empty.Count)
}

# ── 3. 安全检查：拒绝文档/日志混入 ───────────────────────────────
$forbidden = $files | Where-Object {
    $_.Extension -in @('.md', '.txt', '.log') -or
    $_.Name -like 'verification-*' -or
    $_.Name -like '*.key' -or $_.Name -like '*.pem'
}
if ($forbidden) {
    Write-Host '❌ 白名单内出现文档/密钥类文件，已中止部署：' -ForegroundColor Red
    $forbidden | ForEach-Object { Write-Host ("   {0}" -f $_.FullName.Substring($root.Length + 1)) }
    exit 1
}

# ── 4. 输出清单 ──────────────────────────────────────────────────
Write-Host ("将同步 {0} 个文件：" -f $files.Count)
$files | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1)
    Write-Host ("   {0,-45} {1,8} B" -f $rel, $_.Length)
}
Write-Host ''

if ($DryRun) {
    Write-Host '（DryRun：未执行任何同步）' -ForegroundColor Yellow
    exit 0
}

# ── 5. 暂存到临时目录，保证只传白名单内容 ────────────────────────
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("nuwanda-deploy-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage -Force | Out-Null
try {
    foreach ($f in $SiteFiles) {
        $p = Join-Path $root $f
        if (Test-Path $p) { Copy-Item $p -Destination $stage -Force }
    }
    foreach ($d in $SiteDirs) {
        $p = Join-Path $root $d
        if (Test-Path $p) { Copy-Item $p -Destination $stage -Recurse -Force }
    }

    # ── 6. 上传 ──────────────────────────────────────────────────
    Write-Host '上传中…'
    & ssh $SshHost "mkdir -p '$RemoteRoot'"
    if ($LASTEXITCODE -ne 0) { throw "无法在服务器创建目录 $RemoteRoot" }

    & scp -r "$stage/*" "${SshHost}:${RemoteRoot}/"
    if ($LASTEXITCODE -ne 0) { throw 'scp 上传失败' }

    Write-Host ''
    Write-Host '✅ 站点代码已同步。' -ForegroundColor Green
    Write-Host ''
    Write-Host '线上文件清单：'
    & ssh $SshHost "find '$RemoteRoot' -type f -printf '%P  %s B\n' | sort"
}
finally {
    Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ''
Write-Host '提示：scp 只做覆盖，不会删除服务器上已移除的文件。'
Write-Host '      如需清理，请先人工确认后再手动删除。'
Write-Host '      验证：$env:PYTHONIOENCODING="utf-8"; & "D:\python310\python.exe" ".\deploy\verify_tls.py"'

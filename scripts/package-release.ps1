param(
  [string]$Name = "onepiece-studio-website.zip"
)

$ErrorActionPreference = "Stop"
if ($Name -notmatch '^[a-zA-Z0-9][a-zA-Z0-9._-]*\.zip$') {
  throw "Name must be a .zip file name without directories."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $projectRoot "dist"
$release = Join-Path $projectRoot "release"
$zipPath = Join-Path $release $Name

if (-not (Test-Path -LiteralPath (Join-Path $dist "index.html"))) {
  throw "dist/index.html is missing. Run the build first."
}

New-Item -ItemType Directory -Path $release -Force | Out-Null
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $dist -Recurse -Force -File | Sort-Object FullName | ForEach-Object {
    $relative = $_.FullName.Substring($dist.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $archive,
      $_.FullName,
      $relative,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
}
finally {
  $archive.Dispose()
}

$check = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entries = @($check.Entries | ForEach-Object { $_.FullName })
  if (-not ($entries -contains ".nojekyll")) { throw "Package is missing .nojekyll." }
  if (-not ($entries -contains "index.html")) { throw "Package is missing index.html." }
  if (-not ($entries -contains "assets/styles.css")) { throw "Package is missing assets/styles.css." }
  if (-not ($entries -contains "assets/core-pages.css")) { throw "Package is missing assets/core-pages.css." }
  if (-not ($entries -contains "assets/motion-preflight.js")) { throw "Package is missing assets/motion-preflight.js." }
  if (-not ($entries -contains "assets/motion.css")) { throw "Package is missing assets/motion.css." }
  if (-not ($entries -contains "assets/motion.js")) { throw "Package is missing assets/motion.js." }
  if ($entries | Where-Object { $_ -match "\\" }) { throw "Package contains non-portable path separators." }
}
finally {
  $check.Dispose()
}

Get-Item -LiteralPath $zipPath | Select-Object FullName, Length, LastWriteTime

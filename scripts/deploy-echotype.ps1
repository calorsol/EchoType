param(
    [string]$ServerHost = "64.83.35.146",
    [string]$ServerUser = "root",
    [string]$RemotePath = "/home/web/html/echotype",
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $projectRoot "dist"

function Assert-CommandExists {
    param([string]$CommandName)

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $CommandName"
    }
}

Assert-CommandExists "ssh"
Assert-CommandExists "scp"
Assert-CommandExists "npm"

Push-Location $projectRoot
try {
    if (-not $SkipBuild) {
        Write-Host "Building production assets..."
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed."
        }
    }

    if (-not (Test-Path $distPath)) {
        throw "dist directory not found: $distPath"
    }

    $remote = "$ServerUser@$ServerHost"

    Write-Host "Preparing remote directory $RemotePath ..."
    ssh $remote "mkdir -p $RemotePath && find $RemotePath -mindepth 1 -maxdepth 1 -exec rm -rf {} +"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to prepare remote directory."
    }

    Write-Host "Uploading dist contents to $remote`:$RemotePath ..."
    scp -r "$distPath\*" "${remote}:$RemotePath/"
    if ($LASTEXITCODE -ne 0) {
        throw "Upload failed."
    }

    Write-Host "Deployment complete: https://echotype.868601.xyz"
}
finally {
    Pop-Location
}

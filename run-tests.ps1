# Starts backend + frontend with a fresh database, runs the browser tests, then stops everything.
# Usage: powershell -ExecutionPolicy Bypass -File run-tests.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mvn = Join-Path $HOME "apache-maven-3.9.6\bin\mvn.cmd"
if (-not (Test-Path $mvn)) { $mvn = "mvn" }
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) { $npm = "npm" }

# Fresh database so tests never depend on leftover data
Remove-Item -Recurse -Force (Join-Path $root "backend\data") -ErrorAction SilentlyContinue

$beLog = Join-Path $env:TEMP "chatapp-be.log"
$feLog = Join-Path $env:TEMP "chatapp-fe.log"

$be = Start-Process -FilePath $mvn -ArgumentList "spring-boot:run" -WorkingDirectory (Join-Path $root "backend") -PassThru -NoNewWindow -RedirectStandardOutput $beLog -RedirectStandardError "$beLog.err"
$fe = Start-Process -FilePath $npm -ArgumentList "run","dev" -WorkingDirectory (Join-Path $root "frontend") -PassThru -NoNewWindow -RedirectStandardOutput $feLog -RedirectStandardError "$feLog.err"

$exitCode = 1
try {
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 3
        try {
            $a = Invoke-WebRequest -Uri "http://localhost:8080/api/channels" -TimeoutSec 3 -UseBasicParsing
            $b = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -UseBasicParsing
            if ($a.StatusCode -eq 200 -and $b.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
    }

    if (-not $ready) {
        Write-Output "SERVERS FAILED TO START"
        Get-Content $beLog -Tail 30 -ErrorAction SilentlyContinue
        Get-Content $feLog -Tail 30 -ErrorAction SilentlyContinue
        return
    }

    Write-Output "Servers ready. Running browser tests..."
    Push-Location (Join-Path $root "frontend")

    node smoke.mjs
    $smokeExit = $LASTEXITCODE
    node e2e.mjs
    $e2eExit = $LASTEXITCODE
    $exitCode = if ($smokeExit -eq 0 -and $e2eExit -eq 0) { 0 } else { 1 }

    Pop-Location
} finally {
    taskkill /T /F /PID $be.Id 2>$null | Out-Null
    taskkill /T /F /PID $fe.Id 2>$null | Out-Null
    Write-Output "Servers stopped."
    # Leave a pristine seeded database behind for the next manual run
    Start-Sleep -Seconds 2
    Remove-Item -Recurse -Force (Join-Path $root "backend\data") -ErrorAction SilentlyContinue
}

exit $exitCode

# sessionStart / sessionEnd audit trail.
#
# PowerShell mirror of audit-session.sh. Records the timestamp, the phase and the working
# directory. Never records prompt text, environment variables or tool arguments.

param(
    [string]$Phase = 'unknown'
)

$ErrorActionPreference = 'Stop'

try {
    $log = $env:AUDIT_LOG
    if ([string]::IsNullOrWhiteSpace($log)) { $log = '.copilot-audit/session.log' }

    $raw = [Console]::In.ReadToEnd()
    $cwd = 'unknown'
    if (-not [string]::IsNullOrWhiteSpace($raw)) {
        try {
            $payload = $raw | ConvertFrom-Json
            if ($payload.cwd) { $cwd = [string]$payload.cwd }
        }
        catch {
            $cwd = 'unparsed'
        }
    }

    $dir = Split-Path -Parent $log
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    $line = "$stamp`t$Phase`t$cwd`thooks=guardrails.json"
    Add-Content -Path $log -Value $line -Encoding utf8

    exit 0
}
catch {
    exit 0
}

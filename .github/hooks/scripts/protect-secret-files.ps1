# preToolUse guardrail: deny reading or writing likely-secret files.
#
# PowerShell mirror of protect-secret-files.sh. Keep the rule sets in sync.
# Exit 0 on every non-matching path; deny only through stdout JSON.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json

    $toolName = $payload.toolName
    if (-not $toolName) { $toolName = $payload.tool_name }
    $toolName = [string]$toolName

    if ($toolName -notmatch '^(?i)(view|read|edit|write|multiedit|str_replace|create)$') { exit 0 }

    $args_ = $payload.toolArgs
    if (-not $args_) { $args_ = $payload.tool_input }

    $path = ''
    if ($args_ -is [string]) {
        $path = $args_
    }
    elseif ($null -ne $args_) {
        if ($args_.path) { $path = [string]$args_.path }
        elseif ($args_.filePath) { $path = [string]$args_.filePath }
        elseif ($args_.file_path) { $path = [string]$args_.file_path }
        elseif ($args_.file) { $path = [string]$args_.file }
    }

    if ([string]::IsNullOrWhiteSpace($path)) { exit 0 }

    $normalised = $path.Replace('\', '/').ToLowerInvariant()

    $blocked = @(
        @{ Pattern = '(^|/)\.env(\.|$)'; Reason = 'Environment files hold live credentials. Read the .env.example template instead.' },
        @{ Pattern = '\.(pem|key|pfx|p12)$'; Reason = 'Private keys must not enter the model context.' },
        @{ Pattern = '(^|/)id_(rsa|dsa|ecdsa|ed25519)$'; Reason = 'SSH private keys must not enter the model context.' },
        @{ Pattern = '(^|/)\.aws/credentials$'; Reason = 'Cloud credentials must not enter the model context.' },
        @{ Pattern = '(^|/)\.npmrc$'; Reason = 'The npmrc may carry a publish token. Ask a human to check it.' },
        @{ Pattern = '(^|/)\.git/config$'; Reason = 'Repository config changes are a human decision.' }
    )

    foreach ($rule in $blocked) {
        if ($normalised -match $rule.Pattern) {
            $out = [ordered]@{
                permissionDecision       = 'deny'
                permissionDecisionReason = $rule.Reason
            }
            $out | ConvertTo-Json -Compress
            exit 0
        }
    }

    exit 0
}
catch {
    exit 0
}

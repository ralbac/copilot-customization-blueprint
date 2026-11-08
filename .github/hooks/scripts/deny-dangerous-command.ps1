# preToolUse guardrail: deny shell commands that are destructive and hard to undo.
#
# PowerShell mirror of deny-dangerous-command.sh. Keep the rule sets in sync: a rule that
# exists in one and not the other is a guardrail with an operating-system-shaped hole.
#
# Contract reminders:
#   * stdout carries at most one final JSON object.
#   * exit 0 on every non-matching path. A non-zero exit denies the call even when stdout
#     reports "allow", so a crash here blocks the whole session.
#   * timeouts fail open, which silently disables the guardrail. Stay well under timeoutSec.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

    $payload = $raw | ConvertFrom-Json

    $toolName = $payload.toolName
    if (-not $toolName) { $toolName = $payload.tool_name }
    $toolName = [string]$toolName

    if ($toolName -notmatch '^(?i)(bash|shell|powershell|execute)$') { exit 0 }

    $args_ = $payload.toolArgs
    if (-not $args_) { $args_ = $payload.tool_input }

    $command = ''
    if ($args_ -is [string]) {
        $command = $args_
    }
    elseif ($null -ne $args_) {
        if ($args_.command) { $command = [string]$args_.command }
        elseif ($args_.cmd) { $command = [string]$args_.cmd }
        elseif ($args_.script) { $command = [string]$args_.script }
    }

    if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

    $rules = @(
        @{ Id = 'force-push'; Pattern = '(?i)git\s+push\b[^\n]*(--force\b|--force-with-lease\b|\s-f\b)'; Reason = 'Force-pushing rewrites published history. Ask a human to run this.' },
        @{ Id = 'recursive-delete-root'; Pattern = '(?i)rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+(/|/\*|~|\$HOME)\s*$'; Reason = 'Recursive delete of a root path is irreversible.' },
        @{ Id = 'pipe-to-shell'; Pattern = '(?i)\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba)?sh\b'; Reason = 'Piping a download into a shell executes unreviewed code.' },
        @{ Id = 'credential-exfiltration'; Pattern = '(?i)\b(cat|less|more|head|tail|strings|Get-Content)\b[^\n]*(\.env\b|id_rsa\b|\.pem\b|\.aws/credentials)'; Reason = 'Reading credential files into the transcript leaks them into the model context.' },
        @{ Id = 'history-rewrite'; Pattern = '(?i)\bgit\s+(rebase\s+-i|filter-branch)'; Reason = 'Interactive history rewriting is a human decision, not an agent step.' },
        @{ Id = 'database-drop'; Pattern = '(?i)\b(drop\s+database|drop\s+schema|truncate\s+table)\b'; Reason = 'Destructive SQL requires an explicit human decision.' },
        @{ Id = 'chmod-world'; Pattern = '(?i)\bchmod\s+(-R\s+)?777\b'; Reason = 'World-writable permissions are a security defect, not a shortcut.' },
        @{ Id = 'unprotected-secret-write'; Pattern = '(?i)\b(gh\s+secret\s+set|gh\s+variable\s+set)\b'; Reason = 'Secrets are set by a human, from a human-controlled source.' }
    )

    foreach ($rule in $rules) {
        if ($command -match $rule.Pattern) {
            $reason = '[' + $rule.Id + '] ' + $rule.Reason
            $out = [ordered]@{
                permissionDecision       = 'deny'
                permissionDecisionReason = $reason
            }
            $out | ConvertTo-Json -Compress
            exit 0
        }
    }

    exit 0
}
catch {
    # Fail open on an unexpected error. The alternative is a hook that blocks every tool call
    # because of a bug in the hook itself.
    exit 0
}

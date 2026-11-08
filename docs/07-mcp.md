# MCP

MCP is the protocol Copilot uses to reach tools that live outside the repository: an issue
tracker, a browser, a database, an internal service. By the end of this chapter you will be able
to configure a server for the editor and for the cloud surfaces, supply its credentials without
committing them, and grant the smallest set of its tools to the agents that need it.

## Why the configuration is split

Model Context Protocol support is not one setting. It is one setting per surface, in two different
formats, and for the cloud surfaces it is not a file at all:

| Surface | How it is configured | Format |
| --- | --- | --- |
| VS Code | [`.vscode/mcp.json`](../.vscode/mcp.json), committed to the repository | A `servers` object |
| Cloud agent | Repository settings on github.com, `Settings` → `Copilot` → `MCP servers` | An `mcpServers` object pasted into the UI |
| Copilot code review | Shares the repository-level configuration, and can be disabled separately | Same as the cloud agent |
| One custom agent | The `mcp-servers` property in that agent's frontmatter | Same shape as the repository level |

The two object names are not interchangeable. `servers` is what the editor reads from the
committed file; `mcpServers` is what the repository setting accepts. Pasting one into the other
produces a configuration that is accepted and does nothing.

That the cloud configuration is not a committed file surprises people, and the surprise has a
consequence: it is not in code review. A change to the servers the cloud agent can reach is a
change nobody reviewed in a pull request. Chapter [09](09-policies-and-guardrails.md) treats that
as an enforcement gap; here, treat it as a reason to write down who is allowed to change it.

## The JSON shape

```json
{
  "mcpServers": {
    "example": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@example/mcp-server"],
      "tools": ["*"],
      "env": { "EXAMPLE_TOKEN": "$COPILOT_MCP_EXAMPLE_TOKEN" }
    }
  }
}
```

| Field | Meaning |
| --- | --- |
| `type` | `local` or `stdio`, which are the same type under different names |
| `command` | The executable to start, for a local server |
| `args` | Its arguments |
| `tools` | Which of the server's tools to expose |
| `env` | Environment variables for the server process |

`stdio` and `local` are equivalent, and the alias exists because two tools wrote the same field
twice. Use one consistently in a file so a reader does not assume a difference.

## Secrets

A server that needs a token must not have one written into the configuration, because on the cloud
surfaces that configuration lives in a settings UI that is copied, pasted and screenshotted.

Credentials come from **Agents secrets and variables**, and the names are prefixed with
`COPILOT_MCP_`. The prefix is a namespace, not a convention: an unprefixed secret is not available
to the MCP configuration.

| Reference syntax | Where |
| --- | --- |
| `$COPILOT_MCP_X` | Any MCP configuration |
| `${COPILOT_MCP_X}` | Any MCP configuration |
| `${COPILOT_MCP_X:-default}` | Any MCP configuration, with a fallback |
| `${{ secrets.COPILOT_MCP_X }}` | Agent YAML |
| `${{ vars.COPILOT_MCP_X }}` | Agent YAML |

Agents secrets and variables are configured at organization and repository level. Use a variable
for a non-sensitive value that differs per environment, and a secret for anything that grants
access.

The committed editor file solves the same problem differently, through a prompt input: the
reference [`.vscode/mcp.json`](../.vscode/mcp.json) asks for a token when it starts and states in
the prompt that the token must never be committed. A committed file cannot hold a secret, so a
checkout that needs one has to ask for it.

## The servers you already have

The cloud agent has two MCP servers available out of the box: `github` and `playwright`.

- `github` gives access to the repository's own surface — issues, pull requests, code search — so
  the agent does not need a bespoke tool to read the issue it was asked to fix.
- `playwright` drives a browser, which is what makes a UI defect reproducible rather than inferred.

Both are namespaced as `<server>/<tool>`. Reach for one of these before configuring a new server:
an agent that can already read the issue and open a page needs a great deal less configuration than
the reflex suggests.

## Per-agent servers

An agent can carry its own servers, so a capability does not leak into every session:

```yaml
---
description: "Reproduces a reported UI defect by driving the page and reporting the steps."
tools: ["read", "search", "playwright/*"]
mcp-servers:
  playwright:
    type: local
    command: npx
    args: ["-y", "@playwright/mcp@latest", "--headless"]
---
```

The `mcp-servers` property is not used in VS Code, which reads `.vscode/mcp.json` instead. That
asymmetry is the reason to decide early which surfaces matter: a server configured only in the
agent works in the cloud and is invisible in the editor, and the reverse is also true.

## Least privilege on external tools

A server's `tools` field decides which of its tools the model can see. State it explicitly, and
choose between the two levels that mean something:

| Setting | Effect | When to use it |
| --- | --- | --- |
| `tools: ["*"]` | Every tool the server exposes | A server you wrote, with a narrow surface |
| `tools: ["issue_read", "pull_request_read"]` | Named tools only | A general-purpose server whose write tools you do not want |

An MCP server is a tool grant in the sense of [the mental model](00-mental-model.md#three-mechanisms-three-different-guarantees):
it changes what the agent is able to do, and it does so without asking the model to agree to
anything. A tracker server that exposes `create_issue` and `close_issue` alongside `read_issue`
gives an agent that was asked to triage the ability to close the report instead.

The same reasoning applies inside an agent's or a prompt's `tools` list. `<server>/*` is a
convenience that grants everything the server offers; write the tool names when the server offers
more than the task needs.

## Before you add a server

An MCP server is a trust boundary: it runs code, or reaches a service, on behalf of a model that is
following instructions you did not write. Four checks before configuring one:

1. **Does a built-in server already do this?** `github` and `playwright` cover the two most common
   requests, and a server you did not add is one you do not have to secure.
2. **What does the server expose?** Read its tool list and write down which tools you want before
   you connect it. That list is the `tools` field, and writing it first is how you notice that a
   "read-only" server also offers `delete`.
3. **What does it need to read?** A token, a database URL, a cookie. Everything it needs is
   something that can leak into a transcript, so grant the narrowest scope the service supports.
4. **Who reviews the change?** On the cloud surfaces the configuration is a setting rather than a
   file, so no pull request contains it. Decide the reviewer before the server is connected, not
   after.

## Common failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| The server works in the editor and not in the cloud | The two configurations are separate, and only `.vscode/mcp.json` was updated | Add the server in the repository settings UI as `mcpServers` |
| The server is configured and its tools never appear | The object key is `servers` where `mcpServers` is required, or the reverse | Match the key to the surface |
| A token is available locally and empty in the cloud | The secret is not prefixed with `COPILOT_MCP_` | Rename the secret or variable with the prefix |
| The server starts locally and exits in the cloud | It depends on something on your machine | Install or start the dependency in the environment steps; see [chapter 08](08-agent-environment.md) |
| The agent closes or edits data it was only asked to inspect | Every tool from the server is exposed | Name the tools, or grant `<server>/*` only where the server is narrow |
| An agent-relative `mcp-servers` block has no effect | The session is in VS Code, which does not read that property | Configure the editor through `.vscode/mcp.json` |
| A new server is reachable in the cloud and nobody reviewed it | The repository-level configuration is not a committed file, so no pull request contains it | Decide who may change it and review the setting directly; `CODEOWNERS` only covers files |

## Practice

[Lab 07](../labs/07-mcp.md) has you configure a server for the editor, restrict it to named tools,
and prove that the restriction holds.

Next: [the agent environment](08-agent-environment.md), which decides what the agent has available
before it reads a single file.

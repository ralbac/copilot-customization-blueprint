# Lab 07 — Configure MCP for the editor and for the cloud

## Goal

You will be able to prove that the two servers committed in `.vscode/mcp.json` are discovered in
VS Code, and to explain why the cloud surfaces take the same servers through repository settings
with no committed file and a required secret prefix.

## What you need

- VS Code with Copilot Chat, for the editor half.
- A browser with access to the repository settings, for the cloud half.
- Node.js 20 or newer only if you start the `playwright` server, which runs through `npx` and
  downloads a package. The check does not require that server to start; discovery is enough.

## Before you start

Open `.vscode/mcp.json`. The expected state:

```json
{
  "servers": {
    "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer ${input:github-token}" } },
    "playwright": { "type": "stdio", "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--headless", "--allowed-origins", "http://localhost:*"] }
  },
  "inputs": [{ "type": "promptString", "id": "github-token", "password": true }]
}
```

Two details carry the safety of this file: no token is committed, because the header reads
`${input:github-token}`, and `inputs` declares that the value is prompted for and stored as a
password. Confirm both in the file you have open.

## Steps

1. Note the wrapper key: `servers`. That is the VS Code shape. The cloud shape uses
   `mcpServers`, and pasting one into the other produces a server list that is silently empty.

2. In VS Code, open the MCP servers view. The exact location differs by version: it is reachable
   from the Chat view's tools control and from the Command Palette, which lists MCP commands by
   name. The goal, not the menu path, is this: the view lists `github` and `playwright`, the two
   names declared in the file.

3. Start `playwright`. VS Code asks for confirmation before running a server it has not run
   before, and `npx` fetches the package on first use, so this step needs network access. The
   observable result is the server's state changing to running.

4. Find the server's tools where they matter: in agent mode, open the tool picker and look for
   entries named `<server>/<tool>`. A discovered server whose tools are not selected is still
   discovered, and that distinction is the one people trip over — a tool you did not select is
   not a tool the agent can use.

5. Start `github` if you have a fine-grained personal access token with read access to this
   repository. VS Code prompts for it, because `inputs` says so; the value is not written to the
   file. If you do not have one, skip this step. The check does not depend on it.

6. Now the cloud half. Open the repository on github.com and go to the Copilot MCP settings.
   The frontmatter reference names the path as `Settings` → `Copilot` → `MCP servers`; labels in
   that area change, so look for the Copilot section that lists MCP servers rather than trusting
   one screenshot.

7. Paste the same two servers, converted to the cloud shape. The wrapper is `mcpServers`, and any
   secret is a reference, never a value. For example, a server that needs a token in an
   environment variable reads:

   ```json
   {
     "mcpServers": {
       "example": {
         "type": "local",
         "command": "npx",
         "args": ["-y", "@example/mcp-server"],
         "env": { "EXAMPLE_TOKEN": "$COPILOT_MCP_EXAMPLE_TOKEN" }
       }
     }
   }
   ```

   `stdio` and `local` are the same type under two names, so a server copied from the editor file
   needs its `type` renamed only if you want the two files to look alike.

8. Confirm the prefix rule in the repository's Agents secrets and variables. A secret or variable
   used by repository-level MCP must be named with the `COPILOT_MCP_` prefix. The supported
   reference forms are `$COPILOT_MCP_X`, `${COPILOT_MCP_X}` and `${COPILOT_MCP_X:-default}`; in
   an agent's own `mcp-servers` YAML you also see `${{ secrets.COPILOT_MCP_X }}` and
   `${{ vars.COPILOT_MCP_X }}`.

## Check

Success is four observations:

- VS Code lists `github` and `playwright` from `.vscode/mcp.json`, and `playwright` reaches a
  running state.
- The agent's tool picker shows tools named `playwright/<tool>`.
- The repository settings page holds the two servers in the `mcpServers` shape.
- `git status --short` prints nothing, and no `.github/mcp.json` exists, because nothing was
  committed for the cloud half.

Four plausible-looking failures:

| What you see | What it means |
| --- | --- |
| A committed `.github/mcp.json` | Nothing reads it. The editor reads `.vscode/mcp.json`; the cloud reads settings |
| The settings page accepts your JSON and lists no servers | You pasted `servers`. The cloud wrapper is `mcpServers` |
| The token is a literal in `.vscode/mcp.json` | The editor works and you have published a credential. The committed form is `${input:...}` |
| The server works in the editor and is missing in a cloud session | The cloud does not read the editor file; that is the whole point of the second configuration |

## If it does not work

| Symptom | Cause | Fix |
| --- | --- | --- |
| The servers are not listed in VS Code | The file is not `.vscode/mcp.json`, or the workspace is not the repository root | Open the repository folder itself |
| Starting `playwright` fails | No network, or `npx` cannot fetch the package | Inspect discovery only; the check does not need a running server |
| VS Code prompts for the GitHub token on every window | Workspace inputs are stored per workspace and not in the file | Answer the prompt; do not hard-code the token to silence it |
| A cloud session has no MCP tools | Repository-level MCP is not configured, or the secret name lacks the prefix | Configure it in settings and rename the secret |
| Code review has no MCP tools while the cloud agent does | Review shares the repository configuration but can be disabled separately | Check the review section of the MCP settings |
| A tool is discovered and the agent cannot call it | The tool was not selected for that agent | Select it, or grant it in the agent's `tools` list as `<server>/*` |

## Clean up

Stop any server you started, and remove a stored token if you saved one in the workspace. Nothing
was committed, so:

```bash
git status --short
```

Expected: no output. If you created a `.github/mcp.json` while experimenting, delete it: it is
not a configuration file any surface reads.

## What you just proved

MCP configuration is surface-specific in both location and shape: a committed editor file with a
`servers` object, an uncommitted repository setting with an `mcpServers` object, and an optional
`mcp-servers` block inside one agent. The secret rule is not a convention you can choose to skip,
because the reference syntax only resolves names with the `COPILOT_MCP_` prefix — which is what
keeps credentials out of the repository while letting the cloud server reach them. Discovery of a
server is also not the same as a granted tool: the server is configured once, and the tool is
selected per agent.

# Development

## Run Against Another Local Repo

Prerequisites:

- Bun 1.0 or newer

Set up and link this package using Bun:

```sh
cd /path/to/openwiki
bun install
bun run build
bun link
```

Run a dry test from the repo you want OpenWiki to inspect:

```sh
cd /path/to/target/repo
OPENWIKI_DEV=1 openwiki --dry-run
```

Run the real CLI from the target repo:

```sh
cd /path/to/target/repo
openwiki
openwiki -p "Summarize what you can do"
openwiki --modelId openai/gpt-5.5
openwiki "Please focus on API documentation"
```

The target repo is still the current working directory. The global link only
avoids typing the path to `dist/cli.js`.

If you do not want to configure global links, use a shell alias instead:

```sh
alias openwiki='bun run /path/to/openwiki/dist/cli.js'
```

That alias can go in `~/.zshrc` if you want it to persist.

After changing OpenWiki source code, rebuild from this package directory:

```sh
bun run build
```

The existing global link will keep using the rebuilt `dist/cli.js`.

Real runs can write:

- `openwiki/`
- `~/.openwiki/.env` for local OpenRouter model/key settings and optional LangSmith credentials

Scheduled update workflow example:

- `examples/openwiki-update.yml`

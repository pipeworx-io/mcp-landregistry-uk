# mcp-landregistry-uk

HM Land Registry Price Paid Data (UK) MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_transactions` | Search HM Land Registry Price Paid records — individual residential property sales in England & Wales since 1995. Filter by postcode, town, district, county, price range and sale-date range; sort and page through results. Each record returns price paid (£GBP), sale date, full address, property type, tenure (freehold/leasehold) and new-build flag. Postcodes must be UPPERCASE with a space (e.g. "SW1A 1AA"). |
| `lookup_postcode` | Convenience: list the most recent HM Land Registry property sales for a single UK postcode (England & Wales). Returns sale price (£GBP), date, address, property type, tenure and new-build flag, newest sale first. Postcode must be UPPERCASE with a space, e.g. "SW1A 1AA". |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "landregistry-uk": {
      "url": "https://gateway.pipeworx.io/landregistry-uk/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/landregistry-uk/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/search_transactions \
  -H 'Content-Type: application/json' \
  -d '{"postcode":"SW1A 1AA","minPrice":500000,"maxPrice":2000000,"minDate":"2020-01-01","sort":"-transactionDate","pageSize":25}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/search_transactions`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "landregistry-uk": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-landregistry-uk"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-landregistry-uk
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Landregistry Uk data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

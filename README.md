# mcp-landregistry-uk

HM Land Registry Price Paid Data (UK) MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Landregistry Uk data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

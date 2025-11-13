# Advanced Extraction

## Overview

This module adds four advanced extraction capabilities to the workflow executor system:

- CSS selector extraction from live pages
- XPath selector extraction from live pages
- Network interception to capture API responses
- Direct GraphQL query execution

All features are modular under `lib/workflow/executor/**` and maintain backward compatibility with existing tasks.

## Tasks

### `EXTRACT_CSS_FROM_PAGE`

- Inputs: `Web page`, `Selector`, `Attribute`, `All elements`
- Output: `Extracted data` (JSON string), `Web page`
- Attributes supported: `textContent`, `innerText`, `value`, `href`, `src`, `html`

### `EXTRACT_XPATH_FROM_PAGE`

- Inputs: `Web page`, `XPath`, `Attribute`, `All elements`
- Output: `Extracted data` (JSON string), `Web page`
- Uses Puppeteer’s XPath APIs; same attribute options as CSS.

### `INTERCEPT_NETWORK`

- Inputs: `Web page`, `URL pattern` (substring or `/regex/`), `Resource type`, `Method`, `Duration (ms)`, `Max responses`, `Include body`
- Output: `Responses JSON` (array of captured responses), `Web page`
- Captures headers, status, method, resource type; optionally body and post data.

### `GRAPHQL_QUERY`

- Inputs: `Web page` (optional), `Endpoint URL`, `Query`, `Variables JSON` (optional), `Use browser context`
- Output: `Response JSON` (stringified), `Web page`
- When using browser context, applies politeness headers (`user-agent`, `accept-language`, custom headers).

## Configuration

- Politeness configuration from workflow definition is respected in browser mode (user agent rotation and headers).
- No global mutable state is introduced; per-page caches are used for selector results.

## Examples

1. Extract product titles:

```
Task: EXTRACT_CSS_FROM_PAGE
Selector: .product-title
Attribute: innerText
All elements: true
```

2. Extract by XPath:

```
Task: EXTRACT_XPATH_FROM_PAGE
XPath: //div[@class='price']/span
Attribute: textContent
All elements: false
```

3. Capture API responses:

```
Task: INTERCEPT_NETWORK
URL pattern: /api/products/
Resource type: fetch
Method: GET
Duration (ms): 1500
Max responses: 50
Include body: true
```

4. Execute a GraphQL query:

```
Task: GRAPHQL_QUERY
Endpoint URL: https://example.com/graphql
Query: query($id:ID!){ product(id:$id){ name, price } }
Variables JSON: { "id": "123" }
Use browser context: false
```

## Performance

- Selector queries run inside the browser DOM for speed.
- Results are cached per page and selector/attribute pair to avoid redundant work.
- Network listeners are cleaned up after duration or when max responses reached.

## Troubleshooting

- Empty `Extracted data`: Verify selector/XPath and page content is loaded; increase waits if needed.
- `Web page not found`: Ensure upstream tasks pass the browser page instance to this task.
- Network capture returns no matches: Check `URL pattern`, `Resource type`, and `Method`; increase `Duration (ms)`.
- GraphQL variables parsing error: Ensure `Variables JSON` is valid JSON.
- Cookie-authenticated endpoints: Prefer `Use browser context: true` to reuse page cookies.

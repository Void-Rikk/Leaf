![Leaf](/leaf.png)

>Leaf is a lightweight beginner-friendly fetching tool based on Fetch API

## Why Leaf?

Leaf is designed to simplify common problems when working with fetch:

- Avoid duplicate requests automatically
- Retry failed requests with exponential backoff
- Cache GET requests out of the box
- Built-in timeout support

All of this with minimal configuration and a simple API.

## Installation

```bash
npm install @void-rikk/leaf
```

## Basic usage

```javascript
import Leaf from '@void-rikk/leaf';

const leaf = new Leaf("https://example.com");
    
const data = await leaf.get({ url: "/users" });

console.log(data);
```

## Quick example with typing

```typescript
const data = await leaf.get<User[]>({ url: "/users" });
```

## Behavior

- GET requests are deduplicated (multiple identical requests share the same promise)
- Only GET requests are cached
- Non-GET requests clear the cache (temporary behavior)
- Retries are applied to network errors and 5xx responses
- Requests aborted by user are not retried

## API reference

**new Leaf(baseUrl?, config?)**

The `baseUrl?` parameter defines the base URL used in all requests. \
The `config?` parameter represents options objects which change request behavior.
- The `config.timeout?` option enables request abort after custom amount of time.
- The `config.headers?` option defines the headers which will be used as default headers in every request.
- The `config.retry?` option enables retrying mechanism and defines amount of retrying attempts as well.
- The `config.retryDelay?` option defines an amount of time before retry will be executed. \
Note: retryDelay is used as a base delay. Leaf applies exponential backoff automatically.
- The `config.cache?` option enables cache mechanism (notice that caching works only with GET method and the rest methods fully clears the cache map (to be reworked ;) )).
- The `config.cacheTime?` option defines cache TTL (5 minutes by default).

**leaf.get(params)**

The `params` object contains parameters for specific request.
- The `params.url` property defines the path to the resource.
- The `params.headers?` property defines the headers for specific request.
- The `params.params?` property is an object which defines query parameters for specific request.
- The `params.signal?` property defines custom signal which will abort specific request.

The rest of HTTP methods shortcuts have the same params except for `body` property which defines the body of the exact request

### Types

**baseUrl?**

Type: `string`

**config?**

Type: `object`

**config.timeout?**

Type: `number`

**config.headers?**

Type: `HeadersInit`

**config.retry?**

Type: `number`

**config.retryDelay?**

Type: `number`

**config.cache?**

Type: `boolean`

**config.cacheTime?**

Type: `number`

**params**

Type: `object`

**params.url**

Type: `string`

**params.headers?**

Type: `HeadersInit`

**params.params?**

Type: `Record<string, string | number>`

**params.signal?**

Type: `AbortSignal`

## Examples

### Retry configuration example

```javascript
import Leaf from '@void-rikk/leaf';

const leaf = new Leaf("https://example.com", {
    retry: 3,
    retryDelay: 200
});
```

### Cache example

```javascript
import Leaf from '@void-rikk/leaf';

const leaf = new Leaf("https://example.com", {
    cache: true,
    cacheTime: 60000
});
```

### Timeout example

```javascript
import Leaf from '@void-rikk/leaf';

const leaf = new Leaf("https://example.com", {
    timeout: 5000
});
```
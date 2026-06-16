![Leaf](/leaf.png)

>Leaf is a lightweight beginner-friendly fetching tool based on Fetch API

## Key features

- HTTP methods shortcuts
- Retries
- Timeout
- Simple cache
- Deduplication

## Installation

```bash
npm install @vrikk/leaf
```

## Basic usage

```javascript
import Leaf from 'leaf';

const leaf = new Leaf("https://example.com");
    
const data = await leaf.get({ url: "/users" });

console.log(data);
```

## API reference

**new Leaf(baseUrl?, config?)**

The `baseUrl?` parameter of Leaf constructor is used as API domain in HTTP methods shortcuts
such as leaf.get. \
The `config?` parameter represents options objects which changes request's behavior.
- The `config.timeout?` option enables request abort after custom amount of time.
- The `config.headers?` option defines the headers which will be used as default headers in every request.
- The `config.retry?` option enables retrying mechanism and defines amount of retrying attempts as well.
- The `config.retryDelay?` option defines an amount of time before retry will be executed (notice that retry mechanism uses exponential backoff technique so `retryDelay` is more like delay coefficient).
- The `config.cache?` option enables cache mechanism (notice that caching works only with GET method and the rest methods fully clears the cache map (to be reworked ;) )).
- The `config.cacheTime?` option defines cache TTL (5 minutes by default).

**leaf.get(params)**

The `params` object contains parameters for exact request.
- The `params.url` property defines the path to the resource.
- The `params.headers?` property defines the headers for exact request.
- The `params.params?` property is an object which defines query parameters for exact request.
- The `params.signal?` property defines custom signal which will abort exact request.

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
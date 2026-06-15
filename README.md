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
    
const data = await leaf.get("/users");

console.log(data);
```
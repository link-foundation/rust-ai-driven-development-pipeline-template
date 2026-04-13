# Browser Commander

A universal browser automation library with a unified API across multiple browser engines and programming languages. The key focus is on **stoppable page triggers** - ensuring automation logic is properly mounted/unmounted during page navigation.

## Available Implementations

| Language | Package | Status |
|----------|---------|--------|
| JavaScript/TypeScript | [browser-commander](https://www.npmjs.com/package/browser-commander) | [![npm](https://img.shields.io/npm/v/browser-commander)](https://www.npmjs.com/package/browser-commander) |
| Rust | [browser-commander](https://crates.io/crates/browser-commander) | [![crates.io](https://img.shields.io/crates/v/browser-commander)](https://crates.io/crates/browser-commander) |
| Python | [browser-commander](https://pypi.org/project/browser-commander/) | [![PyPI](https://img.shields.io/pypi/v/browser-commander)](https://pypi.org/project/browser-commander/) |

## Core Concept: Page State Machine

Browser Commander manages the browser as a state machine with two states:

```
+------------------+                      +------------------+
|                  |   navigation start   |                  |
|  WORKING STATE   | -------------------> |  LOADING STATE   |
|  (action runs)   |                      |  (wait only)     |
|                  |   <-----------------  |                  |
+------------------+     page ready       +------------------+
```

**LOADING STATE**: Page is loading. Only waiting/tracking operations are allowed. No automation logic runs.

**WORKING STATE**: Page is fully loaded (30 seconds of network idle). Page triggers can safely interact with DOM.

## Page Trigger Lifecycle

The library provides a guarantee when navigation is detected:

1. **Action is signaled to stop** (AbortController.abort())
2. **Wait for action to finish** (up to 10 seconds for graceful cleanup)
3. **Only then start waiting for page load**

This ensures:

- No DOM operations on stale/loading pages
- Actions can do proper cleanup (clear intervals, save state)
- No race conditions between action and navigation

## Getting Started

For installation and usage instructions, see the documentation for your preferred language:

- **JavaScript/TypeScript**: See [js/README.md](js/README.md)
- **Rust**: See [rust/README.md](rust/README.md)
- **Python**: See [python/README.md](python/README.md)

## Architecture

See [js/src/ARCHITECTURE.md](js/src/ARCHITECTURE.md) for detailed architecture documentation.

## License

[UNLICENSE](LICENSE)

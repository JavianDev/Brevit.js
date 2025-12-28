# TypeScript Support for Brevit.js

Brevit.js includes comprehensive TypeScript definitions for full type safety and excellent IDE support.

## Installation

No additional installation required! TypeScript definitions are included in the package.

```bash
npm install brevit-js
```

## Basic Usage

```typescript
import {
  BrevitClient,
  BrevitConfig,
  JsonOptimizationMode,
} from 'brevit-js';

const config = new BrevitConfig({
  jsonMode: JsonOptimizationMode.Flatten,
});

const client = new BrevitClient(config);
const optimized = await client.optimize({ user: { name: 'John' } });
```

## Type Exports

All types are exported for your convenience:

### Enums

```typescript
import {
  JsonOptimizationMode,
  TextOptimizationMode,
  ImageOptimizationMode,
} from 'brevit-js';

// Usage
const mode: typeof JsonOptimizationMode.Flatten = JsonOptimizationMode.Flatten;
```

### Type Aliases

```typescript
import type {
  JsonOptimizationModeType,
  TextOptimizationModeType,
  ImageOptimizationModeType,
} from 'brevit-js';

function setMode(mode: JsonOptimizationModeType) {
  // Type-safe mode setting
}
```

### Interfaces

```typescript
import type {
  BrevitConfigOptions,
  BrevitClientOptions,
  TextOptimizerFunction,
  ImageOptimizerFunction,
} from 'brevit-js';

// Configuration options
const config: BrevitConfigOptions = {
  jsonMode: JsonOptimizationMode.Flatten,
  longTextThreshold: 1000,
};

// Custom optimizer functions
const textOptimizer: TextOptimizerFunction = async (text, intent) => {
  // Your implementation
  return optimizedText;
};
```

## Examples

### Example 1: Type-Safe Configuration

```typescript
import {
  BrevitClient,
  BrevitConfig,
  JsonOptimizationMode,
  type BrevitConfigOptions,
} from 'brevit-js';

const configOptions: BrevitConfigOptions = {
  jsonMode: JsonOptimizationMode.Flatten,
  textMode: 'Clean',
  imageMode: 'Ocr',
  jsonPathsToKeep: ['user.name', 'order.orderId'],
  longTextThreshold: 1000,
};

const config = new BrevitConfig(configOptions);
const client = new BrevitClient(config);
```

### Example 2: Custom Optimizers with Types

```typescript
import {
  BrevitClient,
  BrevitConfig,
  type TextOptimizerFunction,
  type ImageOptimizerFunction,
} from 'brevit-js';

const customTextOptimizer: TextOptimizerFunction = async (longText, intent) => {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: longText, intent }),
  });
  const { summary } = await response.json();
  return summary;
};

const customImageOptimizer: ImageOptimizerFunction = async (imageData, intent) => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData)));
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });
  const { text } = await response.json();
  return text;
};

const client = new BrevitClient(new BrevitConfig(), {
  textOptimizer: customTextOptimizer,
  imageOptimizer: customImageOptimizer,
});
```

### Example 3: Type-Safe Data Structures

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

interface Order {
  orderId: string;
  status: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
  }>;
}

const user: User = {
  id: 'u-123',
  name: 'Javian',
  email: 'support@javianpicardo.com',
};

const order: Order = {
  orderId: 'o-456',
  status: 'SHIPPED',
  items: [
    { sku: 'A-88', name: 'Brevit Pro License', quantity: 1 },
  ],
};

const client = new BrevitClient();
const optimizedUser = await client.optimize(user);
const optimizedOrder = await client.optimize(order);
// Both return Promise<string>
```

### Example 4: Generic Helper Function

```typescript
import { BrevitClient, BrevitConfig } from 'brevit-js';

async function optimizeData<T>(data: T): Promise<string> {
  const client = new BrevitClient();
  return await client.optimize(data);
}

const result = await optimizeData({ name: 'John', age: 30 });
```

## IDE Support

With TypeScript definitions, you get:

- ✅ **Autocomplete**: Full IntelliSense support in VS Code, WebStorm, etc.
- ✅ **Type Checking**: Catch errors at compile time
- ✅ **Refactoring**: Safe refactoring with type-aware tools
- ✅ **Documentation**: Hover to see JSDoc comments
- ✅ **Navigation**: Jump to definitions and find references

## Type Checking

Enable strict type checking in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Compatibility

- **TypeScript**: 4.5+
- **Node.js**: 18.x, 20.x
- **Browsers**: Modern browsers with ES2020 support

## Contributing

When contributing to Brevit.js, ensure TypeScript definitions stay in sync with the JavaScript implementation. The definitions file is located at `src/brevit.d.ts`.


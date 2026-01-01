# Brevit.js

A high-performance JavaScript library for semantically compressing and optimizing data before sending it to a Large Language Model (LLM). Dramatically reduce token costs while maintaining data integrity and readability.

## Table of Contents

- [Why Brevit.js?](#why-brevitjs)
- [Key Features](#key-features)
- [When Not to Use Brevit.js](#when-not-to-use-brevitjs)
- [Benchmarks](#benchmarks)
- [Installation & Quick Start](#installation--quick-start)
- [Playgrounds](#playgrounds)
- [CLI](#cli)
- [Format Overview](#format-overview)
- [API](#api)
- [Using Brevit.js in LLM Prompts](#using-brevitjs-in-llm-prompts)
- [Syntax Cheatsheet](#syntax-cheatsheet)
- [Other Implementations](#other-implementations)
- [Full Specification](#full-specification)

## Why Brevit.js?

### JavaScript-Specific Advantages

- **Zero Dependencies**: Core library has no dependencies - lightweight and fast
- **Universal**: Works in Node.js, browsers, Deno, and Bun
- **TypeScript Support**: Full type definitions included
- **ES Modules**: Modern ES module support
- **Tree-Shakeable**: Only import what you need

### Performance Benefits

- **40-60% Token Reduction**: Dramatically reduce LLM API costs
- **Fast Execution**: Optimized algorithms for minimal overhead
- **Memory Efficient**: Processes data in-place where possible
- **Async/Await**: Non-blocking operations for better scalability

### Example Cost Savings

```javascript
// Before: 234 tokens = $0.000468 per request
const json = JSON.stringify(complexOrder);

// After: 127 tokens = $0.000254 per request (46% reduction)
const optimized = await brevit.brevity(complexOrder); // Automatic optimization

// Or with explicit configuration
const explicit = await brevit.optimize(complexOrder);

// Savings: $0.000214 per request
// At 1M requests/month: $214/month savings
```

### Automatic Strategy Selection

Brevit.js now includes the `.brevity()` method that automatically analyzes your data and selects the optimal optimization strategy:

```javascript
const data = {
  friends: ["ana", "luis", "sam"],
  hikes: [
    {id: 1, name: "Blue Lake Trail", distanceKm: 7.5},
    {id: 2, name: "Ridge Overlook", distanceKm: 9.2}
  ]
};

// Automatically detects uniform arrays and applies tabular format
const optimized = await brevit.brevity(data);
// No configuration needed - Brevit analyzes and optimizes automatically!
```

## Key Features

- **JSON Optimization**: Flatten nested JSON structures into token-efficient key-value pairs
- **Text Optimization**: Clean and summarize long text documents
- **Image Optimization**: Extract text from images via OCR
- **Lightweight**: Zero dependencies (optional YAML support)
- **Universal**: Works in Node.js, browsers, and modern JavaScript environments
- **Type-Safe**: Full TypeScript definitions included

## Installation

**Note**: The package name is `brevit` (lowercase), not `brevit-js` or `Brevit.js`. The project repository is named `Brevit.js` but the published npm package is simply `brevit`.

### npm

```bash
npm install brevit
```

### yarn

```bash
yarn add brevit
```

### pnpm

```bash
pnpm add brevit
```

### CDN (Browser)

```html
<script type="module">
  import { BrevitClient, BrevitConfig, JsonOptimizationMode } from 'https://cdn.jsdelivr.net/npm/brevit@latest/src/brevit.js';
</script>
```

## Quick Start

### TypeScript Support

Brevit.js includes full TypeScript definitions. Simply import and use with full type safety:

```typescript
import {
  BrevitClient,
  BrevitConfig,
  JsonOptimizationMode,
  type BrevitConfigOptions,
} from 'brevit';

const config: BrevitConfigOptions = {
  jsonMode: JsonOptimizationMode.Flatten,
  longTextThreshold: 1000,
};

const client = new BrevitClient(new BrevitConfig(config));
```

## Complete Usage Examples

Brevit.js supports three main data types: **JSON objects/strings**, **text files/strings**, and **images**. Here's how to use each:

### 1. JSON Optimization Examples

#### Example 1.1: Simple JSON Object

```javascript
import { BrevitClient, BrevitConfig, JsonOptimizationMode } from 'brevit';

const brevit = new BrevitClient(new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Flatten 
}));

const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    age: 30
  }
};

// Method 1: Automatic optimization (recommended)
const optimized = await brevit.brevity(data);
// Output (with abbreviations enabled by default):
// @u=user
// @u.name:John Doe
// @u.email:john@example.com
// @u.age:30

// Method 2: Explicit optimization
const explicit = await brevit.optimize(data);
```

#### Example 1.1a: Abbreviation Feature (New in v0.1.2)

Brevit automatically creates abbreviations for frequently repeated prefixes, reducing token usage by 10-25%:

```javascript
import { BrevitClient, BrevitConfig, JsonOptimizationMode } from 'brevit';

const brevit = new BrevitClient(new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Flatten,
  enableAbbreviations: true,      // Enabled by default
  abbreviationThreshold: 2         // Minimum occurrences to abbreviate
}));

const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    age: 30
  },
  order: {
    id: "o-456",
    status: "SHIPPED",
    items: [
      { sku: "A-88", quantity: 1 }
    ]
  }
};

const optimized = await brevit.brevity(data);
// Output with abbreviations:
// @u=user
// @o=order
// @u.name:John Doe
// @u.email:john@example.com
// @u.age:30
// @o.id:o-456
// @o.status:SHIPPED
// @o.items[1]{quantity,sku}:
// 1,A-88
```

**Token Savings**: The abbreviation feature reduces tokens by replacing repeated prefixes like "user." and "order." with short aliases like "@u" and "@o", saving 10-25% on typical nested JSON structures.

#### Example 1.2: JSON String

```javascript
const jsonString = '{"order": {"id": "o-456", "status": "SHIPPED"}}';

// Brevit automatically detects JSON strings
const optimized = await brevit.brevity(jsonString);
// Output (with abbreviations enabled by default):
// @o=order
// @o.id:o-456
// @o.status:SHIPPED
```

#### Example 1.2a: Abbreviations Disabled

```javascript
const brevitNoAbbr = new BrevitClient(new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Flatten,
  enableAbbreviations: false  // Disable abbreviations
}));

const jsonString = '{"order": {"id": "o-456", "status": "SHIPPED"}}';
const optimized = await brevitNoAbbr.brevity(jsonString);
// Output (without abbreviations):
// order.id:o-456
// order.status:SHIPPED
```

#### Example 1.3: Complex Nested JSON with Arrays

```javascript
const complexData = {
  context: {
    task: "Our favorite hikes together",
    location: "Boulder",
    season: "spring_2025"
  },
  friends: ["ana", "luis", "sam"],
  hikes: [
    {
      id: 1,
      name: "Blue Lake Trail",
      distanceKm: 7.5,
      elevationGain: 320,
      companion: "ana",
      wasSunny: true
    },
    {
      id: 2,
      name: "Ridge Overlook",
      distanceKm: 9.2,
      elevationGain: 540,
      companion: "luis",
      wasSunny: false
    }
  ]
};

const optimized = await brevit.brevity(complexData);
// Output (with abbreviations enabled by default):
// @c=context
// @c.task:Our favorite hikes together
// @c.location:Boulder
// @c.season:spring_2025
// friends[3]:ana,luis,sam
// hikes[2]{companion,distanceKm,elevationGain,id,name,wasSunny}:
// ana,7.5,320,1,Blue Lake Trail,true
// luis,9.2,540,2,Ridge Overlook,false
```

#### Example 1.3a: Complex Data with Abbreviations Disabled

```javascript
const brevitNoAbbr = new BrevitClient(new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Flatten,
  enableAbbreviations: false  // Disable abbreviations
}));

const complexData = {
  context: {
    task: "Our favorite hikes together",
    location: "Boulder",
    season: "spring_2025"
  },
  friends: ["ana", "luis", "sam"],
  hikes: [
    {
      id: 1,
      name: "Blue Lake Trail",
      distanceKm: 7.5,
      elevationGain: 320,
      companion: "ana",
      wasSunny: true
    },
    {
      id: 2,
      name: "Ridge Overlook",
      distanceKm: 9.2,
      elevationGain: 540,
      companion: "luis",
      wasSunny: false
    }
  ]
};

const optimized = await brevitNoAbbr.brevity(complexData);
// Output (without abbreviations):
// context.task:Our favorite hikes together
// context.location:Boulder
// context.season:spring_2025
// friends[3]:ana,luis,sam
// hikes[2]{companion,distanceKm,elevationGain,id,name,wasSunny}:
// ana,7.5,320,1,Blue Lake Trail,true
// luis,9.2,540,2,Ridge Overlook,false
```

#### Example 1.4: Different JSON Optimization Modes

```javascript
// Flatten Mode (Default)
const flattenConfig = new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Flatten 
});
// Converts nested JSON to flat key-value pairs

// YAML Mode
const yamlConfig = new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.ToYaml 
});
// Converts JSON to YAML format (requires js-yaml package)

// Filter Mode
const filterConfig = new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Filter,
  jsonPathsToKeep: ["user.name", "order.id"]
});
// Keeps only specified paths, removes everything else
```

### 2. Text Optimization Examples

#### Example 2.1: Long Text String

```javascript
const longText = `
This is a very long document that contains a lot of information.
It has multiple paragraphs and sections.
The text goes on for many lines...
[Repeated content many times]
`.repeat(50);

// Automatic detection: If text exceeds threshold, applies text optimization
const optimized = await brevit.brevity(longText);

// Explicit text optimization
const config = new BrevitConfig({ 
  textMode: TextOptimizationMode.Clean,
  longTextThreshold: 500  // Characters threshold
});
const brevitWithText = new BrevitClient(config);
const cleaned = await brevitWithText.optimize(longText);
```

#### Example 2.2: Reading Text from File (Node.js)

```javascript
import fs from 'fs/promises';

// Read text file
const textContent = await fs.readFile('document.txt', 'utf-8');

// Optimize the text
const optimized = await brevit.brevity(textContent);
```

#### Example 2.3: Text Optimization Modes

```javascript
// Clean Mode (Remove Boilerplate)
const cleanConfig = new BrevitConfig({ 
  textMode: TextOptimizationMode.Clean 
});
// Removes signatures, headers, repetitive content

// Summarize Fast
const fastConfig = new BrevitConfig({ 
  textMode: TextOptimizationMode.SummarizeFast 
});
// Fast summarization (requires custom text optimizer implementation)

// Summarize High Quality
const qualityConfig = new BrevitConfig({ 
  textMode: TextOptimizationMode.SummarizeHighQuality 
});
// High-quality summarization (requires custom text optimizer with LLM integration)
```

### 3. Image Optimization Examples

#### Example 3.1: Image from File (OCR) - Node.js

```javascript
import fs from 'fs/promises';

// Read image file as bytes
const imageBytes = await fs.readFile('receipt.jpg');
const imageBuffer = Buffer.from(imageBytes);

// Brevit automatically detects image data (ArrayBuffer/Buffer)
const extractedText = await brevit.brevity(imageBuffer);
// Output: OCR-extracted text from the image
```

#### Example 3.2: Image from URL - Node.js

```javascript
import fetch from 'node-fetch';

// Fetch image from URL
const response = await fetch('https://example.com/invoice.png');
const imageBuffer = await response.buffer();

// Optimize image
const extractedText = await brevit.brevity(imageBuffer);
```

#### Example 3.3: Image from File Input (Browser)

```html
<input type="file" id="imageInput" accept="image/*">

<script type="module">
  import { BrevitClient, BrevitConfig } from './src/brevit.js';
  
  const brevit = new BrevitClient(new BrevitConfig());
  
  document.getElementById('imageInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    
    // Optimize image
    const extractedText = await brevit.brevity(arrayBuffer);
    console.log('Extracted text:', extractedText);
  });
</script>
```

#### Example 3.4: Image Optimization Modes

```javascript
// OCR Mode (Extract Text)
const ocrConfig = new BrevitConfig({ 
  imageMode: ImageOptimizationMode.Ocr 
});
// Extracts text from images using OCR (requires custom image optimizer)

// Metadata Mode
const metadataConfig = new BrevitConfig({ 
  imageMode: ImageOptimizationMode.Metadata 
});
// Extracts only image metadata (dimensions, format, etc.)
```

### 4. Method Comparison: `.brevity()` vs `.optimize()`

#### `.brevity()` - Automatic Strategy Selection

**Use when:** You want Brevit to automatically analyze and select the best optimization strategy.

```javascript
// Automatically detects data type and applies optimal strategy
const result = await brevit.brevity(data);
// - JSON objects → Flatten with tabular optimization
// - Long text → Text optimization
// - Images → OCR extraction
```

**Advantages:**
- Zero configuration needed
- Intelligent strategy selection
- Works with any data type
- Best for general-purpose use

#### `.optimize()` - Explicit Configuration

**Use when:** You want explicit control over optimization mode.

```javascript
const config = new BrevitConfig({ 
  jsonMode: JsonOptimizationMode.Flatten,
  textMode: TextOptimizationMode.Clean,
  imageMode: ImageOptimizationMode.Ocr
});
const brevit = new BrevitClient(config);

// Uses explicit configuration
const result = await brevit.optimize(data);
```

**Advantages:**
- Full control over optimization
- Predictable behavior
- Best for specific use cases

### 5. Custom Optimizers

You can provide custom optimizers for text and images:

```javascript
// Custom text optimizer (e.g., using OpenAI API)
const customTextOptimizer = async (text, intent) => {
  // Call your summarization service
  const response = await fetch('https://api.example.com/summarize', {
    method: 'POST',
    body: JSON.stringify({ text, intent })
  });
  return await response.text();
};

// Custom image optimizer (e.g., using Azure AI Vision)
const customImageOptimizer = async (imageData, intent) => {
  // Call your OCR service
  const response = await fetch('https://api.example.com/ocr', {
    method: 'POST',
    body: imageData
  });
  return await response.text();
};

const brevit = new BrevitClient(config, {
  textOptimizer: customTextOptimizer,
  imageOptimizer: customImageOptimizer
});
```

### 6. Complete Workflow Examples

#### Example 6.1: E-Commerce Order Processing

```javascript
// Step 1: Optimize order JSON
const order = {
  orderId: "o-456",
  customer: { name: "John", email: "john@example.com" },
  items: [
    { sku: "A-88", quantity: 2, price: 29.99 },
    { sku: "B-22", quantity: 1, price: 49.99 }
  ]
};

const optimizedOrder = await brevit.brevity(order);

// Step 2: Send to LLM
const prompt = `Analyze this order:\n\n${optimizedOrder}\n\nExtract total amount.`;
// Send prompt to OpenAI, Anthropic, etc.
```

#### Example 6.2: Document Processing Pipeline

```javascript
// Step 1: Read and optimize text document
import fs from 'fs/promises';

const contractText = await fs.readFile('contract.txt', 'utf-8');
const optimizedText = await brevit.brevity(contractText);

// Step 2: Process with LLM
const prompt = `Summarize this contract:\n\n${optimizedText}`;
// Send to LLM for summarization
```

#### Example 6.3: Receipt OCR Pipeline

```javascript
// Step 1: Read receipt image
import fs from 'fs/promises';

const receiptImage = await fs.readFile('receipt.jpg');

// Step 2: Extract text via OCR
const extractedText = await brevit.brevity(receiptImage);

// Step 3: Optimize extracted text (if it's long)
const optimized = await brevit.brevity(extractedText);

// Step 4: Send to LLM for analysis
const prompt = `Extract items and total from this receipt:\n\n${optimized}`;
// Send to LLM
```

### Node.js Example

```javascript
import { BrevitClient, BrevitConfig, JsonOptimizationMode } from './src/brevit.js';

const config = new BrevitConfig({
  jsonMode: JsonOptimizationMode.Flatten
});

const brevit = new BrevitClient(config);

async function processOrder(orderData) {
  const optimized = await brevit.optimize(orderData);
  
  // Send to LLM API
  const prompt = `Context:\n${optimized}\n\nTask: Summarize the order.`;
  
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [{ role: 'user', content: prompt }]
  //   })
  // });
  
  return prompt;
}

const order = {
  orderId: 'o-456',
  status: 'SHIPPED',
  items: [{ sku: 'A-88', name: 'Brevit Pro', quantity: 1 }]
};

processOrder(order).then(console.log);
```

### Browser Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Brevit.js Example</title>
</head>
<body>
  <script type="module">
    import { BrevitClient, BrevitConfig, JsonOptimizationMode } from './src/brevit.js';

    const config = new BrevitConfig({
      jsonMode: JsonOptimizationMode.Flatten
    });

    const brevit = new BrevitClient(config);

    const data = {
      user: {
        name: 'Javian',
        email: 'support@javianpicardo.com'
      }
    };

    brevit.optimize(data).then(result => {
      document.body.innerHTML = `<pre>${result}</pre>`;
    });
  </script>
</body>
</html>
```

## Configuration Options

### BrevitConfig

```javascript
const config = new BrevitConfig({
  jsonMode: JsonOptimizationMode.Flatten,  // JSON optimization strategy
  textMode: 'Clean',                        // Text optimization strategy
  imageMode: 'Ocr',                         // Image optimization strategy
  jsonPathsToKeep: [],                      // Paths to keep for Filter mode
  longTextThreshold: 500,                   // Character threshold for text optimization
  enableAbbreviations: true,                // Enable abbreviation feature (default: true)
  abbreviationThreshold: 2                  // Minimum occurrences to create abbreviation (default: 2)
});
```

### JsonOptimizationMode

- **None**: No optimization, pass JSON as-is
- **Flatten**: Convert nested JSON to flat key-value pairs (most token-efficient)
- **ToYaml**: Convert JSON to YAML format (requires `js-yaml` package)
- **Filter**: Keep only specified JSON paths

### TextOptimizationMode

- **None**: No optimization
- **Clean**: Remove boilerplate and excessive whitespace
- **SummarizeFast**: Use a fast model for summarization (requires custom optimizer)
- **SummarizeHighQuality**: Use a high-quality model for summarization (requires custom optimizer)

### ImageOptimizationMode

- **None**: Skip image processing
- **Ocr**: Extract text from images (requires custom optimizer)
- **Metadata**: Extract basic metadata only

## TypeScript Usage

### Type Definitions

All types are exported for use in TypeScript projects:

```typescript
import {
  BrevitClient,
  BrevitConfig,
  JsonOptimizationMode,
  TextOptimizationMode,
  ImageOptimizationMode,
  type BrevitConfigOptions,
  type BrevitClientOptions,
  type TextOptimizerFunction,
  type ImageOptimizerFunction,
} from 'brevit';
```

### Type-Safe Configuration

```typescript
const config: BrevitConfigOptions = {
  jsonMode: JsonOptimizationMode.Flatten,
  textMode: TextOptimizationMode.Clean,
  imageMode: ImageOptimizationMode.Ocr,
  jsonPathsToKeep: ['user.name', 'order.orderId'],
  longTextThreshold: 1000,
  enableAbbreviations: true,         // Default: true
  abbreviationThreshold: 2            // Default: 2
};

const client = new BrevitClient(new BrevitConfig(config));
```

### Custom Optimizers with Types

```typescript
const customTextOptimizer: TextOptimizerFunction = async (longText, intent) => {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: longText, intent }),
  });
  const { summary } = await response.json();
  return summary;
};

const client = new BrevitClient(config, {
  textOptimizer: customTextOptimizer,
});
```

### Type-Safe Data Handling

```typescript
interface Order {
  orderId: string;
  status: string;
  items: Array<{ sku: string; name: string; quantity: number }>;
}

const order: Order = {
  orderId: 'o-456',
  status: 'SHIPPED',
  items: [{ sku: 'A-88', name: 'Brevit Pro', quantity: 1 }],
};

const optimized = await client.optimize(order);
// TypeScript knows optimized is a Promise<string>
```

## Advanced Usage

### Custom Text Optimizer

Implement a custom text optimizer that calls your backend API:

```javascript
async function customTextOptimizer(longText, intent) {
  // Call your backend API for summarization
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: longText, intent })
  });
  
  const { summary } = await response.json();
  return summary;
}

const brevit = new BrevitClient(config, {
  textOptimizer: customTextOptimizer
});
```

### Custom Image Optimizer

Implement a custom image optimizer that calls your OCR service:

```javascript
async function customImageOptimizer(imageData, intent) {
  // Convert ArrayBuffer to base64 if needed
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData)));
  
  // Call your backend OCR API
  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 })
  });
  
  const { text } = await response.json();
  return text;
}

const brevit = new BrevitClient(config, {
  imageOptimizer: customImageOptimizer
});
```

### YAML Mode (Optional)

To use YAML mode, install `js-yaml`:

```bash
npm install js-yaml
```

Then modify the `ToYaml` case in `brevit.js`:

```javascript
import YAML from 'js-yaml';

// In the optimize method:
case JsonOptimizationMode.ToYaml:
  return YAML.dump(inputObject);
```

### Filter Mode

Use Filter mode to keep only specific JSON paths:

```javascript
const config = new BrevitConfig({
  jsonMode: JsonOptimizationMode.Filter,
  jsonPathsToKeep: [
    'user.name',
    'order.orderId',
    'order.items[*].sku'
  ]
});
```

## Examples

### Example 1: Optimize Complex Object

```javascript
const user = {
  id: 'u-123',
  name: 'Javian',
  isActive: true,
  contact: {
    email: 'support@javianpicardo.com',
    phone: null
  },
  orders: [
    { orderId: 'o-456', status: 'SHIPPED' }
  ]
};

const optimized = await brevit.optimize(user);
// Output:
// id: u-123
// name: Javian
// isActive: true
// contact.email: support@javianpicardo.com
// contact.phone: null
// orders[0].orderId: o-456
// orders[0].status: SHIPPED
```

### Example 2: Optimize JSON String

```javascript
const json = `{
  "order": {
    "orderId": "o-456",
    "status": "SHIPPED",
    "items": [
      { "sku": "A-88", "name": "Brevit Pro", "quantity": 1 }
    ]
  }
}`;

const optimized = await brevit.optimize(json);
```

### Example 3: Process Long Text

```javascript
const longDocument = '...very long text...';
const optimized = await brevit.optimize(longDocument);
// Will trigger text optimization if length > longTextThreshold
```

### Example 4: Process Image (ArrayBuffer)

```javascript
// Fetch image as ArrayBuffer
const response = await fetch('https://example.com/receipt.jpg');
const imageData = await response.arrayBuffer();

const optimized = await brevit.optimize(imageData);
// Will trigger image optimization
```

## When Not to Use Brevit.js

Consider alternatives when:

1. **API Responses**: If returning JSON to HTTP clients, use standard JSON
2. **Data Contracts**: When strict JSON schema validation is required
3. **Small Objects**: Objects under 100 tokens may not benefit significantly
4. **Real-Time APIs**: For REST APIs serving JSON, standard formatting is better
5. **Browser Storage**: localStorage/sessionStorage expect JSON strings

**Best Use Cases:**
- ✅ LLM prompt optimization
- ✅ Reducing OpenAI/Anthropic API costs
- ✅ Processing large datasets for AI
- ✅ Document summarization workflows
- ✅ OCR and image processing pipelines

## Benchmarks

### Token Reduction

| Object Type | Original Tokens | Brevit (No Abbr) | Brevit (With Abbr) | Total Reduction |
|-------------|----------------|------------------|-------------------|-----------------|
| Simple Object | 45 | 28 | 26 | 42% |
| Complex Object | 234 | 127 | 105 | 55% |
| Nested Arrays | 156 | 89 | 75 | 52% |
| API Response | 312 | 178 | 145 | 54% |
| Deeply Nested | 95 | 78 | 65 | 32% |

**Note**: Abbreviations are enabled by default and provide additional 10-25% savings on top of base optimization.

### Performance

| Operation | Objects/sec | Avg Latency | Memory |
|-----------|-------------|-------------|--------|
| Flatten (1KB) | 1,800 | 0.6ms | 2.1MB |
| Flatten (10KB) | 420 | 2.4ms | 8.5MB |
| Flatten (100KB) | 52 | 19ms | 45MB |

*Benchmarks: Node.js 20.x, Intel i7-12700K, Release mode*

## Playgrounds

### Interactive Playground

```bash
# Clone and run
git clone https://github.com/JavianDev/Brevit.git
cd Brevit/Brevit.js
npm install
node playground.js
```

### Online Playground

- **Web Playground**: [https://brevit.dev/playground](https://brevit.dev/playground) (Coming Soon)
- **CodeSandbox**: [https://codesandbox.io/brevit](https://codesandbox.io/brevit) (Coming Soon)
- **JSFiddle**: [https://jsfiddle.net/brevit](https://jsfiddle.net/brevit) (Coming Soon)

## CLI

### Installation

```bash
npm install -g brevit-cli
```

### Usage

```bash
# Optimize a JSON file
brevit optimize input.json -o output.txt

# Optimize from stdin
cat data.json | brevit optimize

# Optimize with custom config
brevit optimize input.json --mode flatten --threshold 1000

# Help
brevit --help
```

### Examples

```bash
# Flatten JSON
brevit optimize order.json --mode flatten

# Convert to YAML
brevit optimize data.json --mode yaml

# Filter paths
brevit optimize data.json --mode filter --paths "user.name,order.id"
```

## Format Overview

### Flattened Format (Hybrid Optimization)

Brevit intelligently converts JavaScript objects to flat key-value pairs with automatic tabular optimization:

**Input:**
```javascript
const order = {
  orderId: 'o-456',
  friends: ['ana', 'luis', 'sam'],
  items: [
    { sku: 'A-88', quantity: 1 },
    { sku: 'T-22', quantity: 2 }
  ]
};
```

**Output (with tabular optimization and abbreviations enabled by default):**
```
orderId: o-456
friends[3]: ana,luis,sam
@i=items
@i[2]{quantity,sku}:
1,A-88
2,T-22
```

**Output (with abbreviations disabled):**
```
orderId: o-456
friends[3]: ana,luis,sam
items[2]{quantity,sku}:
1,A-88
2,T-22
```

**For non-uniform arrays (fallback):**
```javascript
const mixed = {
  items: [
    { sku: 'A-88', quantity: 1 },
    'special-item',
    { sku: 'T-22', quantity: 2 }
  ]
};
```

**Output (fallback to indexed format):**
```
items[0].sku: A-88
items[0].quantity: 1
items[1]: special-item
items[2].sku: T-22
items[2].quantity: 2
```

### Key Features

- **Property Names**: Uses JavaScript property names as-is
- **Nested Objects**: Dot notation for nested properties
- **Tabular Arrays**: Uniform object arrays automatically formatted in compact tabular format (`items[2]{field1,field2}:`)
- **Primitive Arrays**: Comma-separated format (`friends[3]: ana,luis,sam`)
- **Abbreviation System** (Default: Enabled): Automatically creates short aliases for repeated prefixes (`@u=user`, `@o=order`)
- **Hybrid Approach**: Automatically detects optimal format, falls back to indexed format for mixed data
- **Null Handling**: Explicit `null` values
- **Type Preservation**: Numbers, booleans preserved as strings

### Abbreviation System (Default: Enabled)

Brevit automatically creates abbreviations for frequently repeated key prefixes, placing definitions at the top of the output:

**Example:**
```
@u=user
@o=order
@u.name:John Doe
@u.email:john@example.com
@o.id:o-456
@o.status:SHIPPED
```

**Benefits:**
- **10-25% additional token savings** on nested data
- **Self-documenting**: Abbreviations are defined at the top
- **LLM-friendly**: Models easily understand the mapping
- **Configurable**: Can be disabled with `enableAbbreviations: false`

**When Abbreviations Help Most:**
- Deeply nested JSON structures
- Arrays of objects with repeated field names
- API responses with consistent schemas
- Data with many repeated prefixes (e.g., `user.profile.settings.theme`)

**Disable Abbreviations:**
```javascript
const config = new BrevitConfig({
  enableAbbreviations: false  // Disable abbreviation feature
});
```

## API

### BrevitClient

Main client class for optimization.

```typescript
class BrevitClient {
  constructor(config?: BrevitConfig, options?: BrevitClientOptions);
  brevity(rawData: unknown, intent?: string | null): Promise<string>;
  optimize(rawData: unknown, intent?: string | null): Promise<string>;
  registerStrategy(name: string, analyzer: Function, optimizer: Function): void;
}
```

**Example - Automatic Optimization:**
```javascript
// Automatically analyzes data and selects best strategy
const optimized = await brevit.brevity(order);
// Automatically detects uniform arrays, long text, etc.
```

**Example - Explicit Optimization:**
```javascript
// Use explicit configuration
const optimized = await brevit.optimize(order, 'extract_total');
```

**Example - Custom Strategy:**
```javascript
// Register custom optimization strategy
brevit.registerStrategy('custom', (data, analysis) => {
  if (analysis.hasSpecialPattern) {
    return { score: 95, reason: 'Custom optimization needed' };
  }
  return { score: 0 };
}, async (data) => {
  // Custom optimization logic
  return customOptimizedData;
});
```

### BrevitConfig

Configuration class for BrevitClient.

```typescript
class BrevitConfig {
  jsonMode: JsonOptimizationModeType;
  textMode: TextOptimizationModeType;
  imageMode: ImageOptimizationModeType;
  jsonPathsToKeep: string[];
  longTextThreshold: number;
  enableAbbreviations: boolean;      // Default: true
  abbreviationThreshold: number;      // Default: 2
}
```

### Enums

#### JsonOptimizationMode
- `None` - No optimization
- `Flatten` - Flatten to key-value pairs (default)
- `ToYaml` - Convert to YAML
- `Filter` - Keep only specified paths

#### TextOptimizationMode
- `None` - No optimization
- `Clean` - Remove boilerplate
- `SummarizeFast` - Fast summarization
- `SummarizeHighQuality` - High-quality summarization

#### ImageOptimizationMode
- `None` - Skip processing
- `Ocr` - Extract text via OCR
- `Metadata` - Extract metadata only

## Using Brevit.js in LLM Prompts

### Best Practices

1. **Context First**: Provide context before optimized data
2. **Clear Instructions**: Tell the LLM what format to expect
3. **Examples**: Include format examples in prompts

### Example Prompt Template

```javascript
const optimized = await brevit.optimize(order);

const prompt = `You are analyzing order data. The data is in Brevit flattened format:

Context:
${optimized}

Task: Extract the order total and shipping address.

Format your response as JSON with keys: total, address`;
```

### Real-World Example

```javascript
async function analyzeOrder(order) {
  const optimized = await brevit.optimize(order);
  
  const prompt = `Analyze this order:

${optimized}

Questions:
1. What is the order total?
2. How many items?
3. Average item price?

Respond in JSON.`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  return await response.json();
}
```

## Syntax Cheatsheet

### JavaScript to Brevit Format

| JS Structure | Brevit Format | Example |
|--------------|---------------|---------|
| Property | `property: value` | `orderId: o-456` |
| Nested property | `parent.child: value` | `customer.name: John` |
| Primitive array | `array[count]: val1,val2,val3` | `friends[3]: ana,luis,sam` |
| Uniform object array | `array[count]{field1,field2}:`<br>`  val1,val2`<br>`  val3,val4` | `items[2]{sku,qty}:`<br>`  A-88,1`<br>`  T-22,2` |
| Array element (fallback) | `array[index].property: value` | `items[0].sku: A-88` |
| Nested array | `parent[index].child[index]` | `orders[0].items[1].sku` |
| Null value | `property: null` | `phone: null` |
| Boolean | `property: true` | `isActive: true` |
| Number | `property: 123` | `quantity: 5` |

### Special Cases

- **Empty Arrays**: `items: []` → `items: []`
- **Empty Objects**: `metadata: {}` → `metadata: {}`
- **Undefined**: Converted to `null`
- **Dates**: Converted to ISO string
- **Tabular Arrays**: Automatically detected when all objects have same keys
- **Primitive Arrays**: Automatically detected when all elements are primitives

## Other Implementations

Brevit is available in multiple languages:

| Language | Package | Status |
|----------|---------|--------|
| JavaScript | `brevit` | ✅ Stable (This) |
| C# (.NET) | `Brevit` | ✅ Stable |
| Python | `brevit` | ✅ Stable |

## Full Specification

### Format Specification

1. **Key-Value Pairs**: One pair per line
2. **Separator**: `: ` (colon + space)
3. **Key Format**: Property names with dot/bracket notation
4. **Value Format**: String representation of values
5. **Line Endings**: `\n` (newline)

### Grammar

```
brevit := line*
line := key ": " value "\n"
key := identifier ("." identifier | "[" number "]")*
value := string | number | boolean | null
identifier := [a-zA-Z_][a-zA-Z0-9_]*
```

### Examples

**Simple Object:**
```
orderId: o-456
status: SHIPPED
```

**Nested Object:**
```
customer.name: John Doe
customer.email: john@example.com
```

**Array:**
```
items[0].sku: A-88
items[0].quantity: 1
items[1].sku: T-22
items[1].quantity: 2
```

**Complex Structure:**
```
orderId: o-456
customer.name: John Doe
items[0].sku: A-88
items[0].price: 29.99
items[1].sku: T-22
items[1].price: 39.99
shipping.address.street: 123 Main St
shipping.address.city: Toronto
```

## Performance Considerations

- **Flatten Mode**: Reduces token count by 40-60% compared to standard JSON
- **Memory Efficient**: Processes data in-place where possible
- **Async/Await**: All operations are asynchronous for better scalability
- **Zero Dependencies**: Core library has no dependencies (optional YAML support)

## Best Practices

1. **Use Backend for LLM Calls**: Never put LLM API keys in frontend code. Use custom optimizers that call your backend.
2. **Configure Thresholds**: Adjust `longTextThreshold` based on your use case
3. **Monitor Token Usage**: Track token counts before/after optimization
4. **Cache Results**: Consider caching optimized results for repeated queries
5. **Error Handling**: Wrap optimize calls in try-catch blocks

## Troubleshooting

### Issue: "ToYaml mode requires installing a YAML library"

**Solution**: Install `js-yaml` package: `npm install js-yaml` and update the code as shown in Advanced Usage.

### Issue: Text summarization returns stub

**Solution**: Implement a custom text optimizer that calls your backend API (see Advanced Usage).

### Issue: Image OCR returns stub

**Solution**: Implement a custom image optimizer that calls your OCR service (see Advanced Usage).

### Issue: Module not found in Node.js

**Solution**: Ensure you're using ES modules. Add `"type": "module"` to your `package.json` or use `.mjs` extension.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: [https://brevit.dev/docs](https://brevit.dev/docs)
- **Issues**: [https://github.com/JavianDev/Brevit.js/issues](https://github.com/JavianDev/Brevit.js/issues)
- **Email**: support@javianpicardo.com

## Version History

- **0.1.0** (Current): Initial release with core optimization features


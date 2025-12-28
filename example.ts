/**
 * TypeScript usage example for Brevit.js
 */

import {
  BrevitClient,
  BrevitConfig,
  JsonOptimizationMode,
  TextOptimizationMode,
  ImageOptimizationMode,
  type BrevitConfigOptions,
  type TextOptimizerFunction,
  type ImageOptimizerFunction,
} from './src/brevit.js';

// Example 1: Basic usage with default configuration
async function example1() {
  const client = new BrevitClient();
  
  const data = {
    user: {
      name: 'Javian',
      email: 'support@javianpicardo.com',
    },
  };

  const optimized = await client.optimize(data);
  console.log(optimized);
  // Output:
  // user.name: Javian
  // user.email: support@javianpicardo.com
}

// Example 2: Custom configuration
async function example2() {
  const config: BrevitConfigOptions = {
    jsonMode: JsonOptimizationMode.Flatten,
    textMode: TextOptimizationMode.Clean,
    imageMode: ImageOptimizationMode.Ocr,
    longTextThreshold: 1000,
  };

  const client = new BrevitClient(new BrevitConfig(config));
  
  const jsonString = '{"order": {"orderId": "o-456", "status": "SHIPPED"}}';
  const optimized = await client.optimize(jsonString);
  console.log(optimized);
}

// Example 3: Custom text optimizer
async function example3() {
  const customTextOptimizer: TextOptimizerFunction = async (longText, intent) => {
    // Call your backend API for summarization
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: longText, intent }),
    });
    
    const { summary } = await response.json();
    return summary;
  };

  const config = new BrevitConfig({
    textMode: TextOptimizationMode.SummarizeFast,
  });

  const client = new BrevitClient(config, {
    textOptimizer: customTextOptimizer,
  });

  const longText = '...very long text...';
  const optimized = await client.optimize(longText);
  console.log(optimized);
}

// Example 4: Custom image optimizer
async function example4() {
  const customImageOptimizer: ImageOptimizerFunction = async (imageData, intent) => {
    // Convert ArrayBuffer to base64 if needed
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(imageData))
    );

    // Call your backend OCR API
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });

    const { text } = await response.json();
    return text;
  };

  const config = new BrevitConfig({
    imageMode: ImageOptimizationMode.Ocr,
  });

  const client = new BrevitClient(config, {
    imageOptimizer: customImageOptimizer,
  });

  const imageData = await fetch('receipt.jpg').then((r) => r.arrayBuffer());
  const optimized = await client.optimize(imageData);
  console.log(optimized);
}

// Example 5: Type-safe usage with interfaces
interface Order {
  orderId: string;
  status: string;
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
  }>;
}

async function example5() {
  const client = new BrevitClient();
  
  const order: Order = {
    orderId: 'o-456',
    status: 'SHIPPED',
    items: [
      { sku: 'A-88', name: 'Brevit Pro License', quantity: 1 },
    ],
  };

  const optimized = await client.optimize(order);
  console.log(optimized);
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  example1().catch(console.error);
}


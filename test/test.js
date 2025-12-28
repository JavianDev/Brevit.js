import { BrevitClient, BrevitConfig, JsonOptimizationMode } from '../src/brevit.js';

async function runTests() {
  console.log('Running Brevit.js Tests...\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.error(`✗ ${name}: ${error.message}`);
      failed++;
    }
  }

  // Test 1: Flatten JSON object
  test('Flatten JSON object', async () => {
    const config = new BrevitConfig({ jsonMode: JsonOptimizationMode.Flatten });
    const brevit = new BrevitClient(config);
    
    const testObject = {
      user: {
        name: 'Javian',
        email: 'support@javianpicardo.com'
      }
    };

    const result = await brevit.optimize(testObject);
    if (!result.includes('user.name: Javian') || !result.includes('user.email: support@javianpicardo.com')) {
      throw new Error('Flattened output does not contain expected values');
    }
  });

  // Test 2: Flatten JSON string
  test('Flatten JSON string', async () => {
    const config = new BrevitConfig({ jsonMode: JsonOptimizationMode.Flatten });
    const brevit = new BrevitClient(config);
    
    const jsonString = '{"order": {"orderId": "o-456", "status": "SHIPPED"}}';
    const result = await brevit.optimize(jsonString);
    
    if (!result.includes('order.orderId: o-456') || !result.includes('order.status: SHIPPED')) {
      throw new Error('Flattened output does not contain expected values');
    }
  });

  // Test 3: Short text returns as-is
  test('Short text returns as-is', async () => {
    const config = new BrevitConfig({ longTextThreshold: 500 });
    const brevit = new BrevitClient(config);
    
    const shortText = 'Hello World';
    const result = await brevit.optimize(shortText);
    
    if (result !== 'Hello World') {
      throw new Error('Short text was modified');
    }
  });

  // Test 4: Array handling
  test('Array handling', async () => {
    const config = new BrevitConfig({ jsonMode: JsonOptimizationMode.Flatten });
    const brevit = new BrevitClient(config);
    
    const testObject = {
      items: [
        { sku: 'A-88', name: 'Brevit Pro' },
        { sku: 'T-22', name: 'Toon Handbook' }
      ]
    };

    const result = await brevit.optimize(testObject);
    if (!result.includes('items[0].sku: A-88') || !result.includes('items[1].sku: T-22')) {
      throw new Error('Array flattening failed');
    }
  });

  console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});


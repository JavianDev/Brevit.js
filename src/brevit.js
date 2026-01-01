/*
 * =================================================================================
 * BREVIT.JS (brevit-js)
 *
 * A high-performance JavaScript library for semantically compressing
 * and optimizing data before sending it to a Large Language Model (LLM).
 *
 * Project: Brevit
 * Author: Javian
 * Version: 0.1.0
 * =================================================================================
 */

// Define enums for configuration (using a JS object)
export const JsonOptimizationMode = {
  None: 'None',
  Flatten: 'Flatten',
  ToYaml: 'ToYaml', // Note: Requires a YAML library like 'js-yaml'
  Filter: 'Filter', // Note: Requires a JSON-path library or custom logic
};

export const TextOptimizationMode = {
  None: 'None',
  Clean: 'Clean',
  SummarizeFast: 'SummarizeFast',
  SummarizeHighQuality: 'SummarizeHighQuality',
};

export const ImageOptimizationMode = {
  None: 'None',
  Ocr: 'Ocr',
  Metadata: 'Metadata',
};

/**
 * Configuration object for the BrevitClient.
 */
export class BrevitConfig {
  /**
   * @param {object} options
   * @param {string} options.jsonMode - Strategy for JSON optimization.
   * @param {string} options.textMode - Strategy for Text optimization.
   * @param {string} options.imageMode - Strategy for Image optimization.
   * @param {string[]} options.jsonPathsToKeep - Paths to keep for Filter mode.
   * @param {number} options.longTextThreshold - Char count to trigger text optimization.
   * @param {boolean} options.enableAbbreviations - Enable abbreviation feature for repeated prefixes.
   * @param {number} options.abbreviationThreshold - Minimum occurrences to create abbreviation.
   */
  constructor({
    jsonMode = JsonOptimizationMode.Flatten,
    textMode = TextOptimizationMode.Clean,
    imageMode = ImageOptimizationMode.Ocr,
    jsonPathsToKeep = [],
    longTextThreshold = 500,
    enableAbbreviations = true,
    abbreviationThreshold = 2,
  } = {}) {
    this.jsonMode = jsonMode;
    this.textMode = textMode;
    this.imageMode = imageMode;
    this.jsonPathsToKeep = jsonPathsToKeep;
    this.longTextThreshold = longTextThreshold;
    this.enableAbbreviations = enableAbbreviations;
    this.abbreviationThreshold = abbreviationThreshold;
  }
}

/**
 * The main client for the Brevit.js library.
 * This class orchestrates the optimization pipeline.
 */
export class BrevitClient {
  /**
   * @param {BrevitConfig} config
   * @param {Object} options - Optional custom optimizers
   * @param {Function} options.textOptimizer - Custom text optimizer function
   * @param {Function} options.imageOptimizer - Custom image optimizer function
   */
  constructor(config = new BrevitConfig(), options = {}) {
    this._config = config;
    this._textOptimizer = options.textOptimizer || this._defaultTextOptimizer.bind(this);
    this._imageOptimizer = options.imageOptimizer || this._defaultImageOptimizer.bind(this);
  }

  /**
   * Checks if an array contains uniform objects (all have same keys).
   * @param {Array} arr - The array to check
   * @returns {Object|null} Object with keys array if uniform, null otherwise
   * @private
   */
  _isUniformObjectArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    
    const firstItem = arr[0];
    if (typeof firstItem !== 'object' || firstItem === null || Array.isArray(firstItem)) {
      return null;
    }
    
    // Preserve original field order instead of sorting
    const firstKeys = Object.keys(firstItem);
    const firstKeySet = new Set(firstKeys);
    
    // Check if all items have the same keys (order-independent)
    for (let i = 1; i < arr.length; i++) {
      const item = arr[i];
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return null;
      }
      const itemKeys = Object.keys(item);
      if (firstKeys.length !== itemKeys.length) {
        return null;
      }
      // Check if all keys exist (order doesn't matter for uniformity)
      if (!itemKeys.every(key => firstKeySet.has(key))) {
        return null;
      }
    }
    
    return { keys: firstKeys };
  }

  /**
   * Checks if an array contains only primitives of compatible types.
   * @param {Array} arr - The array to check
   * @returns {boolean} True if all elements are primitives
   * @private
   */
  _isPrimitiveArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    
    const firstType = typeof arr[0];
    if (firstType === 'object' && arr[0] !== null) return false;
    
    // Check if all elements are primitives
    for (let i = 1; i < arr.length; i++) {
      const itemType = typeof arr[i];
      if (itemType === 'object' && arr[i] !== null) return false;
    }
    
    return true;
  }

  /**
   * Escapes a value for comma-separated format.
   * @param {any} value - The value to escape
   * @returns {string} Escaped string
   * @private
   */
  _escapeValue(value) {
    const str = String(value);
    // Quote if contains comma, newline, or quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '\\"')}"`;
    }
    return str;
  }

  /**
   * Formats a uniform object array in tabular format.
   * @param {Array} arr - The uniform object array
   * @param {string} prefix - The key path prefix
   * @returns {string} Formatted tabular string
   * @private
   */
  _formatTabularArray(arr, prefix) {
    const { keys } = this._isUniformObjectArray(arr);
    const header = `${prefix}[${arr.length}]{${keys.join(',')}}:`;
    const rows = arr.map(item => 
      keys.map(key => this._escapeValue(item[key] ?? 'null')).join(',')
    );
    return `${header}\n${rows.join('\n')}`;
  }

  /**
   * Formats a primitive array in comma-separated format.
   * @param {Array} arr - The primitive array
   * @param {string} prefix - The key path prefix
   * @returns {string} Formatted comma-separated string
   * @private
   */
  _formatPrimitiveArray(arr, prefix) {
    const values = arr.map(item => this._escapeValue(item));
    return `${prefix}[${arr.length}]:${values.join(',')}`;
  }

  /**
   * Recursive helper for flattening a JSON object/array with tabular optimization.
   * @param {any} node - The current JS object, array, or value.
   * @param {string} prefix - The key path built so far.
   * @param {Array<string>} output - The output array of formatted lines.
   * @private
   */
  _flatten(node, prefix = '', output = []) {
    if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
      // It's an object
      Object.entries(node).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        this._flatten(value, newPrefix, output);
      });
    } else if (Array.isArray(node)) {
      // It's an array - check for optimization opportunities
      
      // Check for uniform object array (tabular format)
      const uniformCheck = this._isUniformObjectArray(node);
      if (uniformCheck) {
        output.push(this._formatTabularArray(node, prefix));
        return;
      }
      
      // Check for primitive array (comma-separated format)
      if (this._isPrimitiveArray(node)) {
        output.push(this._formatPrimitiveArray(node, prefix));
        return;
      }
      
      // Fall back to current format for mixed/non-uniform arrays
      node.forEach((item, index) => {
        const newPrefix = `${prefix}[${index}]`;
        this._flatten(item, newPrefix, output);
      });
    } else {
      // It's a primitive value (string, number, boolean, null)
      if (!prefix) prefix = 'value'; // Handle root-level value
      output.push(`${prefix}:${String(node)}`);
    }
  }

  /**
   * Generates abbreviations for frequently repeated prefixes.
   * @param {Array<string>} paths - Array of flattened paths
   * @returns {Object} Object with abbreviation map and definitions array
   * @private
   */
  _generateAbbreviations(paths) {
    if (!this._config.enableAbbreviations) {
      return { map: new Map(), definitions: [] };
    }

    // Count prefix frequencies
    const prefixCounts = new Map();
    
    paths.forEach(path => {
      // Extract all prefixes (e.g., "user", "user.name", "order.items")
      const parts = path.split('.');
      for (let i = 1; i < parts.length; i++) {
        const prefix = parts.slice(0, i).join('.');
        prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
      }
    });

    // Filter prefixes that meet threshold
    const frequentPrefixes = Array.from(prefixCounts.entries())
      .filter(([prefix, count]) => count >= this._config.abbreviationThreshold)
      .sort((a, b) => {
        // Sort by: 1) count (desc), 2) length (asc) - prefer shorter, more frequent
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].length - b[0].length;
      });

    // Generate abbreviations
    const abbreviationMap = new Map();
    const definitions = [];
    let abbrCounter = 0;
    const usedAbbrs = new Set();

    frequentPrefixes.forEach(([prefix, count]) => {
      // Calculate savings: (prefix.length - abbr.length) * count
      // Only abbreviate if it saves tokens
      const abbr = this._generateAbbreviation(prefix, abbrCounter, usedAbbrs);
      const definitionCost = prefix.length + abbr.length + 3; // "@x=prefix"
      const savings = (prefix.length - abbr.length - 1) * count; // -1 for "@"
      
      // Only create abbreviation if it saves tokens (accounting for definition)
      if (savings > definitionCost) {
        abbreviationMap.set(prefix, abbr);
        definitions.push(`@${abbr}=${prefix}`);
        abbrCounter++;
      }
    });

    return { map: abbreviationMap, definitions };
  }

  /**
   * Generates a short abbreviation for a prefix.
   * @param {string} prefix - The prefix to abbreviate
   * @param {number} counter - Counter for fallback abbreviations
   * @param {Set<string>} usedAbbrs - Set of already used abbreviations
   * @returns {string} The abbreviation
   * @private
   */
  _generateAbbreviation(prefix, counter, usedAbbrs) {
    // Strategy 1: Use first letter if available and not used
    const firstLetter = prefix.split('.')[0][0].toLowerCase();
    if (!usedAbbrs.has(firstLetter)) {
      usedAbbrs.add(firstLetter);
      return firstLetter;
    }

    // Strategy 2: Use first letter of each part (e.g., "order.items" -> "oi")
    const parts = prefix.split('.');
    if (parts.length > 1) {
      const multiLetter = parts.map(p => p[0]).join('').toLowerCase();
      if (!usedAbbrs.has(multiLetter) && multiLetter.length <= 3) {
        usedAbbrs.add(multiLetter);
        return multiLetter;
      }
    }

    // Strategy 3: Use counter-based abbreviation (a, b, c, ..., z, aa, ab, ...)
    let abbr = '';
    let num = counter;
    do {
      abbr = String.fromCharCode(97 + (num % 26)) + abbr; // 97 = 'a'
      num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    
    usedAbbrs.add(abbr);
    return abbr;
  }

  /**
   * Applies abbreviations to a path string.
   * @param {string} path - The path to abbreviate
   * @param {Map<string, string>} abbreviationMap - Map of prefix to abbreviation
   * @returns {string} The abbreviated path
   * @private
   */
  _applyAbbreviations(path, abbreviationMap) {
    if (!this._config.enableAbbreviations || abbreviationMap.size === 0) {
      return path;
    }

    // Find the longest matching prefix
    let bestMatch = '';
    let bestAbbr = '';
    
    for (const [prefix, abbr] of abbreviationMap.entries()) {
      if (path.startsWith(prefix + '.') && prefix.length > bestMatch.length) {
        bestMatch = prefix;
        bestAbbr = abbr;
      }
    }

    if (bestMatch) {
      return `@${bestAbbr}.${path.substring(bestMatch.length + 1)}`;
    }

    return path;
  }

  /**
   * Flattens a JS object into a token-efficient string with tabular optimization and abbreviations.
   * @param {object} obj - The object to flatten.
   * @returns {string} The flattened string.
   * @private
   */
  _flattenObject(obj) {
    const output = [];
    this._flatten(obj, '', output);
    
    // Extract paths from output (before values)
    const paths = output.map(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const pathPart = line.substring(0, colonIndex);
        // Handle tabular arrays: "key[count]{fields}:"
        const bracketIndex = pathPart.indexOf('[');
        if (bracketIndex > 0) {
          return pathPart.substring(0, bracketIndex);
        }
        return pathPart;
      }
      return line.split(':')[0];
    });

    // Generate abbreviations
    const { map: abbreviationMap, definitions } = this._generateAbbreviations(paths);

    // Apply abbreviations to output
    const abbreviatedOutput = output.map(line => {
      // Handle different line formats:
      // 1. "key:value"
      // 2. "key[count]:value1,value2"
      // 3. "key[count]{fields}:\nrow1\nrow2"
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return line;
      
      const pathPart = line.substring(0, colonIndex);
      const valuePart = line.substring(colonIndex);
      
      // Handle tabular arrays - abbreviate the base path
      const bracketIndex = pathPart.indexOf('[');
      if (bracketIndex > 0) {
        const basePath = pathPart.substring(0, bracketIndex);
        const rest = pathPart.substring(bracketIndex);
        const abbreviatedBase = this._applyAbbreviations(basePath, abbreviationMap);
        return abbreviatedBase + rest + valuePart;
      }
      
      const abbreviatedPath = this._applyAbbreviations(pathPart, abbreviationMap);
      return abbreviatedPath + valuePart;
    });

    // Combine: definitions first, then abbreviated output
    if (definitions.length > 0) {
      return definitions.join('\n') + '\n' + abbreviatedOutput.join('\n');
    }
    
    return abbreviatedOutput.join('\n');
  }

  /**
   * Analyzes data structure to determine the best optimization strategy.
   * @param {any} data - The data to analyze
   * @returns {Object} Analysis result with recommended strategy
   * @private
   */
  _analyzeDataStructure(data) {
    const analysis = {
      type: null,
      depth: 0,
      hasUniformArrays: false,
      hasPrimitiveArrays: false,
      hasNestedObjects: false,
      textLength: 0,
      arrayCount: 0,
      objectCount: 0,
      complexity: 'simple'
    };

    const analyze = (node, depth = 0, path = '') => {
      analysis.depth = Math.max(analysis.depth, depth);
      
      if (typeof node === 'string') {
        analysis.textLength += node.length;
        return;
      }
      
      if (Array.isArray(node)) {
        analysis.arrayCount++;
        
        // Check for uniform object arrays
        const uniformCheck = this._isUniformObjectArray(node);
        if (uniformCheck) {
          analysis.hasUniformArrays = true;
        }
        
        // Check for primitive arrays
        if (this._isPrimitiveArray(node)) {
          analysis.hasPrimitiveArrays = true;
        }
        
        // Analyze each element
        node.forEach((item, index) => {
          analyze(item, depth + 1, `${path}[${index}]`);
        });
      } else if (typeof node === 'object' && node !== null) {
        analysis.objectCount++;
        
        if (depth > 0) {
          analysis.hasNestedObjects = true;
        }
        
        Object.entries(node).forEach(([key, value]) => {
          analyze(value, depth + 1, path ? `${path}.${key}` : key);
        });
      }
    };

    analyze(data);
    
    // Determine complexity
    if (analysis.depth > 3 || analysis.arrayCount > 5 || analysis.objectCount > 10) {
      analysis.complexity = 'complex';
    } else if (analysis.depth > 1 || analysis.arrayCount > 0 || analysis.objectCount > 3) {
      analysis.complexity = 'moderate';
    }
    
    // Determine type
    if (typeof data === 'string') {
      analysis.type = data.length > this._config.longTextThreshold ? 'longText' : 'text';
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      analysis.type = 'image';
    } else if (Array.isArray(data)) {
      analysis.type = 'array';
    } else if (typeof data === 'object' && data !== null) {
      analysis.type = 'object';
    } else {
      analysis.type = 'primitive';
    }
    
    return analysis;
  }

  /**
   * Selects the best optimization strategy based on data analysis.
   * @param {Object} analysis - Data structure analysis
   * @returns {Object} Strategy configuration
   * @private
   */
  _selectOptimalStrategy(analysis) {
    // Strategy scoring: higher score = better fit
    const strategies = [];
    
    // Strategy 1: Flatten with tabular optimization (best for uniform arrays)
    if (analysis.hasUniformArrays || analysis.hasPrimitiveArrays) {
      strategies.push({
        name: 'Flatten',
        jsonMode: JsonOptimizationMode.Flatten,
        score: analysis.hasUniformArrays ? 100 : 80,
        reason: analysis.hasUniformArrays 
          ? 'Uniform object arrays detected - tabular format optimal'
          : 'Primitive arrays detected - comma-separated format optimal'
      });
    }
    
    // Strategy 2: Standard flatten (good for nested objects)
    if (analysis.hasNestedObjects || analysis.complexity === 'moderate') {
      strategies.push({
        name: 'Flatten',
        jsonMode: JsonOptimizationMode.Flatten,
        score: 70,
        reason: 'Nested objects detected - flatten format optimal'
      });
    }
    
    // Strategy 3: YAML (good for readable structures)
    if (analysis.complexity === 'moderate' && !analysis.hasUniformArrays) {
      strategies.push({
        name: 'ToYaml',
        jsonMode: JsonOptimizationMode.ToYaml,
        score: 60,
        reason: 'Moderate complexity - YAML format may be more readable'
      });
    }
    
    // Strategy 4: Text optimization (for long text)
    if (analysis.type === 'longText') {
      strategies.push({
        name: 'TextOptimization',
        textMode: this._config.textMode,
        score: 90,
        reason: 'Long text detected - summarization recommended'
      });
    }
    
    // Strategy 5: Image optimization (for image data)
    if (analysis.type === 'image') {
      strategies.push({
        name: 'ImageOptimization',
        imageMode: this._config.imageMode,
        score: 100,
        reason: 'Image data detected - OCR recommended'
      });
    }
    
    // Select highest scoring strategy
    if (strategies.length === 0) {
      return {
        name: 'Flatten',
        jsonMode: JsonOptimizationMode.Flatten,
        score: 50,
        reason: 'Default flatten strategy'
      };
    }
    
    return strategies.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * Intelligently optimizes data by automatically selecting the best strategy.
   * This method analyzes the input data structure and applies the most
   * appropriate optimization methods automatically.
   *
   * @param {any} rawData - The data to optimize (object, JSON string, text, ArrayBuffer).
   * @param {string} [intent] - (Optional) A hint about the user's goal.
   * @returns {Promise<string>} A promise that resolves to the optimized string.
   */
  async brevity(rawData, intent = null) {
    // Normalize input to object for analysis
    let inputObject = null;
    let inputType = typeof rawData;
    
    if (inputType === 'string') {
      try {
        const trimmed = rawData.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          inputObject = JSON.parse(rawData);
        } else {
          // It's plain text - analyze and optimize
          const analysis = this._analyzeDataStructure(rawData);
          const strategy = this._selectOptimalStrategy(analysis);
          
          if (strategy.name === 'TextOptimization') {
            return await this._textOptimizer(rawData, intent);
          }
          return rawData;
        }
      } catch (e) {
        // Not JSON - treat as text
        const analysis = this._analyzeDataStructure(rawData);
        const strategy = this._selectOptimalStrategy(analysis);
        
        if (strategy.name === 'TextOptimization') {
          return await this._textOptimizer(rawData, intent);
        }
        return rawData;
      }
    } else if (inputType === 'object' && rawData !== null) {
      // Check if it's image data
      if (rawData instanceof ArrayBuffer || 
          rawData instanceof Uint8Array ||
          (rawData.constructor && rawData.constructor.name === 'Buffer')) {
        return await this._imageOptimizer(rawData, intent);
      }
      inputObject = rawData;
    } else {
      // Primitive - return as-is
      return String(rawData);
    }
    
    // Analyze the data structure
    const analysis = this._analyzeDataStructure(inputObject);
    const strategy = this._selectOptimalStrategy(analysis);
    
    // Apply the selected strategy
    const tempConfig = new BrevitConfig({
      ...this._config,
      jsonMode: strategy.jsonMode || this._config.jsonMode,
      textMode: strategy.textMode || this._config.textMode,
      imageMode: strategy.imageMode || this._config.imageMode
    });
    
    // Temporarily override config for this optimization
    const originalConfig = this._config;
    this._config = tempConfig;
    
    try {
      // Use the existing optimize method with the selected strategy
      return await this.optimize(inputObject, intent);
    } finally {
      // Restore original config
      this._config = originalConfig;
    }
  }

  /**
   * Registers a custom optimization strategy for the brevity method.
   * This allows extending Brevit with new optimization strategies.
   *
   * @param {string} name - Strategy name
   * @param {Function} analyzer - Function that analyzes data and returns score (0-100)
   * @param {Function} optimizer - Function that optimizes the data
   * @example
   * brevit.registerStrategy('custom', (data) => ({ score: 85, reason: 'Custom logic' }), async (data) => { ... });
   */
  registerStrategy(name, analyzer, optimizer) {
    if (!this._strategies) {
      this._strategies = new Map();
    }
    this._strategies.set(name, { analyzer, optimizer });
  }

  /**
   * The primary method. Optimizes any JS object, JSON string,
   * or text into a token-efficient string.
   *
   * @param {any} rawData - The data to optimize (object, JSON string, text, ArrayBuffer).
   * @param {string} [intent] - (Optional) A hint about the user's goal.
   * @returns {Promise<string>} A promise that resolves to the optimized string.
   */
  async optimize(rawData, intent = null) {
    let inputObject = null;
    let inputType = typeof rawData;

    if (inputType === 'string') {
      // Could be JSON string or just text
      try {
        const trimmed = rawData.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          inputObject = JSON.parse(rawData);
        }
      } catch (e) {
        // It's not a JSON string, treat as text
      }

      if (!inputObject) {
        // It's text
        if (rawData.length > this._config.longTextThreshold) {
          // It's long text, apply text optimization
          return await this._textOptimizer(rawData, intent);
        }
        // It's short text, return as-is
        return rawData;
      }
    } else if (inputType === 'object' && rawData !== null) {
      // Check if it's an ArrayBuffer or TypedArray (image data)
      if (rawData instanceof ArrayBuffer || 
          rawData instanceof Uint8Array ||
          (rawData.constructor && rawData.constructor.name === 'Buffer')) {
        return await this._imageOptimizer(rawData, intent);
      }
      // It's a plain JS object
      inputObject = rawData;
    } else {
      // Other primitives, return as-is
      return String(rawData);
    }

    // If we're here, we have an object (from JSON or POJO)
    // Now apply the configured JSON optimization
    switch (this._config.jsonMode) {
      case JsonOptimizationMode.Flatten:
        return this._flattenObject(inputObject);

      case JsonOptimizationMode.ToYaml:
        // STUB: Requires a 'js-yaml' library
        // import YAML from 'js-yaml';
        // return YAML.dump(inputObject);
        console.warn('[Brevit] ToYaml mode requires installing a YAML library (e.g., js-yaml).');
        return JSON.stringify(inputObject, null, 2); // Fallback

      case JsonOptimizationMode.Filter:
        // STUB: Requires a JSON-path library
        console.warn('[Brevit] Filter mode is not implemented in this stub.');
        return JSON.stringify(inputObject); // Fallback

      case JsonOptimizationMode.None:
      default:
        return JSON.stringify(inputObject); // Return as unformatted JSON
    }
  }

  /**
   * Default text optimizer (STUB).
   * In a frontend, this would likely make an API call to a
   * backend (C# or Python) that runs Semantic Kernel or LangChain
   * to do the actual summarization.
   * @private
   */
  async _defaultTextOptimizer(longText, intent) {
    // STUB: A real frontend app would call its backend for this.
    // NEVER put LLM API keys in a frontend app.
    console.warn('[Brevit] Text summarization should be done on a secure backend.');
    const mode = this._config.textMode;
    const stubSummary = longText.substring(0, 150);
    return `[${mode} Stub: Summary of text follows...]\n${stubSummary}...\n[End of summary]`;
  }

  /**
   * Default image optimizer (STUB).
   * In a frontend, this would likely make an API call to a
   * backend that runs OCR services.
   * @private
   */
  async _defaultImageOptimizer(imageData, intent) {
    // STUB: A real frontend app would call its backend for this.
    console.warn('[Brevit] Image OCR should be done on a secure backend.');
    const size = imageData instanceof ArrayBuffer ? imageData.byteLength : imageData.length;
    return `[OCR Stub: Extracted text from image (${size} bytes)]\nSample OCR Text: INVOICE #1234\nTotal: $499.99\n[End of extracted text]`;
  }
}


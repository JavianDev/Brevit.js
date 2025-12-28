/**
 * Brevit.js - TypeScript Definitions
 * A high-performance JavaScript library for semantically compressing
 * and optimizing data before sending it to a Large Language Model (LLM).
 */

/**
 * JSON optimization modes
 */
export const JsonOptimizationMode: {
  readonly None: 'None';
  readonly Flatten: 'Flatten';
  readonly ToYaml: 'ToYaml';
  readonly Filter: 'Filter';
};

/**
 * Text optimization modes
 */
export const TextOptimizationMode: {
  readonly None: 'None';
  readonly Clean: 'Clean';
  readonly SummarizeFast: 'SummarizeFast';
  readonly SummarizeHighQuality: 'SummarizeHighQuality';
};

/**
 * Image optimization modes
 */
export const ImageOptimizationMode: {
  readonly None: 'None';
  readonly Ocr: 'Ocr';
  readonly Metadata: 'Metadata';
};

/**
 * Type for JSON optimization mode values
 */
export type JsonOptimizationModeType = typeof JsonOptimizationMode[keyof typeof JsonOptimizationMode];

/**
 * Type for text optimization mode values
 */
export type TextOptimizationModeType = typeof TextOptimizationMode[keyof typeof TextOptimizationMode];

/**
 * Type for image optimization mode values
 */
export type ImageOptimizationModeType = typeof ImageOptimizationMode[keyof typeof ImageOptimizationMode];

/**
 * Configuration options for BrevitClient
 */
export interface BrevitConfigOptions {
  /**
   * Strategy for JSON optimization
   * @default JsonOptimizationMode.Flatten
   */
  jsonMode?: JsonOptimizationModeType;

  /**
   * Strategy for text optimization
   * @default TextOptimizationMode.Clean
   */
  textMode?: TextOptimizationModeType;

  /**
   * Strategy for image optimization
   * @default ImageOptimizationMode.Ocr
   */
  imageMode?: ImageOptimizationModeType;

  /**
   * JSON property paths to keep when using Filter mode
   * @default []
   */
  jsonPathsToKeep?: string[];

  /**
   * Character count threshold to trigger text optimization
   * @default 500
   */
  longTextThreshold?: number;
}

/**
 * Configuration object for the BrevitClient
 */
export class BrevitConfig {
  /**
   * JSON optimization mode
   */
  jsonMode: JsonOptimizationModeType;

  /**
   * Text optimization mode
   */
  textMode: TextOptimizationModeType;

  /**
   * Image optimization mode
   */
  imageMode: ImageOptimizationModeType;

  /**
   * JSON paths to keep for Filter mode
   */
  jsonPathsToKeep: string[];

  /**
   * Long text threshold
   */
  longTextThreshold: number;

  /**
   * Creates a new BrevitConfig instance
   * @param options Configuration options
   */
  constructor(options?: BrevitConfigOptions);
}

/**
 * Custom text optimizer function signature
 * @param longText The text to optimize
 * @param intent Optional hint about the user's goal
 * @returns Promise resolving to optimized text
 */
export type TextOptimizerFunction = (longText: string, intent?: string | null) => Promise<string>;

/**
 * Custom image optimizer function signature
 * @param imageData The image data (ArrayBuffer, Uint8Array, or Buffer)
 * @param intent Optional hint about the user's goal
 * @returns Promise resolving to optimized text representation
 */
export type ImageOptimizerFunction = (
  imageData: ArrayBuffer | Uint8Array | Buffer,
  intent?: string | null
) => Promise<string>;

/**
 * Options for BrevitClient constructor
 */
export interface BrevitClientOptions {
  /**
   * Custom text optimizer function
   */
  textOptimizer?: TextOptimizerFunction;

  /**
   * Custom image optimizer function
   */
  imageOptimizer?: ImageOptimizerFunction;
}

/**
 * The main client for the Brevit.js library.
 * This class orchestrates the optimization pipeline.
 */
export class BrevitClient {
  /**
   * Creates a new BrevitClient instance
   * @param config Brevit configuration (defaults to new BrevitConfig())
   * @param options Optional custom optimizers
   */
  constructor(config?: BrevitConfig, options?: BrevitClientOptions);

  /**
   * The primary method. Optimizes any JS object, JSON string,
   * or data (text, image bytes) into a token-efficient string.
   *
   * @param rawData The data to optimize. Can be:
   *   - A plain JavaScript object
   *   - A JSON string
   *   - A text string
   *   - An ArrayBuffer, Uint8Array, or Buffer (for images)
   *   - Any other primitive value
   * @param intent Optional hint about the user's goal, which can
   *   help the optimizers make better decisions
   * @returns Promise resolving to an optimized string
   *
   * @example
   * ```typescript
   * const client = new BrevitClient();
   * const optimized = await client.optimize({ user: { name: "John" } });
   * // Returns: "user.name: John"
   * ```
   *
   * @example
   * ```typescript
   * const optimized = await client.optimize('{"order": {"id": "123"}}');
   * // Returns: "order.id: 123"
   * ```
   *
   * @example
   * ```typescript
   * const imageData = await fetch('image.jpg').then(r => r.arrayBuffer());
   * const optimized = await client.optimize(imageData);
   * // Returns OCR text or metadata
   * ```
   */
  optimize(rawData: unknown, intent?: string | null): Promise<string>;
}

// Re-export types for convenience
export type {
  BrevitConfigOptions,
  BrevitClientOptions,
  TextOptimizerFunction,
  ImageOptimizerFunction,
};


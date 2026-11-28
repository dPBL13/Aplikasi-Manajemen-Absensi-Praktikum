/** Ambient declarations for test suites when @types/jest is not in devDependencies */
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(actual: unknown): any;
declare const jest: any;

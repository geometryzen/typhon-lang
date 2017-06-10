import { sourceLines } from '../data/eight';
import { Tokens } from './Tokens';
import { Tokenizer, TokenizerCallback } from './Tokenizer';
// import { tokenNames } from './tokenNames';

describe("Tokenizer", function () {
    let tokenCount = 0;
    const callback: TokenizerCallback = function (token: Tokens, text: string, start: number[], end: number[], line: string): boolean | undefined {
        // const name = tokenNames[token];
        // console.lg(`${name} ${text}`);
        tokenCount++;
        return undefined;
    };
    const tokenizer = new Tokenizer(false, callback);
    const t0 = Date.now();
    for (const sourceLine of sourceLines) {
        tokenizer.generateTokens(sourceLine);
    }
    const t1 = Date.now();
    it("performance should not degrade", function () {
        // There would be 258 tokens if newlines are added.
        expect(tokenCount).toBe(229);
        // console.lg(`Tokenizer performance generateTokens (${tokenCount} tokens)    took ${t1 - t0} ms`);
        // This has been benchmarked at around 4-6 ms.
        expect(t1 - t0 < 10).toBe(true);
    });
});

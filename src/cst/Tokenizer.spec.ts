import { splitSourceTextIntoLines } from './splitSourceTextIntoLines';
import { Tokens } from './Tokens';
import { Tokenizer, TokenizerCallback } from './Tokenizer';
import { tokenNames } from './tokenNames';

interface Token {
    type: Tokens;
    name: string;
    text: string;
    beginLine: number;
    beginColumn: number;
    endLine: number;
    endColumn: number;
}

describe("Tokenizer", function () {
    const tokens: Token[] = [];
    const callback: TokenizerCallback = function callback(type: Tokens, text: string, start: number[], end: number[], line: string): boolean | undefined {
        const name = tokenNames[type];
        tokens.push({ type, name, text, beginLine: start[0], beginColumn: start[1], endLine: end[0], endColumn: end[1] });
        return undefined;
    };
    const tokenizer = new Tokenizer(false, callback);
    const sourceText = [
        " ''' sdf ''' "
    ].join('\n');
    const lines = splitSourceTextIntoLines(sourceText);
    for (const line of lines) {
        const ret = tokenizer.generateTokens(line);
        if (ret) {
            if (ret !== "done") {
                // throw parseError("incomplete input");
            }
            // return p.rootNode;
        }
        // return false;
    }
    it("...", function () {
        expect(tokens.length).toBe(3);
        // console.lg(JSON.stringify(tokens, null, 2));
        // expect(tokens[0].type).toBe(Tokens.T_NUMBER);
        // expect(tokens[1].type).toBe(Tokens.T_NEWLINE);
        // expect(tokens[2].type).toBe(Tokens.T_ENDMARKER);
    });
});

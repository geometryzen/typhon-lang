import { Tokens } from './Tokens';
/**
 * The function called by the tokenizer for each token in a line.
 * If the callback returns `true`, the tokenizer declares that it is 'done' with that line.
 */
export declare type TokenizerCallback = (token: Tokens, text: string, start: number[], end: number[], line: string) => boolean | undefined;
/**
 * This is a port of tokenize.py by Ka-Ping Yee.
 *
 * each call to readline should return one line of input as a string, or
 * undefined if it's finished.
 *
 * callback is called for each token with 5 args:
 * 1. the token type
 * 2. the token string
 * 3. [ start_row, start_col ]
 * 4. [ end_row, end_col ]
 * 5. logical line where the token was found, including continuation lines
 *
 * callback can return true to abort.
 */
export declare class Tokenizer {
    private callback;
    private lnum;
    private parenlev;
    private continued;
    private contstr;
    private needcont;
    private contline;
    private indents;
    private endprog;
    private strstart;
    /**
     * Probably used for REPL support.
     */
    interactive: boolean;
    doneFunc: () => 'done' | 'failed';
    /**
     *
     */
    constructor(interactive: boolean, callback: TokenizerCallback);
    /**
     * @param line
     * @return 'done' or 'failed' or true?
     */
    generateTokens(line: string): boolean | 'done' | 'failed';
}

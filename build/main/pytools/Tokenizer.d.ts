import { Tokens } from './Tokens';
export declare type LineColumn = [number, number];
/**
 * The function called by the tokenizer for each token in a line.
 * If the callback returns `true`, the tokenizer declares that it is 'done' with that line.
 */
export declare type TokenizerCallback = (token: Tokens, text: string, start: number[], end: number[], line: string) => boolean | undefined;
export declare type DoneOrFailed = 'done' | 'failed';
export declare const Done = "done";
export declare const Failed = "failed";
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
    private readonly callback;
    /**
     * Cache of the beginning of a token.
     * This will change by token so consumers must copy the values out.
     */
    private readonly begin;
    /**
     * Cache of the end of a token.
     * This will change by token so consumers must copy the values out.
     */
    private readonly end;
    /**
     * The line number. This must be copied into the begin[LINE] and end[LINE] properties.
     */
    private lnum;
    private parenlev;
    private continued;
    private contstr;
    private needcont;
    private contline;
    private readonly indents;
    private endprog;
    private readonly strstart;
    /**
     * Probably used for REPL support.
     */
    interactive: boolean;
    private readonly doneFunc;
    /**
     *
     */
    constructor(interactive: boolean, callback: TokenizerCallback);
    /**
     * @param line
     * @return 'done' or 'failed' or true?
     */
    generateTokens(line: string): boolean | DoneOrFailed;
}

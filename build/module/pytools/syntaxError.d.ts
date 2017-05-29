/**
 * @param message
 * @param lineNumber
 */
export declare function syntaxError(message: string, lineNumber?: number): SyntaxError;
export declare type LineColumn = [number, number];
export interface Position {
    row: number;
    column: number;
}
export declare class ParseError extends SyntaxError {
    constructor(message: string);
    begin?: Position;
    end?: Position;
}
/**
 * @param message
 * @param begin
 * @param end
 */
export declare function parseError(message: string, begin?: LineColumn, end?: LineColumn): ParseError;

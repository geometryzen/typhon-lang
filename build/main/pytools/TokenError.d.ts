/**
 *
 */
export declare class TokenError {
    name: string;
    message: string;
    lineNumber: number;
    columnNumber: number;
    constructor(message: string, lineNumber: number, columnNumber: number);
}

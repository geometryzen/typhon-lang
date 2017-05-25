/**
 *
 */
export declare class TokenError {
    name: string;
    message: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    constructor(message: string, fileName: string, lineNumber: number, columnNumber: number);
}

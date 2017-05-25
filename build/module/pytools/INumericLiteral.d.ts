/**
 * A numeric literal used in parsing.
 */
export interface INumericLiteral {
    isFloat(): boolean;
    isInt(): boolean;
    isLong(): boolean;
    radix?: number;
    text?: string;
    toString(): string;
    value?: number;
}

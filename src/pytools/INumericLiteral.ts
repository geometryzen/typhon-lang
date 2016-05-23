/**
 * A numeric literal used in parsing.
 */
interface INumericLiteral {
    isFloat(): boolean;
    isInt(): boolean;
    isLong(): boolean;
    radix?: number;
    text?: string;
    toString(): string;
    value?: number;
}

export default INumericLiteral;

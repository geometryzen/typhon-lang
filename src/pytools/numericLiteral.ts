import { INumericLiteral } from './types';

/**
 * @param s
 */
export function floatAST(s: string): INumericLiteral {
    const thing: INumericLiteral = {
        text: s,
        value: parseFloat(s),
        isFloat: function () { return true; },
        isInt: function () { return false; },
        isLong: function () { return false; },
        toString: function () { return s; }
    };
    return thing;
}

/**
 * @param n
 */
export function intAST(n: number): INumericLiteral {
    const thing: INumericLiteral = {
        value: n,
        isFloat: function () { return false; },
        isInt: function () { return true; },
        isLong: function () { return false; },
        toString: function () { return '' + n; }
    };
    return thing;
}

/**
 * @param {string} s
 */
export function longAST(s: string, radix: number): INumericLiteral {
    const thing: INumericLiteral = {
        text: s,
        radix: radix,
        isFloat: function () { return false; },
        isInt: function () { return false; },
        isLong: function () { return true; },
        toString: function () { return s; }
    };
    return thing;
}

import { INumericLiteral } from './INumericLiteral';
/**
 * @param {string} s
 */
export declare function floatAST(s: string): INumericLiteral;
/**
 * @param n {number}
 */
export declare function intAST(n: number): INumericLiteral;
/**
 * @param {string} s
 */
export declare function longAST(s: string, radix: any): INumericLiteral;

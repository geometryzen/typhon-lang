import { INumericLiteral } from './INumericLiteral';
/**
 * @param s
 */
export declare function floatAST(s: string): INumericLiteral;
/**
 * @param n
 */
export declare function intAST(n: number): INumericLiteral;
/**
 * @param {string} s
 */
export declare function longAST(s: string, radix: any): INumericLiteral;

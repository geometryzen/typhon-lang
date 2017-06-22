// DO NOT MODIFY. File automatically generated by pgen/parser/main.py
import { Tokens } from './Tokens';

/**
 * Mapping from operator textual symbols to token symbolic constants.
 */
export const OpMap: { [op: string]: Tokens } = {
    "(": Tokens.T_LPAR,
    ")": Tokens.T_RPAR,
    "[": Tokens.T_LSQB,
    "]": Tokens.T_RSQB,
    ":": Tokens.T_COLON,
    ",": Tokens.T_COMMA,
    ";": Tokens.T_SEMI,
    "+": Tokens.T_PLUS,
    "-": Tokens.T_MINUS,
    "*": Tokens.T_STAR,
    "/": Tokens.T_SLASH,
    "|": Tokens.T_VBAR,
    "&": Tokens.T_AMPER,
    "<": Tokens.T_LESS,
    ">": Tokens.T_GREATER,
    "=": Tokens.T_EQUAL,
    ".": Tokens.T_DOT,
    "%": Tokens.T_PERCENT,
    "`": Tokens.T_BACKQUOTE,
    "{": Tokens.T_LBRACE,
    "}": Tokens.T_RBRACE,
    "@": Tokens.T_AT,
    "==": Tokens.T_EQEQUAL,
    "!=": Tokens.T_NOTEQUAL,
    "<>": Tokens.T_NOTEQUAL,
    "<=": Tokens.T_LESSEQUAL,
    ">=": Tokens.T_GREATEREQUAL,
    "~": Tokens.T_TILDE,
    "^": Tokens.T_CIRCUMFLEX,
    "<<": Tokens.T_LEFTSHIFT,
    ">>": Tokens.T_RIGHTSHIFT,
    "**": Tokens.T_DOUBLESTAR,
    "+=": Tokens.T_PLUSEQUAL,
    "-=": Tokens.T_MINEQUAL,
    "*=": Tokens.T_STAREQUAL,
    "/=": Tokens.T_SLASHEQUAL,
    "%=": Tokens.T_PERCENTEQUAL,
    "&=": Tokens.T_AMPEREQUAL,
    "|=": Tokens.T_VBAREQUAL,
    "^=": Tokens.T_CIRCUMFLEXEQUAL,
    "<<=": Tokens.T_LEFTSHIFTEQUAL,
    ">>=": Tokens.T_RIGHTSHIFTEQUAL,
    "**=": Tokens.T_DOUBLESTAREQUAL,
    "//": Tokens.T_DOUBLESLASH,
    "//=": Tokens.T_DOUBLESLASHEQUAL,
    "->": Tokens.T_RARROW
};
/**
 * An Arc is a pair, represented in an array, consisting a label and a to-state.
 */
export const ARC_SYMBOL_LABEL = 0;
export const ARC_TO_STATE = 1;
export type Arc = [number, number];
/**
 *
 */
export const IDX_DFABT_DFA = 0;
export const IDX_DFABT_BEGIN_TOKENS = 1;
export type State = Arc[];
export type Dfa = State[];
export type BeginTokens = { [value: number]: number };
export type DfaAndBeginTokens = [Dfa, BeginTokens];
export const IDX_LABEL_TOKEN_OR_SYMBOL = 0;
export const IDX_LABEL_NAME = 1;
export type Label = [number, string | null];
/**
 * Describes the shape of the ParseTables objects.
 */
export interface Grammar {
    /**
     * The number of the grammar's start symbol.
     */
    start: number;
    /**
     * A dict mapping symbol numbers to (DFA, first)
     * pairs, where DFA is an item from the states list
     * above, and first is a set of tokens that can
     * begin this grammar rule (represented by a dict
     * whose values are always 1).
     */
    dfas: { [symbolId: number]: DfaAndBeginTokens };
    /**
     * The first index is the symbol for a transition (a number).
     * The second index is the haman-readable decode of the symbol, if it exists, otherwise `null`.
     * Not all symbols have human-readable names.
     * All symbols that have human-readable names are keywords, with one exception.
     * The symbol 0 (zero) is an exceptional symbol and has the human-readavble name 'EMPTY'.
     *
     * a list of (x, y) pairs where x is either a token
     * number or a symbol number, and y is either None
     * or a string; the strings are keywords.  The label
     * number is the index in this list; label numbers
     * are used to mark state transitions (arcs) in the
     * DFAs.
     */
    labels: Label[];
    /**
     * A mapping from a keyword to the symbol that has been assigned to it.
     */
    keywords: { [keyword: string]: number };
    /**
     * A mapping from a token to a symbol.
     * A dict mapping token numbers to arc labels
     */
    tokens: { [token: number]: number };
    /**
     * Actually maps from the node constructor name.
     */
    sym: { [name: string]: number };
    /**
     * A lookup table for converting the value in the `sym` mapping back to a string.
     */
    number2symbol: { [value: number]: string };
    /**
     * A list of DFAs, where each DFA is a list of
     * states, each state is is a list of arcs, and each
     * arc is a (i, j) pair where i is a label and j is
     * a state number.  The DFA number is the index into
     * this list.  (This name is slightly confusing.)
     * Final states are represented by a special arc of
     * the form (0, j) where j is its own state number.
     */
    states: Dfa[];
}
/**
 *
 */
export const ParseTables: Grammar = {
sym:
{AndExpr: 257,
 ArithmeticExpr: 258,
 AtomExpr: 259,
 BitwiseAndExpr: 260,
 BitwiseOrExpr: 261,
 BitwiseXorExpr: 262,
 ComparisonExpr: 263,
 ExprList: 264,
 ExprStmt: 265,
 GeometricExpr: 266,
 GlobalStmt: 267,
 IfExpr: 268,
 ImportList: 269,
 ImportSpecifier: 270,
 LambdaExpr: 271,
 ModuleSpecifier: 272,
 NonLocalStmt: 273,
 NotExpr: 274,
 OrExpr: 275,
 PowerExpr: 276,
 ShiftExpr: 277,
 UnaryExpr: 278,
 YieldExpr: 279,
 annasign: 280,
 arglist: 281,
 argument: 282,
 assert_stmt: 283,
 augassign: 284,
 break_stmt: 285,
 classdef: 286,
 comp_op: 287,
 compound_stmt: 288,
 continue_stmt: 289,
 decorated: 290,
 decorator: 291,
 decorators: 292,
 del_stmt: 293,
 dictmaker: 294,
 dotted_as_name: 295,
 dotted_as_names: 296,
 dotted_name: 297,
 encoding_decl: 298,
 eval_input: 299,
 except_clause: 300,
 exec_stmt: 301,
 file_input: 302,
 flow_stmt: 303,
 for_stmt: 304,
 fpdef: 305,
 fplist: 306,
 funcdef: 307,
 gen_for: 308,
 gen_if: 309,
 gen_iter: 310,
 if_stmt: 311,
 import_from: 312,
 import_name: 313,
 import_stmt: 314,
 list_for: 315,
 list_if: 316,
 list_iter: 317,
 listmaker: 318,
 old_LambdaExpr: 319,
 old_test: 320,
 parameters: 321,
 pass_stmt: 322,
 print_stmt: 323,
 raise_stmt: 324,
 return_stmt: 325,
 simple_stmt: 326,
 single_input: 256,
 sliceop: 327,
 small_stmt: 328,
 stmt: 329,
 subscript: 330,
 subscriptlist: 331,
 suite: 332,
 testlist: 333,
 testlist1: 334,
 testlist_gexp: 335,
 testlist_safe: 336,
 trailer: 337,
 try_stmt: 338,
 varargslist: 339,
 while_stmt: 340,
 with_stmt: 341,
 with_var: 342,
 yield_stmt: 343},
number2symbol:
{256: 'single_input',
 257: 'AndExpr',
 258: 'ArithmeticExpr',
 259: 'AtomExpr',
 260: 'BitwiseAndExpr',
 261: 'BitwiseOrExpr',
 262: 'BitwiseXorExpr',
 263: 'ComparisonExpr',
 264: 'ExprList',
 265: 'ExprStmt',
 266: 'GeometricExpr',
 267: 'GlobalStmt',
 268: 'IfExpr',
 269: 'ImportList',
 270: 'ImportSpecifier',
 271: 'LambdaExpr',
 272: 'ModuleSpecifier',
 273: 'NonLocalStmt',
 274: 'NotExpr',
 275: 'OrExpr',
 276: 'PowerExpr',
 277: 'ShiftExpr',
 278: 'UnaryExpr',
 279: 'YieldExpr',
 280: 'annasign',
 281: 'arglist',
 282: 'argument',
 283: 'assert_stmt',
 284: 'augassign',
 285: 'break_stmt',
 286: 'classdef',
 287: 'comp_op',
 288: 'compound_stmt',
 289: 'continue_stmt',
 290: 'decorated',
 291: 'decorator',
 292: 'decorators',
 293: 'del_stmt',
 294: 'dictmaker',
 295: 'dotted_as_name',
 296: 'dotted_as_names',
 297: 'dotted_name',
 298: 'encoding_decl',
 299: 'eval_input',
 300: 'except_clause',
 301: 'exec_stmt',
 302: 'file_input',
 303: 'flow_stmt',
 304: 'for_stmt',
 305: 'fpdef',
 306: 'fplist',
 307: 'funcdef',
 308: 'gen_for',
 309: 'gen_if',
 310: 'gen_iter',
 311: 'if_stmt',
 312: 'import_from',
 313: 'import_name',
 314: 'import_stmt',
 315: 'list_for',
 316: 'list_if',
 317: 'list_iter',
 318: 'listmaker',
 319: 'old_LambdaExpr',
 320: 'old_test',
 321: 'parameters',
 322: 'pass_stmt',
 323: 'print_stmt',
 324: 'raise_stmt',
 325: 'return_stmt',
 326: 'simple_stmt',
 327: 'sliceop',
 328: 'small_stmt',
 329: 'stmt',
 330: 'subscript',
 331: 'subscriptlist',
 332: 'suite',
 333: 'testlist',
 334: 'testlist1',
 335: 'testlist_gexp',
 336: 'testlist_safe',
 337: 'trailer',
 338: 'try_stmt',
 339: 'varargslist',
 340: 'while_stmt',
 341: 'with_stmt',
 342: 'with_var',
 343: 'yield_stmt'},
dfas:
{256: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
       {2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1}],
 257: [[[[38, 1]], [[39, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 258: [[[[40, 1]], [[25, 0], [37, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 259: [[[[18, 1], [8, 2], [32, 5], [29, 4], [9, 3], [14, 6], [21, 2]],
        [[18, 1], [0, 1]],
        [[0, 2]],
        [[41, 7], [42, 2]],
        [[43, 2], [44, 8], [45, 8]],
        [[46, 9], [47, 2]],
        [[48, 10]],
        [[42, 2]],
        [[43, 2]],
        [[47, 2]],
        [[14, 2]]],
       {8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 29: 1, 32: 1}],
 260: [[[[49, 1]], [[50, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 261: [[[[51, 1]], [[52, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 262: [[[[53, 1]], [[54, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 263: [[[[55, 1]], [[56, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 264: [[[[55, 1]], [[57, 2], [0, 1]], [[55, 1], [0, 2]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 265: [[[[58, 1]],
        [[59, 2], [60, 3], [61, 4], [0, 1]],
        [[0, 2]],
        [[58, 2], [45, 2]],
        [[58, 5], [45, 5]],
        [[61, 4], [0, 5]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 266: [[[[62, 1]], [[63, 0], [64, 0], [65, 0], [66, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 267: [[[[27, 1]], [[21, 2]], [[57, 1], [0, 2]]], {27: 1}],
 268: [[[[67, 1], [68, 2]],
        [[0, 1]],
        [[31, 3], [0, 2]],
        [[68, 4]],
        [[69, 5]],
        [[70, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 269: [[[[71, 1]], [[57, 2], [0, 1]], [[71, 1], [0, 2]]], {21: 1}],
 270: [[[[21, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]], {21: 1}],
 271: [[[[11, 1]], [[73, 2], [74, 3]], [[70, 4]], [[73, 2]], [[0, 4]]],
       {11: 1}],
 272: [[[[18, 1]], [[0, 1]]], {18: 1}],
 273: [[[[13, 1]], [[21, 2]], [[57, 1], [0, 2]]], {13: 1}],
 274: [[[[7, 1], [75, 2]], [[38, 2]], [[0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 275: [[[[76, 1]], [[77, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 276: [[[[78, 1]], [[79, 1], [80, 2], [0, 1]], [[49, 3]], [[0, 3]]],
       {8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 29: 1, 32: 1}],
 277: [[[[81, 1]], [[82, 0], [83, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 278: [[[[25, 1], [6, 1], [37, 1], [84, 2]], [[49, 2]], [[0, 2]]],
       {6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1}],
 279: [[[[26, 1]], [[58, 2], [0, 1]], [[0, 2]]], {26: 1}],
 280: [[[[73, 1]], [[70, 2]], [[61, 3], [0, 2]], [[70, 4]], [[0, 4]]],
       {73: 1}],
 281: [[[[64, 1], [85, 2], [80, 3]],
        [[70, 4]],
        [[57, 5], [0, 2]],
        [[70, 6]],
        [[57, 7], [0, 4]],
        [[64, 1], [85, 2], [80, 3], [0, 5]],
        [[0, 6]],
        [[85, 4], [80, 3]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1,
        64: 1,
        80: 1}],
 282: [[[[70, 1]], [[86, 2], [61, 3], [0, 1]], [[0, 2]], [[70, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 283: [[[[20, 1]], [[70, 2]], [[57, 3], [0, 2]], [[70, 4]], [[0, 4]]],
       {20: 1}],
 284: [[[[87, 1],
         [88, 1],
         [89, 1],
         [90, 1],
         [91, 1],
         [92, 1],
         [93, 1],
         [94, 1],
         [95, 1],
         [96, 1],
         [97, 1],
         [98, 1]],
        [[0, 1]]],
       {87: 1,
        88: 1,
        89: 1,
        90: 1,
        91: 1,
        92: 1,
        93: 1,
        94: 1,
        95: 1,
        96: 1,
        97: 1,
        98: 1}],
 285: [[[[33, 1]], [[0, 1]]], {33: 1}],
 286: [[[[10, 1]],
        [[21, 2]],
        [[73, 3], [29, 4]],
        [[99, 5]],
        [[43, 6], [58, 7]],
        [[0, 5]],
        [[73, 3]],
        [[43, 6]]],
       {10: 1}],
 287: [[[[100, 1],
         [101, 1],
         [7, 2],
         [102, 1],
         [100, 1],
         [103, 1],
         [104, 1],
         [105, 3],
         [106, 1],
         [107, 1]],
        [[0, 1]],
        [[103, 1]],
        [[7, 1], [0, 3]]],
       {7: 1, 100: 1, 101: 1, 102: 1, 103: 1, 104: 1, 105: 1, 106: 1, 107: 1}],
 288: [[[[108, 1],
         [109, 1],
         [110, 1],
         [111, 1],
         [112, 1],
         [113, 1],
         [114, 1],
         [115, 1]],
        [[0, 1]]],
       {4: 1, 10: 1, 15: 1, 17: 1, 28: 1, 31: 1, 35: 1, 36: 1}],
 289: [[[[34, 1]], [[0, 1]]], {34: 1}],
 290: [[[[116, 1]], [[114, 2], [111, 2]], [[0, 2]]], {35: 1}],
 291: [[[[35, 1]],
        [[117, 2]],
        [[29, 4], [2, 3]],
        [[0, 3]],
        [[43, 5], [118, 6]],
        [[2, 3]],
        [[43, 5]]],
       {35: 1}],
 292: [[[[119, 1]], [[119, 1], [0, 1]]], {35: 1}],
 293: [[[[22, 1]], [[120, 2]], [[0, 2]]], {22: 1}],
 294: [[[[70, 1]],
        [[73, 2]],
        [[70, 3]],
        [[57, 4], [0, 3]],
        [[70, 1], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 295: [[[[117, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]], {21: 1}],
 296: [[[[121, 1]], [[57, 0], [0, 1]]], {21: 1}],
 297: [[[[21, 1]], [[122, 0], [0, 1]]], {21: 1}],
 298: [[[[21, 1]], [[0, 1]]], {21: 1}],
 299: [[[[58, 1]], [[2, 1], [123, 2]], [[0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 300: [[[[124, 1]],
        [[70, 2], [0, 1]],
        [[72, 3], [57, 3], [0, 2]],
        [[70, 4]],
        [[0, 4]]],
       {124: 1}],
 301: [[[[16, 1]],
        [[55, 2]],
        [[103, 3], [0, 2]],
        [[70, 4]],
        [[57, 5], [0, 4]],
        [[70, 6]],
        [[0, 6]]],
       {16: 1}],
 302: [[[[2, 0], [123, 1], [125, 0]], [[0, 1]]],
       {2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1,
        123: 1}],
 303: [[[[126, 1], [127, 1], [128, 1], [129, 1], [130, 1]], [[0, 1]]],
       {5: 1, 19: 1, 26: 1, 33: 1, 34: 1}],
 304: [[[[28, 1]],
        [[120, 2]],
        [[103, 3]],
        [[58, 4]],
        [[73, 5]],
        [[99, 6]],
        [[69, 7], [0, 6]],
        [[73, 8]],
        [[99, 9]],
        [[0, 9]]],
       {28: 1}],
 305: [[[[29, 1], [21, 2]],
        [[131, 3]],
        [[73, 4], [0, 2]],
        [[43, 5]],
        [[70, 5]],
        [[0, 5]]],
       {21: 1, 29: 1}],
 306: [[[[132, 1]], [[57, 2], [0, 1]], [[132, 1], [0, 2]]], {21: 1, 29: 1}],
 307: [[[[4, 1]],
        [[21, 2]],
        [[133, 3]],
        [[134, 4], [73, 5]],
        [[70, 6]],
        [[99, 7]],
        [[73, 5]],
        [[0, 7]]],
       {4: 1}],
 308: [[[[28, 1]],
        [[120, 2]],
        [[103, 3]],
        [[68, 4]],
        [[135, 5], [0, 4]],
        [[0, 5]]],
       {28: 1}],
 309: [[[[31, 1]], [[136, 2]], [[135, 3], [0, 2]], [[0, 3]]], {31: 1}],
 310: [[[[86, 1], [137, 1]], [[0, 1]]], {28: 1, 31: 1}],
 311: [[[[31, 1]],
        [[70, 2]],
        [[73, 3]],
        [[99, 4]],
        [[69, 5], [138, 1], [0, 4]],
        [[73, 6]],
        [[99, 7]],
        [[0, 7]]],
       {31: 1}],
 312: [[[[30, 1]],
        [[139, 2]],
        [[24, 3]],
        [[140, 4], [29, 5], [64, 4]],
        [[0, 4]],
        [[140, 6]],
        [[43, 4]]],
       {30: 1}],
 313: [[[[24, 1]], [[141, 2]], [[0, 2]]], {24: 1}],
 314: [[[[142, 1], [143, 1]], [[0, 1]]], {24: 1, 30: 1}],
 315: [[[[28, 1]],
        [[120, 2]],
        [[103, 3]],
        [[144, 4]],
        [[145, 5], [0, 4]],
        [[0, 5]]],
       {28: 1}],
 316: [[[[31, 1]], [[136, 2]], [[145, 3], [0, 2]], [[0, 3]]], {31: 1}],
 317: [[[[146, 1], [147, 1]], [[0, 1]]], {28: 1, 31: 1}],
 318: [[[[70, 1]],
        [[146, 2], [57, 3], [0, 1]],
        [[0, 2]],
        [[70, 4], [0, 3]],
        [[57, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 319: [[[[11, 1]], [[73, 2], [74, 3]], [[136, 4]], [[73, 2]], [[0, 4]]],
       {11: 1}],
 320: [[[[148, 1], [68, 1]], [[0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 321: [[[[29, 1]], [[43, 2], [74, 3]], [[0, 2]], [[43, 2]]], {29: 1}],
 322: [[[[23, 1]], [[0, 1]]], {23: 1}],
 323: [[[[12, 1]],
        [[70, 2], [82, 3], [0, 1]],
        [[57, 4], [0, 2]],
        [[70, 5]],
        [[70, 2], [0, 4]],
        [[57, 6], [0, 5]],
        [[70, 7]],
        [[57, 8], [0, 7]],
        [[70, 7], [0, 8]]],
       {12: 1}],
 324: [[[[5, 1]],
        [[70, 2], [0, 1]],
        [[57, 3], [0, 2]],
        [[70, 4]],
        [[57, 5], [0, 4]],
        [[70, 6]],
        [[0, 6]]],
       {5: 1}],
 325: [[[[19, 1]], [[58, 2], [0, 1]], [[0, 2]]], {19: 1}],
 326: [[[[149, 1]], [[2, 2], [150, 3]], [[0, 2]], [[149, 1], [2, 2]]],
       {5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        16: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        29: 1,
        30: 1,
        32: 1,
        33: 1,
        34: 1,
        37: 1}],
 327: [[[[73, 1]], [[70, 2], [0, 1]], [[0, 2]]], {73: 1}],
 328: [[[[151, 1],
         [152, 1],
         [153, 1],
         [154, 1],
         [155, 1],
         [156, 1],
         [157, 1],
         [158, 1],
         [159, 1],
         [160, 1]],
        [[0, 1]]],
       {5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        16: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        29: 1,
        30: 1,
        32: 1,
        33: 1,
        34: 1,
        37: 1}],
 329: [[[[1, 1], [3, 1]], [[0, 1]]],
       {4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        37: 1}],
 330: [[[[73, 1], [70, 2], [122, 3]],
        [[161, 4], [70, 5], [0, 1]],
        [[73, 1], [0, 2]],
        [[122, 6]],
        [[0, 4]],
        [[161, 4], [0, 5]],
        [[122, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1,
        73: 1,
        122: 1}],
 331: [[[[162, 1]], [[57, 2], [0, 1]], [[162, 1], [0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1,
        73: 1,
        122: 1}],
 332: [[[[1, 1], [2, 2]],
        [[0, 1]],
        [[163, 3]],
        [[125, 4]],
        [[164, 1], [125, 4]]],
       {2: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        16: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        29: 1,
        30: 1,
        32: 1,
        33: 1,
        34: 1,
        37: 1}],
 333: [[[[70, 1]], [[57, 2], [0, 1]], [[70, 1], [0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 334: [[[[70, 1]], [[57, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 335: [[[[70, 1]],
        [[86, 2], [57, 3], [0, 1]],
        [[0, 2]],
        [[70, 4], [0, 3]],
        [[57, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 336: [[[[136, 1]],
        [[57, 2], [0, 1]],
        [[136, 3]],
        [[57, 4], [0, 3]],
        [[136, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        14: 1,
        18: 1,
        21: 1,
        25: 1,
        29: 1,
        32: 1,
        37: 1}],
 337: [[[[29, 1], [122, 2], [32, 3]],
        [[43, 4], [118, 5]],
        [[21, 4]],
        [[165, 6]],
        [[0, 4]],
        [[43, 4]],
        [[47, 4]]],
       {29: 1, 32: 1, 122: 1}],
 338: [[[[15, 1]],
        [[73, 2]],
        [[99, 3]],
        [[166, 4], [167, 5]],
        [[73, 6]],
        [[73, 7]],
        [[99, 8]],
        [[99, 9]],
        [[166, 4], [69, 10], [167, 5], [0, 8]],
        [[0, 9]],
        [[73, 11]],
        [[99, 12]],
        [[167, 5], [0, 12]]],
       {15: 1}],
 339: [[[[64, 1], [132, 2], [80, 3]],
        [[21, 4]],
        [[61, 5], [57, 6], [0, 2]],
        [[21, 7]],
        [[57, 8], [0, 4]],
        [[70, 9]],
        [[64, 1], [132, 2], [80, 3], [0, 6]],
        [[0, 7]],
        [[80, 3]],
        [[57, 6], [0, 9]]],
       {21: 1, 29: 1, 64: 1, 80: 1}],
 340: [[[[17, 1]],
        [[70, 2]],
        [[73, 3]],
        [[99, 4]],
        [[69, 5], [0, 4]],
        [[73, 6]],
        [[99, 7]],
        [[0, 7]]],
       {17: 1}],
 341: [[[[36, 1]],
        [[70, 2]],
        [[73, 3], [168, 4]],
        [[99, 5]],
        [[73, 3]],
        [[0, 5]]],
       {36: 1}],
 342: [[[[72, 1]], [[55, 2]], [[0, 2]]], {72: 1}],
 343: [[[[45, 1]], [[0, 1]]], {26: 1}]},
states:
[[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
 [[[38, 1]], [[39, 0], [0, 1]]],
 [[[40, 1]], [[25, 0], [37, 0], [0, 1]]],
 [[[18, 1], [8, 2], [32, 5], [29, 4], [9, 3], [14, 6], [21, 2]],
  [[18, 1], [0, 1]],
  [[0, 2]],
  [[41, 7], [42, 2]],
  [[43, 2], [44, 8], [45, 8]],
  [[46, 9], [47, 2]],
  [[48, 10]],
  [[42, 2]],
  [[43, 2]],
  [[47, 2]],
  [[14, 2]]],
 [[[49, 1]], [[50, 0], [0, 1]]],
 [[[51, 1]], [[52, 0], [0, 1]]],
 [[[53, 1]], [[54, 0], [0, 1]]],
 [[[55, 1]], [[56, 0], [0, 1]]],
 [[[55, 1]], [[57, 2], [0, 1]], [[55, 1], [0, 2]]],
 [[[58, 1]],
  [[59, 2], [60, 3], [61, 4], [0, 1]],
  [[0, 2]],
  [[58, 2], [45, 2]],
  [[58, 5], [45, 5]],
  [[61, 4], [0, 5]]],
 [[[62, 1]], [[63, 0], [64, 0], [65, 0], [66, 0], [0, 1]]],
 [[[27, 1]], [[21, 2]], [[57, 1], [0, 2]]],
 [[[67, 1], [68, 2]],
  [[0, 1]],
  [[31, 3], [0, 2]],
  [[68, 4]],
  [[69, 5]],
  [[70, 1]]],
 [[[71, 1]], [[57, 2], [0, 1]], [[71, 1], [0, 2]]],
 [[[21, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]],
 [[[11, 1]], [[73, 2], [74, 3]], [[70, 4]], [[73, 2]], [[0, 4]]],
 [[[18, 1]], [[0, 1]]],
 [[[13, 1]], [[21, 2]], [[57, 1], [0, 2]]],
 [[[7, 1], [75, 2]], [[38, 2]], [[0, 2]]],
 [[[76, 1]], [[77, 0], [0, 1]]],
 [[[78, 1]], [[79, 1], [80, 2], [0, 1]], [[49, 3]], [[0, 3]]],
 [[[81, 1]], [[82, 0], [83, 0], [0, 1]]],
 [[[25, 1], [6, 1], [37, 1], [84, 2]], [[49, 2]], [[0, 2]]],
 [[[26, 1]], [[58, 2], [0, 1]], [[0, 2]]],
 [[[73, 1]], [[70, 2]], [[61, 3], [0, 2]], [[70, 4]], [[0, 4]]],
 [[[64, 1], [85, 2], [80, 3]],
  [[70, 4]],
  [[57, 5], [0, 2]],
  [[70, 6]],
  [[57, 7], [0, 4]],
  [[64, 1], [85, 2], [80, 3], [0, 5]],
  [[0, 6]],
  [[85, 4], [80, 3]]],
 [[[70, 1]], [[86, 2], [61, 3], [0, 1]], [[0, 2]], [[70, 2]]],
 [[[20, 1]], [[70, 2]], [[57, 3], [0, 2]], [[70, 4]], [[0, 4]]],
 [[[87, 1],
   [88, 1],
   [89, 1],
   [90, 1],
   [91, 1],
   [92, 1],
   [93, 1],
   [94, 1],
   [95, 1],
   [96, 1],
   [97, 1],
   [98, 1]],
  [[0, 1]]],
 [[[33, 1]], [[0, 1]]],
 [[[10, 1]],
  [[21, 2]],
  [[73, 3], [29, 4]],
  [[99, 5]],
  [[43, 6], [58, 7]],
  [[0, 5]],
  [[73, 3]],
  [[43, 6]]],
 [[[100, 1],
   [101, 1],
   [7, 2],
   [102, 1],
   [100, 1],
   [103, 1],
   [104, 1],
   [105, 3],
   [106, 1],
   [107, 1]],
  [[0, 1]],
  [[103, 1]],
  [[7, 1], [0, 3]]],
 [[[108, 1],
   [109, 1],
   [110, 1],
   [111, 1],
   [112, 1],
   [113, 1],
   [114, 1],
   [115, 1]],
  [[0, 1]]],
 [[[34, 1]], [[0, 1]]],
 [[[116, 1]], [[114, 2], [111, 2]], [[0, 2]]],
 [[[35, 1]],
  [[117, 2]],
  [[29, 4], [2, 3]],
  [[0, 3]],
  [[43, 5], [118, 6]],
  [[2, 3]],
  [[43, 5]]],
 [[[119, 1]], [[119, 1], [0, 1]]],
 [[[22, 1]], [[120, 2]], [[0, 2]]],
 [[[70, 1]], [[73, 2]], [[70, 3]], [[57, 4], [0, 3]], [[70, 1], [0, 4]]],
 [[[117, 1]], [[72, 2], [0, 1]], [[21, 3]], [[0, 3]]],
 [[[121, 1]], [[57, 0], [0, 1]]],
 [[[21, 1]], [[122, 0], [0, 1]]],
 [[[21, 1]], [[0, 1]]],
 [[[58, 1]], [[2, 1], [123, 2]], [[0, 2]]],
 [[[124, 1]],
  [[70, 2], [0, 1]],
  [[72, 3], [57, 3], [0, 2]],
  [[70, 4]],
  [[0, 4]]],
 [[[16, 1]],
  [[55, 2]],
  [[103, 3], [0, 2]],
  [[70, 4]],
  [[57, 5], [0, 4]],
  [[70, 6]],
  [[0, 6]]],
 [[[2, 0], [123, 1], [125, 0]], [[0, 1]]],
 [[[126, 1], [127, 1], [128, 1], [129, 1], [130, 1]], [[0, 1]]],
 [[[28, 1]],
  [[120, 2]],
  [[103, 3]],
  [[58, 4]],
  [[73, 5]],
  [[99, 6]],
  [[69, 7], [0, 6]],
  [[73, 8]],
  [[99, 9]],
  [[0, 9]]],
 [[[29, 1], [21, 2]],
  [[131, 3]],
  [[73, 4], [0, 2]],
  [[43, 5]],
  [[70, 5]],
  [[0, 5]]],
 [[[132, 1]], [[57, 2], [0, 1]], [[132, 1], [0, 2]]],
 [[[4, 1]],
  [[21, 2]],
  [[133, 3]],
  [[134, 4], [73, 5]],
  [[70, 6]],
  [[99, 7]],
  [[73, 5]],
  [[0, 7]]],
 [[[28, 1]], [[120, 2]], [[103, 3]], [[68, 4]], [[135, 5], [0, 4]], [[0, 5]]],
 [[[31, 1]], [[136, 2]], [[135, 3], [0, 2]], [[0, 3]]],
 [[[86, 1], [137, 1]], [[0, 1]]],
 [[[31, 1]],
  [[70, 2]],
  [[73, 3]],
  [[99, 4]],
  [[69, 5], [138, 1], [0, 4]],
  [[73, 6]],
  [[99, 7]],
  [[0, 7]]],
 [[[30, 1]],
  [[139, 2]],
  [[24, 3]],
  [[140, 4], [29, 5], [64, 4]],
  [[0, 4]],
  [[140, 6]],
  [[43, 4]]],
 [[[24, 1]], [[141, 2]], [[0, 2]]],
 [[[142, 1], [143, 1]], [[0, 1]]],
 [[[28, 1]], [[120, 2]], [[103, 3]], [[144, 4]], [[145, 5], [0, 4]], [[0, 5]]],
 [[[31, 1]], [[136, 2]], [[145, 3], [0, 2]], [[0, 3]]],
 [[[146, 1], [147, 1]], [[0, 1]]],
 [[[70, 1]],
  [[146, 2], [57, 3], [0, 1]],
  [[0, 2]],
  [[70, 4], [0, 3]],
  [[57, 3], [0, 4]]],
 [[[11, 1]], [[73, 2], [74, 3]], [[136, 4]], [[73, 2]], [[0, 4]]],
 [[[148, 1], [68, 1]], [[0, 1]]],
 [[[29, 1]], [[43, 2], [74, 3]], [[0, 2]], [[43, 2]]],
 [[[23, 1]], [[0, 1]]],
 [[[12, 1]],
  [[70, 2], [82, 3], [0, 1]],
  [[57, 4], [0, 2]],
  [[70, 5]],
  [[70, 2], [0, 4]],
  [[57, 6], [0, 5]],
  [[70, 7]],
  [[57, 8], [0, 7]],
  [[70, 7], [0, 8]]],
 [[[5, 1]],
  [[70, 2], [0, 1]],
  [[57, 3], [0, 2]],
  [[70, 4]],
  [[57, 5], [0, 4]],
  [[70, 6]],
  [[0, 6]]],
 [[[19, 1]], [[58, 2], [0, 1]], [[0, 2]]],
 [[[149, 1]], [[2, 2], [150, 3]], [[0, 2]], [[149, 1], [2, 2]]],
 [[[73, 1]], [[70, 2], [0, 1]], [[0, 2]]],
 [[[151, 1],
   [152, 1],
   [153, 1],
   [154, 1],
   [155, 1],
   [156, 1],
   [157, 1],
   [158, 1],
   [159, 1],
   [160, 1]],
  [[0, 1]]],
 [[[1, 1], [3, 1]], [[0, 1]]],
 [[[73, 1], [70, 2], [122, 3]],
  [[161, 4], [70, 5], [0, 1]],
  [[73, 1], [0, 2]],
  [[122, 6]],
  [[0, 4]],
  [[161, 4], [0, 5]],
  [[122, 4]]],
 [[[162, 1]], [[57, 2], [0, 1]], [[162, 1], [0, 2]]],
 [[[1, 1], [2, 2]], [[0, 1]], [[163, 3]], [[125, 4]], [[164, 1], [125, 4]]],
 [[[70, 1]], [[57, 2], [0, 1]], [[70, 1], [0, 2]]],
 [[[70, 1]], [[57, 0], [0, 1]]],
 [[[70, 1]],
  [[86, 2], [57, 3], [0, 1]],
  [[0, 2]],
  [[70, 4], [0, 3]],
  [[57, 3], [0, 4]]],
 [[[136, 1]],
  [[57, 2], [0, 1]],
  [[136, 3]],
  [[57, 4], [0, 3]],
  [[136, 3], [0, 4]]],
 [[[29, 1], [122, 2], [32, 3]],
  [[43, 4], [118, 5]],
  [[21, 4]],
  [[165, 6]],
  [[0, 4]],
  [[43, 4]],
  [[47, 4]]],
 [[[15, 1]],
  [[73, 2]],
  [[99, 3]],
  [[166, 4], [167, 5]],
  [[73, 6]],
  [[73, 7]],
  [[99, 8]],
  [[99, 9]],
  [[166, 4], [69, 10], [167, 5], [0, 8]],
  [[0, 9]],
  [[73, 11]],
  [[99, 12]],
  [[167, 5], [0, 12]]],
 [[[64, 1], [132, 2], [80, 3]],
  [[21, 4]],
  [[61, 5], [57, 6], [0, 2]],
  [[21, 7]],
  [[57, 8], [0, 4]],
  [[70, 9]],
  [[64, 1], [132, 2], [80, 3], [0, 6]],
  [[0, 7]],
  [[80, 3]],
  [[57, 6], [0, 9]]],
 [[[17, 1]],
  [[70, 2]],
  [[73, 3]],
  [[99, 4]],
  [[69, 5], [0, 4]],
  [[73, 6]],
  [[99, 7]],
  [[0, 7]]],
 [[[36, 1]], [[70, 2]], [[73, 3], [168, 4]], [[99, 5]], [[73, 3]], [[0, 5]]],
 [[[72, 1]], [[55, 2]], [[0, 2]]],
 [[[45, 1]], [[0, 1]]]],
labels:
[[0, 'EMPTY'],
 [326, null],
 [4, null],
 [288, null],
 [1, 'def'],
 [1, 'raise'],
 [32, null],
 [1, 'not'],
 [2, null],
 [26, null],
 [1, 'class'],
 [1, 'lambda'],
 [1, 'print'],
 [1, 'nonlocal'],
 [25, null],
 [1, 'try'],
 [1, 'exec'],
 [1, 'while'],
 [3, null],
 [1, 'return'],
 [1, 'assert'],
 [1, null],
 [1, 'del'],
 [1, 'pass'],
 [1, 'import'],
 [15, null],
 [1, 'yield'],
 [1, 'global'],
 [1, 'for'],
 [7, null],
 [1, 'from'],
 [1, 'if'],
 [9, null],
 [1, 'break'],
 [1, 'continue'],
 [50, null],
 [1, 'with'],
 [14, null],
 [274, null],
 [1, 'and'],
 [266, null],
 [294, null],
 [27, null],
 [8, null],
 [335, null],
 [279, null],
 [318, null],
 [10, null],
 [334, null],
 [278, null],
 [19, null],
 [262, null],
 [18, null],
 [260, null],
 [33, null],
 [258, null],
 [287, null],
 [12, null],
 [333, null],
 [280, null],
 [284, null],
 [22, null],
 [277, null],
 [48, null],
 [16, null],
 [17, null],
 [24, null],
 [271, null],
 [275, null],
 [1, 'else'],
 [268, null],
 [270, null],
 [1, 'as'],
 [11, null],
 [339, null],
 [263, null],
 [257, null],
 [1, 'or'],
 [259, null],
 [337, null],
 [36, null],
 [261, null],
 [35, null],
 [34, null],
 [276, null],
 [282, null],
 [308, null],
 [46, null],
 [39, null],
 [41, null],
 [47, null],
 [42, null],
 [43, null],
 [37, null],
 [44, null],
 [49, null],
 [45, null],
 [38, null],
 [40, null],
 [332, null],
 [29, null],
 [21, null],
 [28, null],
 [1, 'in'],
 [30, null],
 [1, 'is'],
 [31, null],
 [20, null],
 [338, null],
 [311, null],
 [304, null],
 [286, null],
 [341, null],
 [340, null],
 [307, null],
 [290, null],
 [292, null],
 [297, null],
 [281, null],
 [291, null],
 [264, null],
 [295, null],
 [23, null],
 [0, null],
 [1, 'except'],
 [329, null],
 [285, null],
 [289, null],
 [324, null],
 [325, null],
 [343, null],
 [306, null],
 [305, null],
 [321, null],
 [55, null],
 [310, null],
 [320, null],
 [309, null],
 [1, 'elif'],
 [272, null],
 [269, null],
 [296, null],
 [313, null],
 [312, null],
 [336, null],
 [317, null],
 [315, null],
 [316, null],
 [319, null],
 [328, null],
 [13, null],
 [303, null],
 [267, null],
 [265, null],
 [322, null],
 [273, null],
 [323, null],
 [293, null],
 [301, null],
 [283, null],
 [314, null],
 [327, null],
 [330, null],
 [5, null],
 [6, null],
 [331, null],
 [300, null],
 [1, 'finally'],
 [342, null]],
keywords:
{'and': 39,
 'as': 72,
 'assert': 20,
 'break': 33,
 'class': 10,
 'continue': 34,
 'def': 4,
 'del': 22,
 'elif': 138,
 'else': 69,
 'except': 124,
 'exec': 16,
 'finally': 167,
 'for': 28,
 'from': 30,
 'global': 27,
 'if': 31,
 'import': 24,
 'in': 103,
 'is': 105,
 'lambda': 11,
 'nonlocal': 13,
 'not': 7,
 'or': 77,
 'pass': 23,
 'print': 12,
 'raise': 5,
 'return': 19,
 'try': 15,
 'while': 17,
 'with': 36,
 'yield': 26},
tokens:
{0: 123,
 1: 21,
 2: 8,
 3: 18,
 4: 2,
 5: 163,
 6: 164,
 7: 29,
 8: 43,
 9: 32,
 10: 47,
 11: 73,
 12: 57,
 13: 150,
 14: 37,
 15: 25,
 16: 64,
 17: 65,
 18: 52,
 19: 50,
 20: 107,
 21: 101,
 22: 61,
 23: 122,
 24: 66,
 25: 14,
 26: 9,
 27: 42,
 28: 102,
 29: 100,
 30: 104,
 31: 106,
 32: 6,
 33: 54,
 34: 83,
 35: 82,
 36: 80,
 37: 93,
 38: 97,
 39: 88,
 40: 98,
 41: 89,
 42: 91,
 43: 92,
 44: 94,
 45: 96,
 46: 87,
 47: 90,
 48: 63,
 49: 95,
 50: 35,
 55: 134},
start: 256
};

// Nothing more to see here.

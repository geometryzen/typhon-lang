/**
 * FIXME: These may not be synched?
 *
 * @enum {number}
 */
const Tokens = {
    T_ENDMARKER: 0,
    T_NAME: 1,
    T_NUMBER: 2,
    T_STRING: 3,
    T_NEWLINE: 4,
    T_INDENT: 5,
    T_DEDENT: 6,
    T_LPAR: 7,
    T_RPAR: 8,
    T_LSQB: 9,
    T_RSQB: 10,
    T_COLON: 11,
    T_COMMA: 12,
    T_SEMI: 13,
    T_PLUS: 14,
    T_MINUS: 15,
    T_STAR: 16,
    T_SLASH: 17,
    T_VBAR: 18,
    T_AMPER: 19,
    T_LESS: 20,
    T_GREATER: 21,
    T_EQUAL: 22,
    T_DOT: 23,
    T_PERCENT: 24,
    T_BACKQUOTE: 25,
    T_LBRACE: 26,
    T_RBRACE: 27,
    T_EQEQUAL: 28,
    T_NOTEQUAL: 29,
    T_LESSEQUAL: 30,
    T_GREATEREQUAL: 31,
    T_TILDE: 32,
    T_CIRCUMFLEX: 33,
    T_LEFTSHIFT: 34,
    T_RIGHTSHIFT: 35,
    T_DOUBLESTAR: 36,
    T_PLUSEQUAL: 37,
    T_MINEQUAL: 38,
    T_STAREQUAL: 39,
    T_SLASHEQUAL: 40,
    T_PERCENTEQUAL: 41,
    T_AMPEREQUAL: 42,
    T_VBAREQUAL: 43,
    T_CIRCUMFLEXEQUAL: 44,
    T_LEFTSHIFTEQUAL: 45,
    T_RIGHTSHIFTEQUAL: 46,
    T_DOUBLESTAREQUAL: 47,
    T_DOUBLESLASH: 48,
    T_DOUBLESLASHEQUAL: 49,
    T_AT: 50,
    T_OP: 51,
    T_COMMENT: 52,
    T_NL: 53,
    T_RARROW: 54,
    T_ERRORTOKEN: 55,
    T_N_TOKENS: 56,
    T_NT_OFFSET: 256
};

export default Tokens;

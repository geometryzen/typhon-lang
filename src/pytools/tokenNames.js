define(["require", "exports"], function (require, exports) {
    "use strict";
    var tokenNames = {
        0: 'T_ENDMARKER',
        1: 'T_NAME', 2: 'T_NUMBER', 3: 'T_STRING', 4: 'T_NEWLINE',
        5: 'T_INDENT', 6: 'T_DEDENT', 7: 'T_LPAR', 8: 'T_RPAR', 9: 'T_LSQB',
        10: 'T_RSQB', 11: 'T_COLON', 12: 'T_COMMA', 13: 'T_SEMI', 14: 'T_PLUS',
        15: 'T_MINUS', 16: 'T_STAR', 17: 'T_SLASH', 18: 'T_VBAR', 19: 'T_AMPER',
        20: 'T_LESS', 21: 'T_GREATER', 22: 'T_EQUAL', 23: 'T_DOT', 24: 'T_PERCENT',
        25: 'T_BACKQUOTE', 26: 'T_LBRACE', 27: 'T_RBRACE', 28: 'T_EQEQUAL', 29: 'T_NOTEQUAL',
        30: 'T_LESSEQUAL', 31: 'T_GREATEREQUAL', 32: 'T_TILDE', 33: 'T_CIRCUMFLEX', 34: 'T_LEFTSHIFT',
        35: 'T_RIGHTSHIFT', 36: 'T_DOUBLESTAR', 37: 'T_PLUSEQUAL', 38: 'T_MINEQUAL', 39: 'T_STAREQUAL',
        40: 'T_SLASHEQUAL', 41: 'T_PERCENTEQUAL', 42: 'T_AMPEREQUAL', 43: 'T_VBAREQUAL', 44: 'T_CIRCUMFLEXEQUAL',
        45: 'T_LEFTSHIFTEQUAL', 46: 'T_RIGHTSHIFTEQUAL', 47: 'T_DOUBLESTAREQUAL', 48: 'T_DOUBLESLASH', 49: 'T_DOUBLESLASHEQUAL',
        50: 'T_AT', 51: 'T_OP', 52: 'T_COMMENT', 53: 'T_NL', 54: 'T_RARROW',
        55: 'T_ERRORTOKEN', 56: 'T_N_TOKENS',
        256: 'T_NT_OFFSET'
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = tokenNames;
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenNames = void 0;
var Tokens_1 = require("./Tokens");
/**
 * Decodes of the tokens.
 * A mapping from the token number (symbol) to its human-readable name.
 */
exports.tokenNames = {};
exports.tokenNames[Tokens_1.Tokens.T_AMPER] = 'T_AMPER';
exports.tokenNames[Tokens_1.Tokens.T_AMPEREQUAL] = 'T_AMPEREQUAL';
exports.tokenNames[Tokens_1.Tokens.T_AT] = 'T_AT';
exports.tokenNames[Tokens_1.Tokens.T_BACKQUOTE] = 'T_BACKQUOTE';
exports.tokenNames[Tokens_1.Tokens.T_CIRCUMFLEX] = 'T_CIRCUMFLEX';
exports.tokenNames[Tokens_1.Tokens.T_CIRCUMFLEXEQUAL] = 'T_CIRCUMFLEXEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_COLON] = 'T_COLON';
exports.tokenNames[Tokens_1.Tokens.T_COMMA] = 'T_COMMA';
exports.tokenNames[Tokens_1.Tokens.T_COMMENT] = 'T_COMMENT';
exports.tokenNames[Tokens_1.Tokens.T_DEDENT] = 'T_DEDENT';
exports.tokenNames[Tokens_1.Tokens.T_DOT] = 'T_DOT';
exports.tokenNames[Tokens_1.Tokens.T_DOUBLESLASH] = 'T_DOUBLESLASH';
exports.tokenNames[Tokens_1.Tokens.T_DOUBLESLASHEQUAL] = 'T_DOUBLESLASHEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_DOUBLESTAR] = 'T_DOUBLESTAR';
exports.tokenNames[Tokens_1.Tokens.T_DOUBLESTAREQUAL] = 'T_DOUBLESTAREQUAL';
exports.tokenNames[Tokens_1.Tokens.T_ENDMARKER] = 'T_ENDMARKER';
exports.tokenNames[Tokens_1.Tokens.T_EQEQUAL] = 'T_EQEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_EQUAL] = 'T_EQUAL';
exports.tokenNames[Tokens_1.Tokens.T_ERRORTOKEN] = 'T_ERRORTOKEN';
exports.tokenNames[Tokens_1.Tokens.T_GREATER] = 'T_GREATER';
exports.tokenNames[Tokens_1.Tokens.T_GREATEREQUAL] = 'T_GREATEREQUAL';
exports.tokenNames[Tokens_1.Tokens.T_INDENT] = 'T_INDENT';
exports.tokenNames[Tokens_1.Tokens.T_LBRACE] = 'T_LBRACE';
exports.tokenNames[Tokens_1.Tokens.T_LEFTSHIFT] = 'T_LEFTSHIFT';
exports.tokenNames[Tokens_1.Tokens.T_LEFTSHIFTEQUAL] = 'T_LEFTSHIFTEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_LESS] = 'T_LESS';
exports.tokenNames[Tokens_1.Tokens.T_LESSEQUAL] = 'T_LESSEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_LPAR] = 'T_LPAR';
exports.tokenNames[Tokens_1.Tokens.T_LSQB] = 'T_LSQB';
exports.tokenNames[Tokens_1.Tokens.T_MINEQUAL] = 'T_MINEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_MINUS] = 'T_MINUS';
exports.tokenNames[Tokens_1.Tokens.T_N_TOKENS] = 'T_N_TOKENS';
exports.tokenNames[Tokens_1.Tokens.T_NAME] = 'T_NAME';
exports.tokenNames[Tokens_1.Tokens.T_NEWLINE] = 'T_NEWLINE';
exports.tokenNames[Tokens_1.Tokens.T_NL] = 'T_NL';
exports.tokenNames[Tokens_1.Tokens.T_NOTEQUAL] = 'T_NOTEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_NT_OFFSET] = 'T_NT_OFFSET';
exports.tokenNames[Tokens_1.Tokens.T_NUMBER] = 'T_NUMBER';
exports.tokenNames[Tokens_1.Tokens.T_OP] = 'T_OP';
exports.tokenNames[Tokens_1.Tokens.T_PERCENT] = 'T_PERCENT';
exports.tokenNames[Tokens_1.Tokens.T_PERCENTEQUAL] = 'T_PERCENTEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_PLUS] = 'T_PLUS';
exports.tokenNames[Tokens_1.Tokens.T_PLUSEQUAL] = 'T_PLUSEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_RARROW] = 'T_RARROW';
exports.tokenNames[Tokens_1.Tokens.T_RBRACE] = 'T_RBRACE';
exports.tokenNames[Tokens_1.Tokens.T_RIGHTSHIFT] = 'T_RIGHTSHIFT';
exports.tokenNames[Tokens_1.Tokens.T_RPAR] = 'T_RPAR';
exports.tokenNames[Tokens_1.Tokens.T_RSQB] = 'T_RSQB';
exports.tokenNames[Tokens_1.Tokens.T_SEMI] = 'T_SEMI';
exports.tokenNames[Tokens_1.Tokens.T_SLASH] = 'T_SLASH';
exports.tokenNames[Tokens_1.Tokens.T_SLASHEQUAL] = 'T_SLASHEQUAL';
exports.tokenNames[Tokens_1.Tokens.T_STAR] = 'T_STAR';
exports.tokenNames[Tokens_1.Tokens.T_STAREQUAL] = 'T_STAREQUAL';
exports.tokenNames[Tokens_1.Tokens.T_STRING] = 'T_STRING';
exports.tokenNames[Tokens_1.Tokens.T_TILDE] = 'T_TILDE';
exports.tokenNames[Tokens_1.Tokens.T_VBAR] = 'T_VBAR';
exports.tokenNames[Tokens_1.Tokens.T_VBAREQUAL] = 'T_VBAREQUAL';

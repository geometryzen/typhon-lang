import { Tokens } from './Tokens';

/**
 * Decodes of the tokens.
 * A mapping from the token number (symbol) to its human-readable name.
 */
export const tokenNames: { [code: number]: string } = {};

tokenNames[Tokens.T_AMPER] = 'T_AMPER';
tokenNames[Tokens.T_AMPEREQUAL] = 'T_AMPEREQUAL';
tokenNames[Tokens.T_AT] = 'T_AT';
tokenNames[Tokens.T_BACKQUOTE] = 'T_BACKQUOTE';
tokenNames[Tokens.T_CIRCUMFLEX] = 'T_CIRCUMFLEX';
tokenNames[Tokens.T_CIRCUMFLEXEQUAL] = 'T_CIRCUMFLEXEQUAL';
tokenNames[Tokens.T_COLON] = 'T_COLON';
tokenNames[Tokens.T_COMMA] = 'T_COMMA';
tokenNames[Tokens.T_COMMENT] = 'T_COMMENT';
tokenNames[Tokens.T_DEDENT] = 'T_DEDENT';
tokenNames[Tokens.T_DOT] = 'T_DOT';
tokenNames[Tokens.T_DOUBLESLASH] = 'T_DOUBLESLASH';
tokenNames[Tokens.T_DOUBLESLASHEQUAL] = 'T_DOUBLESLASHEQUAL';
tokenNames[Tokens.T_DOUBLESTAR] = 'T_DOUBLESTAR';
tokenNames[Tokens.T_DOUBLESTAREQUAL] = 'T_DOUBLESTAREQUAL';
tokenNames[Tokens.T_ENDMARKER] = 'T_ENDMARKER';
tokenNames[Tokens.T_EQEQUAL] = 'T_EQEQUAL';
tokenNames[Tokens.T_EQUAL] = 'T_EQUAL';
tokenNames[Tokens.T_ERRORTOKEN] = 'T_ERRORTOKEN';
tokenNames[Tokens.T_GREATER] = 'T_GREATER';
tokenNames[Tokens.T_GREATEREQUAL] = 'T_GREATEREQUAL';
tokenNames[Tokens.T_INDENT] = 'T_INDENT';
tokenNames[Tokens.T_LBRACE] = 'T_LBRACE';
tokenNames[Tokens.T_LEFTSHIFT] = 'T_LEFTSHIFT';
tokenNames[Tokens.T_LEFTSHIFTEQUAL] = 'T_LEFTSHIFTEQUAL';
tokenNames[Tokens.T_LESS] = 'T_LESS';
tokenNames[Tokens.T_LESSEQUAL] = 'T_LESSEQUAL';
tokenNames[Tokens.T_LPAR] = 'T_LPAR';
tokenNames[Tokens.T_LSQB] = 'T_LSQB';
tokenNames[Tokens.T_MINEQUAL] = 'T_MINEQUAL';
tokenNames[Tokens.T_MINUS] = 'T_MINUS';
tokenNames[Tokens.T_N_TOKENS] = 'T_N_TOKENS';
tokenNames[Tokens.T_NAME] = 'T_NAME';
tokenNames[Tokens.T_NEWLINE] = 'T_NEWLINE';
tokenNames[Tokens.T_NL] = 'T_NL';
tokenNames[Tokens.T_NOTEQUAL] = 'T_NOTEQUAL';
tokenNames[Tokens.T_NT_OFFSET] = 'T_NT_OFFSET';
tokenNames[Tokens.T_NUMBER] = 'T_NUMBER';
tokenNames[Tokens.T_OP] = 'T_OP';
tokenNames[Tokens.T_PERCENT] = 'T_PERCENT';
tokenNames[Tokens.T_PERCENTEQUAL] = 'T_PERCENTEQUAL';
tokenNames[Tokens.T_PLUS] = 'T_PLUS';
tokenNames[Tokens.T_PLUSEQUAL] = 'T_PLUSEQUAL';
tokenNames[Tokens.T_RARROW] = 'T_RARROW';
tokenNames[Tokens.T_RBRACE] = 'T_RBRACE';
tokenNames[Tokens.T_RIGHTSHIFT] = 'T_RIGHTSHIFT';
tokenNames[Tokens.T_RPAR] = 'T_RPAR';
tokenNames[Tokens.T_RSQB] = 'T_RSQB';
tokenNames[Tokens.T_SEMI] = 'T_SEMI';
tokenNames[Tokens.T_SLASH] = 'T_SLASH';
tokenNames[Tokens.T_SLASHEQUAL] = 'T_SLASHEQUAL';
tokenNames[Tokens.T_STAR] = 'T_STAR';
tokenNames[Tokens.T_STAREQUAL] = 'T_STAREQUAL';
tokenNames[Tokens.T_STRING] = 'T_STRING';
tokenNames[Tokens.T_TILDE] = 'T_TILDE';
tokenNames[Tokens.T_VBAR] = 'T_VBAR';
tokenNames[Tokens.T_VBAREQUAL] = 'T_VBAREQUAL';

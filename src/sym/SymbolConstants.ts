/* Flags for def-use information */

export const DEF_GLOBAL = 1 << 0;      /* global stmt */
export const DEF_LOCAL = 2 << 0;       /* assignment in code block */
export const DEF_PARAM = 2 << 1;       /* formal parameter */
export const USE = 2 << 2;             /* name is used */
export const DEF_STAR = 2 << 3;        /* parameter is star arg */
export const DEF_DOUBLESTAR = 2 << 4;  /* parameter is star-star arg */
export const DEF_INTUPLE = 2 << 5;     /* name defined in tuple in parameters */
export const DEF_FREE = 2 << 6;        /* name used but not defined in nested block */
export const DEF_FREE_GLOBAL = 2 << 7; /* free variable is actually implicit global */
export const DEF_FREE_CLASS = 2 << 8;  /* free variable from class's method */
export const DEF_IMPORT = 2 << 9;      /* assignment occurred via import */

export const DEF_BOUND = (DEF_LOCAL | DEF_PARAM | DEF_IMPORT);

// TODO: Each flag should be redefined as part of an enum and the SymbolFlags will be a Set.
export type SymbolFlags = number;

/* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
   table.  GLOBAL is returned from PyST_GetScope() for either of them.
   It is stored in ste_symbols at bits 12-14.
*/
export const SCOPE_OFF = 11;
export const SCOPE_MASK = 7;

export type DictionaryKind = 1 | 2 | 3 | 4;
export const LOCAL = 1;
export const GLOBAL_EXPLICIT = 2;
export const GLOBAL_IMPLICIT = 3;
export const FREE = 4;
export const CELL = 5;

/* The following three names are used for the ste_unoptimized bit field */
export const OPT_IMPORT_STAR = 1;
export const OPT_EXEC = 2;
export const OPT_BARE_EXEC = 4;
export const OPT_TOPLEVEL = 8;  /* top-level names, including eval and exec */

export const GENERATOR = 2;
export const GENERATOR_EXPRESSION = 2;

export const ModuleBlock = 'module';
export const FunctionBlock = 'function';
export const ClassBlock = 'class';

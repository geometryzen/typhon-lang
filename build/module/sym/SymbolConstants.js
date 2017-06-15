/* Flags for def-use information */
export var DEF_GLOBAL = 1 << 0; /* global stmt */
export var DEF_LOCAL = 2 << 0; /* assignment in code block */
export var DEF_PARAM = 2 << 1; /* formal parameter */
export var USE = 2 << 2; /* name is used */
export var DEF_STAR = 2 << 3; /* parameter is star arg */
export var DEF_DOUBLESTAR = 2 << 4; /* parameter is star-star arg */
export var DEF_INTUPLE = 2 << 5; /* name defined in tuple in parameters */
export var DEF_FREE = 2 << 6; /* name used but not defined in nested block */
export var DEF_FREE_GLOBAL = 2 << 7; /* free variable is actually implicit global */
export var DEF_FREE_CLASS = 2 << 8; /* free variable from class's method */
export var DEF_IMPORT = 2 << 9; /* assignment occurred via import */
export var DEF_BOUND = (DEF_LOCAL | DEF_PARAM | DEF_IMPORT);
/* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
   table.  GLOBAL is returned from PyST_GetScope() for either of them.
   It is stored in ste_symbols at bits 12-14.
*/
export var SCOPE_OFF = 11;
export var SCOPE_MASK = 7;
export var LOCAL = 1;
export var GLOBAL_EXPLICIT = 2;
export var GLOBAL_IMPLICIT = 3;
export var FREE = 4;
export var CELL = 5;
/* The following three names are used for the ste_unoptimized bit field */
export var OPT_IMPORT_STAR = 1;
export var OPT_EXEC = 2;
export var OPT_BARE_EXEC = 4;
export var OPT_TOPLEVEL = 8; /* top-level names, including eval and exec */
export var GENERATOR = 2;
export var GENERATOR_EXPRESSION = 2;
export var ModuleBlock = 'module';
export var FunctionBlock = 'function';
export var ClassBlock = 'class';

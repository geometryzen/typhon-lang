/* Flags for def-use information */
define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.DEF_GLOBAL = 1; /* global stmt */
    exports.DEF_LOCAL = 2; /* assignment in code block */
    exports.DEF_PARAM = 2 << 1; /* formal parameter */
    exports.USE = 2 << 2; /* name is used */
    exports.DEF_STAR = 2 << 3; /* parameter is star arg */
    exports.DEF_DOUBLESTAR = 2 << 4; /* parameter is star-star arg */
    exports.DEF_INTUPLE = 2 << 5; /* name defined in tuple in parameters */
    exports.DEF_FREE = 2 << 6; /* name used but not defined in nested block */
    exports.DEF_FREE_GLOBAL = 2 << 7; /* free variable is actually implicit global */
    exports.DEF_FREE_CLASS = 2 << 8; /* free variable from class's method */
    exports.DEF_IMPORT = 2 << 9; /* assignment occurred via import */
    exports.DEF_BOUND = (exports.DEF_LOCAL | exports.DEF_PARAM | exports.DEF_IMPORT);
    /* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
       table.  GLOBAL is returned from PyST_GetScope() for either of them.
       It is stored in ste_symbols at bits 12-14.
    */
    exports.SCOPE_OFF = 11;
    exports.SCOPE_MASK = 7;
    exports.LOCAL = 1;
    exports.GLOBAL_EXPLICIT = 2;
    exports.GLOBAL_IMPLICIT = 3;
    exports.FREE = 4;
    exports.CELL = 5;
    /* The following three names are used for the ste_unoptimized bit field */
    exports.OPT_IMPORT_STAR = 1;
    exports.OPT_EXEC = 2;
    exports.OPT_BARE_EXEC = 4;
    exports.OPT_TOPLEVEL = 8; /* top-level names, including eval and exec */
    exports.GENERATOR = 2;
    exports.GENERATOR_EXPRESSION = 2;
    exports.ModuleBlock = 'module';
    exports.FunctionBlock = 'function';
    exports.ClassBlock = 'class';
});

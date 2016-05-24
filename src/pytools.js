define(["require", "exports", './pytools/parser', './pytools/builder', './py-to-sk/sk-compiler', './py-to-es/transpiler', './mstools/mathscript', './mstools/mathscript', './mstools/mathscript'], function (require, exports, parser_1, builder_1, sk_compiler_1, transpiler_1, mathscript_1, mathscript_2, mathscript_3) {
    "use strict";
    var pytools = {
        parser: { parse: parser_1.parse, parseTreeDump: parser_1.parseTreeDump },
        builder: { astFromParse: builder_1.astFromParse, astDump: builder_1.astDump },
        skCompiler: { compile: sk_compiler_1.compile, resetCompiler: sk_compiler_1.resetCompiler },
        tsCompiler: { compile: transpiler_1.compile, resetCompiler: transpiler_1.resetCompiler },
        MathScript: {
            parse: mathscript_1.parse,
            transpile: mathscript_1.transpile,
            add: mathscript_2.add,
            sub: mathscript_2.sub,
            mul: mathscript_2.mul,
            div: mathscript_2.div,
            eq: mathscript_3.eq,
            ne: mathscript_3.ne,
            neg: mathscript_3.neg,
            pos: mathscript_3.pos,
            tilde: mathscript_3.tilde
        }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = pytools;
});

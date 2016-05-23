define(["require", "exports", './pytools/parser', './pytools/builder', './pytools/sk-compiler', './pytools/ts-compiler'], function (require, exports, parser_1, builder_1, sk_compiler_1, ts_compiler_1) {
    "use strict";
    var pytools = {
        parser: { parse: parser_1.parse, parseTreeDump: parser_1.parseTreeDump },
        builder: { astFromParse: builder_1.astFromParse, astDump: builder_1.astDump },
        skCompiler: { compile: sk_compiler_1.compile, resetCompiler: sk_compiler_1.resetCompiler },
        tsCompiler: { compile: ts_compiler_1.compile, resetCompiler: ts_compiler_1.resetCompiler }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = pytools;
});

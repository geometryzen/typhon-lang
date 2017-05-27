/// <reference path="../../../node_modules/typescript/lib/typescriptServices.d.ts" />
/**
 * TODO: Rename compileModule
 */
export declare function compile(source: string, fileName: string): {
    code: string;
};
export declare function compileExpression(source: string, fileName: string): {
    code: string;
};
export declare function compileSingle(source: string, fileName: string): {
    code: string;
};
export declare function resetCompiler(): void;
/**
 *
 * @param sourceText
 * @param sourceKind
 */
export declare function transpileModule(sourceText: string): ts.ModuleBlock;
export declare function transpileExpression(sourceText: string): ts.Expression;
export declare function transpileSingle(sourceText: string): ts.Statement[];

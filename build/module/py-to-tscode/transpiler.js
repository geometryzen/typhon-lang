import { assert } from '../pytools/asserts';
import { Lt } from '../pytools/types';
import { Module } from '../pytools/types';
import { Name } from '../pytools/types';
import { parse, SourceKind } from '../pytools/parser';
import { astFromParse } from '../pytools/builder';
import { symbolTable } from '../pytools/symtable';
import { toStringLiteralJS } from '../pytools/toStringLiteralJS';
import { DEF_LOCAL } from '../pytools/SymbolConstants';
/**
 * A smart buffer for writing TypeScript code.
 */
var TypeWriter = (function () {
    function TypeWriter() {
        this.buffer = [];
        // Do nothing.
    }
    TypeWriter.prototype.push = function (text) {
        switch (text) {
            case ';': {
                throw new Error("Please call endStatement rather than push('" + text + "')");
            }
            case ',': {
                throw new Error("Please call comma rather than push('" + text + "')");
            }
            case '(': {
                throw new Error("Please call openParen rather than push('" + text + "')");
            }
            case ')': {
                throw new Error("Please call closeParen rather than push('" + text + "')");
            }
            case '{': {
                throw new Error("Please call beginBlock rather than push('" + text + "')");
            }
            case '}': {
                throw new Error("Please call endBlock rather than push('" + text + "')");
            }
        }
        this.buffer.push(text);
    };
    TypeWriter.prototype.snapshot = function () {
        return this.buffer.join("");
    };
    TypeWriter.prototype.comma = function () {
        this.buffer.push(',');
    };
    TypeWriter.prototype.beginBlock = function () {
        this.buffer.push('{');
    };
    TypeWriter.prototype.endBlock = function () {
        this.buffer.push('}');
    };
    TypeWriter.prototype.openParen = function () {
        this.buffer.push('(');
    };
    TypeWriter.prototype.closeParen = function () {
        this.buffer.push(')');
    };
    TypeWriter.prototype.beginStatement = function () {
        // Do nothing yet.
    };
    TypeWriter.prototype.endStatement = function () {
        this.buffer.push(';');
    };
    return TypeWriter;
}());
/**
 * Provides enhanced scope information beyond the SymbolTableScope.
 */
var PrinterUnit = (function () {
    /**
     * Stuff that changes on entry/exit of code blocks. must be saved and restored
     * when returning to a block.
     * Corresponds to the body of a module, class, or function.
     */
    function PrinterUnit(name, ste) {
        assert(typeof name === 'string');
        assert(typeof ste === 'object');
        this.name = name;
        this.ste = ste;
        this.private_ = null;
        this.firstlineno = 0;
        this.lineno = 0;
        this.linenoSet = false;
        this.localnames = [];
        this.blocknum = 0;
        this.blocks = [];
        this.curblock = 0;
        this.scopename = null;
        this.prefixCode = '';
        this.varDeclsCode = '';
        this.switchCode = '';
        this.suffixCode = '';
        // stack of where to go on a break
        this.breakBlocks = [];
        // stack of where to go on a continue
        this.continueBlocks = [];
        this.exceptBlocks = [];
        this.finallyBlocks = [];
    }
    PrinterUnit.prototype.activateScope = function () {
        // Do nothing yet.
    };
    PrinterUnit.prototype.deactivateScope = function () {
        // Do nothing yet.
    };
    return PrinterUnit;
}());
var Printer = (function () {
    /**
     *
     * @param st The symbol table obtained from semantic analysis.
     * @param flags Not being used yet. May become options.
     * @param sourceText The original source code, provided for annotating the generated code and source mapping.
     */
    function Printer(st, flags, sourceText) {
        /**
         * Used to provide a unique number for generated symbol names.
         */
        this.gensymCount = 0;
        // this.fileName = fileName;
        this.st = st;
        this.flags = flags;
        this.interactive = false;
        this.nestlevel = 0;
        this.u = null;
        this.stack = [];
        this.result = [];
        // this.gensymcount = 0;
        this.allUnits = [];
        this.source = sourceText ? sourceText.split("\n") : false;
        this.writer = new TypeWriter();
    }
    /**
     * This is the entry point for this visitor.
     */
    Printer.prototype.transpileModule = function (module) {
        this.enterScope("<module>", module, 0);
        this.module(module);
        this.exitScope();
        return this.writer.snapshot();
    };
    /**
     * Looks up the SymbolTableScope.
     * Pushes a new PrinterUnit onto the stack.
     * Returns a string identifying the scope.
     * @param name The name that will be assigned to the PrinterUnit.
     * @param key A scope object in the AST from sematic analysis. Provides the mapping to the SymbolTableScope.
     * @param lineno Assigned to the first line numberof the PrinterUnit.
     */
    Printer.prototype.enterScope = function (name, key, lineno) {
        var u = new PrinterUnit(name, this.st.getStsForAst(key));
        u.firstlineno = lineno;
        if (this.u && this.u.private_) {
            u.private_ = this.u.private_;
        }
        this.stack.push(this.u);
        this.allUnits.push(u);
        var scopeName = this.gensym('scope');
        u.scopename = scopeName;
        this.u = u;
        this.u.activateScope();
        this.nestlevel++;
        return scopeName;
    };
    Printer.prototype.exitScope = function () {
        if (this.u) {
            this.u.deactivateScope();
        }
        this.nestlevel--;
        if (this.stack.length - 1 >= 0) {
            this.u = this.stack.pop();
        }
        else {
            this.u = null;
        }
        if (this.u) {
            this.u.activateScope();
        }
    };
    /**
     * Generates a unique symbol name for the provided namespace.
     */
    Printer.prototype.gensym = function (namespace) {
        var symbolName = namespace || '';
        symbolName = '$' + symbolName;
        symbolName += this.gensymCount++;
        return symbolName;
    };
    // Everything below here is an implementation of the Visitor
    Printer.prototype.assign = function (assign) {
        this.writer.beginStatement();
        // TODO: Declaration.
        // TODO: How to deal with multiple target?
        for (var _i = 0, _a = assign.targets; _i < _a.length; _i++) {
            var target = _a[_i];
            if (target instanceof Name) {
                var flags = this.u.ste.symFlags[target.id];
                // console.log(`${target.id} => ${flags.toString(2)}`);
                if (flags && DEF_LOCAL) {
                    this.writer.push("const ");
                }
            }
            target.accept(this);
        }
        this.writer.push("=");
        assign.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.callExpression = function (ce) {
        ce.func.accept(this);
        this.writer.openParen();
        for (var i = 0; i < ce.args.length; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            var arg = ce.args[i];
            arg.accept(this);
        }
        for (var i = 0; i < ce.keywords.length; ++i)
            ce.keywords[i].value.accept(this);
        // print(JSON.stringify(e.starargs, null, 2));
        // print(JSON.stringify(e.kwargs, null,2));
        if (ce.starargs) {
            ce.starargs.accept(this);
        }
        if (ce.kwargs) {
            ce.kwargs.accept(this);
        }
        this.writer.closeParen();
    };
    Printer.prototype.compareExpression = function (ce) {
        ce.left.accept(this);
        for (var _i = 0, _a = ce.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op) {
                case Lt: {
                    this.writer.push("<");
                    break;
                }
                default: {
                    throw new Error("Unexpected comparison expression operator: " + op);
                }
            }
        }
        for (var _b = 0, _c = ce.comparators; _b < _c.length; _b++) {
            var comparator = _c[_b];
            comparator.accept(this);
        }
    };
    Printer.prototype.expressionStatement = function (s) {
        s.value.accept(this);
    };
    Printer.prototype.ifStatement = function (i) {
        this.writer.push("if");
        this.writer.openParen();
        i.test.accept(this);
        this.writer.closeParen();
        this.writer.beginBlock();
        for (var _i = 0, _a = i.consequent; _i < _a.length; _i++) {
            var con = _a[_i];
            con.accept(this);
        }
        this.writer.endBlock();
    };
    Printer.prototype.module = function (m) {
        for (var _i = 0, _a = m.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            stmt.accept(this);
        }
    };
    Printer.prototype.name = function (name) {
        // TODO: Since 'True' and 'False' are reserved words in Python,
        // syntactic analysis (parsing) should be sufficient to identify
        // this name as a boolean expression - avoiding this overhead.
        switch (name.id) {
            case 'True': {
                this.writer.push('true');
                break;
            }
            case 'False': {
                this.writer.push('false');
                break;
            }
            default: {
                this.writer.push(name.id);
            }
        }
    };
    Printer.prototype.num = function (num) {
        var n = num.n;
        this.writer.push(n.toString());
    };
    Printer.prototype.print = function (print) {
        this.writer.push("console.log");
        this.writer.openParen();
        for (var _i = 0, _a = print.values; _i < _a.length; _i++) {
            var value = _a[_i];
            value.accept(this);
        }
        this.writer.closeParen();
    };
    Printer.prototype.str = function (str) {
        var s = str.s;
        // TODO: AST is not preserving the original quoting, or maybe a hint.
        this.writer.push(toStringLiteralJS(s));
    };
    return Printer;
}());
export function transpileModule(sourceText, fileName) {
    var cst = parse(sourceText, SourceKind.File);
    if (typeof cst === 'object') {
        var stmts = astFromParse(cst);
        var mod = new Module(stmts);
        var st = symbolTable(mod);
        var printer = new Printer(st, 0, sourceText);
        return { code: printer.transpileModule(mod) };
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var asserts_1 = require("../pytools/asserts");
var types_1 = require("../pytools/types");
var types_2 = require("../pytools/types");
var types_3 = require("../pytools/types");
var types_4 = require("../pytools/types");
var parser_1 = require("../pytools/parser");
var builder_1 = require("../pytools/builder");
var symtable_1 = require("../pytools/symtable");
var toStringLiteralJS_1 = require("../pytools/toStringLiteralJS");
var SymbolConstants_1 = require("../pytools/SymbolConstants");
var utils_1 = require("./utils");
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
    TypeWriter.prototype.beginObject = function () {
        this.buffer.push("{");
    };
    TypeWriter.prototype.endObject = function () {
        this.buffer.push("}");
    };
    TypeWriter.prototype.openParen = function () {
        this.buffer.push('(');
    };
    TypeWriter.prototype.closeParen = function () {
        this.buffer.push(')');
    };
    TypeWriter.prototype.beginQuote = function () {
        this.buffer.push("'");
    };
    TypeWriter.prototype.endQuote = function () {
        this.buffer.push("'");
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
        /**
         * Used to determine whether a local variable has been declared.
         */
        this.declared = {};
        asserts_1.assert(typeof name === 'string');
        asserts_1.assert(typeof ste === 'object');
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
            if (target instanceof types_4.Name) {
                var flags = this.u.ste.symFlags[target.id];
                // console.log(`${target.id} => ${flags.toString(2)}`);
                if (flags && SymbolConstants_1.DEF_LOCAL) {
                    if (this.u.declared[target.id]) {
                        // The variable has already been declared.
                    }
                    else {
                        // We use let for now because we would need to look ahead for more assignments.
                        // The smenatic analysis could count the number of assignments in the current scope?
                        this.writer.push("let ");
                        this.u.declared[target.id] = true;
                    }
                }
            }
            target.accept(this);
        }
        this.writer.push("=");
        assign.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.attribute = function (attribute) {
        attribute.value.accept(this);
        this.writer.push(".");
        this.writer.push(attribute.attr);
    };
    Printer.prototype.binOp = function (be) {
        be.left.accept(this);
        switch (be.op) {
            case types_1.Add: {
                this.writer.push("+");
                break;
            }
            case types_1.Sub: {
                this.writer.push("-");
                break;
            }
            case types_1.Mult: {
                this.writer.push("*");
                break;
            }
            case types_1.Div: {
                this.writer.push("/");
                break;
            }
            case types_1.BitOr: {
                this.writer.push("|");
                break;
            }
            case types_1.BitXor: {
                this.writer.push("^");
                break;
            }
            case types_1.BitAnd: {
                this.writer.push("&");
                break;
            }
            case types_1.LShift: {
                this.writer.push("<<");
                break;
            }
            case types_1.RShift: {
                this.writer.push(">>");
                break;
            }
            case types_1.Mod: {
                this.writer.push("%");
                break;
            }
            case types_1.FloorDiv: {
                // TODO: What is the best way to handle FloorDiv.
                // This doesn't actually exist in TypeScript.
                this.writer.push("//");
                break;
            }
            default: {
                throw new Error("Unexpected binary operator " + be.op + ": " + typeof be.op);
            }
        }
        be.right.accept(this);
    };
    Printer.prototype.callExpression = function (ce) {
        if (ce.func instanceof types_4.Name) {
            if (utils_1.isClassNameByConvention(ce.func)) {
                this.writer.push("new ");
            }
        }
        else {
            throw new Error("Call.func must be a Name");
        }
        ce.func.accept(this);
        this.writer.openParen();
        for (var i = 0; i < ce.args.length; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            var arg = ce.args[i];
            arg.accept(this);
        }
        for (var i = 0; i < ce.keywords.length; ++i) {
            ce.keywords[i].value.accept(this);
        }
        if (ce.starargs) {
            ce.starargs.accept(this);
        }
        if (ce.kwargs) {
            ce.kwargs.accept(this);
        }
        this.writer.closeParen();
    };
    Printer.prototype.classDef = function (cd) {
        this.writer.push("class ");
        this.writer.push(cd.name);
        // this.writer.openParen();
        // this.writer.closeParen();
        this.writer.beginBlock();
        /*
        this.writer.push("constructor");
        this.writer.openParen();
        this.writer.closeParen();
        this.writer.beginBlock();
        this.writer.endBlock();
        */
        for (var _i = 0, _a = cd.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            stmt.accept(this);
        }
        this.writer.endBlock();
    };
    Printer.prototype.compareExpression = function (ce) {
        ce.left.accept(this);
        for (var _i = 0, _a = ce.ops; _i < _a.length; _i++) {
            var op = _a[_i];
            switch (op) {
                case types_2.Eq: {
                    this.writer.push("===");
                    break;
                }
                case types_2.NotEq: {
                    this.writer.push("!==");
                    break;
                }
                case types_2.Lt: {
                    this.writer.push("<");
                    break;
                }
                case types_2.LtE: {
                    this.writer.push("<=");
                    break;
                }
                case types_2.Gt: {
                    this.writer.push(">");
                    break;
                }
                case types_2.GtE: {
                    this.writer.push(">=");
                    break;
                }
                case types_2.Is: {
                    this.writer.push("===");
                    break;
                }
                case types_2.IsNot: {
                    this.writer.push("!==");
                    break;
                }
                case types_2.In: {
                    this.writer.push(" in ");
                    break;
                }
                case types_2.NotIn: {
                    this.writer.push(" not in ");
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
    Printer.prototype.dict = function (dict) {
        var keys = dict.keys;
        var values = dict.values;
        var N = keys.length;
        this.writer.beginObject();
        for (var i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            keys[i].accept(this);
            this.writer.push(":");
            values[i].accept(this);
        }
        this.writer.endObject();
    };
    Printer.prototype.expressionStatement = function (s) {
        s.value.accept(this);
    };
    Printer.prototype.functionDef = function (functionDef) {
        var isClassMethod = utils_1.isMethod(functionDef);
        if (!isClassMethod) {
            this.writer.push("function ");
        }
        this.writer.push(functionDef.name);
        this.writer.openParen();
        for (var i = 0; i < functionDef.args.args.length; i++) {
            var arg = functionDef.args.args[i];
            if (i === 0) {
                if (arg.id === 'self') {
                    // Ignore.
                }
                else {
                    arg.accept(this);
                }
            }
            else {
                arg.accept(this);
            }
        }
        this.writer.closeParen();
        this.writer.beginBlock();
        for (var _i = 0, _a = functionDef.body; _i < _a.length; _i++) {
            var stmt = _a[_i];
            stmt.accept(this);
        }
        this.writer.endBlock();
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
    Printer.prototype.importFrom = function (importFrom) {
        this.writer.beginStatement();
        this.writer.push("import ");
        this.writer.beginBlock();
        for (var i = 0; i < importFrom.names.length; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            var alias = importFrom.names[i];
            this.writer.push(alias.name);
            if (alias.asname) {
                this.writer.push(" as ");
                this.writer.push(alias.asname);
            }
        }
        this.writer.endBlock();
        this.writer.push(" from ");
        this.writer.beginQuote();
        // TODO: Escaping?
        this.writer.push(importFrom.module);
        this.writer.endQuote();
        this.writer.endStatement();
    };
    Printer.prototype.list = function (list) {
        var elements = list.elts;
        var N = elements.length;
        this.writer.push('[');
        for (var i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            elements[i].accept(this);
        }
        this.writer.push(']');
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
    Printer.prototype.returnStatement = function (rs) {
        this.writer.beginStatement();
        this.writer.push("return ");
        rs.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.str = function (str) {
        var s = str.s;
        // TODO: AST is not preserving the original quoting, or maybe a hint.
        this.writer.push(toStringLiteralJS_1.toStringLiteralJS(s));
    };
    return Printer;
}());
function transpileModule(sourceText, fileName) {
    var cst = parser_1.parse(sourceText, parser_1.SourceKind.File);
    if (typeof cst === 'object') {
        var stmts = builder_1.astFromParse(cst);
        var mod = new types_3.Module(stmts);
        var symbolTable = symtable_1.semanticsOfModule(mod);
        var printer = new Printer(symbolTable, 0, sourceText);
        return { code: printer.transpileModule(mod), symbolTable: symbolTable };
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}
exports.transpileModule = transpileModule;

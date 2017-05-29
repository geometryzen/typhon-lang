import { assert } from '../pytools/asserts';
import { Attribute } from '../pytools/types';
import { Add, Sub, Mult, Div, BitOr, BitXor, BitAnd, LShift, RShift, FloorDiv, Mod } from '../pytools/types';
import { Eq, NotEq, Gt, GtE, Lt, LtE, In, NotIn, Is, IsNot } from '../pytools/types';
import { Module } from '../pytools/types';
import { Name } from '../pytools/types';
import { parse, SourceKind } from '../pytools/parser';
import { astFromParse } from '../pytools/builder';
import { semanticsOfModule } from '../pytools/symtable';
import { toStringLiteralJS } from '../pytools/toStringLiteralJS';
import { DEF_LOCAL } from '../pytools/SymbolConstants';
import { isClassNameByConvention, isMethod } from './utils';
import { TypeWriter } from './TypeWriter';
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
                    if (this.u.declared[target.id]) {
                        // The variable has already been declared.
                    }
                    else {
                        // We use let for now because we would need to look ahead for more assignments.
                        // The smenatic analysis could count the number of assignments in the current scope?
                        this.writer.write("let ");
                        this.u.declared[target.id] = true;
                    }
                }
            }
            target.accept(this);
        }
        this.writer.write("=");
        assign.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.attribute = function (attribute) {
        attribute.value.accept(this);
        this.writer.write(".");
        this.writer.write(attribute.attr);
    };
    Printer.prototype.binOp = function (be) {
        be.left.accept(this);
        switch (be.op) {
            case Add: {
                this.writer.binOp("+");
                break;
            }
            case Sub: {
                this.writer.binOp("-");
                break;
            }
            case Mult: {
                this.writer.binOp("*");
                break;
            }
            case Div: {
                this.writer.binOp("/");
                break;
            }
            case BitOr: {
                this.writer.binOp("|");
                break;
            }
            case BitXor: {
                this.writer.binOp("^");
                break;
            }
            case BitAnd: {
                this.writer.binOp("&");
                break;
            }
            case LShift: {
                this.writer.binOp("<<");
                break;
            }
            case RShift: {
                this.writer.binOp(">>");
                break;
            }
            case Mod: {
                this.writer.binOp("%");
                break;
            }
            case FloorDiv: {
                // TODO: What is the best way to handle FloorDiv.
                // This doesn't actually exist in TypeScript.
                this.writer.binOp("//");
                break;
            }
            default: {
                throw new Error("Unexpected binary operator " + be.op + ": " + typeof be.op);
            }
        }
        be.right.accept(this);
    };
    Printer.prototype.callExpression = function (ce) {
        if (ce.func instanceof Name) {
            if (isClassNameByConvention(ce.func)) {
                this.writer.write("new ");
            }
        }
        else if (ce.func instanceof Attribute) {
            if (isClassNameByConvention(ce.func)) {
                this.writer.write("new ");
            }
        }
        else {
            throw new Error("Call.func must be a Name " + ce.func);
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
        this.writer.write("class ");
        this.writer.write(cd.name);
        // this.writer.openParen();
        // this.writer.closeParen();
        this.writer.beginBlock();
        /*
        this.writer.write("constructor");
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
                case Eq: {
                    this.writer.write("===");
                    break;
                }
                case NotEq: {
                    this.writer.write("!==");
                    break;
                }
                case Lt: {
                    this.writer.write("<");
                    break;
                }
                case LtE: {
                    this.writer.write("<=");
                    break;
                }
                case Gt: {
                    this.writer.write(">");
                    break;
                }
                case GtE: {
                    this.writer.write(">=");
                    break;
                }
                case Is: {
                    this.writer.write("===");
                    break;
                }
                case IsNot: {
                    this.writer.write("!==");
                    break;
                }
                case In: {
                    this.writer.write(" in ");
                    break;
                }
                case NotIn: {
                    this.writer.write(" not in ");
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
            this.writer.write(":");
            values[i].accept(this);
        }
        this.writer.endObject();
    };
    Printer.prototype.expressionStatement = function (s) {
        s.value.accept(this);
    };
    Printer.prototype.functionDef = function (functionDef) {
        var isClassMethod = isMethod(functionDef);
        if (!isClassMethod) {
            this.writer.write("function ");
        }
        this.writer.write(functionDef.name);
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
        this.writer.write("if");
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
        this.writer.write("import ");
        this.writer.beginBlock();
        for (var i = 0; i < importFrom.names.length; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            var alias = importFrom.names[i];
            this.writer.write(alias.name);
            if (alias.asname) {
                this.writer.write(" as ");
                this.writer.write(alias.asname);
            }
        }
        this.writer.endBlock();
        this.writer.write(" from ");
        this.writer.beginQuote();
        // TODO: Escaping?
        this.writer.write(importFrom.module);
        this.writer.endQuote();
        this.writer.endStatement();
    };
    Printer.prototype.list = function (list) {
        var elements = list.elts;
        var N = elements.length;
        this.writer.write('[');
        for (var i = 0; i < N; i++) {
            if (i > 0) {
                this.writer.comma();
            }
            elements[i].accept(this);
        }
        this.writer.write(']');
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
                this.writer.write('true');
                break;
            }
            case 'False': {
                this.writer.write('false');
                break;
            }
            default: {
                this.writer.write(name.id);
            }
        }
    };
    Printer.prototype.num = function (num) {
        var n = num.n;
        this.writer.write(n.toString());
    };
    Printer.prototype.print = function (print) {
        this.writer.write("console.log");
        this.writer.openParen();
        for (var _i = 0, _a = print.values; _i < _a.length; _i++) {
            var value = _a[_i];
            value.accept(this);
        }
        this.writer.closeParen();
    };
    Printer.prototype.returnStatement = function (rs) {
        this.writer.beginStatement();
        this.writer.write("return ");
        rs.value.accept(this);
        this.writer.endStatement();
    };
    Printer.prototype.str = function (str) {
        var s = str.s;
        // TODO: AST is not preserving the original quoting, or maybe a hint.
        this.writer.write(toStringLiteralJS(s));
    };
    return Printer;
}());
export function transpileModule(sourceText) {
    var cst = parse(sourceText, SourceKind.File);
    if (typeof cst === 'object') {
        var stmts = astFromParse(cst);
        var mod = new Module(stmts);
        var symbolTable = semanticsOfModule(mod);
        var printer = new Printer(symbolTable, 0, sourceText);
        return { code: printer.transpileModule(mod), cst: cst, symbolTable: symbolTable };
    }
    else {
        throw new Error("Error parsing source for file.");
    }
}

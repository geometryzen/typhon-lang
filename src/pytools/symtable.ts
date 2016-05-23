import {assert, fail} from './asserts';
import SymbolTable from './SymbolTable';

import {Assert} from './astnodes';
import {Assign} from './astnodes';
import {Attribute} from './astnodes';
import {AugAssign} from './astnodes';
import {BinOp} from './astnodes';
import {BoolOp} from './astnodes';
import {Break_} from './astnodes';
import {Call} from './astnodes';
import {ClassDef} from './astnodes';
import {Compare} from './astnodes';
import {Continue_} from './astnodes';
import {Delete_} from './astnodes';
import {Dict} from './astnodes';
import {Ellipsis} from './astnodes';
import {Exec} from './astnodes';
import {Expr} from './astnodes';
import {ExtSlice} from './astnodes';
import {For_} from './astnodes';
import {FunctionDef} from './astnodes';
import {GeneratorExp} from './astnodes';
import {Global} from './astnodes';
import {If_} from './astnodes';
import {IfExp} from './astnodes';
import {Import_} from './astnodes';
import {ImportFrom} from './astnodes';
import {Index} from './astnodes';
import {Lambda} from './astnodes';
import {Load} from './astnodes';
import {List} from './astnodes';
import {ListComp} from './astnodes';
import {Name} from './astnodes';
import {Num} from './astnodes';
import {Param} from './astnodes';
import {Pass} from './astnodes';
import {Print} from './astnodes';
import {Raise} from './astnodes';
import {Return_} from './astnodes';
import {Slice} from './astnodes';
import {Store} from './astnodes';
import {Str} from './astnodes';
import {Subscript} from './astnodes';
import {TryExcept} from './astnodes';
import {TryFinally} from './astnodes';
import {Tuple} from './astnodes';
import {UnaryOp} from './astnodes';
import {While_} from './astnodes';
import {With_} from './astnodes';
import {Yield} from './astnodes';

import {isDef, isNumber, isString} from './base';
import Symbol from './Symbol';
import SymbolTableScope from './SymbolTableScope';

import {CELL} from './SymbolConstants';
import {ClassBlock} from './SymbolConstants';
import {DEF_BOUND} from './SymbolConstants';
import {DEF_FREE_CLASS} from './SymbolConstants';
import {DEF_GLOBAL} from './SymbolConstants';
import {DEF_IMPORT} from './SymbolConstants';
import {DEF_LOCAL} from './SymbolConstants';
import {DEF_PARAM} from './SymbolConstants';
import {FREE} from './SymbolConstants';
import {FunctionBlock} from './SymbolConstants';
import {GLOBAL_EXPLICIT} from './SymbolConstants';
import {GLOBAL_IMPLICIT} from './SymbolConstants';
import {LOCAL} from './SymbolConstants';
import {ModuleBlock} from './SymbolConstants';
import {USE} from './SymbolConstants';
import {SCOPE_OFF} from './SymbolConstants';

/**
 * @param {Object} ast
 * @param {string} fileName
 */
var symbolTable = function(ast, fileName): SymbolTable {
    var ret = new SymbolTable(fileName);

    ret.enterBlock("top", ModuleBlock, ast, 0);
    ret.top = ret.cur;

    //print(Sk.astDump(ast));
    for (var i = 0; i < ast.body.length; ++i)
        ret.visitStmt(ast.body[i]);

    ret.exitBlock();

    ret.analyze();

    return ret;
};

var dumpSymbolTable = function(st) {
    var pyBoolStr = function(b) {
        return b ? "True" : "False";
    };
    var pyList = function(l) {
        var ret = [];
        for (var i = 0; i < l.length; ++i) {
            // TODO: Originally, this computed the Python repr().
            ret.push(l[i]);
        }
        return '[' + ret.join(', ') + ']';
    };
    var getIdents = function(obj, indent) {
        if (indent === undefined) indent = "";
        var ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno() + "\n";
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class") {
            ret += indent + "Class_methods: " + pyList(obj.get_methods()) + "\n";
        }
        else if (obj.get_type() === "function") {
            ret += indent + "Func_params: " + pyList(obj.get_parameters()) + "\n";
            ret += indent + "Func_locals: " + pyList(obj.get_locals()) + "\n";
            ret += indent + "Func_globals: " + pyList(obj.get_globals()) + "\n";
            ret += indent + "Func_frees: " + pyList(obj.get_frees()) + "\n";
        }
        ret += indent + "-- Identifiers --\n";
        var objidents = obj.get_identifiers();
        var objidentslen = objidents.length;
        for (var i = 0; i < objidentslen; ++i) {
            var info = obj.lookup(objidents[i]);
            ret += indent + "name: " + info.get_name() + "\n";
            ret += indent + "  is_referenced: " + pyBoolStr(info.is_referenced()) + "\n";
            ret += indent + "  is_imported: " + pyBoolStr(info.is_imported()) + "\n";
            ret += indent + "  is_parameter: " + pyBoolStr(info.is_parameter()) + "\n";
            ret += indent + "  is_global: " + pyBoolStr(info.is_global()) + "\n";
            ret += indent + "  is_declared_global: " + pyBoolStr(info.is_declared_global()) + "\n";
            ret += indent + "  is_local: " + pyBoolStr(info.is_local()) + "\n";
            ret += indent + "  is_free: " + pyBoolStr(info.is_free()) + "\n";
            ret += indent + "  is_assigned: " + pyBoolStr(info.is_assigned()) + "\n";
            ret += indent + "  is_namespace: " + pyBoolStr(info.is_namespace()) + "\n";
            var nss = info.get_namespaces();
            var nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            var sub = [];
            for (var j = 0; j < nsslen; ++j) {
                var ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join('\n');
            ret += indent + '  ]\n';
        }
        return ret;
    };
    return getIdents(st.top, '');
};

const that =
    {
        symbolTable: symbolTable,
        LOCAL: LOCAL,
        GLOBAL_EXPLICIT: GLOBAL_EXPLICIT,
        GLOBAL_IMPLICIT: GLOBAL_IMPLICIT,
        FREE: FREE,
        CELL: CELL,
        FunctionBlock: FunctionBlock,
        dumpSymbolTable: dumpSymbolTable
    };
export default that;


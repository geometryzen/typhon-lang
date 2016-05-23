define(["require", "exports", './SymbolTable', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, SymbolTable_1, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6, SymbolConstants_7) {
    "use strict";
    /**
     * @param {Object} ast
     * @param {string} fileName
     */
    var symbolTable = function (ast, fileName) {
        var ret = new SymbolTable_1.default(fileName);
        ret.enterBlock("top", SymbolConstants_7.ModuleBlock, ast, 0);
        ret.top = ret.cur;
        //print(Sk.astDump(ast));
        for (var i = 0; i < ast.body.length; ++i)
            ret.visitStmt(ast.body[i]);
        ret.exitBlock();
        ret.analyze();
        return ret;
    };
    var dumpSymbolTable = function (st) {
        var pyBoolStr = function (b) {
            return b ? "True" : "False";
        };
        var pyList = function (l) {
            var ret = [];
            for (var i = 0; i < l.length; ++i) {
                // TODO: Originally, this computed the Python repr().
                ret.push(l[i]);
            }
            return '[' + ret.join(', ') + ']';
        };
        var getIdents = function (obj, indent) {
            if (indent === undefined)
                indent = "";
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
    var that = {
        symbolTable: symbolTable,
        LOCAL: SymbolConstants_6.LOCAL,
        GLOBAL_EXPLICIT: SymbolConstants_4.GLOBAL_EXPLICIT,
        GLOBAL_IMPLICIT: SymbolConstants_5.GLOBAL_IMPLICIT,
        FREE: SymbolConstants_2.FREE,
        CELL: SymbolConstants_1.CELL,
        FunctionBlock: SymbolConstants_3.FunctionBlock,
        dumpSymbolTable: dumpSymbolTable
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = that;
});

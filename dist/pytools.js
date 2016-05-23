//
//
//
(
/**
 * @param {?*} global
 * @param {(function():*)=} define
 * @suppress {missingProperties}
 */
function(global, define) {
  var globalDefine = global.define;
// Experiment to make the generated library Google Closure compatible.

/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(
/**
 * @param {?undefined=} undef
 */
function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {string} name the relative name
     * @param {string} baseName a real name that the name arg is relative
     * to.
     * @returns {string} normalized name
     */
    function normalize(name, baseName) {
        /**
         * @type {Array.<string>}
         */
        var nameParts;
        var nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                nameParts = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(nameParts[lastIndex])) {
                    nameParts[lastIndex] = nameParts[lastIndex].replace(jsSuffixRegExp, '');
                }

                nameParts = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < nameParts.length; i += 1) {
                    part = nameParts[i];
                    if (part === ".") {
                        nameParts.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (nameParts[2] === '..' || nameParts[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            nameParts.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = nameParts.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    /**
     * @param {string} relName
     * @param {boolean=} forceSync
     */
    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    /**
     * @param {Object|string|undefined} deps
     * @param {?=} callback
     * @param {?=} relName
     * @param {boolean=} forceSync
     * @param {boolean=} alt
     */
    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    /**
     * @param {string} name
     * @param {*} deps
     * @param {*=} callback
     */
    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}(undefined));

define("../manual-deps/almond/almond", function(){});

define('pytools/Tokens',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * FIXME: These may not be synched?
     *
     * @enum {number}
     */
    var Tokens = {
        T_ENDMARKER: 0,
        T_NAME: 1,
        T_NUMBER: 2,
        T_STRING: 3,
        T_NEWLINE: 4,
        T_INDENT: 5,
        T_DEDENT: 6,
        T_LPAR: 7,
        T_RPAR: 8,
        T_LSQB: 9,
        T_RSQB: 10,
        T_COLON: 11,
        T_COMMA: 12,
        T_SEMI: 13,
        T_PLUS: 14,
        T_MINUS: 15,
        T_STAR: 16,
        T_SLASH: 17,
        T_VBAR: 18,
        T_AMPER: 19,
        T_LESS: 20,
        T_GREATER: 21,
        T_EQUAL: 22,
        T_DOT: 23,
        T_PERCENT: 24,
        T_BACKQUOTE: 25,
        T_LBRACE: 26,
        T_RBRACE: 27,
        T_EQEQUAL: 28,
        T_NOTEQUAL: 29,
        T_LESSEQUAL: 30,
        T_GREATEREQUAL: 31,
        T_TILDE: 32,
        T_CIRCUMFLEX: 33,
        T_LEFTSHIFT: 34,
        T_RIGHTSHIFT: 35,
        T_DOUBLESTAR: 36,
        T_PLUSEQUAL: 37,
        T_MINEQUAL: 38,
        T_STAREQUAL: 39,
        T_SLASHEQUAL: 40,
        T_PERCENTEQUAL: 41,
        T_AMPEREQUAL: 42,
        T_VBAREQUAL: 43,
        T_CIRCUMFLEXEQUAL: 44,
        T_LEFTSHIFTEQUAL: 45,
        T_RIGHTSHIFTEQUAL: 46,
        T_DOUBLESTAREQUAL: 47,
        T_DOUBLESLASH: 48,
        T_DOUBLESLASHEQUAL: 49,
        T_AT: 50,
        T_OP: 51,
        T_COMMENT: 52,
        T_NL: 53,
        T_RARROW: 54,
        T_ERRORTOKEN: 55,
        T_N_TOKENS: 56,
        T_NT_OFFSET: 256
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Tokens;
});

define('pytools/tables',["require", "exports", './Tokens'], function (require, exports, Tokens_1) {
    "use strict";
    var OpMap = {
        "(": Tokens_1.default.T_LPAR,
        ")": Tokens_1.default.T_RPAR,
        "[": Tokens_1.default.T_LSQB,
        "]": Tokens_1.default.T_RSQB,
        ":": Tokens_1.default.T_COLON,
        ",": Tokens_1.default.T_COMMA,
        ";": Tokens_1.default.T_SEMI,
        "+": Tokens_1.default.T_PLUS,
        "-": Tokens_1.default.T_MINUS,
        "*": Tokens_1.default.T_STAR,
        "/": Tokens_1.default.T_SLASH,
        "|": Tokens_1.default.T_VBAR,
        "&": Tokens_1.default.T_AMPER,
        "<": Tokens_1.default.T_LESS,
        ">": Tokens_1.default.T_GREATER,
        "=": Tokens_1.default.T_EQUAL,
        ".": Tokens_1.default.T_DOT,
        "%": Tokens_1.default.T_PERCENT,
        "`": Tokens_1.default.T_BACKQUOTE,
        "{": Tokens_1.default.T_LBRACE,
        "}": Tokens_1.default.T_RBRACE,
        "@": Tokens_1.default.T_AT,
        "==": Tokens_1.default.T_EQEQUAL,
        "!=": Tokens_1.default.T_NOTEQUAL,
        "<>": Tokens_1.default.T_NOTEQUAL,
        "<=": Tokens_1.default.T_LESSEQUAL,
        ">=": Tokens_1.default.T_GREATEREQUAL,
        "~": Tokens_1.default.T_TILDE,
        "^": Tokens_1.default.T_CIRCUMFLEX,
        "<<": Tokens_1.default.T_LEFTSHIFT,
        ">>": Tokens_1.default.T_RIGHTSHIFT,
        "**": Tokens_1.default.T_DOUBLESTAR,
        "+=": Tokens_1.default.T_PLUSEQUAL,
        "-=": Tokens_1.default.T_MINEQUAL,
        "*=": Tokens_1.default.T_STAREQUAL,
        "/=": Tokens_1.default.T_SLASHEQUAL,
        "%=": Tokens_1.default.T_PERCENTEQUAL,
        "&=": Tokens_1.default.T_AMPEREQUAL,
        "|=": Tokens_1.default.T_VBAREQUAL,
        "^=": Tokens_1.default.T_CIRCUMFLEXEQUAL,
        "<<=": Tokens_1.default.T_LEFTSHIFTEQUAL,
        ">>=": Tokens_1.default.T_RIGHTSHIFTEQUAL,
        "**=": Tokens_1.default.T_DOUBLESTAREQUAL,
        "//": Tokens_1.default.T_DOUBLESLASH,
        "//=": Tokens_1.default.T_DOUBLESLASHEQUAL,
        "->": Tokens_1.default.T_RARROW
    };
    var ParseTables = {
        sym: { AndExpr: 257,
            ArithmeticExpr: 258,
            AtomExpr: 259,
            BitwiseAndExpr: 260,
            BitwiseOrExpr: 261,
            BitwiseXorExpr: 262,
            ComparisonExpr: 263,
            ExprList: 264,
            ExprStmt: 265,
            GeometricExpr: 266,
            GlobalStmt: 267,
            IfExpr: 268,
            LambdaExpr: 269,
            NonLocalStmt: 270,
            NotExpr: 271,
            OrExpr: 272,
            PowerExpr: 273,
            ShiftExpr: 274,
            UnaryExpr: 275,
            YieldExpr: 276,
            arglist: 277,
            argument: 278,
            assert_stmt: 279,
            augassign: 280,
            break_stmt: 281,
            classdef: 282,
            comp_op: 283,
            compound_stmt: 284,
            continue_stmt: 285,
            decorated: 286,
            decorator: 287,
            decorators: 288,
            del_stmt: 289,
            dictmaker: 290,
            dotted_as_name: 291,
            dotted_as_names: 292,
            dotted_name: 293,
            encoding_decl: 294,
            eval_input: 295,
            except_clause: 296,
            exec_stmt: 297,
            file_input: 298,
            flow_stmt: 299,
            for_stmt: 300,
            fpdef: 301,
            fplist: 302,
            funcdef: 303,
            gen_for: 304,
            gen_if: 305,
            gen_iter: 306,
            if_stmt: 307,
            import_as_name: 308,
            import_as_names: 309,
            import_from: 310,
            import_name: 311,
            import_stmt: 312,
            list_for: 313,
            list_if: 314,
            list_iter: 315,
            listmaker: 316,
            old_LambdaExpr: 317,
            old_test: 318,
            parameters: 319,
            pass_stmt: 320,
            print_stmt: 321,
            raise_stmt: 322,
            return_stmt: 323,
            simple_stmt: 324,
            single_input: 256,
            sliceop: 325,
            small_stmt: 326,
            stmt: 327,
            subscript: 328,
            subscriptlist: 329,
            suite: 330,
            testlist: 331,
            testlist1: 332,
            testlist_gexp: 333,
            testlist_safe: 334,
            trailer: 335,
            try_stmt: 336,
            varargslist: 337,
            while_stmt: 338,
            with_stmt: 339,
            with_var: 340,
            yield_stmt: 341 },
        number2symbol: { 256: 'single_input',
            257: 'AndExpr',
            258: 'ArithmeticExpr',
            259: 'AtomExpr',
            260: 'BitwiseAndExpr',
            261: 'BitwiseOrExpr',
            262: 'BitwiseXorExpr',
            263: 'ComparisonExpr',
            264: 'ExprList',
            265: 'ExprStmt',
            266: 'GeometricExpr',
            267: 'GlobalStmt',
            268: 'IfExpr',
            269: 'LambdaExpr',
            270: 'NonLocalStmt',
            271: 'NotExpr',
            272: 'OrExpr',
            273: 'PowerExpr',
            274: 'ShiftExpr',
            275: 'UnaryExpr',
            276: 'YieldExpr',
            277: 'arglist',
            278: 'argument',
            279: 'assert_stmt',
            280: 'augassign',
            281: 'break_stmt',
            282: 'classdef',
            283: 'comp_op',
            284: 'compound_stmt',
            285: 'continue_stmt',
            286: 'decorated',
            287: 'decorator',
            288: 'decorators',
            289: 'del_stmt',
            290: 'dictmaker',
            291: 'dotted_as_name',
            292: 'dotted_as_names',
            293: 'dotted_name',
            294: 'encoding_decl',
            295: 'eval_input',
            296: 'except_clause',
            297: 'exec_stmt',
            298: 'file_input',
            299: 'flow_stmt',
            300: 'for_stmt',
            301: 'fpdef',
            302: 'fplist',
            303: 'funcdef',
            304: 'gen_for',
            305: 'gen_if',
            306: 'gen_iter',
            307: 'if_stmt',
            308: 'import_as_name',
            309: 'import_as_names',
            310: 'import_from',
            311: 'import_name',
            312: 'import_stmt',
            313: 'list_for',
            314: 'list_if',
            315: 'list_iter',
            316: 'listmaker',
            317: 'old_LambdaExpr',
            318: 'old_test',
            319: 'parameters',
            320: 'pass_stmt',
            321: 'print_stmt',
            322: 'raise_stmt',
            323: 'return_stmt',
            324: 'simple_stmt',
            325: 'sliceop',
            326: 'small_stmt',
            327: 'stmt',
            328: 'subscript',
            329: 'subscriptlist',
            330: 'suite',
            331: 'testlist',
            332: 'testlist1',
            333: 'testlist_gexp',
            334: 'testlist_safe',
            335: 'trailer',
            336: 'try_stmt',
            337: 'varargslist',
            338: 'while_stmt',
            339: 'with_stmt',
            340: 'with_var',
            341: 'yield_stmt' },
        dfas: { 256: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
                { 2: 1,
                    4: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    10: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    15: 1,
                    16: 1,
                    17: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    28: 1,
                    29: 1,
                    30: 1,
                    31: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    35: 1,
                    36: 1,
                    37: 1 }],
            257: [[[[38, 1]], [[39, 0], [0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            258: [[[[40, 1]], [[25, 0], [37, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            259: [[[[21, 1], [8, 1], [9, 4], [29, 3], [32, 2], [14, 5], [18, 6]],
                    [[0, 1]],
                    [[41, 7], [42, 1]],
                    [[43, 1], [44, 8], [45, 8]],
                    [[46, 9], [47, 1]],
                    [[48, 10]],
                    [[18, 6], [0, 6]],
                    [[42, 1]],
                    [[43, 1]],
                    [[47, 1]],
                    [[14, 1]]],
                { 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 29: 1, 32: 1 }],
            260: [[[[49, 1]], [[50, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            261: [[[[51, 1]], [[52, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            262: [[[[53, 1]], [[54, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            263: [[[[55, 1]], [[56, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            264: [[[[55, 1]], [[57, 2], [0, 1]], [[55, 1], [0, 2]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            265: [[[[58, 1]],
                    [[59, 2], [60, 3], [0, 1]],
                    [[58, 4], [45, 4]],
                    [[58, 5], [45, 5]],
                    [[0, 4]],
                    [[60, 3], [0, 5]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            266: [[[[61, 1]], [[62, 0], [63, 0], [64, 0], [65, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            267: [[[[27, 1]], [[21, 2]], [[57, 1], [0, 2]]], { 27: 1 }],
            268: [[[[66, 1], [67, 2]],
                    [[0, 1]],
                    [[31, 3], [0, 2]],
                    [[67, 4]],
                    [[68, 5]],
                    [[69, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            269: [[[[11, 1]], [[70, 2], [71, 3]], [[69, 4]], [[70, 2]], [[0, 4]]],
                { 11: 1 }],
            270: [[[[13, 1]], [[21, 2]], [[57, 1], [0, 2]]], { 13: 1 }],
            271: [[[[7, 1], [72, 2]], [[38, 2]], [[0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            272: [[[[73, 1]], [[74, 0], [0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            273: [[[[75, 1]], [[76, 1], [77, 2], [0, 1]], [[49, 3]], [[0, 3]]],
                { 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 29: 1, 32: 1 }],
            274: [[[[78, 1]], [[79, 0], [80, 0], [0, 1]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            275: [[[[25, 1], [6, 1], [37, 1], [81, 2]], [[49, 2]], [[0, 2]]],
                { 6: 1, 8: 1, 9: 1, 14: 1, 18: 1, 21: 1, 25: 1, 29: 1, 32: 1, 37: 1 }],
            276: [[[[26, 1]], [[58, 2], [0, 1]], [[0, 2]]], { 26: 1 }],
            277: [[[[63, 1], [82, 2], [77, 3]],
                    [[69, 4]],
                    [[57, 5], [0, 2]],
                    [[69, 6]],
                    [[57, 7], [0, 4]],
                    [[63, 1], [82, 2], [77, 3], [0, 5]],
                    [[0, 6]],
                    [[82, 4], [77, 3]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1,
                    63: 1,
                    77: 1 }],
            278: [[[[69, 1]], [[83, 2], [60, 3], [0, 1]], [[0, 2]], [[69, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            279: [[[[20, 1]], [[69, 2]], [[57, 3], [0, 2]], [[69, 4]], [[0, 4]]],
                { 20: 1 }],
            280: [[[[84, 1],
                        [85, 1],
                        [86, 1],
                        [87, 1],
                        [88, 1],
                        [89, 1],
                        [90, 1],
                        [91, 1],
                        [92, 1],
                        [93, 1],
                        [94, 1],
                        [95, 1]],
                    [[0, 1]]],
                { 84: 1,
                    85: 1,
                    86: 1,
                    87: 1,
                    88: 1,
                    89: 1,
                    90: 1,
                    91: 1,
                    92: 1,
                    93: 1,
                    94: 1,
                    95: 1 }],
            281: [[[[33, 1]], [[0, 1]]], { 33: 1 }],
            282: [[[[10, 1]],
                    [[21, 2]],
                    [[70, 3], [29, 4]],
                    [[96, 5]],
                    [[43, 6], [58, 7]],
                    [[0, 5]],
                    [[70, 3]],
                    [[43, 6]]],
                { 10: 1 }],
            283: [[[[97, 1],
                        [98, 1],
                        [7, 2],
                        [99, 1],
                        [97, 1],
                        [100, 1],
                        [101, 1],
                        [102, 3],
                        [103, 1],
                        [104, 1]],
                    [[0, 1]],
                    [[100, 1]],
                    [[7, 1], [0, 3]]],
                { 7: 1, 97: 1, 98: 1, 99: 1, 100: 1, 101: 1, 102: 1, 103: 1, 104: 1 }],
            284: [[[[105, 1],
                        [106, 1],
                        [107, 1],
                        [108, 1],
                        [109, 1],
                        [110, 1],
                        [111, 1],
                        [112, 1]],
                    [[0, 1]]],
                { 4: 1, 10: 1, 15: 1, 17: 1, 28: 1, 31: 1, 35: 1, 36: 1 }],
            285: [[[[34, 1]], [[0, 1]]], { 34: 1 }],
            286: [[[[113, 1]], [[111, 2], [108, 2]], [[0, 2]]], { 35: 1 }],
            287: [[[[35, 1]],
                    [[114, 2]],
                    [[2, 4], [29, 3]],
                    [[43, 5], [115, 6]],
                    [[0, 4]],
                    [[2, 4]],
                    [[43, 5]]],
                { 35: 1 }],
            288: [[[[116, 1]], [[116, 1], [0, 1]]], { 35: 1 }],
            289: [[[[22, 1]], [[117, 2]], [[0, 2]]], { 22: 1 }],
            290: [[[[69, 1]],
                    [[70, 2]],
                    [[69, 3]],
                    [[57, 4], [0, 3]],
                    [[69, 1], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            291: [[[[114, 1]], [[118, 2], [0, 1]], [[21, 3]], [[0, 3]]], { 21: 1 }],
            292: [[[[119, 1]], [[57, 0], [0, 1]]], { 21: 1 }],
            293: [[[[21, 1]], [[120, 0], [0, 1]]], { 21: 1 }],
            294: [[[[21, 1]], [[0, 1]]], { 21: 1 }],
            295: [[[[58, 1]], [[2, 1], [121, 2]], [[0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            296: [[[[122, 1]],
                    [[69, 2], [0, 1]],
                    [[118, 3], [57, 3], [0, 2]],
                    [[69, 4]],
                    [[0, 4]]],
                { 122: 1 }],
            297: [[[[16, 1]],
                    [[55, 2]],
                    [[100, 3], [0, 2]],
                    [[69, 4]],
                    [[57, 5], [0, 4]],
                    [[69, 6]],
                    [[0, 6]]],
                { 16: 1 }],
            298: [[[[2, 0], [121, 1], [123, 0]], [[0, 1]]],
                { 2: 1,
                    4: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    10: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    15: 1,
                    16: 1,
                    17: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    28: 1,
                    29: 1,
                    30: 1,
                    31: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    35: 1,
                    36: 1,
                    37: 1,
                    121: 1 }],
            299: [[[[124, 1], [125, 1], [126, 1], [127, 1], [128, 1]], [[0, 1]]],
                { 5: 1, 19: 1, 26: 1, 33: 1, 34: 1 }],
            300: [[[[28, 1]],
                    [[117, 2]],
                    [[100, 3]],
                    [[58, 4]],
                    [[70, 5]],
                    [[96, 6]],
                    [[68, 7], [0, 6]],
                    [[70, 8]],
                    [[96, 9]],
                    [[0, 9]]],
                { 28: 1 }],
            301: [[[[29, 1], [21, 2]], [[129, 3]], [[0, 2]], [[43, 2]]], { 21: 1, 29: 1 }],
            302: [[[[130, 1]], [[57, 2], [0, 1]], [[130, 1], [0, 2]]], { 21: 1, 29: 1 }],
            303: [[[[4, 1]], [[21, 2]], [[131, 3]], [[70, 4]], [[96, 5]], [[0, 5]]],
                { 4: 1 }],
            304: [[[[28, 1]],
                    [[117, 2]],
                    [[100, 3]],
                    [[67, 4]],
                    [[132, 5], [0, 4]],
                    [[0, 5]]],
                { 28: 1 }],
            305: [[[[31, 1]], [[133, 2]], [[132, 3], [0, 2]], [[0, 3]]], { 31: 1 }],
            306: [[[[83, 1], [134, 1]], [[0, 1]]], { 28: 1, 31: 1 }],
            307: [[[[31, 1]],
                    [[69, 2]],
                    [[70, 3]],
                    [[96, 4]],
                    [[68, 5], [135, 1], [0, 4]],
                    [[70, 6]],
                    [[96, 7]],
                    [[0, 7]]],
                { 31: 1 }],
            308: [[[[21, 1]], [[118, 2], [0, 1]], [[21, 3]], [[0, 3]]], { 21: 1 }],
            309: [[[[136, 1]], [[57, 2], [0, 1]], [[136, 1], [0, 2]]], { 21: 1 }],
            310: [[[[30, 1]],
                    [[114, 2], [120, 3]],
                    [[24, 4]],
                    [[114, 2], [24, 4], [120, 3]],
                    [[137, 5], [63, 5], [29, 6]],
                    [[0, 5]],
                    [[137, 7]],
                    [[43, 5]]],
                { 30: 1 }],
            311: [[[[24, 1]], [[138, 2]], [[0, 2]]], { 24: 1 }],
            312: [[[[139, 1], [140, 1]], [[0, 1]]], { 24: 1, 30: 1 }],
            313: [[[[28, 1]],
                    [[117, 2]],
                    [[100, 3]],
                    [[141, 4]],
                    [[142, 5], [0, 4]],
                    [[0, 5]]],
                { 28: 1 }],
            314: [[[[31, 1]], [[133, 2]], [[142, 3], [0, 2]], [[0, 3]]], { 31: 1 }],
            315: [[[[143, 1], [144, 1]], [[0, 1]]], { 28: 1, 31: 1 }],
            316: [[[[69, 1]],
                    [[143, 2], [57, 3], [0, 1]],
                    [[0, 2]],
                    [[69, 4], [0, 3]],
                    [[57, 3], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            317: [[[[11, 1]], [[70, 2], [71, 3]], [[133, 4]], [[70, 2]], [[0, 4]]],
                { 11: 1 }],
            318: [[[[145, 1], [67, 1]], [[0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            319: [[[[29, 1]], [[43, 2], [71, 3]], [[0, 2]], [[43, 2]]], { 29: 1 }],
            320: [[[[23, 1]], [[0, 1]]], { 23: 1 }],
            321: [[[[12, 1]],
                    [[69, 2], [79, 3], [0, 1]],
                    [[57, 4], [0, 2]],
                    [[69, 5]],
                    [[69, 2], [0, 4]],
                    [[57, 6], [0, 5]],
                    [[69, 7]],
                    [[57, 8], [0, 7]],
                    [[69, 7], [0, 8]]],
                { 12: 1 }],
            322: [[[[5, 1]],
                    [[69, 2], [0, 1]],
                    [[57, 3], [0, 2]],
                    [[69, 4]],
                    [[57, 5], [0, 4]],
                    [[69, 6]],
                    [[0, 6]]],
                { 5: 1 }],
            323: [[[[19, 1]], [[58, 2], [0, 1]], [[0, 2]]], { 19: 1 }],
            324: [[[[146, 1]], [[2, 2], [147, 3]], [[0, 2]], [[146, 1], [2, 2]]],
                { 5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    16: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    29: 1,
                    30: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    37: 1 }],
            325: [[[[70, 1]], [[69, 2], [0, 1]], [[0, 2]]], { 70: 1 }],
            326: [[[[148, 1],
                        [149, 1],
                        [150, 1],
                        [151, 1],
                        [152, 1],
                        [153, 1],
                        [154, 1],
                        [155, 1],
                        [156, 1],
                        [157, 1]],
                    [[0, 1]]],
                { 5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    16: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    29: 1,
                    30: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    37: 1 }],
            327: [[[[1, 1], [3, 1]], [[0, 1]]],
                { 4: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    10: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    15: 1,
                    16: 1,
                    17: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    28: 1,
                    29: 1,
                    30: 1,
                    31: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    35: 1,
                    36: 1,
                    37: 1 }],
            328: [[[[70, 1], [69, 2], [120, 3]],
                    [[158, 4], [69, 5], [0, 1]],
                    [[70, 1], [0, 2]],
                    [[120, 6]],
                    [[0, 4]],
                    [[158, 4], [0, 5]],
                    [[120, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1,
                    70: 1,
                    120: 1 }],
            329: [[[[159, 1]], [[57, 2], [0, 1]], [[159, 1], [0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1,
                    70: 1,
                    120: 1 }],
            330: [[[[1, 1], [2, 2]],
                    [[0, 1]],
                    [[160, 3]],
                    [[123, 4]],
                    [[161, 1], [123, 4]]],
                { 2: 1,
                    5: 1,
                    6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    12: 1,
                    13: 1,
                    14: 1,
                    16: 1,
                    18: 1,
                    19: 1,
                    20: 1,
                    21: 1,
                    22: 1,
                    23: 1,
                    24: 1,
                    25: 1,
                    26: 1,
                    27: 1,
                    29: 1,
                    30: 1,
                    32: 1,
                    33: 1,
                    34: 1,
                    37: 1 }],
            331: [[[[69, 1]], [[57, 2], [0, 1]], [[69, 1], [0, 2]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            332: [[[[69, 1]], [[57, 0], [0, 1]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            333: [[[[69, 1]],
                    [[83, 2], [57, 3], [0, 1]],
                    [[0, 2]],
                    [[69, 4], [0, 3]],
                    [[57, 3], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            334: [[[[133, 1]],
                    [[57, 2], [0, 1]],
                    [[133, 3]],
                    [[57, 4], [0, 3]],
                    [[133, 3], [0, 4]]],
                { 6: 1,
                    7: 1,
                    8: 1,
                    9: 1,
                    11: 1,
                    14: 1,
                    18: 1,
                    21: 1,
                    25: 1,
                    29: 1,
                    32: 1,
                    37: 1 }],
            335: [[[[29, 1], [120, 2], [32, 3]],
                    [[43, 4], [115, 5]],
                    [[21, 4]],
                    [[162, 6]],
                    [[0, 4]],
                    [[43, 4]],
                    [[42, 4]]],
                { 29: 1, 32: 1, 120: 1 }],
            336: [[[[15, 1]],
                    [[70, 2]],
                    [[96, 3]],
                    [[163, 4], [164, 5]],
                    [[70, 6]],
                    [[70, 7]],
                    [[96, 8]],
                    [[96, 9]],
                    [[163, 4], [68, 10], [164, 5], [0, 8]],
                    [[0, 9]],
                    [[70, 11]],
                    [[96, 12]],
                    [[164, 5], [0, 12]]],
                { 15: 1 }],
            337: [[[[63, 1], [130, 2], [77, 3]],
                    [[21, 4]],
                    [[60, 5], [57, 6], [0, 2]],
                    [[21, 7]],
                    [[57, 8], [0, 4]],
                    [[69, 9]],
                    [[63, 1], [130, 2], [77, 3], [0, 6]],
                    [[0, 7]],
                    [[77, 3]],
                    [[57, 6], [0, 9]]],
                { 21: 1, 29: 1, 63: 1, 77: 1 }],
            338: [[[[17, 1]],
                    [[69, 2]],
                    [[70, 3]],
                    [[96, 4]],
                    [[68, 5], [0, 4]],
                    [[70, 6]],
                    [[96, 7]],
                    [[0, 7]]],
                { 17: 1 }],
            339: [[[[36, 1]],
                    [[69, 2]],
                    [[70, 3], [165, 4]],
                    [[96, 5]],
                    [[70, 3]],
                    [[0, 5]]],
                { 36: 1 }],
            340: [[[[118, 1]], [[55, 2]], [[0, 2]]], { 118: 1 }],
            341: [[[[45, 1]], [[0, 1]]], { 26: 1 }] },
        states: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
            [[[38, 1]], [[39, 0], [0, 1]]],
            [[[40, 1]], [[25, 0], [37, 0], [0, 1]]],
            [[[21, 1], [8, 1], [9, 4], [29, 3], [32, 2], [14, 5], [18, 6]],
                [[0, 1]],
                [[41, 7], [42, 1]],
                [[43, 1], [44, 8], [45, 8]],
                [[46, 9], [47, 1]],
                [[48, 10]],
                [[18, 6], [0, 6]],
                [[42, 1]],
                [[43, 1]],
                [[47, 1]],
                [[14, 1]]],
            [[[49, 1]], [[50, 0], [0, 1]]],
            [[[51, 1]], [[52, 0], [0, 1]]],
            [[[53, 1]], [[54, 0], [0, 1]]],
            [[[55, 1]], [[56, 0], [0, 1]]],
            [[[55, 1]], [[57, 2], [0, 1]], [[55, 1], [0, 2]]],
            [[[58, 1]],
                [[59, 2], [60, 3], [0, 1]],
                [[58, 4], [45, 4]],
                [[58, 5], [45, 5]],
                [[0, 4]],
                [[60, 3], [0, 5]]],
            [[[61, 1]], [[62, 0], [63, 0], [64, 0], [65, 0], [0, 1]]],
            [[[27, 1]], [[21, 2]], [[57, 1], [0, 2]]],
            [[[66, 1], [67, 2]],
                [[0, 1]],
                [[31, 3], [0, 2]],
                [[67, 4]],
                [[68, 5]],
                [[69, 1]]],
            [[[11, 1]], [[70, 2], [71, 3]], [[69, 4]], [[70, 2]], [[0, 4]]],
            [[[13, 1]], [[21, 2]], [[57, 1], [0, 2]]],
            [[[7, 1], [72, 2]], [[38, 2]], [[0, 2]]],
            [[[73, 1]], [[74, 0], [0, 1]]],
            [[[75, 1]], [[76, 1], [77, 2], [0, 1]], [[49, 3]], [[0, 3]]],
            [[[78, 1]], [[79, 0], [80, 0], [0, 1]]],
            [[[25, 1], [6, 1], [37, 1], [81, 2]], [[49, 2]], [[0, 2]]],
            [[[26, 1]], [[58, 2], [0, 1]], [[0, 2]]],
            [[[63, 1], [82, 2], [77, 3]],
                [[69, 4]],
                [[57, 5], [0, 2]],
                [[69, 6]],
                [[57, 7], [0, 4]],
                [[63, 1], [82, 2], [77, 3], [0, 5]],
                [[0, 6]],
                [[82, 4], [77, 3]]],
            [[[69, 1]], [[83, 2], [60, 3], [0, 1]], [[0, 2]], [[69, 2]]],
            [[[20, 1]], [[69, 2]], [[57, 3], [0, 2]], [[69, 4]], [[0, 4]]],
            [[[84, 1],
                    [85, 1],
                    [86, 1],
                    [87, 1],
                    [88, 1],
                    [89, 1],
                    [90, 1],
                    [91, 1],
                    [92, 1],
                    [93, 1],
                    [94, 1],
                    [95, 1]],
                [[0, 1]]],
            [[[33, 1]], [[0, 1]]],
            [[[10, 1]],
                [[21, 2]],
                [[70, 3], [29, 4]],
                [[96, 5]],
                [[43, 6], [58, 7]],
                [[0, 5]],
                [[70, 3]],
                [[43, 6]]],
            [[[97, 1],
                    [98, 1],
                    [7, 2],
                    [99, 1],
                    [97, 1],
                    [100, 1],
                    [101, 1],
                    [102, 3],
                    [103, 1],
                    [104, 1]],
                [[0, 1]],
                [[100, 1]],
                [[7, 1], [0, 3]]],
            [[[105, 1],
                    [106, 1],
                    [107, 1],
                    [108, 1],
                    [109, 1],
                    [110, 1],
                    [111, 1],
                    [112, 1]],
                [[0, 1]]],
            [[[34, 1]], [[0, 1]]],
            [[[113, 1]], [[111, 2], [108, 2]], [[0, 2]]],
            [[[35, 1]],
                [[114, 2]],
                [[2, 4], [29, 3]],
                [[43, 5], [115, 6]],
                [[0, 4]],
                [[2, 4]],
                [[43, 5]]],
            [[[116, 1]], [[116, 1], [0, 1]]],
            [[[22, 1]], [[117, 2]], [[0, 2]]],
            [[[69, 1]], [[70, 2]], [[69, 3]], [[57, 4], [0, 3]], [[69, 1], [0, 4]]],
            [[[114, 1]], [[118, 2], [0, 1]], [[21, 3]], [[0, 3]]],
            [[[119, 1]], [[57, 0], [0, 1]]],
            [[[21, 1]], [[120, 0], [0, 1]]],
            [[[21, 1]], [[0, 1]]],
            [[[58, 1]], [[2, 1], [121, 2]], [[0, 2]]],
            [[[122, 1]],
                [[69, 2], [0, 1]],
                [[118, 3], [57, 3], [0, 2]],
                [[69, 4]],
                [[0, 4]]],
            [[[16, 1]],
                [[55, 2]],
                [[100, 3], [0, 2]],
                [[69, 4]],
                [[57, 5], [0, 4]],
                [[69, 6]],
                [[0, 6]]],
            [[[2, 0], [121, 1], [123, 0]], [[0, 1]]],
            [[[124, 1], [125, 1], [126, 1], [127, 1], [128, 1]], [[0, 1]]],
            [[[28, 1]],
                [[117, 2]],
                [[100, 3]],
                [[58, 4]],
                [[70, 5]],
                [[96, 6]],
                [[68, 7], [0, 6]],
                [[70, 8]],
                [[96, 9]],
                [[0, 9]]],
            [[[29, 1], [21, 2]], [[129, 3]], [[0, 2]], [[43, 2]]],
            [[[130, 1]], [[57, 2], [0, 1]], [[130, 1], [0, 2]]],
            [[[4, 1]], [[21, 2]], [[131, 3]], [[70, 4]], [[96, 5]], [[0, 5]]],
            [[[28, 1]], [[117, 2]], [[100, 3]], [[67, 4]], [[132, 5], [0, 4]], [[0, 5]]],
            [[[31, 1]], [[133, 2]], [[132, 3], [0, 2]], [[0, 3]]],
            [[[83, 1], [134, 1]], [[0, 1]]],
            [[[31, 1]],
                [[69, 2]],
                [[70, 3]],
                [[96, 4]],
                [[68, 5], [135, 1], [0, 4]],
                [[70, 6]],
                [[96, 7]],
                [[0, 7]]],
            [[[21, 1]], [[118, 2], [0, 1]], [[21, 3]], [[0, 3]]],
            [[[136, 1]], [[57, 2], [0, 1]], [[136, 1], [0, 2]]],
            [[[30, 1]],
                [[114, 2], [120, 3]],
                [[24, 4]],
                [[114, 2], [24, 4], [120, 3]],
                [[137, 5], [63, 5], [29, 6]],
                [[0, 5]],
                [[137, 7]],
                [[43, 5]]],
            [[[24, 1]], [[138, 2]], [[0, 2]]],
            [[[139, 1], [140, 1]], [[0, 1]]],
            [[[28, 1]], [[117, 2]], [[100, 3]], [[141, 4]], [[142, 5], [0, 4]], [[0, 5]]],
            [[[31, 1]], [[133, 2]], [[142, 3], [0, 2]], [[0, 3]]],
            [[[143, 1], [144, 1]], [[0, 1]]],
            [[[69, 1]],
                [[143, 2], [57, 3], [0, 1]],
                [[0, 2]],
                [[69, 4], [0, 3]],
                [[57, 3], [0, 4]]],
            [[[11, 1]], [[70, 2], [71, 3]], [[133, 4]], [[70, 2]], [[0, 4]]],
            [[[145, 1], [67, 1]], [[0, 1]]],
            [[[29, 1]], [[43, 2], [71, 3]], [[0, 2]], [[43, 2]]],
            [[[23, 1]], [[0, 1]]],
            [[[12, 1]],
                [[69, 2], [79, 3], [0, 1]],
                [[57, 4], [0, 2]],
                [[69, 5]],
                [[69, 2], [0, 4]],
                [[57, 6], [0, 5]],
                [[69, 7]],
                [[57, 8], [0, 7]],
                [[69, 7], [0, 8]]],
            [[[5, 1]],
                [[69, 2], [0, 1]],
                [[57, 3], [0, 2]],
                [[69, 4]],
                [[57, 5], [0, 4]],
                [[69, 6]],
                [[0, 6]]],
            [[[19, 1]], [[58, 2], [0, 1]], [[0, 2]]],
            [[[146, 1]], [[2, 2], [147, 3]], [[0, 2]], [[146, 1], [2, 2]]],
            [[[70, 1]], [[69, 2], [0, 1]], [[0, 2]]],
            [[[148, 1],
                    [149, 1],
                    [150, 1],
                    [151, 1],
                    [152, 1],
                    [153, 1],
                    [154, 1],
                    [155, 1],
                    [156, 1],
                    [157, 1]],
                [[0, 1]]],
            [[[1, 1], [3, 1]], [[0, 1]]],
            [[[70, 1], [69, 2], [120, 3]],
                [[158, 4], [69, 5], [0, 1]],
                [[70, 1], [0, 2]],
                [[120, 6]],
                [[0, 4]],
                [[158, 4], [0, 5]],
                [[120, 4]]],
            [[[159, 1]], [[57, 2], [0, 1]], [[159, 1], [0, 2]]],
            [[[1, 1], [2, 2]], [[0, 1]], [[160, 3]], [[123, 4]], [[161, 1], [123, 4]]],
            [[[69, 1]], [[57, 2], [0, 1]], [[69, 1], [0, 2]]],
            [[[69, 1]], [[57, 0], [0, 1]]],
            [[[69, 1]],
                [[83, 2], [57, 3], [0, 1]],
                [[0, 2]],
                [[69, 4], [0, 3]],
                [[57, 3], [0, 4]]],
            [[[133, 1]],
                [[57, 2], [0, 1]],
                [[133, 3]],
                [[57, 4], [0, 3]],
                [[133, 3], [0, 4]]],
            [[[29, 1], [120, 2], [32, 3]],
                [[43, 4], [115, 5]],
                [[21, 4]],
                [[162, 6]],
                [[0, 4]],
                [[43, 4]],
                [[42, 4]]],
            [[[15, 1]],
                [[70, 2]],
                [[96, 3]],
                [[163, 4], [164, 5]],
                [[70, 6]],
                [[70, 7]],
                [[96, 8]],
                [[96, 9]],
                [[163, 4], [68, 10], [164, 5], [0, 8]],
                [[0, 9]],
                [[70, 11]],
                [[96, 12]],
                [[164, 5], [0, 12]]],
            [[[63, 1], [130, 2], [77, 3]],
                [[21, 4]],
                [[60, 5], [57, 6], [0, 2]],
                [[21, 7]],
                [[57, 8], [0, 4]],
                [[69, 9]],
                [[63, 1], [130, 2], [77, 3], [0, 6]],
                [[0, 7]],
                [[77, 3]],
                [[57, 6], [0, 9]]],
            [[[17, 1]],
                [[69, 2]],
                [[70, 3]],
                [[96, 4]],
                [[68, 5], [0, 4]],
                [[70, 6]],
                [[96, 7]],
                [[0, 7]]],
            [[[36, 1]], [[69, 2]], [[70, 3], [165, 4]], [[96, 5]], [[70, 3]], [[0, 5]]],
            [[[118, 1]], [[55, 2]], [[0, 2]]],
            [[[45, 1]], [[0, 1]]]],
        labels: [[0, 'EMPTY'],
            [324, null],
            [4, null],
            [284, null],
            [1, 'def'],
            [1, 'raise'],
            [32, null],
            [1, 'not'],
            [2, null],
            [26, null],
            [1, 'class'],
            [1, 'lambda'],
            [1, 'print'],
            [1, 'nonlocal'],
            [25, null],
            [1, 'try'],
            [1, 'exec'],
            [1, 'while'],
            [3, null],
            [1, 'return'],
            [1, 'assert'],
            [1, null],
            [1, 'del'],
            [1, 'pass'],
            [1, 'import'],
            [15, null],
            [1, 'yield'],
            [1, 'global'],
            [1, 'for'],
            [7, null],
            [1, 'from'],
            [1, 'if'],
            [9, null],
            [1, 'break'],
            [1, 'continue'],
            [50, null],
            [1, 'with'],
            [14, null],
            [271, null],
            [1, 'and'],
            [266, null],
            [316, null],
            [10, null],
            [8, null],
            [333, null],
            [276, null],
            [290, null],
            [27, null],
            [332, null],
            [275, null],
            [19, null],
            [262, null],
            [18, null],
            [260, null],
            [33, null],
            [258, null],
            [283, null],
            [12, null],
            [331, null],
            [280, null],
            [22, null],
            [274, null],
            [48, null],
            [16, null],
            [17, null],
            [24, null],
            [269, null],
            [272, null],
            [1, 'else'],
            [268, null],
            [11, null],
            [337, null],
            [263, null],
            [257, null],
            [1, 'or'],
            [259, null],
            [335, null],
            [36, null],
            [261, null],
            [35, null],
            [34, null],
            [273, null],
            [278, null],
            [304, null],
            [46, null],
            [39, null],
            [41, null],
            [47, null],
            [42, null],
            [43, null],
            [37, null],
            [44, null],
            [49, null],
            [45, null],
            [38, null],
            [40, null],
            [330, null],
            [29, null],
            [21, null],
            [28, null],
            [1, 'in'],
            [30, null],
            [1, 'is'],
            [31, null],
            [20, null],
            [336, null],
            [307, null],
            [300, null],
            [282, null],
            [339, null],
            [338, null],
            [303, null],
            [286, null],
            [288, null],
            [293, null],
            [277, null],
            [287, null],
            [264, null],
            [1, 'as'],
            [291, null],
            [23, null],
            [0, null],
            [1, 'except'],
            [327, null],
            [281, null],
            [285, null],
            [322, null],
            [323, null],
            [341, null],
            [302, null],
            [301, null],
            [319, null],
            [306, null],
            [318, null],
            [305, null],
            [1, 'elif'],
            [308, null],
            [309, null],
            [292, null],
            [311, null],
            [310, null],
            [334, null],
            [315, null],
            [313, null],
            [314, null],
            [317, null],
            [326, null],
            [13, null],
            [270, null],
            [267, null],
            [265, null],
            [320, null],
            [321, null],
            [289, null],
            [297, null],
            [299, null],
            [279, null],
            [312, null],
            [325, null],
            [328, null],
            [5, null],
            [6, null],
            [329, null],
            [296, null],
            [1, 'finally'],
            [340, null]],
        keywords: { 'and': 39,
            'as': 118,
            'assert': 20,
            'break': 33,
            'class': 10,
            'continue': 34,
            'def': 4,
            'del': 22,
            'elif': 135,
            'else': 68,
            'except': 122,
            'exec': 16,
            'finally': 164,
            'for': 28,
            'from': 30,
            'global': 27,
            'if': 31,
            'import': 24,
            'in': 100,
            'is': 102,
            'lambda': 11,
            'nonlocal': 13,
            'not': 7,
            'or': 74,
            'pass': 23,
            'print': 12,
            'raise': 5,
            'return': 19,
            'try': 15,
            'while': 17,
            'with': 36,
            'yield': 26 },
        tokens: { 0: 121,
            1: 21,
            2: 8,
            3: 18,
            4: 2,
            5: 160,
            6: 161,
            7: 29,
            8: 43,
            9: 32,
            10: 42,
            11: 70,
            12: 57,
            13: 147,
            14: 37,
            15: 25,
            16: 63,
            17: 64,
            18: 52,
            19: 50,
            20: 104,
            21: 98,
            22: 60,
            23: 120,
            24: 65,
            25: 14,
            26: 9,
            27: 47,
            28: 99,
            29: 97,
            30: 101,
            31: 103,
            32: 6,
            33: 54,
            34: 80,
            35: 79,
            36: 77,
            37: 90,
            38: 94,
            39: 85,
            40: 95,
            41: 86,
            42: 88,
            43: 89,
            44: 91,
            45: 93,
            46: 84,
            47: 87,
            48: 62,
            49: 92,
            50: 35 },
        start: 256
    };
    var that = {
        'OpMap': OpMap,
        'ParseTables': ParseTables
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = that;
});

define('pytools/asserts',["require", "exports"], function (require, exports) {
    "use strict";
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    exports.assert = assert;
    function fail(message) {
        assert(false, message);
    }
    exports.fail = fail;
});

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
define('pytools/base',["require", "exports"], function (require, exports) {
    "use strict";
    var COMPILED = false;
    /**
     * Base namespace for the Closure library.  Checks to see base is already
     * defined in the current scope before assigning to prevent clobbering if
     * base.js is loaded more than once.
     *
     * @const
     */
    var base = base || {};
    /**
     * Reference to the global context.  In most cases this will be 'window'.
     */
    base.global = this;
    /**
     * Builds an object structure for the provided namespace path, ensuring that
     * names that already exist are not overwritten. For example:
     * "a.b.c" -> a = {};a.b={};a.b.c={};
     * Used by base.provide and base.exportSymbol.
     * @param {string} name name of the object that this file defines.
     * @param {*=} opt_object the object to expose at the end of the path.
     * @param {Object=} opt_objectToExportTo The object to add the path to; default
     *     is |base.global|.
     * @private
     */
    base.exportPath_ = function (name, opt_object, opt_objectToExportTo) {
        var parts = name.split('.');
        var cur = opt_objectToExportTo || base.global;
        // Internet Explorer exhibits strange behavior when throwing errors from
        // methods externed in this manner.  See the testExportSymbolExceptions in
        // base_test.html for an example.
        if (!(parts[0] in cur) && cur.execScript) {
            cur.execScript('var ' + parts[0]);
        }
        // Certain browsers cannot parse code in the form for((a in b); c;);
        // This pattern is produced by the JSCompiler when it collapses the
        // statement above into the conditional loop below. To prevent this from
        // happening, use a for-loop and reserve the init logic as below.
        // Parentheses added to eliminate strict JS warning in Firefox.
        for (var part; parts.length && (part = parts.shift());) {
            if (!parts.length && opt_object !== undefined) {
                // last part and we have an object; use it
                cur[part] = opt_object;
            }
            else if (cur[part]) {
                cur = cur[part];
            }
            else {
                cur = cur[part] = {};
            }
        }
    };
    base.DEBUG = true;
    /**
     * Returns an object based on its fully qualified external name.  If you are
     * using a compilation pass that renames property names beware that using this
     * function will not find renamed properties.
     *
     * @param {string} name The fully qualified name.
     * @param {Object=} opt_obj The object within which to look; default is
     *     |base.global|.
     * @return {?} The value (object or primitive) or, if not found, null.
     */
    base.getObjectByName = function (name, opt_obj) {
        var parts = name.split('.');
        var cur = opt_obj || base.global;
        for (var part; part = parts.shift();) {
            if (base.isDefAndNotNull(cur[part])) {
                cur = cur[part];
            }
            else {
                return null;
            }
        }
        return cur;
    };
    /**
     * Globalizes a whole namespace, such as base or base.lang.
     *
     * @param {Object} obj The namespace to globalize.
     * @param {Object=} opt_global The object to add the properties to.
     * @deprecated Properties may be explicitly exported to the global scope, but
     *     this should no longer be done in bulk.
     */
    base.globalize = function (obj, opt_global) {
        var global = opt_global || base.global;
        for (var x in obj) {
            global[x] = obj[x];
        }
    };
    /**
     * Null function used for default values of callbacks, etc.
     * @return {void} Nothing.
     */
    base.nullFunction = function () { };
    /**
     * The identity function. Returns its first argument.
     *
     * @param {*=} opt_returnValue The single value that will be returned.
     * @param {...*} var_args Optional trailing arguments. These are ignored.
     * @return {?} The first argument. We can't know the type -- just pass it along
     *      without type.
     * @deprecated Use base.functions.identity instead.
     */
    base.identityFunction = function (opt_returnValue, var_args) {
        return opt_returnValue;
    };
    /**
     * When defining a class Foo with an abstract method bar(), you can do:
     * Foo.prototype.bar = base.abstractMethod
     *
     * Now if a subclass of Foo fails to override bar(), an error will be thrown
     * when bar() is invoked.
     *
     * Note: This does not take the name of the function to override as an argument
     * because that would make it more difficult to obfuscate our JavaScript code.
     *
     * @type {!Function}
     * @throws {Error} when invoked to indicate the method should be overridden.
     */
    base.abstractMethod = function () {
        throw Error('unimplemented abstract method');
    };
    //==============================================================================
    // Language Enhancements
    //==============================================================================
    /**
     * This is a "fixed" version of the typeof operator.  It differs from the typeof
     * operator in such a way that null returns 'null' and arrays return 'array'.
     * @param {*} value The value to get the type of.
     * @return {string} The name of the type.
     */
    base.typeOf = function (value) {
        var s = typeof value;
        if (s == 'object') {
            if (value) {
                // Check these first, so we can avoid calling Object.prototype.toString if
                // possible.
                //
                // IE improperly marshals tyepof across execution contexts, but a
                // cross-context object will still return false for "instanceof Object".
                if (value instanceof Array) {
                    return 'array';
                }
                else if (value instanceof Object) {
                    return s;
                }
                // HACK: In order to use an Object prototype method on the arbitrary
                //   value, the compiler requires the value be cast to type Object,
                //   even though the ECMA spec explicitly allows it.
                var className = Object.prototype.toString.call(
                /** @type {Object} */ (value));
                // In Firefox 3.6, attempting to access iframe window objects' length
                // property throws an NS_ERROR_FAILURE, so we need to special-case it
                // here.
                if (className == '[object Window]') {
                    return 'object';
                }
                // We cannot always use constructor == Array or instanceof Array because
                // different frames have different Array objects. In IE6, if the iframe
                // where the array was created is destroyed, the array loses its
                // prototype. Then dereferencing val.splice here throws an exception, so
                // we can't use base.isFunction. Calling typeof directly returns 'unknown'
                // so that will work. In this case, this function will return false and
                // most array functions will still work because the array is still
                // array-like (supports length and []) even though it has lost its
                // prototype.
                // Mark Miller noticed that Object.prototype.toString
                // allows access to the unforgeable [[Class]] property.
                //  15.2.4.2 Object.prototype.toString ( )
                //  When the toString method is called, the following steps are taken:
                //      1. Get the [[Class]] property of this object.
                //      2. Compute a string value by concatenating the three strings
                //         "[object ", Result(1), and "]".
                //      3. Return Result(2).
                // and this behavior survives the destruction of the execution context.
                if ((className == '[object Array]' ||
                    // In IE all non value types are wrapped as objects across window
                    // boundaries (not iframe though) so we have to do object detection
                    // for this edge case.
                    typeof value.length == 'number' &&
                        typeof value.splice != 'undefined' &&
                        typeof value.propertyIsEnumerable != 'undefined' &&
                        !value.propertyIsEnumerable('splice'))) {
                    return 'array';
                }
                // HACK: There is still an array case that fails.
                //     function ArrayImpostor() {}
                //     ArrayImpostor.prototype = [];
                //     var impostor = new ArrayImpostor;
                // this can be fixed by getting rid of the fast path
                // (value instanceof Array) and solely relying on
                // (value && Object.prototype.toString.vall(value) === '[object Array]')
                // but that would require many more function calls and is not warranted
                // unless closure code is receiving objects from untrusted sources.
                // IE in cross-window calls does not correctly marshal the function type
                // (it appears just as an object) so we cannot use just typeof val ==
                // 'function'. However, if the object has a call property, it is a
                // function.
                if ((className == '[object Function]' ||
                    typeof value.call != 'undefined' &&
                        typeof value.propertyIsEnumerable != 'undefined' &&
                        !value.propertyIsEnumerable('call'))) {
                    return 'function';
                }
            }
            else {
                return 'null';
            }
        }
        else if (s == 'function' && typeof value.call == 'undefined') {
            // In Safari typeof nodeList returns 'function', and on Firefox typeof
            // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps. We
            // would like to return object for those and we can detect an invalid
            // function by making sure that the function object has a call method.
            return 'object';
        }
        return s;
    };
    /**
     * Returns true if the specified value is not undefined.
     * WARNING: Do not use this to test if an object has a property. Use the in
     * operator instead.  Additionally, this function assumes that the global
     * undefined variable has not been redefined.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is defined.
     */
    function isDef(val) {
        return val !== undefined;
    }
    exports.isDef = isDef;
    ;
    /**
     * Returns true if the specified value is null.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is null.
     */
    base.isNull = function (val) {
        return val === null;
    };
    /**
     * Returns true if the specified value is defined and not null.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is defined and not null.
     */
    base.isDefAndNotNull = function (val) {
        // Note that undefined == null.
        return val != null;
    };
    /**
     * Returns true if the specified value is an array.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is an array.
     */
    function isArray(val) {
        return base.typeOf(val) == 'array';
    }
    exports.isArray = isArray;
    /**
     * Returns true if the object looks like an array. To qualify as array like
     * the value needs to be either a NodeList or an object with a Number length
     * property.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is an array.
     */
    function isArrayLike(val) {
        var type = base.typeOf(val);
        return type == 'array' || type == 'object' && typeof val.length == 'number';
    }
    exports.isArrayLike = isArrayLike;
    /**
     * Returns true if the object looks like a Date. To qualify as Date-like the
     * value needs to be an object and have a getFullYear() function.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a like a Date.
     */
    base.isDateLike = function (val) {
        return base.isObject(val) && typeof val.getFullYear == 'function';
    };
    /**
     * Returns true if the specified value is a string.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a string.
     */
    function isString(val) {
        return typeof val === 'string';
    }
    exports.isString = isString;
    /**
     * Returns true if the specified value is a boolean.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is boolean.
     */
    base.isBoolean = function (val) {
        return typeof val == 'boolean';
    };
    /**
     * Returns true if the specified value is a number.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a number.
     */
    function isNumber(val) {
        return typeof val === 'number';
    }
    exports.isNumber = isNumber;
    ;
    /**
     * Returns true if the specified value is a function.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a function.
     */
    base.isFunction = function (val) {
        return base.typeOf(val) == 'function';
    };
    /**
     * Returns true if the specified value is an object.  This includes arrays and
     * functions.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is an object.
     */
    base.isObject = function (val) {
        var type = typeof val;
        return type == 'object' && val != null || type == 'function';
        // return Object(val) === val also works, but is slower, especially if val is
        // not an object.
    };
    /**
     * Gets a unique ID for an object. This mutates the object so that further calls
     * with the same object as a parameter returns the same value. The unique ID is
     * guaranteed to be unique across the current session amongst objects that are
     * passed into {@code getUid}. There is no guarantee that the ID is unique or
     * consistent across sessions. It is unsafe to generate unique ID for function
     * prototypes.
     *
     * @param {Object} obj The object to get the unique ID for.
     * @return {number} The unique ID for the object.
     */
    base.getUid = function (obj) {
        // TODO(arv): Make the type stricter, do not accept null.
        // In Opera window.hasOwnProperty exists but always returns false so we avoid
        // using it. As a consequence the unique ID generated for BaseClass.prototype
        // and SubClass.prototype will be the same.
        return obj[base.UID_PROPERTY_] ||
            (obj[base.UID_PROPERTY_] = ++base.uidCounter_);
    };
    /**
     * Removes the unique ID from an object. This is useful if the object was
     * previously mutated using {@code base.getUid} in which case the mutation is
     * undone.
     * @param {Object} obj The object to remove the unique ID field from.
     */
    base.removeUid = function (obj) {
        // TODO(arv): Make the type stricter, do not accept null.
        // In IE, DOM nodes are not instances of Object and throw an exception if we
        // try to delete.  Instead we try to use removeAttribute.
        if ('removeAttribute' in obj) {
            obj.removeAttribute(base.UID_PROPERTY_);
        }
        /** @preserveTry */
        try {
            delete obj[base.UID_PROPERTY_];
        }
        catch (ex) {
        }
    };
    /**
     * Name for unique ID property. Initialized in a way to help avoid collisions
     * with other closure JavaScript on the same page.
     * @type {string}
     * @private
     */
    base.UID_PROPERTY_ = 'closure_uid_' + ((Math.random() * 1e9) >>> 0);
    /**
     * Counter for UID.
     * @type {number}
     * @private
     */
    base.uidCounter_ = 0;
    /**
     * Adds a hash code field to an object. The hash code is unique for the
     * given object.
     * @param {Object} obj The object to get the hash code for.
     * @return {number} The hash code for the object.
     * @deprecated Use base.getUid instead.
     */
    base.getHashCode = base.getUid;
    /**
     * Removes the hash code field from an object.
     * @param {Object} obj The object to remove the field from.
     * @deprecated Use base.removeUid instead.
     */
    base.removeHashCode = base.removeUid;
    /**
     * Clones a value. The input may be an Object, Array, or basic type. Objects and
     * arrays will be cloned recursively.
     *
     * WARNINGS:
     * <code>base.cloneObject</code> does not detect reference loops. Objects that
     * refer to themselves will cause infinite recursion.
     *
     * <code>base.cloneObject</code> is unaware of unique identifiers, and copies
     * UIDs created by <code>getUid</code> into cloned results.
     *
     * @param {*} obj The value to clone.
     * @return {*} A clone of the input value.
     * @deprecated base.cloneObject is unsafe. Prefer the base.object methods.
     */
    base.cloneObject = function (obj) {
        var type = base.typeOf(obj);
        if (type == 'object' || type == 'array') {
            if (obj.clone) {
                return obj.clone();
            }
            var clone = type == 'array' ? [] : {};
            for (var key in obj) {
                clone[key] = base.cloneObject(obj[key]);
            }
            return clone;
        }
        return obj;
    };
    /**
     * A native implementation of base.bind.
     * @param {Function} fn A function to partially apply.
     * @param {Object|undefined} selfObj Specifies the object which this should
     *     point to when the function is run.
     * @param {...*} var_args Additional arguments that are partially applied to the
     *     function.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.
     * @private
     * @suppress {deprecated} The compiler thinks that Function.prototype.bind is
     *     deprecated because some people have declared a pure-JS version.
     *     Only the pure-JS version is truly deprecated.
     */
    base.bindNative_ = function (fn, selfObj, var_args) {
        return (fn.call.apply(fn.bind, arguments));
    };
    /**
     * A pure-JS implementation of base.bind.
     * @param {Function} fn A function to partially apply.
     * @param {Object|undefined} selfObj Specifies the object which this should
     *     point to when the function is run.
     * @param {...*} var_args Additional arguments that are partially applied to the
     *     function.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.
     * @private
     */
    base.bindJs_ = function (fn, selfObj, var_args) {
        if (!fn) {
            throw new Error();
        }
        if (arguments.length > 2) {
            var boundArgs = Array.prototype.slice.call(arguments, 2);
            return function () {
                // Prepend the bound arguments to the current arguments.
                var newArgs = Array.prototype.slice.call(arguments);
                Array.prototype.unshift.apply(newArgs, boundArgs);
                return fn.apply(selfObj, newArgs);
            };
        }
        else {
            return function () {
                return fn.apply(selfObj, arguments);
            };
        }
    };
    /**
     * Partially applies this function to a particular 'this object' and zero or
     * more arguments. The result is a new function with some arguments of the first
     * function pre-filled and the value of this 'pre-specified'.
     *
     * Remaining arguments specified at call-time are appended to the pre-specified
     * ones.
     *
     * Also see: {@link #partial}.
     *
     * Usage:
     * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
     * barMethBound('arg3', 'arg4');</pre>
     *
     * @param {?function(this:T, ...)} fn A function to partially apply.
     * @param {T} selfObj Specifies the object which this should point to when the
     *     function is run.
     * @param {...*} var_args Additional arguments that are partially applied to the
     *     function.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.
     * @template T
     * @suppress {deprecated} See above.
     */
    base.bind = function (fn, selfObj, var_args) {
        // TODO(nicksantos): narrow the type signature.
        if (Function.prototype.bind &&
            // NOTE(nicksantos): Somebody pulled base.js into the default Chrome
            // extension environment. This means that for Chrome extensions, they get
            // the implementation of Function.prototype.bind that calls base.bind
            // instead of the native one. Even worse, we don't want to introduce a
            // circular dependency between base.bind and Function.prototype.bind, so
            // we have to hack this to make sure it works correctly.
            Function.prototype.bind.toString().indexOf('native code') != -1) {
            base.bind = base.bindNative_;
        }
        else {
            base.bind = base.bindJs_;
        }
        return base.bind.apply(null, arguments);
    };
    /**
     * Like bind(), except that a 'this object' is not required. Useful when the
     * target function is already bound.
     *
     * Usage:
     * var g = partial(f, arg1, arg2);
     * g(arg3, arg4);
     *
     * @param {Function} fn A function to partially apply.
     * @param {...*} var_args Additional arguments that are partially applied to fn.
     * @return {!Function} A partially-applied form of the function bind() was
     *     invoked as a method of.
     */
    base.partial = function (fn, var_args) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            // Prepend the bound arguments to the current arguments.
            var newArgs = Array.prototype.slice.call(arguments);
            newArgs.unshift.apply(newArgs, args);
            return fn.apply(this, newArgs);
        };
    };
    /**
     * Copies all the members of a source object to a target object. This method
     * does not work on all browsers for all objects that contain keys such as
     * toString or hasOwnProperty. Use base.object.extend for this purpose.
     * @param {Object} target Target.
     * @param {Object} source Source.
     */
    base.mixin = function (target, source) {
        for (var x in source) {
            target[x] = source[x];
        }
        // For IE7 or lower, the for-in-loop does not contain any properties that are
        // not enumerable on the prototype object (for example, isPrototypeOf from
        // Object.prototype) but also it will not include 'replace' on objects that
        // extend String and change 'replace' (not that it is common for anyone to
        // extend anything except Object).
    };
    /**
     * @return {number} An integer value representing the number of milliseconds
     *     between midnight, January 1, 1970 and the current time.
     */
    base.now = (base.TRUSTED_SITE && Date.now) || (function () {
        // Unary plus operator converts its operand to a number which in the case of
        // a date is done by calling getTime().
        return +new Date();
    });
    /**
     * Evals JavaScript in the global scope.  In IE this uses execScript, other
     * browsers use base.global.eval. If base.global.eval does not evaluate in the
     * global scope (for example, in Safari), appends a script tag instead.
     * Throws an exception if neither execScript or eval is defined.
     * @param {string} script JavaScript string.
     */
    base.globalEval = function (script) {
        if (base.global.execScript) {
            base.global.execScript(script, 'JavaScript');
        }
        else if (base.global.eval) {
            // Test to see if eval works
            if (base.evalWorksForGlobals_ == null) {
                base.global.eval('var _et_ = 1;');
                if (typeof base.global['_et_'] != 'undefined') {
                    delete base.global['_et_'];
                    base.evalWorksForGlobals_ = true;
                }
                else {
                    base.evalWorksForGlobals_ = false;
                }
            }
            if (base.evalWorksForGlobals_) {
                base.global.eval(script);
            }
            else {
                var doc = base.global.document;
                var scriptElt = doc.createElement('script');
                scriptElt.type = 'text/javascript';
                scriptElt.defer = false;
                // Note(user): can't use .innerHTML since "t('<test>')" will fail and
                // .text doesn't work in Safari 2.  Therefore we append a text node.
                scriptElt.appendChild(doc.createTextNode(script));
                doc.body.appendChild(scriptElt);
                doc.body.removeChild(scriptElt);
            }
        }
        else {
            throw Error('base.globalEval not available');
        }
    };
    /**
     * Indicates whether or not we can call 'eval' directly to eval code in the
     * global scope. Set to a Boolean by the first call to base.globalEval (which
     * empirically tests whether eval works for globals). @see base.globalEval
     * @type {?boolean}
     * @private
     */
    base.evalWorksForGlobals_ = null;
    /**
     * Optional map of CSS class names to obfuscated names used with
     * base.getCssName().
     * @type {Object|undefined}
     * @private
     * @see base.setCssNameMapping
     */
    base.cssNameMapping_;
    /**
     * Optional obfuscation style for CSS class names. Should be set to either
     * 'BY_WHOLE' or 'BY_PART' if defined.
     * @type {string|undefined}
     * @private
     * @see base.setCssNameMapping
     */
    base.cssNameMappingStyle_;
    /**
     * Handles strings that are intended to be used as CSS class names.
     *
     * This function works in tandem with @see base.setCssNameMapping.
     *
     * Without any mapping set, the arguments are simple joined with a hyphen and
     * passed through unaltered.
     *
     * When there is a mapping, there are two possible styles in which these
     * mappings are used. In the BY_PART style, each part (i.e. in between hyphens)
     * of the passed in css name is rewritten according to the map. In the BY_WHOLE
     * style, the full css name is looked up in the map directly. If a rewrite is
     * not specified by the map, the compiler will output a warning.
     *
     * When the mapping is passed to the compiler, it will replace calls to
     * base.getCssName with the strings from the mapping, e.g.
     *     var x = base.getCssName('foo');
     *     var y = base.getCssName(this.baseClass, 'active');
     *  becomes:
     *     var x= 'foo';
     *     var y = this.baseClass + '-active';
     *
     * If one argument is passed it will be processed, if two are passed only the
     * modifier will be processed, as it is assumed the first argument was generated
     * as a result of calling base.getCssName.
     *
     * @param {string} className The class name.
     * @param {string=} opt_modifier A modifier to be appended to the class name.
     * @return {string} The class name or the concatenation of the class name and
     *     the modifier.
     */
    base.getCssName = function (className, opt_modifier) {
        var getMapping = function (cssName) {
            return base.cssNameMapping_[cssName] || cssName;
        };
        var renameByParts = function (cssName) {
            // Remap all the parts individually.
            var parts = cssName.split('-');
            var mapped = [];
            for (var i = 0; i < parts.length; i++) {
                mapped.push(getMapping(parts[i]));
            }
            return mapped.join('-');
        };
        var rename;
        if (base.cssNameMapping_) {
            rename = base.cssNameMappingStyle_ == 'BY_WHOLE' ?
                getMapping : renameByParts;
        }
        else {
            rename = function (a) {
                return a;
            };
        }
        if (opt_modifier) {
            return className + '-' + rename(opt_modifier);
        }
        else {
            return rename(className);
        }
    };
    /**
     * Sets the map to check when returning a value from base.getCssName(). Example:
     * <pre>
     * base.setCssNameMapping({
     *   "base": "a",
     *   "disabled": "b",
     * });
     *
     * var x = base.getCssName('base');
     * // The following evaluates to: "a a-b".
     * base.getCssName('base') + ' ' + base.getCssName(x, 'disabled')
     * </pre>
     * When declared as a map of string literals to string literals, the JSCompiler
     * will replace all calls to base.getCssName() using the supplied map if the
     * --closure_pass flag is set.
     *
     * @param {!Object} mapping A map of strings to strings where keys are possible
     *     arguments to base.getCssName() and values are the corresponding values
     *     that should be returned.
     * @param {string=} opt_style The style of css name mapping. There are two valid
     *     options: 'BY_PART', and 'BY_WHOLE'.
     * @see base.getCssName for a description.
     */
    base.setCssNameMapping = function (mapping, opt_style) {
        base.cssNameMapping_ = mapping;
        base.cssNameMappingStyle_ = opt_style;
    };
    /**
     * To use CSS renaming in compiled mode, one of the input files should have a
     * call to base.setCssNameMapping() with an object literal that the JSCompiler
     * can extract and use to replace all calls to base.getCssName(). In uncompiled
     * mode, JavaScript code should be loaded before this base.js file that declares
     * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
     * to ensure that the mapping is loaded before any calls to base.getCssName()
     * are made in uncompiled mode.
     *
     * A hook for overriding the CSS name mapping.
     * @type {Object|undefined}
     */
    base.global.CLOSURE_CSS_NAME_MAPPING;
    if (!COMPILED && base.global.CLOSURE_CSS_NAME_MAPPING) {
        // This does not call base.setCssNameMapping() because the JSCompiler
        // requires that base.setCssNameMapping() be called with an object literal.
        base.cssNameMapping_ = base.global.CLOSURE_CSS_NAME_MAPPING;
    }
    /**
     * Gets a localized message.
     *
     * This function is a compiler primitive. If you give the compiler a localized
     * message bundle, it will replace the string at compile-time with a localized
     * version, and expand base.getMsg call to a concatenated string.
     *
     * Messages must be initialized in the form:
     * <code>
     * var MSG_NAME = base.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
     * </code>
     *
     * @param {string} str Translatable string, places holders in the form {$foo}.
     * @param {Object=} opt_values Map of place holder name to value.
     * @return {string} message with placeholders filled.
     */
    base.getMsg = function (str, opt_values) {
        var values = opt_values || {};
        for (var key in values) {
            var value = ('' + values[key]).replace(/\$/g, '$$$$');
            str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
        }
        return str;
    };
    /**
     * Gets a localized message. If the message does not have a translation, gives a
     * fallback message.
     *
     * This is useful when introducing a new message that has not yet been
     * translated into all languages.
     *
     * This function is a compiler primtive. Must be used in the form:
     * <code>var x = base.getMsgWithFallback(MSG_A, MSG_B);</code>
     * where MSG_A and MSG_B were initialized with base.getMsg.
     *
     * @param {string} a The preferred message.
     * @param {string} b The fallback message.
     * @return {string} The best translated message.
     */
    base.getMsgWithFallback = function (a, b) {
        return a;
    };
    /**
     * Exposes an unobfuscated global namespace path for the given object.
     * Note that fields of the exported object *will* be obfuscated, unless they are
     * exported in turn via this function or base.exportProperty.
     *
     * Also handy for making public items that are defined in anonymous closures.
     *
     * ex. base.exportSymbol('public.path.Foo', Foo);
     *
     * ex. base.exportSymbol('public.path.Foo.staticFunction', Foo.staticFunction);
     *     public.path.Foo.staticFunction();
     *
     * ex. base.exportSymbol('public.path.Foo.prototype.myMethod',
     *                       Foo.prototype.myMethod);
     *     new public.path.Foo().myMethod();
     *
     * @param {string} publicPath Unobfuscated name to export.
     * @param {*} object Object the name should point to.
     * @param {Object=} opt_objectToExportTo The object to add the path to; default
     *     is base.global.
     */
    base.exportSymbol = function (publicPath, object, opt_objectToExportTo) {
        base.exportPath_(publicPath, object, opt_objectToExportTo);
    };
    /**
     * Exports a property unobfuscated into the object's namespace.
     * ex. base.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
     * ex. base.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
     * @param {Object} object Object whose static property is being exported.
     * @param {string} publicName Unobfuscated name to export.
     * @param {*} symbol Object the name should point to.
     */
    base.exportProperty = function (object, publicName, symbol) {
        object[publicName] = symbol;
    };
    /**
     * Inherit the prototype methods from one constructor into another.
     *
     * Usage:
     * <pre>
     * function ParentClass(a, b) { }
     * ParentClass.prototype.foo = function(a) { }
     *
     * function ChildClass(a, b, c) {
     *   base.base(this, a, b);
     * }
     * base.inherits(ChildClass, ParentClass);
     *
     * var child = new ChildClass('a', 'b', 'see');
     * child.foo(); // This works.
     * </pre>
     *
     * In addition, a superclass' implementation of a method can be invoked as
     * follows:
     *
     * <pre>
     * ChildClass.prototype.foo = function(a) {
     *   ChildClass.superClass_.foo.call(this, a);
     *   // Other code here.
     * };
     * </pre>
     *
     * @param {Function} childCtor Child class.
     * @param {Function} parentCtor Parent class.
     */
    base.inherits = function (childCtor, parentCtor) {
        /** @constructor */
        function tempCtor() { }
        ;
        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor();
        /** @override */
        childCtor.prototype.constructor = childCtor;
    };
    /**
     * Call up to the superclass.
     *
     * If this is called from a constructor, then this calls the superclass
     * contsructor with arguments 1-N.
     *
     * If this is called from a prototype method, then you must pass the name of the
     * method as the second argument to this function. If you do not, you will get a
     * runtime error. This calls the superclass' method with arguments 2-N.
     *
     * This function only works if you use base.inherits to express inheritance
     * relationships between your classes.
     *
     * This function is a compiler primitive. At compile-time, the compiler will do
     * macro expansion to remove a lot of the extra overhead that this function
     * introduces. The compiler will also enforce a lot of the assumptions that this
     * function makes, and treat it as a compiler error if you break them.
     *
     * @param {!Object} me Should always be "this".
     * @param {*=} opt_methodName The method name if calling a super method.
     * @param {...*} var_args The rest of the arguments.
     * @return {*} The return value of the superclass method.
     */
    base.base = function (me, opt_methodName, var_args) {
        var caller = arguments.callee.caller;
        if (base.DEBUG) {
            if (!caller) {
                throw Error('arguments.caller not defined.  base.base() expects not ' +
                    'to be running in strict mode. See ' +
                    'http://www.ecma-international.org/ecma-262/5.1/#sec-C');
            }
        }
        if (caller['superClass_']) {
            // This is a constructor. Call the superclass constructor.
            return caller['superClass_'].constructor.apply(me, Array.prototype.slice.call(arguments, 1));
        }
        var args = Array.prototype.slice.call(arguments, 2);
        var foundCaller = false;
        for (var ctor = me.constructor; ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
            if (ctor.prototype[opt_methodName] === caller) {
                foundCaller = true;
            }
            else if (foundCaller) {
                return ctor.prototype[opt_methodName].apply(me, args);
            }
        }
        // If we did not find the caller in the prototype chain, then one of two
        // things happened:
        // 1) The caller is an instance method.
        // 2) This method was not called by the right caller.
        if (me[opt_methodName] === caller) {
            return me.constructor.prototype[opt_methodName].apply(me, args);
        }
        else {
            throw Error('base.base called from a method of one name ' +
                'to a method of a different name');
        }
    };
    /**
     * Allow for aliasing within scope functions.  This function exists for
     * uncompiled code - in compiled code the calls will be inlined and the aliases
     * applied.  In uncompiled code the function is simply run since the aliases as
     * written are valid JavaScript.
     * @param {function()} fn Function to call.  This function can contain aliases
     *     to namespaces (e.g. "var dom = base.dom") or classes
     *     (e.g. "var Timer = base.Timer").
     */
    base.scope = function (fn) {
        fn.call(base.global);
    };
});

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define('pytools/TokenError',["require", "exports", './asserts', './base'], function (require, exports, asserts_1, base_1) {
    "use strict";
    /**
     * @class TokenError
     * @extends SyntaxError
     */
    var TokenError = (function (_super) {
        __extends(TokenError, _super);
        /**
         * @class TokenError
         * @constructor
         * @param {string} message
         * @param {string} fileName
         * @param {number} lineNumber
         * @param {number} columnNumber
         */
        function TokenError(message, fileName, lineNumber, columnNumber) {
            _super.call(this);
            asserts_1.assert(base_1.isString(message), "message must be a string");
            asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
            asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
            asserts_1.assert(base_1.isNumber(columnNumber), "columnNumber must be a number");
            this.name = "TokenError";
            this.message = message;
            this.fileName = fileName;
            this.lineNumber = lineNumber;
            this.columnNumber = columnNumber;
        }
        return TokenError;
    }(SyntaxError));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = TokenError;
});

define('pytools/Tokenizer',["require", "exports", './asserts', './base', './TokenError', './Tokens'], function (require, exports, asserts_1, base_1, TokenError_1, Tokens_1) {
    "use strict";
    /**
     * This is a port of tokenize.py by Ka-Ping Yee.
     *
     * each call to readline should return one line of input as a string, or
     * undefined if it's finished.
     *
     * callback is called for each token with 5 args:
     * 1. the token type
     * 2. the token string
     * 3. [ start_row, start_col ]
     * 4. [ end_row, end_col ]
     * 5. logical line where the token was found, including continuation lines
     *
     * callback can return true to abort.
     */
    // TODO: Make this the default export and rename the file.
    var Tokenizer = (function () {
        /**
         * @constructor
         * @param {string} fileName
         */
        function Tokenizer(fileName, interactive, callback) {
            asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
            this.fileName = fileName;
            this.callback = callback;
            this.lnum = 0;
            this.parenlev = 0;
            this.continued = false;
            this.namechars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
            this.numchars = '0123456789';
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
            this.indents = [0];
            this.endprog = /.*/;
            this.strstart = [-1, -1];
            this.interactive = interactive;
            this.doneFunc = function () {
                for (var i = 1; i < this.indents.length; ++i) {
                    if (this.callback(Tokens_1.default.T_DEDENT, '', [this.lnum, 0], [this.lnum, 0], ''))
                        return 'done';
                }
                if (this.callback(Tokens_1.default.T_ENDMARKER, '', [this.lnum, 0], [this.lnum, 0], ''))
                    return 'done';
                return 'failed';
            };
        }
        /**
         * @method generateTokens
         * @param line {string}
         * @return {boolean | string} 'done' or true?
         */
        Tokenizer.prototype.generateTokens = function (line) {
            var endmatch, pos, column, end, max;
            // bnm - Move these definitions in this function otherwise test state is preserved between
            // calls on single3prog and double3prog causing weird errors with having multiple instances
            // of triple quoted strings in the same program.
            var pseudoprog = new RegExp(PseudoToken);
            var single3prog = new RegExp(Single3, "g");
            var double3prog = new RegExp(Double3, "g");
            var endprogs = { "'": new RegExp(Single, "g"), '"': new RegExp(Double_, "g"),
                "'''": single3prog, '"""': double3prog,
                "r'''": single3prog, 'r"""': double3prog,
                "u'''": single3prog, 'u"""': double3prog,
                "b'''": single3prog, 'b"""': double3prog,
                "ur'''": single3prog, 'ur"""': double3prog,
                "br'''": single3prog, 'br"""': double3prog,
                "R'''": single3prog, 'R"""': double3prog,
                "U'''": single3prog, 'U"""': double3prog,
                "B'''": single3prog, 'B"""': double3prog,
                "uR'''": single3prog, 'uR"""': double3prog,
                "Ur'''": single3prog, 'Ur"""': double3prog,
                "UR'''": single3prog, 'UR"""': double3prog,
                "bR'''": single3prog, 'bR"""': double3prog,
                "Br'''": single3prog, 'Br"""': double3prog,
                "BR'''": single3prog, 'BR"""': double3prog,
                'r': null, 'R': null,
                'u': null, 'U': null,
                'b': null, 'B': null
            };
            if (!line)
                line = '';
            this.lnum += 1;
            pos = 0;
            max = line.length;
            if (this.contstr.length > 0) {
                if (!line) {
                    throw new TokenError_1.default("EOF in multi-line string", this.fileName, this.strstart[0], this.strstart[1]);
                }
                this.endprog.lastIndex = 0;
                endmatch = this.endprog.test(line);
                if (endmatch) {
                    pos = end = this.endprog.lastIndex;
                    if (this.callback(Tokens_1.default.T_STRING, this.contstr + line.substring(0, end), this.strstart, [this.lnum, end], this.contline + line))
                        return 'done';
                    this.contstr = '';
                    this.needcont = false;
                    this.contline = undefined;
                }
                else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n") {
                    if (this.callback(Tokens_1.default.T_ERRORTOKEN, this.contstr + line, this.strstart, [this.lnum, line.length], this.contline)) {
                        return 'done';
                    }
                    this.contstr = '';
                    this.contline = undefined;
                    return false;
                }
                else {
                    this.contstr += line;
                    this.contline = this.contline + line;
                    return false;
                }
            }
            else if (this.parenlev === 0 && !this.continued) {
                if (!line)
                    return this.doneFunc();
                column = 0;
                while (pos < max) {
                    if (line.charAt(pos) === ' ')
                        column += 1;
                    else if (line.charAt(pos) === '\t')
                        column = (column / tabsize + 1) * tabsize;
                    else if (line.charAt(pos) === '\f')
                        column = 0;
                    else
                        break;
                    pos = pos + 1;
                }
                if (pos === max)
                    return this.doneFunc();
                if ("#\r\n".indexOf(line.charAt(pos)) !== -1) {
                    if (line.charAt(pos) === '#') {
                        var comment_token = rstrip(line.substring(pos), '\r\n');
                        var nl_pos = pos + comment_token.length;
                        if (this.callback(Tokens_1.default.T_COMMENT, comment_token, [this.lnum, pos], [this.lnum, pos + comment_token.length], line))
                            return 'done';
                        if (this.callback(Tokens_1.default.T_NL, line.substring(nl_pos), [this.lnum, nl_pos], [this.lnum, line.length], line))
                            return 'done';
                        return false;
                    }
                    else {
                        if (this.callback(Tokens_1.default.T_NL, line.substring(pos), [this.lnum, pos], [this.lnum, line.length], line))
                            return 'done';
                        if (!this.interactive)
                            return false;
                    }
                }
                if (column > this.indents[this.indents.length - 1]) {
                    this.indents.push(column);
                    if (this.callback(Tokens_1.default.T_INDENT, line.substring(0, pos), [this.lnum, 0], [this.lnum, pos], line))
                        return 'done';
                }
                while (column < this.indents[this.indents.length - 1]) {
                    if (!contains(this.indents, column)) {
                        throw indentationError("unindent does not match any outer indentation level", this.fileName, [this.lnum, 0], [this.lnum, pos], line);
                    }
                    this.indents.splice(this.indents.length - 1, 1);
                    if (this.callback(Tokens_1.default.T_DEDENT, '', [this.lnum, pos], [this.lnum, pos], line)) {
                        return 'done';
                    }
                }
            }
            else {
                if (!line) {
                    throw new TokenError_1.default("EOF in multi-line statement", this.fileName, this.lnum, 0);
                }
                this.continued = false;
            }
            while (pos < max) {
                // js regexes don't return any info about matches, other than the
                // content. we'd like to put a \w+ before pseudomatch, but then we
                // can't get any data
                var capos = line.charAt(pos);
                while (capos === ' ' || capos === '\f' || capos === '\t') {
                    pos += 1;
                    capos = line.charAt(pos);
                }
                pseudoprog.lastIndex = 0;
                var pseudomatch = pseudoprog.exec(line.substring(pos));
                if (pseudomatch) {
                    var start = pos;
                    end = start + pseudomatch[1].length;
                    var spos = [this.lnum, start];
                    var epos = [this.lnum, end];
                    pos = end;
                    var token = line.substring(start, end);
                    var initial = line.charAt(start);
                    if (this.numchars.indexOf(initial) !== -1 || (initial === '.' && token !== '.')) {
                        if (this.callback(Tokens_1.default.T_NUMBER, token, spos, epos, line))
                            return 'done';
                    }
                    else if (initial === '\r' || initial === '\n') {
                        var newl = Tokens_1.default.T_NEWLINE;
                        if (this.parenlev > 0)
                            newl = Tokens_1.default.T_NL;
                        if (this.callback(newl, token, spos, epos, line))
                            return 'done';
                    }
                    else if (initial === '#') {
                        if (this.callback(Tokens_1.default.T_COMMENT, token, spos, epos, line))
                            return 'done';
                    }
                    else if (triple_quoted.hasOwnProperty(token)) {
                        this.endprog = endprogs[token];
                        this.endprog.lastIndex = 0;
                        endmatch = this.endprog.test(line.substring(pos));
                        if (endmatch) {
                            pos = this.endprog.lastIndex + pos;
                            token = line.substring(start, pos);
                            if (this.callback(Tokens_1.default.T_STRING, token, spos, [this.lnum, pos], line))
                                return 'done';
                        }
                        else {
                            this.strstart = [this.lnum, start];
                            this.contstr = line.substring(start);
                            this.contline = line;
                            return false;
                        }
                    }
                    else if (single_quoted.hasOwnProperty(initial) ||
                        single_quoted.hasOwnProperty(token.substring(0, 2)) ||
                        single_quoted.hasOwnProperty(token.substring(0, 3))) {
                        if (token[token.length - 1] === '\n') {
                            this.strstart = [this.lnum, start];
                            this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                            this.contstr = line.substring(start);
                            this.needcont = true;
                            this.contline = line;
                            return false;
                        }
                        else {
                            if (this.callback(Tokens_1.default.T_STRING, token, spos, epos, line))
                                return 'done';
                        }
                    }
                    else if (this.namechars.indexOf(initial) !== -1) {
                        if (this.callback(Tokens_1.default.T_NAME, token, spos, epos, line))
                            return 'done';
                    }
                    else if (initial === '\\') {
                        if (this.callback(Tokens_1.default.T_NL, token, spos, [this.lnum, pos], line))
                            return 'done';
                        this.continued = true;
                    }
                    else {
                        if ('([{'.indexOf(initial) !== -1)
                            this.parenlev += 1;
                        else if (')]}'.indexOf(initial) !== -1)
                            this.parenlev -= 1;
                        if (this.callback(Tokens_1.default.T_OP, token, spos, epos, line))
                            return 'done';
                    }
                }
                else {
                    if (this.callback(Tokens_1.default.T_ERRORTOKEN, line.charAt(pos), [this.lnum, pos], [this.lnum, pos + 1], line))
                        return 'done';
                    pos += 1;
                }
            }
            return false;
        };
        /**
         * Not sure who needs this yet.
         */
        Tokenizer.Tokens = Tokens_1.default;
        return Tokenizer;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Tokenizer;
    /** @param {...*} x */
    function group(x, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        var args = Array.prototype.slice.call(arguments);
        return '(' + args.join('|') + ')';
    }
    /** @param {...*} x */
    function any(x) { return group.apply(null, arguments) + "*"; }
    /** @param {...*} x */
    function maybe(x) { return group.apply(null, arguments) + "?"; }
    /* we have to use string and ctor to be able to build patterns up. + on /.../
     * does something strange. */
    var Whitespace = "[ \\f\\t]*";
    var Comment_ = "#[^\\r\\n]*";
    var Ident = "[a-zA-Z_]\\w*";
    var Binnumber = '0[bB][01]*';
    var Hexnumber = '0[xX][\\da-fA-F]*[lL]?';
    var Octnumber = '0[oO]?[0-7]*[lL]?';
    var Decnumber = '[1-9]\\d*[lL]?';
    var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);
    var Exponent = "[eE][-+]?\\d+";
    var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
    var Expfloat = '\\d+' + Exponent;
    var Floatnumber = group(Pointfloat, Expfloat);
    var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
    var Number_ = group(Imagnumber, Floatnumber, Intnumber);
    // tail end of ' string
    var Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
    // tail end of " string
    var Double_ = '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
    // tail end of ''' string
    var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
    // tail end of """ string
    var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
    var Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
    var String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'", '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');
    // Because of leftmost-then-longest match semantics, be sure to put the
    // longest operators first (e.g., if = came before ==, == would get
    // recognized as two instances of =).
    var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=", "//=?", "->", "[+\\-*/%&|^=<>]=?", "~");
    var Bracket = '[\\][(){}]';
    var Special = group('\\r?\\n', '[:;.,`@]');
    var Funny = group(Operator, Bracket, Special);
    var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
        group("'", '\\\\\\r?\\n'), '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
        group('"', '\\\\\\r?\\n'));
    var PseudoExtras = group('\\\\\\r?\\n', Comment_, Triple);
    // Need to prefix with "^" as we only want to match what's next
    var PseudoToken = "^" + group(PseudoExtras, Number_, Funny, ContStr, Ident);
    var pseudoprog;
    var single3prog;
    var double3prog;
    var endprogs = {};
    var triple_quoted = {
        "'''": true, '"""': true,
        "r'''": true, 'r"""': true, "R'''": true, 'R"""': true,
        "u'''": true, 'u"""': true, "U'''": true, 'U"""': true,
        "b'''": true, 'b"""': true, "B'''": true, 'B"""': true,
        "ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
        "uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
        "br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
        "bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
    };
    var single_quoted = {
        "'": true, '"': true,
        "r'": true, 'r"': true, "R'": true, 'R"': true,
        "u'": true, 'u"': true, "U'": true, 'U"': true,
        "b'": true, 'b"': true, "B'": true, 'B"': true,
        "ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
        "uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
        "br'": true, 'br"': true, "Br'": true, 'Br"': true,
        "bR'": true, 'bR"': true, "BR'": true, 'BR"': true
    };
    // hack to make closure keep those objects. not sure what a better way is.
    (function () {
        for (var k in triple_quoted) { }
        for (var k in single_quoted) { }
    }());
    var tabsize = 8;
    function contains(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i] === obj) {
                return true;
            }
        }
        return false;
    }
    function rstrip(input, what) {
        for (var i = input.length; i > 0; --i) {
            if (what.indexOf(input.charAt(i - 1)) === -1)
                break;
        }
        return input.substring(0, i);
    }
    /**
     * @param {string} message
     * @param {string} fileName
     * @param {Array.<number>} begin
     * @param {Array.<number>} end
     * @param {string|undefined} text
     */
    function indentationError(message, fileName, begin, end, text) {
        if (!base_1.isArray(begin)) {
            asserts_1.fail("begin must be Array.<number>");
        }
        if (!base_1.isArray(end)) {
            asserts_1.fail("end must be Array.<number>");
        }
        var e = new SyntaxError(message /*, fileName*/);
        e.name = "IndentationError";
        e['fileName'] = fileName;
        if (base_1.isDef(begin)) {
            e['lineNumber'] = begin[0];
            e['columnNumber'] = begin[1];
        }
        return e;
    }
});

define('pytools/tokenNames',["require", "exports"], function (require, exports) {
    "use strict";
    var tokenNames = {
        0: 'T_ENDMARKER',
        1: 'T_NAME', 2: 'T_NUMBER', 3: 'T_STRING', 4: 'T_NEWLINE',
        5: 'T_INDENT', 6: 'T_DEDENT', 7: 'T_LPAR', 8: 'T_RPAR', 9: 'T_LSQB',
        10: 'T_RSQB', 11: 'T_COLON', 12: 'T_COMMA', 13: 'T_SEMI', 14: 'T_PLUS',
        15: 'T_MINUS', 16: 'T_STAR', 17: 'T_SLASH', 18: 'T_VBAR', 19: 'T_AMPER',
        20: 'T_LESS', 21: 'T_GREATER', 22: 'T_EQUAL', 23: 'T_DOT', 24: 'T_PERCENT',
        25: 'T_BACKQUOTE', 26: 'T_LBRACE', 27: 'T_RBRACE', 28: 'T_EQEQUAL', 29: 'T_NOTEQUAL',
        30: 'T_LESSEQUAL', 31: 'T_GREATEREQUAL', 32: 'T_TILDE', 33: 'T_CIRCUMFLEX', 34: 'T_LEFTSHIFT',
        35: 'T_RIGHTSHIFT', 36: 'T_DOUBLESTAR', 37: 'T_PLUSEQUAL', 38: 'T_MINEQUAL', 39: 'T_STAREQUAL',
        40: 'T_SLASHEQUAL', 41: 'T_PERCENTEQUAL', 42: 'T_AMPEREQUAL', 43: 'T_VBAREQUAL', 44: 'T_CIRCUMFLEXEQUAL',
        45: 'T_LEFTSHIFTEQUAL', 46: 'T_RIGHTSHIFTEQUAL', 47: 'T_DOUBLESTAREQUAL', 48: 'T_DOUBLESLASH', 49: 'T_DOUBLESLASHEQUAL',
        50: 'T_AT', 51: 'T_OP', 52: 'T_COMMENT', 53: 'T_NL', 54: 'T_RARROW',
        55: 'T_ERRORTOKEN', 56: 'T_N_TOKENS',
        256: 'T_NT_OFFSET'
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = tokenNames;
});

define('pytools/parser',["require", "exports", './tables', './asserts', './base', './Tokenizer', './Tokens', './tokenNames'], function (require, exports, tables_1, asserts_1, base_1, Tokenizer_1, Tokens_1, tokenNames_1) {
    "use strict";
    var OpMap = tables_1.default.OpMap;
    var ParseTables = tables_1.default.ParseTables;
    // low level parser to a concrete syntax tree, derived from cpython's lib2to3
    /**
     * @param {string} message
     * @param {string} fileName
     * @param {Array.<number>=} begin
     * @param {Array.<number>=} end
     */
    function parseError(message, fileName, begin, end) {
        var e = new SyntaxError(message /*, fileName*/);
        e.name = "ParseError";
        e['fileName'] = fileName;
        if (base_1.isDef(begin)) {
            e['lineNumber'] = begin[0];
            e['columnNumber'] = begin[1];
        }
        return e;
    }
    var Parser = (function () {
        /**
         *
         * @constructor
         * @param {Object} grammar
         *
         * p = new Parser(grammar);
         * p.setup([start]);
         * foreach input token:
         *     if p.addtoken(...):
         *         break
         * root = p.rootnode
         *
         * can throw ParseError
         */
        function Parser(filename, grammar) {
            this.filename = filename;
            this.grammar = grammar;
            return this;
        }
        Parser.prototype.setup = function (start) {
            start = start || this.grammar.start;
            var newnode = {
                type: start,
                value: null,
                context: null,
                children: []
            };
            var stackentry = {
                dfa: this.grammar.dfas[start],
                state: 0,
                node: newnode
            };
            this.stack = [stackentry];
            this.used_names = {};
        };
        // Add a token; return true if we're done
        Parser.prototype.addtoken = function (type, value, context) {
            var ilabel = this.classify(type, value, context);
            OUTERWHILE: while (true) {
                var tp = this.stack[this.stack.length - 1];
                var states = tp.dfa[0];
                var first = tp.dfa[1];
                var arcs = states[tp.state];
                // look for a state with this label
                for (var a = 0; a < arcs.length; ++a) {
                    var i = arcs[a][0];
                    var newstate = arcs[a][1];
                    var t = this.grammar.labels[i][0];
                    var v = this.grammar.labels[i][1];
                    if (ilabel === i) {
                        // look it up in the list of labels
                        asserts_1.assert(t < 256);
                        // shift a token; we're done with it
                        this.shift(type, value, newstate, context);
                        // pop while we are in an accept-only state
                        var state = newstate;
                        while (states[state].length === 1
                            && states[state][0][0] === 0
                            && states[state][0][1] === state) {
                            this.pop();
                            if (this.stack.length === 0) {
                                // done!
                                return true;
                            }
                            tp = this.stack[this.stack.length - 1];
                            state = tp.state;
                            states = tp.dfa[0];
                            first = tp.dfa[1];
                        }
                        // done with this token
                        return false;
                    }
                    else if (t >= 256) {
                        var itsdfa = this.grammar.dfas[t];
                        var itsfirst = itsdfa[1];
                        if (itsfirst.hasOwnProperty(ilabel)) {
                            // push a symbol
                            this.push(t, this.grammar.dfas[t], newstate, context);
                            continue OUTERWHILE;
                        }
                    }
                }
                if (findInDfa(arcs, [0, tp.state])) {
                    // an accepting state, pop it and try something else
                    this.pop();
                    if (this.stack.length === 0) {
                        throw parseError("too much input", this.filename);
                    }
                }
                else {
                    // no transition
                    throw parseError("bad input", this.filename, context[0], context[1]);
                }
            }
        };
        // turn a token into a label
        Parser.prototype.classify = function (type, value, context) {
            var ilabel;
            if (type === Tokens_1.default.T_NAME) {
                this.used_names[value] = true;
                ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];
                if (ilabel) {
                    return ilabel;
                }
            }
            ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
            if (!ilabel) {
                throw parseError("bad token", this.filename, context[0], context[1]);
            }
            return ilabel;
        };
        // shift a token
        Parser.prototype.shift = function (type, value, newstate, context) {
            var dfa = this.stack[this.stack.length - 1].dfa;
            var state = this.stack[this.stack.length - 1].state;
            var node = this.stack[this.stack.length - 1].node;
            var newnode = {
                type: type,
                value: value,
                lineno: context[0][0],
                col_offset: context[0][1],
                children: null
            };
            if (newnode) {
                node.children.push(newnode);
            }
            this.stack[this.stack.length - 1] = { dfa: dfa, state: newstate, node: node };
        };
        // push a nonterminal
        Parser.prototype.push = function (type, newdfa, newstate, context) {
            var dfa = this.stack[this.stack.length - 1].dfa;
            var node = this.stack[this.stack.length - 1].node;
            this.stack[this.stack.length - 1] = { dfa: dfa, state: newstate, node: node };
            var newnode = { type: type, value: null, lineno: context[0][0], col_offset: context[0][1], children: [] };
            this.stack.push({ dfa: newdfa, state: 0, node: newnode });
        };
        // pop a nonterminal
        Parser.prototype.pop = function () {
            var pop = this.stack.pop();
            var newnode = pop.node;
            if (newnode) {
                if (this.stack.length !== 0) {
                    var node = this.stack[this.stack.length - 1].node;
                    node.children.push(newnode);
                }
                else {
                    this.rootnode = newnode;
                    this.rootnode.used_names = this.used_names;
                }
            }
        };
        return Parser;
    }());
    /**
     * Finds the specified
     * @param a An array of arrays where each element is an array of two integers.
     * @param obj An array containing two integers.
     */
    function findInDfa(a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i][0] === obj[0] && a[i][1] === obj[1]) {
                return true;
            }
        }
        return false;
    }
    //var ac = 0;
    //var bc = 0;
    /**
     * parser for interactive input. returns a function that should be called with
     * lines of input as they are entered. the function will return false
     * until the input is complete, when it will return the rootnode of the parse.
     *
     * @param {string} filename
     * @param {string=} style root of parse tree (optional)
     */
    function makeParser(filename, style) {
        if (style === undefined)
            style = "file_input";
        var p = new Parser(filename, ParseTables);
        // for closure's benefit
        if (style === "file_input")
            p.setup(ParseTables.sym.file_input);
        else
            asserts_1.fail("TODO");
        var curIndex = 0;
        var lineno = 1;
        var column = 0;
        var prefix = "";
        var T_COMMENT = Tokens_1.default.T_COMMENT;
        var T_NL = Tokens_1.default.T_NL;
        var T_OP = Tokens_1.default.T_OP;
        var tokenizer = new Tokenizer_1.default(filename, style === "single_input", function (type, value, start, end, line) {
            var s_lineno = start[0];
            var s_column = start[1];
            /*
            if (s_lineno !== lineno && s_column !== column)
            {
                // todo; update prefix and line/col
            }
            */
            if (type === T_COMMENT || type === T_NL) {
                prefix += value;
                lineno = end[0];
                column = end[1];
                if (value[value.length - 1] === "\n") {
                    lineno += 1;
                    column = 0;
                }
                return undefined;
            }
            if (type === T_OP) {
                type = OpMap[value];
            }
            if (p.addtoken(type, value, [start, end, line])) {
                return true;
            }
        });
        return function (line) {
            var ret = tokenizer.generateTokens(line);
            if (ret) {
                if (ret !== "done") {
                    throw parseError("incomplete input", this.filename);
                }
                return p.rootnode;
            }
            return false;
        };
    }
    function parse(filename, input) {
        var parseFunc = makeParser(filename);
        if (input.substr(input.length - 1, 1) !== "\n")
            input += "\n";
        var lines = input.split("\n");
        var ret;
        for (var i = 0; i < lines.length; ++i) {
            ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
        }
        return ret;
    }
    exports.parse = parse;
    function parseTreeDump(n) {
        var ret = "";
        if (n.type >= 256) {
            ret += ParseTables.number2symbol[n.type] + "\n";
            for (var i = 0; i < n.children.length; ++i) {
                ret += parseTreeDump(n.children[i]);
            }
        }
        else {
            ret += tokenNames_1.default[n.type] + ": " + n.value + "\n";
        }
        return ret;
    }
    exports.parseTreeDump = parseTreeDump;
});

// Do NOT MODIFY. File automatically generated by asdl_js.py.
define('pytools/astnodes',["require", "exports"], function (require, exports) {
    "use strict";
    // ----------------------
    // operator functions
    // ----------------------
    var Load = (function () {
        function Load() {
        }
        return Load;
    }());
    exports.Load = Load;
    var Store = (function () {
        function Store() {
        }
        return Store;
    }());
    exports.Store = Store;
    var Del = (function () {
        function Del() {
        }
        return Del;
    }());
    exports.Del = Del;
    var AugLoad = (function () {
        function AugLoad() {
        }
        return AugLoad;
    }());
    exports.AugLoad = AugLoad;
    var AugStore = (function () {
        function AugStore() {
        }
        return AugStore;
    }());
    exports.AugStore = AugStore;
    var Param = (function () {
        function Param() {
        }
        return Param;
    }());
    exports.Param = Param;
    var And = (function () {
        function And() {
        }
        return And;
    }());
    exports.And = And;
    var Or = (function () {
        function Or() {
        }
        return Or;
    }());
    exports.Or = Or;
    var Add = (function () {
        function Add() {
        }
        return Add;
    }());
    exports.Add = Add;
    var Sub = (function () {
        function Sub() {
        }
        return Sub;
    }());
    exports.Sub = Sub;
    var Mult = (function () {
        function Mult() {
        }
        return Mult;
    }());
    exports.Mult = Mult;
    var Div = (function () {
        function Div() {
        }
        return Div;
    }());
    exports.Div = Div;
    var Mod = (function () {
        function Mod() {
        }
        return Mod;
    }());
    exports.Mod = Mod;
    var Pow = (function () {
        function Pow() {
        }
        return Pow;
    }());
    exports.Pow = Pow;
    var LShift = (function () {
        function LShift() {
        }
        return LShift;
    }());
    exports.LShift = LShift;
    var RShift = (function () {
        function RShift() {
        }
        return RShift;
    }());
    exports.RShift = RShift;
    var BitOr = (function () {
        function BitOr() {
        }
        return BitOr;
    }());
    exports.BitOr = BitOr;
    var BitXor = (function () {
        function BitXor() {
        }
        return BitXor;
    }());
    exports.BitXor = BitXor;
    var BitAnd = (function () {
        function BitAnd() {
        }
        return BitAnd;
    }());
    exports.BitAnd = BitAnd;
    var FloorDiv = (function () {
        function FloorDiv() {
        }
        return FloorDiv;
    }());
    exports.FloorDiv = FloorDiv;
    var Invert = (function () {
        function Invert() {
        }
        return Invert;
    }());
    exports.Invert = Invert;
    var Not = (function () {
        function Not() {
        }
        return Not;
    }());
    exports.Not = Not;
    var UAdd = (function () {
        function UAdd() {
        }
        return UAdd;
    }());
    exports.UAdd = UAdd;
    var USub = (function () {
        function USub() {
        }
        return USub;
    }());
    exports.USub = USub;
    var Eq = (function () {
        function Eq() {
        }
        return Eq;
    }());
    exports.Eq = Eq;
    var NotEq = (function () {
        function NotEq() {
        }
        return NotEq;
    }());
    exports.NotEq = NotEq;
    var Lt = (function () {
        function Lt() {
        }
        return Lt;
    }());
    exports.Lt = Lt;
    var LtE = (function () {
        function LtE() {
        }
        return LtE;
    }());
    exports.LtE = LtE;
    var Gt = (function () {
        function Gt() {
        }
        return Gt;
    }());
    exports.Gt = Gt;
    var GtE = (function () {
        function GtE() {
        }
        return GtE;
    }());
    exports.GtE = GtE;
    var Is = (function () {
        function Is() {
        }
        return Is;
    }());
    exports.Is = Is;
    var IsNot = (function () {
        function IsNot() {
        }
        return IsNot;
    }());
    exports.IsNot = IsNot;
    var In_ = (function () {
        function In_() {
        }
        return In_;
    }());
    exports.In_ = In_;
    var NotIn = (function () {
        function NotIn() {
        }
        return NotIn;
    }());
    exports.NotIn = NotIn;
    // ----------------------
    // constructors for nodes
    // ----------------------
    var Module = (function () {
        function Module(body) {
            this.body = body;
        }
        return Module;
    }());
    exports.Module = Module;
    var Interactive = (function () {
        function Interactive(body) {
            this.body = body;
        }
        return Interactive;
    }());
    exports.Interactive = Interactive;
    var Expression = (function () {
        function Expression(body) {
            this.body = body;
        }
        return Expression;
    }());
    exports.Expression = Expression;
    var Suite = (function () {
        function Suite(body) {
            this.body = body;
        }
        return Suite;
    }());
    exports.Suite = Suite;
    var FunctionDef = (function () {
        function FunctionDef(name, args, body, decorator_list, lineno, col_offset) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return FunctionDef;
    }());
    exports.FunctionDef = FunctionDef;
    var ClassDef = (function () {
        function ClassDef(name, bases, body, decorator_list, lineno, col_offset) {
            this.name = name;
            this.bases = bases;
            this.body = body;
            this.decorator_list = decorator_list;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ClassDef;
    }());
    exports.ClassDef = ClassDef;
    var Return_ = (function () {
        function Return_(value, lineno, col_offset) {
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Return_;
    }());
    exports.Return_ = Return_;
    var Delete_ = (function () {
        function Delete_(targets, lineno, col_offset) {
            this.targets = targets;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Delete_;
    }());
    exports.Delete_ = Delete_;
    var Assign = (function () {
        function Assign(targets, value, lineno, col_offset) {
            this.targets = targets;
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Assign;
    }());
    exports.Assign = Assign;
    var AugAssign = (function () {
        function AugAssign(target, op, value, lineno, col_offset) {
            this.target = target;
            this.op = op;
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return AugAssign;
    }());
    exports.AugAssign = AugAssign;
    var Print = (function () {
        function Print(dest, values, nl, lineno, col_offset) {
            this.dest = dest;
            this.values = values;
            this.nl = nl;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Print;
    }());
    exports.Print = Print;
    var For_ = (function () {
        function For_(target, iter, body, orelse, lineno, col_offset) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return For_;
    }());
    exports.For_ = For_;
    var While_ = (function () {
        function While_(test, body, orelse, lineno, col_offset) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return While_;
    }());
    exports.While_ = While_;
    var If_ = (function () {
        function If_(test, body, orelse, lineno, col_offset) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return If_;
    }());
    exports.If_ = If_;
    var With_ = (function () {
        function With_(context_expr, optional_vars, body, lineno, col_offset) {
            this.context_expr = context_expr;
            this.optional_vars = optional_vars;
            this.body = body;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return With_;
    }());
    exports.With_ = With_;
    var Raise = (function () {
        function Raise(type, inst, tback, lineno, col_offset) {
            this.type = type;
            this.inst = inst;
            this.tback = tback;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Raise;
    }());
    exports.Raise = Raise;
    var TryExcept = (function () {
        function TryExcept(body, handlers, orelse, lineno, col_offset) {
            this.body = body;
            this.handlers = handlers;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return TryExcept;
    }());
    exports.TryExcept = TryExcept;
    var TryFinally = (function () {
        function TryFinally(body, finalbody, lineno, col_offset) {
            this.body = body;
            this.finalbody = finalbody;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return TryFinally;
    }());
    exports.TryFinally = TryFinally;
    var Assert = (function () {
        function Assert(test, msg, lineno, col_offset) {
            this.test = test;
            this.msg = msg;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Assert;
    }());
    exports.Assert = Assert;
    var Import_ = (function () {
        function Import_(names, lineno, col_offset) {
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Import_;
    }());
    exports.Import_ = Import_;
    var ImportFrom = (function () {
        function ImportFrom(module, names, level, lineno, col_offset) {
            this.module = module;
            this.names = names;
            this.level = level;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ImportFrom;
    }());
    exports.ImportFrom = ImportFrom;
    var Exec = (function () {
        function Exec(body, globals, locals, lineno, col_offset) {
            this.body = body;
            this.globals = globals;
            this.locals = locals;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Exec;
    }());
    exports.Exec = Exec;
    var Global = (function () {
        function Global(names, lineno, col_offset) {
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Global;
    }());
    exports.Global = Global;
    var NonLocal = (function () {
        function NonLocal(names, lineno, col_offset) {
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return NonLocal;
    }());
    exports.NonLocal = NonLocal;
    var Expr = (function () {
        function Expr(value, lineno, col_offset) {
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Expr;
    }());
    exports.Expr = Expr;
    var Pass = (function () {
        function Pass(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Pass;
    }());
    exports.Pass = Pass;
    var Break_ = (function () {
        function Break_(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Break_;
    }());
    exports.Break_ = Break_;
    var Continue_ = (function () {
        function Continue_(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Continue_;
    }());
    exports.Continue_ = Continue_;
    var BoolOp = (function () {
        function BoolOp(op, values, lineno, col_offset) {
            this.op = op;
            this.values = values;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return BoolOp;
    }());
    exports.BoolOp = BoolOp;
    var BinOp = (function () {
        function BinOp(left, op, right, lineno, col_offset) {
            this.left = left;
            this.op = op;
            this.right = right;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return BinOp;
    }());
    exports.BinOp = BinOp;
    var UnaryOp = (function () {
        function UnaryOp(op, operand, lineno, col_offset) {
            this.op = op;
            this.operand = operand;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return UnaryOp;
    }());
    exports.UnaryOp = UnaryOp;
    var Lambda = (function () {
        function Lambda(args, body, lineno, col_offset) {
            this.args = args;
            this.body = body;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Lambda;
    }());
    exports.Lambda = Lambda;
    var IfExp = (function () {
        function IfExp(test, body, orelse, lineno, col_offset) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return IfExp;
    }());
    exports.IfExp = IfExp;
    var Dict = (function () {
        function Dict(keys, values, lineno, col_offset) {
            this.keys = keys;
            this.values = values;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Dict;
    }());
    exports.Dict = Dict;
    var ListComp = (function () {
        function ListComp(elt, generators, lineno, col_offset) {
            this.elt = elt;
            this.generators = generators;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ListComp;
    }());
    exports.ListComp = ListComp;
    var GeneratorExp = (function () {
        function GeneratorExp(elt, generators, lineno, col_offset) {
            this.elt = elt;
            this.generators = generators;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return GeneratorExp;
    }());
    exports.GeneratorExp = GeneratorExp;
    var Yield = (function () {
        function Yield(value, lineno, col_offset) {
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Yield;
    }());
    exports.Yield = Yield;
    var Compare = (function () {
        function Compare(left, ops, comparators, lineno, col_offset) {
            this.left = left;
            this.ops = ops;
            this.comparators = comparators;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Compare;
    }());
    exports.Compare = Compare;
    var Call = (function () {
        function Call(func, args, keywords, starargs, kwargs, lineno, col_offset) {
            this.func = func;
            this.args = args;
            this.keywords = keywords;
            this.starargs = starargs;
            this.kwargs = kwargs;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Call;
    }());
    exports.Call = Call;
    var Num = (function () {
        function Num(n, lineno, col_offset) {
            this.n = n;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Num;
    }());
    exports.Num = Num;
    var Str = (function () {
        function Str(s, lineno, col_offset) {
            this.s = s;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Str;
    }());
    exports.Str = Str;
    var Attribute = (function () {
        function Attribute(value, attr, ctx, lineno, col_offset) {
            this.value = value;
            this.attr = attr;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Attribute;
    }());
    exports.Attribute = Attribute;
    var Subscript = (function () {
        function Subscript(value, slice, ctx, lineno, col_offset) {
            this.value = value;
            this.slice = slice;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Subscript;
    }());
    exports.Subscript = Subscript;
    var Name = (function () {
        function Name(id, ctx, lineno, col_offset) {
            this.id = id;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Name;
    }());
    exports.Name = Name;
    var List = (function () {
        function List(elts, ctx, lineno, col_offset) {
            this.elts = elts;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return List;
    }());
    exports.List = List;
    var Tuple = (function () {
        function Tuple(elts, ctx, lineno, col_offset) {
            this.elts = elts;
            this.ctx = ctx;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Tuple;
    }());
    exports.Tuple = Tuple;
    var Ellipsis = (function () {
        function Ellipsis() {
        }
        return Ellipsis;
    }());
    exports.Ellipsis = Ellipsis;
    var Slice = (function () {
        function Slice(lower, upper, step) {
            this.lower = lower;
            this.upper = upper;
            this.step = step;
        }
        return Slice;
    }());
    exports.Slice = Slice;
    var ExtSlice = (function () {
        function ExtSlice(dims) {
            this.dims = dims;
        }
        return ExtSlice;
    }());
    exports.ExtSlice = ExtSlice;
    var Index = (function () {
        function Index(value) {
            this.value = value;
        }
        return Index;
    }());
    exports.Index = Index;
    var comprehension = (function () {
        function comprehension(target, iter, ifs) {
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
        }
        return comprehension;
    }());
    exports.comprehension = comprehension;
    var ExceptHandler = (function () {
        function ExceptHandler(type, name, body, lineno, col_offset) {
            this.type = type;
            this.name = name;
            this.body = body;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ExceptHandler;
    }());
    exports.ExceptHandler = ExceptHandler;
    var arguments_ = (function () {
        function arguments_(args, vararg, kwarg, defaults) {
            this.args = args;
            this.vararg = vararg;
            this.kwarg = kwarg;
            this.defaults = defaults;
        }
        return arguments_;
    }());
    exports.arguments_ = arguments_;
    var keyword = (function () {
        function keyword(arg, value) {
            this.arg = arg;
            this.value = value;
        }
        return keyword;
    }());
    exports.keyword = keyword;
    var alias = (function () {
        function alias(name, asname) {
            this.name = name;
            this.asname = asname;
        }
        return alias;
    }());
    exports.alias = alias;
    Module.prototype['_astname'] = 'Module';
    Module.prototype['_fields'] = [
        'body', function (n) { return n.body; }
    ];
    Interactive.prototype['_astname'] = 'Interactive';
    Interactive.prototype['_fields'] = [
        'body', function (n) { return n.body; }
    ];
    Expression.prototype['_astname'] = 'Expression';
    Expression.prototype['_fields'] = [
        'body', function (n) { return n.body; }
    ];
    Suite.prototype['_astname'] = 'Suite';
    Suite.prototype['_fields'] = [
        'body', function (n) { return n.body; }
    ];
    FunctionDef.prototype['_astname'] = 'FunctionDef';
    FunctionDef.prototype['_fields'] = [
        'name', function (n) { return n.name; },
        'args', function (n) { return n.args; },
        'body', function (n) { return n.body; },
        'decorator_list', function (n) { return n.decorator_list; }
    ];
    ClassDef.prototype['_astname'] = 'ClassDef';
    ClassDef.prototype['_fields'] = [
        'name', function (n) { return n.name; },
        'bases', function (n) { return n.bases; },
        'body', function (n) { return n.body; },
        'decorator_list', function (n) { return n.decorator_list; }
    ];
    Return_.prototype['_astname'] = 'Return';
    Return_.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    Delete_.prototype['_astname'] = 'Delete';
    Delete_.prototype['_fields'] = [
        'targets', function (n) { return n.targets; }
    ];
    Assign.prototype['_astname'] = 'Assign';
    Assign.prototype['_fields'] = [
        'targets', function (n) { return n.targets; },
        'value', function (n) { return n.value; }
    ];
    AugAssign.prototype['_astname'] = 'AugAssign';
    AugAssign.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'op', function (n) { return n.op; },
        'value', function (n) { return n.value; }
    ];
    Print.prototype['_astname'] = 'Print';
    Print.prototype['_fields'] = [
        'dest', function (n) { return n.dest; },
        'values', function (n) { return n.values; },
        'nl', function (n) { return n.nl; }
    ];
    For_.prototype['_astname'] = 'For';
    For_.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'iter', function (n) { return n.iter; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    While_.prototype['_astname'] = 'While';
    While_.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    If_.prototype['_astname'] = 'If';
    If_.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    With_.prototype['_astname'] = 'With';
    With_.prototype['_fields'] = [
        'context_expr', function (n) { return n.context_expr; },
        'optional_vars', function (n) { return n.optional_vars; },
        'body', function (n) { return n.body; }
    ];
    Raise.prototype['_astname'] = 'Raise';
    Raise.prototype['_fields'] = [
        'type', function (n) { return n.type; },
        'inst', function (n) { return n.inst; },
        'tback', function (n) { return n.tback; }
    ];
    TryExcept.prototype['_astname'] = 'TryExcept';
    TryExcept.prototype['_fields'] = [
        'body', function (n) { return n.body; },
        'handlers', function (n) { return n.handlers; },
        'orelse', function (n) { return n.orelse; }
    ];
    TryFinally.prototype['_astname'] = 'TryFinally';
    TryFinally.prototype['_fields'] = [
        'body', function (n) { return n.body; },
        'finalbody', function (n) { return n.finalbody; }
    ];
    Assert.prototype['_astname'] = 'Assert';
    Assert.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'msg', function (n) { return n.msg; }
    ];
    Import_.prototype['_astname'] = 'Import';
    Import_.prototype['_fields'] = [
        'names', function (n) { return n.names; }
    ];
    ImportFrom.prototype['_astname'] = 'ImportFrom';
    ImportFrom.prototype['_fields'] = [
        'module', function (n) { return n.module; },
        'names', function (n) { return n.names; },
        'level', function (n) { return n.level; }
    ];
    Exec.prototype['_astname'] = 'Exec';
    Exec.prototype['_fields'] = [
        'body', function (n) { return n.body; },
        'globals', function (n) { return n.globals; },
        'locals', function (n) { return n.locals; }
    ];
    Global.prototype['_astname'] = 'Global';
    Global.prototype['_fields'] = [
        'names', function (n) { return n.names; }
    ];
    NonLocal.prototype['_astname'] = 'NonLocal';
    NonLocal.prototype['_fields'] = [
        'names', function (n) { return n.names; }
    ];
    Expr.prototype['_astname'] = 'Expr';
    Expr.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    Pass.prototype['_astname'] = 'Pass';
    Pass.prototype['_fields'] = [];
    Break_.prototype['_astname'] = 'Break';
    Break_.prototype['_fields'] = [];
    Continue_.prototype['_astname'] = 'Continue';
    Continue_.prototype['_fields'] = [];
    BoolOp.prototype['_astname'] = 'BoolOp';
    BoolOp.prototype['_fields'] = [
        'op', function (n) { return n.op; },
        'values', function (n) { return n.values; }
    ];
    BinOp.prototype['_astname'] = 'BinOp';
    BinOp.prototype['_fields'] = [
        'left', function (n) { return n.left; },
        'op', function (n) { return n.op; },
        'right', function (n) { return n.right; }
    ];
    UnaryOp.prototype['_astname'] = 'UnaryOp';
    UnaryOp.prototype['_fields'] = [
        'op', function (n) { return n.op; },
        'operand', function (n) { return n.operand; }
    ];
    Lambda.prototype['_astname'] = 'Lambda';
    Lambda.prototype['_fields'] = [
        'args', function (n) { return n.args; },
        'body', function (n) { return n.body; }
    ];
    IfExp.prototype['_astname'] = 'IfExp';
    IfExp.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    Dict.prototype['_astname'] = 'Dict';
    Dict.prototype['_fields'] = [
        'keys', function (n) { return n.keys; },
        'values', function (n) { return n.values; }
    ];
    ListComp.prototype['_astname'] = 'ListComp';
    ListComp.prototype['_fields'] = [
        'elt', function (n) { return n.elt; },
        'generators', function (n) { return n.generators; }
    ];
    GeneratorExp.prototype['_astname'] = 'GeneratorExp';
    GeneratorExp.prototype['_fields'] = [
        'elt', function (n) { return n.elt; },
        'generators', function (n) { return n.generators; }
    ];
    Yield.prototype['_astname'] = 'Yield';
    Yield.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    Compare.prototype['_astname'] = 'Compare';
    Compare.prototype['_fields'] = [
        'left', function (n) { return n.left; },
        'ops', function (n) { return n.ops; },
        'comparators', function (n) { return n.comparators; }
    ];
    Call.prototype['_astname'] = 'Call';
    Call.prototype['_fields'] = [
        'func', function (n) { return n.func; },
        'args', function (n) { return n.args; },
        'keywords', function (n) { return n.keywords; },
        'starargs', function (n) { return n.starargs; },
        'kwargs', function (n) { return n.kwargs; }
    ];
    Num.prototype['_astname'] = 'Num';
    Num.prototype['_fields'] = [
        'n', function (n) { return n.n; }
    ];
    Str.prototype['_astname'] = 'Str';
    Str.prototype['_fields'] = [
        's', function (n) { return n.s; }
    ];
    Attribute.prototype['_astname'] = 'Attribute';
    Attribute.prototype['_fields'] = [
        'value', function (n) { return n.value; },
        'attr', function (n) { return n.attr; },
        'ctx', function (n) { return n.ctx; }
    ];
    Subscript.prototype['_astname'] = 'Subscript';
    Subscript.prototype['_fields'] = [
        'value', function (n) { return n.value; },
        'slice', function (n) { return n.slice; },
        'ctx', function (n) { return n.ctx; }
    ];
    Name.prototype['_astname'] = 'Name';
    Name.prototype['_fields'] = [
        'id', function (n) { return n.id; },
        'ctx', function (n) { return n.ctx; }
    ];
    List.prototype['_astname'] = 'List';
    List.prototype['_fields'] = [
        'elts', function (n) { return n.elts; },
        'ctx', function (n) { return n.ctx; }
    ];
    Tuple.prototype['_astname'] = 'Tuple';
    Tuple.prototype['_fields'] = [
        'elts', function (n) { return n.elts; },
        'ctx', function (n) { return n.ctx; }
    ];
    Load.prototype['_astname'] = 'Load';
    Load.prototype['_isenum'] = true;
    Store.prototype['_astname'] = 'Store';
    Store.prototype['_isenum'] = true;
    Del.prototype['_astname'] = 'Del';
    Del.prototype['_isenum'] = true;
    AugLoad.prototype['_astname'] = 'AugLoad';
    AugLoad.prototype['_isenum'] = true;
    AugStore.prototype['_astname'] = 'AugStore';
    AugStore.prototype['_isenum'] = true;
    Param.prototype['_astname'] = 'Param';
    Param.prototype['_isenum'] = true;
    Ellipsis.prototype['_astname'] = 'Ellipsis';
    Ellipsis.prototype['_fields'] = [];
    Slice.prototype['_astname'] = 'Slice';
    Slice.prototype['_fields'] = [
        'lower', function (n) { return n.lower; },
        'upper', function (n) { return n.upper; },
        'step', function (n) { return n.step; }
    ];
    ExtSlice.prototype['_astname'] = 'ExtSlice';
    ExtSlice.prototype['_fields'] = [
        'dims', function (n) { return n.dims; }
    ];
    Index.prototype['_astname'] = 'Index';
    Index.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    And.prototype['_astname'] = 'And';
    And.prototype['_isenum'] = true;
    Or.prototype['_astname'] = 'Or';
    Or.prototype['_isenum'] = true;
    Add.prototype['_astname'] = 'Add';
    Add.prototype['_isenum'] = true;
    Sub.prototype['_astname'] = 'Sub';
    Sub.prototype['_isenum'] = true;
    Mult.prototype['_astname'] = 'Mult';
    Mult.prototype['_isenum'] = true;
    Div.prototype['_astname'] = 'Div';
    Div.prototype['_isenum'] = true;
    Mod.prototype['_astname'] = 'Mod';
    Mod.prototype['_isenum'] = true;
    Pow.prototype['_astname'] = 'Pow';
    Pow.prototype['_isenum'] = true;
    LShift.prototype['_astname'] = 'LShift';
    LShift.prototype['_isenum'] = true;
    RShift.prototype['_astname'] = 'RShift';
    RShift.prototype['_isenum'] = true;
    BitOr.prototype['_astname'] = 'BitOr';
    BitOr.prototype['_isenum'] = true;
    BitXor.prototype['_astname'] = 'BitXor';
    BitXor.prototype['_isenum'] = true;
    BitAnd.prototype['_astname'] = 'BitAnd';
    BitAnd.prototype['_isenum'] = true;
    FloorDiv.prototype['_astname'] = 'FloorDiv';
    FloorDiv.prototype['_isenum'] = true;
    Invert.prototype['_astname'] = 'Invert';
    Invert.prototype['_isenum'] = true;
    Not.prototype['_astname'] = 'Not';
    Not.prototype['_isenum'] = true;
    UAdd.prototype['_astname'] = 'UAdd';
    UAdd.prototype['_isenum'] = true;
    USub.prototype['_astname'] = 'USub';
    USub.prototype['_isenum'] = true;
    Eq.prototype['_astname'] = 'Eq';
    Eq.prototype['_isenum'] = true;
    NotEq.prototype['_astname'] = 'NotEq';
    NotEq.prototype['_isenum'] = true;
    Lt.prototype['_astname'] = 'Lt';
    Lt.prototype['_isenum'] = true;
    LtE.prototype['_astname'] = 'LtE';
    LtE.prototype['_isenum'] = true;
    Gt.prototype['_astname'] = 'Gt';
    Gt.prototype['_isenum'] = true;
    GtE.prototype['_astname'] = 'GtE';
    GtE.prototype['_isenum'] = true;
    Is.prototype['_astname'] = 'Is';
    Is.prototype['_isenum'] = true;
    IsNot.prototype['_astname'] = 'IsNot';
    IsNot.prototype['_isenum'] = true;
    In_.prototype['_astname'] = 'In';
    In_.prototype['_isenum'] = true;
    NotIn.prototype['_astname'] = 'NotIn';
    NotIn.prototype['_isenum'] = true;
    comprehension.prototype['_astname'] = 'comprehension';
    comprehension.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'iter', function (n) { return n.iter; },
        'ifs', function (n) { return n.ifs; }
    ];
    ExceptHandler.prototype['_astname'] = 'ExceptHandler';
    ExceptHandler.prototype['_fields'] = [
        'type', function (n) { return n.type; },
        'name', function (n) { return n.name; },
        'body', function (n) { return n.body; }
    ];
    arguments_.prototype['_astname'] = 'arguments';
    arguments_.prototype['_fields'] = [
        'args', function (n) { return n.args; },
        'vararg', function (n) { return n.vararg; },
        'kwarg', function (n) { return n.kwarg; },
        'defaults', function (n) { return n.defaults; }
    ];
    keyword.prototype['_astname'] = 'keyword';
    keyword.prototype['_fields'] = [
        'arg', function (n) { return n.arg; },
        'value', function (n) { return n.value; }
    ];
    alias.prototype['_astname'] = 'alias';
    alias.prototype['_fields'] = [
        'name', function (n) { return n.name; },
        'asname', function (n) { return n.asname; }
    ];
});

define('pytools/numericLiteral',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * @param {string} s
     */
    function floatAST(s) {
        var thing = {
            text: s,
            value: parseFloat(s),
            isFloat: function () { return true; },
            isInt: function () { return false; },
            isLong: function () { return false; },
            toString: function () { return s; }
        };
        return thing;
    }
    exports.floatAST = floatAST;
    /**
     * @param n {number}
     */
    function intAST(n) {
        var thing = {
            value: n,
            isFloat: function () { return false; },
            isInt: function () { return true; },
            isLong: function () { return false; },
            toString: function () { return '' + n; }
        };
        return thing;
    }
    exports.intAST = intAST;
    /**
     * @param {string} s
     */
    function longAST(s, radix) {
        var thing = {
            text: s,
            radix: radix,
            isFloat: function () { return false; },
            isInt: function () { return false; },
            isLong: function () { return true; },
            toString: function () { return s; }
        };
        return thing;
    }
    exports.longAST = longAST;
});

define('pytools/builder',["require", "exports", './asserts', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './base', './tables', './Tokens', './numericLiteral'], function (require, exports, asserts_1, astnodes_1, astnodes_2, astnodes_3, astnodes_4, astnodes_5, astnodes_6, astnodes_7, astnodes_8, astnodes_9, astnodes_10, astnodes_11, astnodes_12, astnodes_13, astnodes_14, astnodes_15, astnodes_16, astnodes_17, astnodes_18, astnodes_19, astnodes_20, astnodes_21, astnodes_22, astnodes_23, astnodes_24, astnodes_25, astnodes_26, astnodes_27, astnodes_28, astnodes_29, astnodes_30, astnodes_31, astnodes_32, astnodes_33, astnodes_34, astnodes_35, astnodes_36, astnodes_37, astnodes_38, astnodes_39, astnodes_40, astnodes_41, astnodes_42, astnodes_43, astnodes_44, astnodes_45, astnodes_46, astnodes_47, astnodes_48, astnodes_49, astnodes_50, astnodes_51, astnodes_52, astnodes_53, astnodes_54, astnodes_55, astnodes_56, astnodes_57, astnodes_58, astnodes_59, astnodes_60, astnodes_61, astnodes_62, astnodes_63, astnodes_64, astnodes_65, astnodes_66, astnodes_67, astnodes_68, astnodes_69, astnodes_70, astnodes_71, astnodes_72, astnodes_73, astnodes_74, astnodes_75, astnodes_76, astnodes_77, astnodes_78, astnodes_79, astnodes_80, astnodes_81, astnodes_82, astnodes_83, astnodes_84, astnodes_85, astnodes_86, base_1, tables_1, Tokens_1, numericLiteral_1) {
    "use strict";
    //
    // This is pretty much a straight port of ast.c from CPython 2.6.5.
    //
    // The previous version was easier to work with and more JS-ish, but having a
    // somewhat different ast structure than cpython makes testing more difficult.
    //
    // This way, we can use a dump from the ast module on any arbitrary python
    // code and know that we're the same up to ast level, at least.
    //
    var ParseTables = tables_1.default.ParseTables;
    var SYM = ParseTables.sym;
    var TOK = Tokens_1.default;
    /**
     * @const
     * @type {number}
     */
    var LONG_THRESHOLD = Math.pow(2, 53);
    /**
     * @param {string} message
     * @param {string} fileName
     * @param {number} lineNumber
     */
    function syntaxError(message, fileName, lineNumber) {
        asserts_1.assert(base_1.isString(message), "message must be a string");
        asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
        asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
        var e = new SyntaxError(message /*, fileName*/);
        e['fileName'] = fileName;
        e['lineNumber'] = lineNumber;
        return e;
    }
    /** @constructor */
    function Compiling(encoding, filename) {
        this.c_encoding = encoding;
        this.c_filename = filename;
    }
    /**
     * @return {number}
     */
    function NCH(n) {
        asserts_1.assert(n !== undefined);
        if (n.children === null)
            return 0;
        return n.children.length;
    }
    function CHILD(n, i) {
        asserts_1.assert(n !== undefined);
        asserts_1.assert(i !== undefined);
        return n.children[i];
    }
    function REQ(n, type) {
        asserts_1.assert(n.type === type, "node wasn't expected type");
    }
    function strobj(s) {
        asserts_1.assert(typeof s === "string", "expecting string, got " + (typeof s));
        // This previuosly constructed the runtime representation.
        // That may have had an string intern side effect?
        return s;
    }
    /** @return {number} */
    function numStmts(n) {
        switch (n.type) {
            case SYM.single_input:
                if (CHILD(n, 0).type === TOK.T_NEWLINE)
                    return 0;
                else
                    return numStmts(CHILD(n, 0));
            case SYM.file_input:
                var cnt = 0;
                for (var i = 0; i < NCH(n); ++i) {
                    var ch = CHILD(n, i);
                    if (ch.type === SYM.stmt)
                        cnt += numStmts(ch);
                }
                return cnt;
            case SYM.stmt:
                return numStmts(CHILD(n, 0));
            case SYM.compound_stmt:
                return 1;
            case SYM.simple_stmt:
                return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
            case SYM.suite:
                if (NCH(n) === 1)
                    return numStmts(CHILD(n, 0));
                else {
                    var cnt = 0;
                    for (var i = 2; i < NCH(n) - 1; ++i)
                        cnt += numStmts(CHILD(n, i));
                    return cnt;
                }
            default:
                asserts_1.fail("Non-statement found");
        }
        return 0;
    }
    function forbiddenCheck(c, n, x, lineno) {
        if (x === "None")
            throw syntaxError("assignment to None", c.c_filename, lineno);
        if (x === "True" || x === "False")
            throw syntaxError("assignment to True or False is forbidden", c.c_filename, lineno);
    }
    /**
     * Set the context ctx for e, recursively traversing e.
     *
     * Only sets context for expr kinds that can appear in assignment context as
     * per the asdl file.
     */
    function setContext(c, e, ctx, n) {
        asserts_1.assert(ctx !== astnodes_10.AugStore && ctx !== astnodes_9.AugLoad);
        var s = null;
        var exprName = null;
        switch (e.constructor) {
            case astnodes_7.Attribute:
            case astnodes_59.Name:
                if (ctx === astnodes_74.Store)
                    forbiddenCheck(c, n, e.attr, n.lineno);
                e.ctx = ctx;
                break;
            case astnodes_77.Subscript:
                e.ctx = ctx;
                break;
            case astnodes_50.List:
                e.ctx = ctx;
                s = e.elts;
                break;
            case astnodes_80.Tuple:
                if (e.elts.length === 0)
                    throw syntaxError("can't assign to ()", c.c_filename, n.lineno);
                e.ctx = ctx;
                s = e.elts;
                break;
            case astnodes_49.Lambda:
                exprName = "lambda";
                break;
            case astnodes_17.Call:
                exprName = "function call";
                break;
            case astnodes_15.BoolOp:
            case astnodes_11.BinOp:
            case astnodes_82.UnaryOp:
                exprName = "operator";
                break;
            case astnodes_35.GeneratorExp:
                exprName = "generator expression";
                break;
            case astnodes_86.Yield:
                exprName = "yield expression";
                break;
            case astnodes_51.ListComp:
                exprName = "list comprehension";
                break;
            case astnodes_24.Dict:
            case astnodes_64.Num:
            case astnodes_75.Str:
                exprName = "literal";
                break;
            case astnodes_19.Compare:
                exprName = "comparison expression";
                break;
            case astnodes_41.IfExp:
                exprName = "conditional expression";
                break;
            default:
                asserts_1.fail("unhandled expression in assignment");
        }
        if (exprName) {
            throw syntaxError("can't " + (ctx === astnodes_74.Store ? "assign to" : "delete") + " " + exprName, c.c_filename, n.lineno);
        }
        if (s) {
            for (var i = 0; i < s.length; ++i) {
                setContext(c, s[i], ctx, n);
            }
        }
    }
    var operatorMap = {};
    (function () {
        operatorMap[TOK.T_VBAR] = astnodes_13.BitOr;
        operatorMap[TOK.T_VBAR] = astnodes_13.BitOr;
        operatorMap[TOK.T_CIRCUMFLEX] = astnodes_14.BitXor;
        operatorMap[TOK.T_AMPER] = astnodes_12.BitAnd;
        operatorMap[TOK.T_LEFTSHIFT] = astnodes_53.LShift;
        operatorMap[TOK.T_RIGHTSHIFT] = astnodes_72.RShift;
        operatorMap[TOK.T_PLUS] = astnodes_1.Add;
        operatorMap[TOK.T_MINUS] = astnodes_76.Sub;
        operatorMap[TOK.T_STAR] = astnodes_58.Mult;
        operatorMap[TOK.T_SLASH] = astnodes_25.Div;
        operatorMap[TOK.T_DOUBLESLASH] = astnodes_32.FloorDiv;
        operatorMap[TOK.T_PERCENT] = astnodes_56.Mod;
    }());
    function getOperator(n) {
        asserts_1.assert(operatorMap[n.type] !== undefined);
        return operatorMap[n.type];
    }
    function astForCompOp(c, n) {
        /* comp_op: '<'|'>'|'=='|'>='|'<='|'<>'|'!='|'in'|'not' 'in'|'is'
                    |'is' 'not'
        */
        REQ(n, SYM.comp_op);
        if (NCH(n) === 1) {
            n = CHILD(n, 0);
            switch (n.type) {
                case TOK.T_LESS: return astnodes_54.Lt;
                case TOK.T_GREATER: return astnodes_37.Gt;
                case TOK.T_EQEQUAL: return astnodes_27.Eq;
                case TOK.T_LESSEQUAL: return astnodes_55.LtE;
                case TOK.T_GREATEREQUAL: return astnodes_38.GtE;
                case TOK.T_NOTEQUAL: return astnodes_62.NotEq;
                case TOK.T_NAME:
                    if (n.value === "in")
                        return astnodes_45.In_;
                    if (n.value === "is")
                        return astnodes_47.Is;
            }
        }
        else if (NCH(n) === 2) {
            if (CHILD(n, 0).type === TOK.T_NAME) {
                if (CHILD(n, 1).value === "in")
                    return astnodes_63.NotIn;
                if (CHILD(n, 0).value === "is")
                    return astnodes_48.IsNot;
            }
        }
        asserts_1.fail("invalid comp_op");
    }
    function seqForTestlist(c, n) {
        /* testlist: test (',' test)* [','] */
        asserts_1.assert(n.type === SYM.testlist ||
            n.type === SYM.listmaker ||
            n.type === SYM.testlist_gexp ||
            n.type === SYM.testlist_safe ||
            n.type === SYM.testlist1);
        var seq = [];
        for (var i = 0; i < NCH(n); i += 2) {
            asserts_1.assert(CHILD(n, i).type === SYM.IfExpr || CHILD(n, i).type === SYM.old_test);
            seq[i / 2] = astForExpr(c, CHILD(n, i));
        }
        return seq;
    }
    function astForSuite(c, n) {
        /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
        REQ(n, SYM.suite);
        var seq = [];
        var pos = 0;
        var ch;
        if (CHILD(n, 0).type === SYM.simple_stmt) {
            n = CHILD(n, 0);
            /* simple_stmt always ends with an NEWLINE and may have a trailing
                * SEMI. */
            var end = NCH(n) - 1;
            if (CHILD(n, end - 1).type === TOK.T_SEMI)
                end -= 1;
            for (var i = 0; i < end; i += 2)
                seq[pos++] = astForStmt(c, CHILD(n, i));
        }
        else {
            for (var i = 2; i < NCH(n) - 1; ++i) {
                ch = CHILD(n, i);
                REQ(ch, SYM.stmt);
                var num = numStmts(ch);
                if (num === 1) {
                    // small_stmt or compound_stmt w/ only 1 child
                    seq[pos++] = astForStmt(c, ch);
                }
                else {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (var j = 0; j < NCH(ch); j += 2) {
                        if (NCH(CHILD(ch, j)) === 0) {
                            asserts_1.assert(j + 1 === NCH(ch));
                            break;
                        }
                        seq[pos++] = astForStmt(c, CHILD(ch, j));
                    }
                }
            }
        }
        asserts_1.assert(pos === numStmts(n));
        return seq;
    }
    function astForExceptClause(c, exc, body) {
        /* except_clause: 'except' [test [(',' | 'as') test]] */
        REQ(exc, SYM.except_clause);
        REQ(body, SYM.suite);
        if (NCH(exc) === 1)
            return new astnodes_28.ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
        else if (NCH(exc) === 2)
            return new astnodes_28.ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
        else if (NCH(exc) === 4) {
            var e = astForExpr(c, CHILD(exc, 3));
            setContext(c, e, astnodes_74.Store, CHILD(exc, 3));
            return new astnodes_28.ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
        }
        asserts_1.fail("wrong number of children for except clause");
    }
    function astForTryStmt(c, n) {
        var nc = NCH(n);
        var nexcept = (nc - 3) / 3;
        var body, orelse = [], finally_ = null;
        REQ(n, SYM.try_stmt);
        body = astForSuite(c, CHILD(n, 2));
        if (CHILD(n, nc - 3).type === TOK.T_NAME) {
            if (CHILD(n, nc - 3).value === "finally") {
                if (nc >= 9 && CHILD(n, nc - 6).type === TOK.T_NAME) {
                    /* we can assume it's an "else",
                        because nc >= 9 for try-else-finally and
                        it would otherwise have a type of except_clause */
                    orelse = astForSuite(c, CHILD(n, nc - 4));
                    nexcept--;
                }
                finally_ = astForSuite(c, CHILD(n, nc - 1));
                nexcept--;
            }
            else {
                /* we can assume it's an "else",
                    otherwise it would have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 1));
                nexcept--;
            }
        }
        else if (CHILD(n, nc - 3).type !== SYM.except_clause) {
            throw syntaxError("malformed 'try' statement", c.c_filename, n.lineno);
        }
        if (nexcept > 0) {
            var handlers = [];
            for (var i = 0; i < nexcept; ++i)
                handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
            var exceptSt = new astnodes_78.TryExcept(body, handlers, orelse, n.lineno, n.col_offset);
            if (!finally_)
                return exceptSt;
            /* if a 'finally' is present too, we nest the TryExcept within a
                TryFinally to emulate try ... except ... finally */
            body = [exceptSt];
        }
        asserts_1.assert(finally_ !== null);
        return new astnodes_79.TryFinally(body, finally_, n.lineno, n.col_offset);
    }
    function astForDottedName(c, n) {
        REQ(n, SYM.dotted_name);
        var lineno = n.lineno;
        var col_offset = n.col_offset;
        var id = strobj(CHILD(n, 0).value);
        var e = new astnodes_59.Name(id, astnodes_52.Load, lineno, col_offset);
        for (var i = 2; i < NCH(n); i += 2) {
            id = strobj(CHILD(n, i).value);
            e = new astnodes_7.Attribute(e, id, astnodes_52.Load, lineno, col_offset);
        }
        return e;
    }
    function astForDecorator(c, n) {
        /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
        REQ(n, SYM.decorator);
        REQ(CHILD(n, 0), TOK.T_AT);
        REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
        var nameExpr = astForDottedName(c, CHILD(n, 1));
        var d;
        if (NCH(n) === 3)
            return nameExpr;
        else if (NCH(n) === 5)
            return new astnodes_17.Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
        else
            return astForCall(c, CHILD(n, 3), nameExpr);
    }
    function astForDecorators(c, n) {
        REQ(n, SYM.decorators);
        var decoratorSeq = [];
        for (var i = 0; i < NCH(n); ++i)
            decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
        return decoratorSeq;
    }
    function astForDecorated(c, n) {
        REQ(n, SYM.decorated);
        var decoratorSeq = astForDecorators(c, CHILD(n, 0));
        asserts_1.assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);
        var thing = null;
        if (CHILD(n, 1).type === SYM.funcdef)
            thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
        else if (CHILD(n, 1) === SYM.classdef)
            thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
        if (thing) {
            thing.lineno = n.lineno;
            thing.col_offset = n.col_offset;
        }
        return thing;
    }
    function astForWithVar(c, n) {
        REQ(n, SYM.with_var);
        return astForExpr(c, CHILD(n, 1));
    }
    function astForWithStmt(c, n) {
        /* with_stmt: 'with' test [ with_var ] ':' suite */
        var suiteIndex = 3; // skip with, test, :
        asserts_1.assert(n.type === SYM.with_stmt);
        var contextExpr = astForExpr(c, CHILD(n, 1));
        if (CHILD(n, 2).type === SYM.with_var) {
            var optionalVars = astForWithVar(c, CHILD(n, 2));
            setContext(c, optionalVars, astnodes_74.Store, n);
            suiteIndex = 4;
        }
        return new astnodes_85.With_(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
    }
    function astForExecStmt(c, n) {
        var expr1, globals = null, locals = null;
        var nchildren = NCH(n);
        asserts_1.assert(nchildren === 2 || nchildren === 4 || nchildren === 6);
        /* exec_stmt: 'exec' expr ['in' test [',' test]] */
        REQ(n, SYM.exec_stmt);
        var expr1 = astForExpr(c, CHILD(n, 1));
        if (nchildren >= 4)
            globals = astForExpr(c, CHILD(n, 3));
        if (nchildren === 6)
            locals = astForExpr(c, CHILD(n, 5));
        return new astnodes_29.Exec(expr1, globals, locals, n.lineno, n.col_offset);
    }
    function astForIfStmt(c, n) {
        /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
            ['else' ':' suite]
        */
        REQ(n, SYM.if_stmt);
        if (NCH(n) === 4)
            return new astnodes_40.If_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
        var s = CHILD(n, 4).value;
        var decider = s.charAt(2); // elSe or elIf
        if (decider === 's') {
            return new astnodes_40.If_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
        }
        else if (decider === 'i') {
            var nElif = NCH(n) - 4;
            var hasElse = false;
            var orelse = [];
            /* must reference the child nElif+1 since 'else' token is third, not
                * fourth child from the end. */
            if (CHILD(n, nElif + 1).type === TOK.T_NAME && CHILD(n, nElif + 1).value.charAt(2) === 's') {
                hasElse = true;
                nElif -= 3;
            }
            nElif /= 4;
            if (hasElse) {
                orelse = [
                    new astnodes_40.If_(astForExpr(c, CHILD(n, NCH(n) - 6)), astForSuite(c, CHILD(n, NCH(n) - 4)), astForSuite(c, CHILD(n, NCH(n) - 1)), CHILD(n, NCH(n) - 6).lineno, CHILD(n, NCH(n) - 6).col_offset)];
                nElif--;
            }
            for (var i = 0; i < nElif; ++i) {
                var off = 5 + (nElif - i - 1) * 4;
                orelse = [
                    new astnodes_40.If_(astForExpr(c, CHILD(n, off)), astForSuite(c, CHILD(n, off + 2)), orelse, CHILD(n, off).lineno, CHILD(n, off).col_offset)];
            }
            return new astnodes_40.If_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), orelse, n.lineno, n.col_offset);
        }
        asserts_1.fail("unexpected token in 'if' statement");
    }
    function astForExprlist(c, n, context) {
        REQ(n, SYM.ExprList);
        var seq = [];
        for (var i = 0; i < NCH(n); i += 2) {
            var e = astForExpr(c, CHILD(n, i));
            seq[i / 2] = e;
            if (context)
                setContext(c, e, context, CHILD(n, i));
        }
        return seq;
    }
    function astForDelStmt(c, n) {
        REQ(n, SYM.del_stmt);
        return new astnodes_23.Delete_(astForExprlist(c, CHILD(n, 1), astnodes_22.Del), n.lineno, n.col_offset);
    }
    function astForGlobalStmt(c, n) {
        REQ(n, SYM.GlobalStmt);
        var s = [];
        for (var i = 1; i < NCH(n); i += 2) {
            s[(i - 1) / 2] = strobj(CHILD(n, i).value);
        }
        return new astnodes_36.Global(s, n.lineno, n.col_offset);
    }
    function astForNonLocalStmt(c, n) {
        REQ(n, SYM.NonLocalStmt);
        var s = [];
        for (var i = 1; i < NCH(n); i += 2) {
            s[(i - 1) / 2] = strobj(CHILD(n, i).value);
        }
        return new astnodes_60.NonLocal(s, n.lineno, n.col_offset);
    }
    function astForAssertStmt(c, n) {
        /* assert_stmt: 'assert' test [',' test] */
        REQ(n, SYM.assert_stmt);
        if (NCH(n) === 2)
            return new astnodes_5.Assert(astForExpr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
        else if (NCH(n) === 4)
            return new astnodes_5.Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.lineno, n.col_offset);
        asserts_1.fail("improper number of parts to assert stmt");
    }
    function aliasForImportName(c, n) {
        /*
            import_as_name: NAME ['as' NAME]
            dotted_as_name: dotted_name ['as' NAME]
            dotted_name: NAME ('.' NAME)*
        */
        loop: while (true) {
            switch (n.type) {
                case SYM.import_as_name:
                    var str = null;
                    var name_1 = strobj(CHILD(n, 0).value);
                    if (NCH(n) === 3)
                        str = CHILD(n, 2).value;
                    return new astnodes_2.alias(name_1, str == null ? null : strobj(str));
                case SYM.dotted_as_name:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue loop;
                    }
                    else {
                        var a = aliasForImportName(c, CHILD(n, 0));
                        asserts_1.assert(!a.asname);
                        a.asname = strobj(CHILD(n, 2).value);
                        return a;
                    }
                case SYM.dotted_name:
                    if (NCH(n) === 1)
                        return new astnodes_2.alias(strobj(CHILD(n, 0).value), null);
                    else {
                        // create a string of the form a.b.c
                        var str_1 = '';
                        for (var i = 0; i < NCH(n); i += 2)
                            str_1 += CHILD(n, i).value + ".";
                        return new astnodes_2.alias(strobj(str_1.substr(0, str_1.length - 1)), null);
                    }
                case TOK.T_STAR:
                    return new astnodes_2.alias(strobj("*"), null);
                default:
                    throw syntaxError("unexpected import name", c.c_filename, n.lineno);
            }
        }
    }
    function astForImportStmt(c, n) {
        REQ(n, SYM.import_stmt);
        var lineno = n.lineno;
        var col_offset = n.col_offset;
        n = CHILD(n, 0);
        if (n.type === SYM.import_name) {
            n = CHILD(n, 1);
            REQ(n, SYM.dotted_as_names);
            var aliases = [];
            for (var i = 0; i < NCH(n); i += 2)
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            return new astnodes_42.Import_(aliases, lineno, col_offset);
        }
        else if (n.type === SYM.import_from) {
            var mod = null;
            var ndots = 0;
            var nchildren;
            for (var idx = 1; idx < NCH(n); ++idx) {
                if (CHILD(n, idx).type === SYM.dotted_name) {
                    mod = aliasForImportName(c, CHILD(n, idx));
                    idx++;
                    break;
                }
                else if (CHILD(n, idx).type !== TOK.T_DOT)
                    break;
                ndots++;
            }
            ++idx; // skip the import keyword
            switch (CHILD(n, idx).type) {
                case TOK.T_STAR:
                    // from ... import
                    n = CHILD(n, idx);
                    nchildren = 1;
                    break;
                case TOK.T_LPAR:
                    // from ... import (x, y, z)
                    n = CHILD(n, idx + 1);
                    nchildren = NCH(n);
                    break;
                case SYM.import_as_names:
                    // from ... import x, y, z
                    n = CHILD(n, idx);
                    nchildren = NCH(n);
                    if (nchildren % 2 === 0)
                        throw syntaxError("trailing comma not allowed without surrounding parentheses", c.c_filename, n.lineno);
                    break;
                default:
                    throw syntaxError("Unexpected node-type in from-import", c.c_filename, n.lineno);
            }
            var aliases = [];
            if (n.type === TOK.T_STAR)
                aliases[0] = aliasForImportName(c, n);
            else
                for (var i = 0; i < NCH(n); i += 2)
                    aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
            var modname = mod ? mod.name : "";
            return new astnodes_43.ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
        }
        throw syntaxError("unknown import statement", c.c_filename, n.lineno);
    }
    function astForTestlistGexp(c, n) {
        asserts_1.assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
        if (NCH(n) > 1 && CHILD(n, 1).type === SYM.gen_for)
            return astForGenexp(c, n);
        return astForTestlist(c, n);
    }
    function astForListcomp(c, n) {
        function countListFors(c, n) {
            var nfors = 0;
            var ch = CHILD(n, 1);
            count_list_for: while (true) {
                nfors++;
                REQ(ch, SYM.list_for);
                if (NCH(ch) === 5)
                    ch = CHILD(ch, 4);
                else
                    return nfors;
                count_list_iter: while (true) {
                    REQ(ch, SYM.list_iter);
                    ch = CHILD(ch, 0);
                    if (ch.type === SYM.list_for)
                        continue count_list_for;
                    else if (ch.type === SYM.list_if) {
                        if (NCH(ch) === 3) {
                            ch = CHILD(ch, 2);
                            continue count_list_iter;
                        }
                        else
                            return nfors;
                    }
                    break;
                }
                break;
            }
        }
        function countListIfs(c, n) {
            var nifs = 0;
            while (true) {
                REQ(n, SYM.list_iter);
                if (CHILD(n, 0).type === SYM.list_for)
                    return nifs;
                n = CHILD(n, 0);
                REQ(n, SYM.list_if);
                nifs++;
                if (NCH(n) == 2)
                    return nifs;
                n = CHILD(n, 2);
            }
        }
        REQ(n, SYM.listmaker);
        asserts_1.assert(NCH(n) > 1);
        var elt = astForExpr(c, CHILD(n, 0));
        var nfors = countListFors(c, n);
        var listcomps = [];
        var ch = CHILD(n, 1);
        for (var i = 0; i < nfors; ++i) {
            REQ(ch, SYM.list_for);
            var forch = CHILD(ch, 1);
            var t = astForExprlist(c, forch, astnodes_74.Store);
            var expression = astForTestlist(c, CHILD(ch, 3));
            var lc;
            if (NCH(forch) === 1)
                lc = new astnodes_20.comprehension(t[0], expression, []);
            else
                lc = new astnodes_20.comprehension(new astnodes_80.Tuple(t, astnodes_74.Store, ch.lineno, ch.col_offset), expression, []);
            if (NCH(ch) === 5) {
                ch = CHILD(ch, 4);
                var nifs = countListIfs(c, ch);
                var ifs = [];
                for (var j = 0; j < nifs; ++j) {
                    REQ(ch, SYM.list_iter);
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.list_if);
                    ifs[j] = astForExpr(c, CHILD(ch, 1));
                    if (NCH(ch) === 3)
                        ch = CHILD(ch, 2);
                }
                if (ch.type === SYM.list_iter)
                    ch = CHILD(ch, 0);
                lc.ifs = ifs;
            }
            listcomps[i] = lc;
        }
        return new astnodes_51.ListComp(elt, listcomps, n.lineno, n.col_offset);
    }
    function astForUnaryExpr(c, n) {
        if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2) {
            var pfactor = CHILD(n, 1);
            if (pfactor.type === SYM.UnaryExpr && NCH(pfactor) === 1) {
                var ppower = CHILD(pfactor, 0);
                if (ppower.type === SYM.PowerExpr && NCH(ppower) === 1) {
                    var patom = CHILD(ppower, 0);
                    if (patom.type === SYM.AtomExpr) {
                        var pnum = CHILD(patom, 0);
                        if (pnum.type === TOK.T_NUMBER) {
                            pnum.value = "-" + pnum.value;
                            return astForAtomExpr(c, patom);
                        }
                    }
                }
            }
        }
        var expression = astForExpr(c, CHILD(n, 1));
        switch (CHILD(n, 0).type) {
            case TOK.T_PLUS: return new astnodes_82.UnaryOp(astnodes_81.UAdd, expression, n.lineno, n.col_offset);
            case TOK.T_MINUS: return new astnodes_82.UnaryOp(astnodes_83.USub, expression, n.lineno, n.col_offset);
            case TOK.T_TILDE: return new astnodes_82.UnaryOp(astnodes_46.Invert, expression, n.lineno, n.col_offset);
        }
        asserts_1.fail("unhandled UnaryExpr");
    }
    function astForForStmt(c, n) {
        var seq = [];
        REQ(n, SYM.for_stmt);
        if (NCH(n) === 9)
            seq = astForSuite(c, CHILD(n, 8));
        var nodeTarget = CHILD(n, 1);
        var _target = astForExprlist(c, nodeTarget, astnodes_74.Store);
        var target;
        if (NCH(nodeTarget) === 1)
            target = _target[0];
        else
            target = new astnodes_80.Tuple(_target, astnodes_74.Store, n.lineno, n.col_offset);
        return new astnodes_33.For_(target, astForTestlist(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 5)), seq, n.lineno, n.col_offset);
    }
    function astForCall(c, n, func) {
        /*
            arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
                    | '**' test)
            argument: [test '='] test [gen_for]        # Really [keyword '='] test
        */
        REQ(n, SYM.arglist);
        var nargs = 0;
        var nkeywords = 0;
        var ngens = 0;
        for (var i = 0; i < NCH(n); ++i) {
            var ch = CHILD(n, i);
            if (ch.type === SYM.argument) {
                if (NCH(ch) === 1)
                    nargs++;
                else if (CHILD(ch, 1).type === SYM.gen_for)
                    ngens++;
                else
                    nkeywords++;
            }
        }
        if (ngens > 1 || (ngens && (nargs || nkeywords)))
            throw syntaxError("Generator expression must be parenthesized if not sole argument", c.c_filename, n.lineno);
        if (nargs + nkeywords + ngens > 255)
            throw syntaxError("more than 255 arguments", c.c_filename, n.lineno);
        var args = [];
        var keywords = [];
        nargs = 0;
        nkeywords = 0;
        var vararg = null;
        var kwarg = null;
        for (var i = 0; i < NCH(n); ++i) {
            var ch = CHILD(n, i);
            if (ch.type === SYM.argument) {
                if (NCH(ch) === 1) {
                    if (nkeywords)
                        throw syntaxError("non-keyword arg after keyword arg", c.c_filename, n.lineno);
                    if (vararg)
                        throw syntaxError("only named arguments may follow *expression", c.c_filename, n.lineno);
                    args[nargs++] = astForExpr(c, CHILD(ch, 0));
                }
                else if (CHILD(ch, 1).type === SYM.gen_for)
                    args[nargs++] = astForGenexp(c, ch);
                else {
                    var e = astForExpr(c, CHILD(ch, 0));
                    if (e.constructor === astnodes_49.Lambda)
                        throw syntaxError("lambda cannot contain assignment", c.c_filename, n.lineno);
                    else if (e.constructor !== astnodes_59.Name)
                        throw syntaxError("keyword can't be an expression", c.c_filename, n.lineno);
                    var key = e.id;
                    forbiddenCheck(c, CHILD(ch, 0), key, n.lineno);
                    for (var k = 0; k < nkeywords; ++k) {
                        var tmp = keywords[k].arg;
                        if (tmp === key)
                            throw syntaxError("keyword argument repeated", c.c_filename, n.lineno);
                    }
                    keywords[nkeywords++] = new astnodes_39.keyword(key, astForExpr(c, CHILD(ch, 2)));
                }
            }
            else if (ch.type === TOK.T_STAR)
                vararg = astForExpr(c, CHILD(n, ++i));
            else if (ch.type === TOK.T_DOUBLESTAR)
                kwarg = astForExpr(c, CHILD(n, ++i));
        }
        return new astnodes_17.Call(func, args, keywords, vararg, kwarg, func.lineno, func.col_offset);
    }
    function astForTrailer(c, n, leftExpr) {
        /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
            subscriptlist: subscript (',' subscript)* [',']
            subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
            */
        REQ(n, SYM.trailer);
        if (CHILD(n, 0).type === TOK.T_LPAR) {
            if (NCH(n) === 2)
                return new astnodes_17.Call(leftExpr, [], [], null, null, n.lineno, n.col_offset);
            else
                return astForCall(c, CHILD(n, 1), leftExpr);
        }
        else if (CHILD(n, 0).type === TOK.T_DOT)
            return new astnodes_7.Attribute(leftExpr, strobj(CHILD(n, 1).value), astnodes_52.Load, n.lineno, n.col_offset);
        else {
            REQ(CHILD(n, 0), TOK.T_LSQB);
            REQ(CHILD(n, 2), TOK.T_RSQB);
            n = CHILD(n, 1);
            if (NCH(n) === 1)
                return new astnodes_77.Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), astnodes_52.Load, n.lineno, n.col_offset);
            else {
                /* The grammar is ambiguous here. The ambiguity is resolved
                    by treating the sequence as a tuple literal if there are
                    no slice features.
                */
                var simple = true;
                var slices = [];
                for (var j = 0; j < NCH(n); j += 2) {
                    var slc = astForSlice(c, CHILD(n, j));
                    if (slc.constructor !== astnodes_44.Index)
                        simple = false;
                    slices[j / 2] = slc;
                }
                if (!simple) {
                    return new astnodes_77.Subscript(leftExpr, new astnodes_31.ExtSlice(slices), astnodes_52.Load, n.lineno, n.col_offset);
                }
                var elts = [];
                for (var j = 0; j < slices.length; ++j) {
                    var slc_1 = slices[j];
                    asserts_1.assert(slc_1.constructor === astnodes_44.Index && slc_1.value !== null && slc_1.value !== undefined);
                    elts[j] = slc_1.value;
                }
                var e = new astnodes_80.Tuple(elts, astnodes_52.Load, n.lineno, n.col_offset);
                return new astnodes_77.Subscript(leftExpr, new astnodes_44.Index(e), astnodes_52.Load, n.lineno, n.col_offset);
            }
        }
    }
    function astForFlowStmt(c, n) {
        var ch;
        REQ(n, SYM.flow_stmt);
        ch = CHILD(n, 0);
        switch (ch.type) {
            case SYM.break_stmt: return new astnodes_16.Break_(n.lineno, n.col_offset);
            case SYM.continue_stmt: return new astnodes_21.Continue_(n.lineno, n.col_offset);
            case SYM.yield_stmt:
                return new astnodes_30.Expr(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
            case SYM.return_stmt:
                if (NCH(ch) === 1)
                    return new astnodes_71.Return_(null, n.lineno, n.col_offset);
                else
                    return new astnodes_71.Return_(astForTestlist(c, CHILD(ch, 1)), n.lineno, n.col_offset);
            case SYM.raise_stmt:
                if (NCH(ch) === 1)
                    return new astnodes_70.Raise(null, null, null, n.lineno, n.col_offset);
                else if (NCH(ch) === 2)
                    return new astnodes_70.Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.lineno, n.col_offset);
                else if (NCH(ch) === 4)
                    return new astnodes_70.Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), null, n.lineno, n.col_offset);
                else if (NCH(ch) === 6)
                    return new astnodes_70.Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), astForExpr(c, CHILD(ch, 5)), n.lineno, n.col_offset);
            default:
                asserts_1.fail("unexpected flow_stmt");
        }
        asserts_1.fail("unhandled flow statement");
    }
    function astForArguments(c, n) {
        /* parameters: '(' [varargslist] ')'
            varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
                | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
        */
        var ch;
        var vararg = null;
        var kwarg = null;
        if (n.type === SYM.parameters) {
            if (NCH(n) === 2)
                return new astnodes_3.arguments_([], null, null, []);
            n = CHILD(n, 1);
        }
        REQ(n, SYM.varargslist);
        var args = [];
        var defaults = [];
        /* fpdef: NAME | '(' fplist ')'
            fplist: fpdef (',' fpdef)* [',']
        */
        var foundDefault = false;
        var i = 0;
        var j = 0; // index for defaults
        var k = 0; // index for args
        while (i < NCH(n)) {
            ch = CHILD(n, i);
            switch (ch.type) {
                case SYM.fpdef:
                    var complexArgs = 0;
                    var parenthesized = false;
                    handle_fpdef: while (true) {
                        if (i + 1 < NCH(n) && CHILD(n, i + 1).type === TOK.T_EQUAL) {
                            defaults[j++] = astForExpr(c, CHILD(n, i + 2));
                            i += 2;
                            foundDefault = true;
                        }
                        else if (foundDefault) {
                            /* def f((x)=4): pass should raise an error.
                                def f((x, (y))): pass will just incur the tuple unpacking warning. */
                            if (parenthesized && !complexArgs)
                                throw syntaxError("parenthesized arg with default", c.c_filename, n.lineno);
                            throw syntaxError("non-default argument follows default argument", c.c_filename, n.lineno);
                        }
                        if (NCH(ch) === 3) {
                            ch = CHILD(ch, 1);
                            // def foo((x)): is not complex, special case.
                            if (NCH(ch) !== 1) {
                                throw syntaxError("tuple parameter unpacking has been removed", c.c_filename, n.lineno);
                            }
                            else {
                                /* def foo((x)): setup for checking NAME below. */
                                /* Loop because there can be many parens and tuple
                                    unpacking mixed in. */
                                parenthesized = true;
                                ch = CHILD(ch, 0);
                                asserts_1.assert(ch.type === SYM.fpdef);
                                continue handle_fpdef;
                            }
                        }
                        if (CHILD(ch, 0).type === TOK.T_NAME) {
                            forbiddenCheck(c, n, CHILD(ch, 0).value, n.lineno);
                            var id = strobj(CHILD(ch, 0).value);
                            args[k++] = new astnodes_59.Name(id, astnodes_66.Param, ch.lineno, ch.col_offset);
                        }
                        i += 2;
                        if (parenthesized)
                            throw syntaxError("parenthesized argument names are invalid", c.c_filename, n.lineno);
                        break;
                    }
                    break;
                case TOK.T_STAR:
                    forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                    vararg = strobj(CHILD(n, i + 1).value);
                    i += 3;
                    break;
                case TOK.T_DOUBLESTAR:
                    forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value, n.lineno);
                    kwarg = strobj(CHILD(n, i + 1).value);
                    i += 3;
                    break;
                default:
                    asserts_1.fail("unexpected node in varargslist");
            }
        }
        return new astnodes_3.arguments_(args, vararg, kwarg, defaults);
    }
    function astForFuncdef(c, n, decoratorSeq) {
        /* funcdef: 'def' NAME parameters ':' suite */
        REQ(n, SYM.funcdef);
        var name = strobj(CHILD(n, 1).value);
        forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value, n.lineno);
        var args = astForArguments(c, CHILD(n, 2));
        var body = astForSuite(c, CHILD(n, 4));
        return new astnodes_34.FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
    }
    function astForClassBases(c, n) {
        asserts_1.assert(NCH(n) > 0);
        REQ(n, SYM.testlist);
        if (NCH(n) === 1)
            return [astForExpr(c, CHILD(n, 0))];
        return seqForTestlist(c, n);
    }
    function astForClassdef(c, n, decoratorSeq) {
        REQ(n, SYM.classdef);
        forbiddenCheck(c, n, CHILD(n, 1).value, n.lineno);
        var classname = strobj(CHILD(n, 1).value);
        if (NCH(n) === 4)
            return new astnodes_18.ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
        if (CHILD(n, 3).type === TOK.T_RPAR)
            return new astnodes_18.ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);
        var bases = astForClassBases(c, CHILD(n, 3));
        var s = astForSuite(c, CHILD(n, 6));
        return new astnodes_18.ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
    }
    function astForLambdef(c, n) {
        var args;
        var expression;
        if (NCH(n) === 3) {
            args = new astnodes_3.arguments_([], null, null, []);
            expression = astForExpr(c, CHILD(n, 2));
        }
        else {
            args = astForArguments(c, CHILD(n, 1));
            expression = astForExpr(c, CHILD(n, 3));
        }
        return new astnodes_49.Lambda(args, expression, n.lineno, n.col_offset);
    }
    function astForGenexp(c, n) {
        /* testlist_gexp: test ( gen_for | (',' test)* [','] )
            argument: [test '='] test [gen_for]       # Really [keyword '='] test */
        asserts_1.assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
        asserts_1.assert(NCH(n) > 1);
        function countGenFors(c, n) {
            var nfors = 0;
            var ch = CHILD(n, 1);
            count_gen_for: while (true) {
                nfors++;
                REQ(ch, SYM.gen_for);
                if (NCH(ch) === 5)
                    ch = CHILD(ch, 4);
                else
                    return nfors;
                count_gen_iter: while (true) {
                    REQ(ch, SYM.gen_iter);
                    ch = CHILD(ch, 0);
                    if (ch.type === SYM.gen_for)
                        continue count_gen_for;
                    else if (ch.type === SYM.gen_if) {
                        if (NCH(ch) === 3) {
                            ch = CHILD(ch, 2);
                            continue count_gen_iter;
                        }
                        else
                            return nfors;
                    }
                    break;
                }
                break;
            }
            asserts_1.fail("logic error in countGenFors");
        }
        function countGenIfs(c, n) {
            var nifs = 0;
            while (true) {
                REQ(n, SYM.gen_iter);
                if (CHILD(n, 0).type === SYM.gen_for)
                    return nifs;
                n = CHILD(n, 0);
                REQ(n, SYM.gen_if);
                nifs++;
                if (NCH(n) == 2)
                    return nifs;
                n = CHILD(n, 2);
            }
        }
        var elt = astForExpr(c, CHILD(n, 0));
        var nfors = countGenFors(c, n);
        var genexps = [];
        var ch = CHILD(n, 1);
        for (var i = 0; i < nfors; ++i) {
            REQ(ch, SYM.gen_for);
            var forch = CHILD(ch, 1);
            var t = astForExprlist(c, forch, astnodes_74.Store);
            var expression = astForExpr(c, CHILD(ch, 3));
            var ge;
            if (NCH(forch) === 1)
                ge = new astnodes_20.comprehension(t[0], expression, []);
            else
                ge = new astnodes_20.comprehension(new astnodes_80.Tuple(t, astnodes_74.Store, ch.lineno, ch.col_offset), expression, []);
            if (NCH(ch) === 5) {
                ch = CHILD(ch, 4);
                var nifs = countGenIfs(c, ch);
                var ifs = [];
                for (var j = 0; j < nifs; ++j) {
                    REQ(ch, SYM.gen_iter);
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.gen_if);
                    expression = astForExpr(c, CHILD(ch, 1));
                    ifs[j] = expression;
                    if (NCH(ch) === 3)
                        ch = CHILD(ch, 2);
                }
                if (ch.type === SYM.gen_iter)
                    ch = CHILD(ch, 0);
                ge.ifs = ifs;
            }
            genexps[i] = ge;
        }
        return new astnodes_35.GeneratorExp(elt, genexps, n.lineno, n.col_offset);
    }
    function astForWhileStmt(c, n) {
        /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
        REQ(n, SYM.while_stmt);
        if (NCH(n) === 4)
            return new astnodes_84.While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
        else if (NCH(n) === 7)
            return new astnodes_84.While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
        asserts_1.fail("wrong number of tokens for 'while' stmt");
    }
    function astForAugassign(c, n) {
        REQ(n, SYM.augassign);
        n = CHILD(n, 0);
        switch (n.value.charAt(0)) {
            case '+': return astnodes_1.Add;
            case '-': return astnodes_76.Sub;
            case '/':
                if (n.value.charAt(1) === '/')
                    return astnodes_32.FloorDiv;
                return astnodes_25.Div;
            case '%': return astnodes_56.Mod;
            case '<': return astnodes_53.LShift;
            case '>': return astnodes_72.RShift;
            case '&': return astnodes_12.BitAnd;
            case '^': return astnodes_14.BitXor;
            case '|': return astnodes_13.BitOr;
            case '*':
                if (n.value.charAt(1) === '*')
                    return astnodes_68.Pow;
                return astnodes_58.Mult;
            default: asserts_1.fail("invalid augassign");
        }
    }
    function astForBinop(c, n) {
        /* Must account for a sequence of expressions.
            How should A op B op C by represented?
            BinOp(BinOp(A, op, B), op, C).
        */
        var result = new astnodes_11.BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.lineno, n.col_offset);
        var nops = (NCH(n) - 1) / 2;
        for (var i = 1; i < nops; ++i) {
            var nextOper = CHILD(n, i * 2 + 1);
            var newoperator = getOperator(nextOper);
            var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
            result = new astnodes_11.BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
        }
        return result;
    }
    function astForTestlist(c, n) {
        /* testlist_gexp: test (',' test)* [','] */
        /* testlist: test (',' test)* [','] */
        /* testlist_safe: test (',' test)+ [','] */
        /* testlist1: test (',' test)* */
        asserts_1.assert(NCH(n) > 0);
        if (n.type === SYM.testlist_gexp) {
            if (NCH(n) > 1) {
                asserts_1.assert(CHILD(n, 1).type !== SYM.gen_for);
            }
        }
        else {
            asserts_1.assert(n.type === SYM.testlist || n.type === SYM.testlist_safe || n.type === SYM.testlist1);
        }
        if (NCH(n) === 1) {
            return astForExpr(c, CHILD(n, 0));
        }
        else {
            return new astnodes_80.Tuple(seqForTestlist(c, n), astnodes_52.Load, n.lineno, n.col_offset);
        }
    }
    function astForExprStmt(c, n) {
        REQ(n, SYM.ExprStmt);
        if (NCH(n) === 1)
            return new astnodes_30.Expr(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
        else if (CHILD(n, 1).type === SYM.augassign) {
            var ch = CHILD(n, 0);
            var expr1 = astForTestlist(c, ch);
            switch (expr1.constructor) {
                case astnodes_35.GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", c.c_filename, n.lineno);
                case astnodes_86.Yield: throw syntaxError("augmented assignment to yield expression not possible", c.c_filename, n.lineno);
                case astnodes_59.Name:
                    var varName = expr1.id;
                    forbiddenCheck(c, ch, varName, n.lineno);
                    break;
                case astnodes_7.Attribute:
                case astnodes_77.Subscript:
                    break;
                default:
                    throw syntaxError("illegal expression for augmented assignment", c.c_filename, n.lineno);
            }
            setContext(c, expr1, astnodes_74.Store, ch);
            ch = CHILD(n, 2);
            var expr2;
            if (ch.type === SYM.testlist)
                expr2 = astForTestlist(c, ch);
            else
                expr2 = astForExpr(c, ch);
            return new astnodes_8.AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
        }
        else {
            // normal assignment
            REQ(CHILD(n, 1), TOK.T_EQUAL);
            var targets = [];
            for (var i = 0; i < NCH(n) - 2; i += 2) {
                var ch = CHILD(n, i);
                if (ch.type === SYM.YieldExpr)
                    throw syntaxError("assignment to yield expression not possible", c.c_filename, n.lineno);
                var e = astForTestlist(c, ch);
                setContext(c, e, astnodes_74.Store, CHILD(n, i));
                targets[i / 2] = e;
            }
            var value = CHILD(n, NCH(n) - 1);
            var expression;
            if (value.type === SYM.testlist)
                expression = astForTestlist(c, value);
            else
                expression = astForExpr(c, value);
            return new astnodes_6.Assign(targets, expression, n.lineno, n.col_offset);
        }
    }
    function astForIfexpr(c, n) {
        asserts_1.assert(NCH(n) === 5);
        return new astnodes_41.IfExp(astForExpr(c, CHILD(n, 2)), astForExpr(c, CHILD(n, 0)), astForExpr(c, CHILD(n, 4)), n.lineno, n.col_offset);
    }
    // escape() was deprecated in JavaScript 1.5. Use encodeURI or encodeURIComponent instead.
    function escape(s) {
        return encodeURIComponent(s);
    }
    function unescape(s) {
        return decodeURIComponent(s);
    }
    /**
     * s is a python-style string literal, including quote characters and u/r/b
     * prefixes. Returns decoded string object.
     */
    function parsestr(c, s) {
        // 
        var encodeUtf8 = function (s) { return unescape(encodeURIComponent(s)); };
        var decodeUtf8 = function (s) { return decodeURIComponent(escape(s)); };
        var decodeEscape = function (s, quote) {
            var len = s.length;
            var ret = '';
            for (var i = 0; i < len; ++i) {
                var c = s.charAt(i);
                if (c === '\\') {
                    ++i;
                    c = s.charAt(i);
                    if (c === 'n')
                        ret += "\n";
                    else if (c === '\\')
                        ret += "\\";
                    else if (c === 't')
                        ret += "\t";
                    else if (c === 'r')
                        ret += "\r";
                    else if (c === 'b')
                        ret += "\b";
                    else if (c === 'f')
                        ret += "\f";
                    else if (c === 'v')
                        ret += "\v";
                    else if (c === '0')
                        ret += "\0";
                    else if (c === '"')
                        ret += '"';
                    else if (c === '\'')
                        ret += '\'';
                    else if (c === '\n') { }
                    else if (c === 'x') {
                        var d0 = s.charAt(++i);
                        var d1 = s.charAt(++i);
                        ret += String.fromCharCode(parseInt(d0 + d1, 16));
                    }
                    else if (c === 'u' || c === 'U') {
                        var d0 = s.charAt(++i);
                        var d1 = s.charAt(++i);
                        var d2 = s.charAt(++i);
                        var d3 = s.charAt(++i);
                        ret += String.fromCharCode(parseInt(d0 + d1, 16), parseInt(d2 + d3, 16));
                    }
                    else {
                        // Leave it alone
                        ret += "\\" + c;
                    }
                }
                else {
                    ret += c;
                }
            }
            return ret;
        };
        var quote = s.charAt(0);
        var rawmode = false;
        if (quote === 'u' || quote === 'U') {
            s = s.substr(1);
            quote = s.charAt(0);
        }
        else if (quote === 'r' || quote === 'R') {
            s = s.substr(1);
            quote = s.charAt(0);
            rawmode = true;
        }
        asserts_1.assert(quote !== 'b' && quote !== 'B', "todo; haven't done b'' strings yet");
        asserts_1.assert(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
        s = s.substr(1, s.length - 2);
        if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote) {
            asserts_1.assert(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
            s = s.substr(2, s.length - 4);
        }
        if (rawmode || s.indexOf('\\') === -1) {
            return strobj(decodeUtf8(s));
        }
        return strobj(decodeEscape(s, quote));
    }
    /**
     * @return {string}
     */
    function parsestrplus(c, n) {
        REQ(CHILD(n, 0), TOK.T_STRING);
        var ret = "";
        for (var i = 0; i < NCH(n); ++i) {
            var child = CHILD(n, i);
            try {
                ret = ret + parsestr(c, child.value);
            }
            catch (x) {
                throw syntaxError("invalid string (possibly contains a unicode character)", c.c_filename, child.lineno);
            }
        }
        return ret;
    }
    function parsenumber(c, s, lineno) {
        var end = s.charAt(s.length - 1);
        if (end === 'j' || end === 'J') {
            throw syntaxError("complex numbers are currently unsupported", c.c_filename, lineno);
        }
        if (s.indexOf('.') !== -1) {
            return numericLiteral_1.floatAST(s);
        }
        // Handle integers of various bases
        var tmp = s;
        var value;
        var radix = 10;
        var neg = false;
        if (s.charAt(0) === '-') {
            tmp = s.substr(1);
            neg = true;
        }
        if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'x' || tmp.charAt(1) === 'X')) {
            // Hex
            tmp = tmp.substring(2);
            value = parseInt(tmp, 16);
            radix = 16;
        }
        else if ((s.indexOf('e') !== -1) || (s.indexOf('E') !== -1)) {
            // Float with exponent (needed to make sure e/E wasn't hex first)
            return numericLiteral_1.floatAST(s);
        }
        else if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'b' || tmp.charAt(1) === 'B')) {
            // Binary
            tmp = tmp.substring(2);
            value = parseInt(tmp, 2);
            radix = 2;
        }
        else if (tmp.charAt(0) === '0') {
            if (tmp === "0") {
                // Zero
                value = 0;
            }
            else {
                // Octal (Leading zero, but not actually zero)
                if (end === 'l' || end === 'L') {
                    return numericLiteral_1.longAST(s.substr(0, s.length - 1), 8);
                }
                else {
                    radix = 8;
                    tmp = tmp.substring(1);
                    if ((tmp.charAt(0) === 'o') || (tmp.charAt(0) === 'O')) {
                        tmp = tmp.substring(1);
                    }
                    value = parseInt(tmp, 8);
                }
            }
        }
        else {
            // Decimal
            if (end === 'l' || end === 'L') {
                return numericLiteral_1.longAST(s.substr(0, s.length - 1), radix);
            }
            else {
                value = parseInt(tmp, radix);
            }
        }
        // Convert to long
        if (value > LONG_THRESHOLD && Math.floor(value) === value && (s.indexOf('e') === -1 && s.indexOf('E') === -1)) {
            // TODO: Does radix zero make sense?
            return numericLiteral_1.longAST(s, 0);
        }
        if (end === 'l' || end === 'L') {
            return numericLiteral_1.longAST(s.substr(0, s.length - 1), radix);
        }
        else {
            if (neg) {
                return numericLiteral_1.intAST(-value);
            }
            else {
                return numericLiteral_1.intAST(value);
            }
        }
    }
    function astForSlice(c, n) {
        REQ(n, SYM.subscript);
        var ch = CHILD(n, 0);
        var lower = null;
        var upper = null;
        var step = null;
        if (ch.type === TOK.T_DOT)
            return new astnodes_26.Ellipsis();
        if (NCH(n) === 1 && ch.type === SYM.IfExpr)
            return new astnodes_44.Index(astForExpr(c, ch));
        if (ch.type === SYM.IfExpr)
            lower = astForExpr(c, ch);
        if (ch.type === TOK.T_COLON) {
            if (NCH(n) > 1) {
                var n2 = CHILD(n, 1);
                if (n2.type === SYM.IfExpr)
                    upper = astForExpr(c, n2);
            }
        }
        else if (NCH(n) > 2) {
            var n2 = CHILD(n, 2);
            if (n2.type === SYM.IfExpr)
                upper = astForExpr(c, n2);
        }
        ch = CHILD(n, NCH(n) - 1);
        if (ch.type === SYM.sliceop) {
            if (NCH(ch) === 1) {
                ch = CHILD(ch, 0);
                step = new astnodes_59.Name(strobj("None"), astnodes_52.Load, ch.lineno, ch.col_offset);
            }
            else {
                ch = CHILD(ch, 1);
                if (ch.type === SYM.IfExpr)
                    step = astForExpr(c, ch);
            }
        }
        return new astnodes_73.Slice(lower, upper, step);
    }
    function astForAtomExpr(c, n) {
        var ch = CHILD(n, 0);
        switch (ch.type) {
            case TOK.T_NAME:
                // All names start in Load context, but may be changed later
                return new astnodes_59.Name(strobj(ch.value), astnodes_52.Load, n.lineno, n.col_offset);
            case TOK.T_STRING:
                return new astnodes_75.Str(parsestrplus(c, n), n.lineno, n.col_offset);
            case TOK.T_NUMBER:
                return new astnodes_64.Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
            case TOK.T_LPAR:
                ch = CHILD(n, 1);
                if (ch.type === TOK.T_RPAR)
                    return new astnodes_80.Tuple([], astnodes_52.Load, n.lineno, n.col_offset);
                if (ch.type === SYM.YieldExpr)
                    return astForExpr(c, ch);
                if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                    return astForGenexp(c, ch);
                return astForTestlistGexp(c, ch);
            case TOK.T_LSQB:
                ch = CHILD(n, 1);
                if (ch.type === TOK.T_RSQB)
                    return new astnodes_50.List([], astnodes_52.Load, n.lineno, n.col_offset);
                REQ(ch, SYM.listmaker);
                if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                    return new astnodes_50.List(seqForTestlist(c, ch), astnodes_52.Load, n.lineno, n.col_offset);
                else
                    return astForListcomp(c, ch);
            case TOK.T_LBRACE:
                /* dictmaker: test ':' test (',' test ':' test)* [','] */
                ch = CHILD(n, 1);
                var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
                var keys = [];
                var values = [];
                for (var i = 0; i < NCH(ch); i += 4) {
                    keys[i / 4] = astForExpr(c, CHILD(ch, i));
                    values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
                }
                return new astnodes_24.Dict(keys, values, n.lineno, n.col_offset);
            case TOK.T_BACKQUOTE:
                throw syntaxError("backquote not supported, use repr()", c.c_filename, n.lineno);
            default:
                asserts_1.fail("unhandled atom" /*, ch.type*/);
        }
    }
    function astForPowerExpr(c, n) {
        REQ(n, SYM.PowerExpr);
        var e = astForAtomExpr(c, CHILD(n, 0));
        if (NCH(n) === 1)
            return e;
        for (var i = 1; i < NCH(n); ++i) {
            var ch = CHILD(n, i);
            if (ch.type !== SYM.trailer)
                break;
            var tmp = astForTrailer(c, ch, e);
            tmp.lineno = e.lineno;
            tmp.col_offset = e.col_offset;
            e = tmp;
        }
        if (CHILD(n, NCH(n) - 1).type === SYM.UnaryExpr) {
            var f = astForExpr(c, CHILD(n, NCH(n) - 1));
            e = new astnodes_11.BinOp(e, astnodes_68.Pow, f, n.lineno, n.col_offset);
        }
        return e;
    }
    function astForExpr(c, n) {
        LOOP: while (true) {
            switch (n.type) {
                case SYM.IfExpr:
                case SYM.old_test:
                    if (CHILD(n, 0).type === SYM.LambdaExpr || CHILD(n, 0).type === SYM.old_LambdaExpr)
                        return astForLambdef(c, CHILD(n, 0));
                    else if (NCH(n) > 1)
                        return astForIfexpr(c, n);
                // fallthrough
                case SYM.OrExpr:
                case SYM.AndExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    var seq = [];
                    for (var i = 0; i < NCH(n); i += 2)
                        seq[i / 2] = astForExpr(c, CHILD(n, i));
                    if (CHILD(n, 1).value === "and")
                        return new astnodes_15.BoolOp(astnodes_4.And, seq, n.lineno, n.col_offset);
                    asserts_1.assert(CHILD(n, 1).value === "or");
                    return new astnodes_15.BoolOp(astnodes_65.Or, seq, n.lineno, n.col_offset);
                case SYM.NotExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    else {
                        return new astnodes_82.UnaryOp(astnodes_61.Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
                    }
                case SYM.ComparisonExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    else {
                        var ops = [];
                        var cmps = [];
                        for (var i = 1; i < NCH(n); i += 2) {
                            ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                            cmps[(i - 1) / 2] = astForExpr(c, CHILD(n, i + 1));
                        }
                        return new astnodes_19.Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
                    }
                case SYM.ArithmeticExpr:
                case SYM.GeometricExpr:
                case SYM.ShiftExpr:
                case SYM.BitwiseOrExpr:
                case SYM.BitwiseXorExpr:
                case SYM.BitwiseAndExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    return astForBinop(c, n);
                case SYM.YieldExpr:
                    var exp = null;
                    if (NCH(n) === 2) {
                        exp = astForTestlist(c, CHILD(n, 1));
                    }
                    return new astnodes_86.Yield(exp, n.lineno, n.col_offset);
                case SYM.UnaryExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    return astForUnaryExpr(c, n);
                case SYM.PowerExpr:
                    return astForPowerExpr(c, n);
                default:
                    asserts_1.fail("unhandled expr" /*, "n.type: %d", n.type*/);
            }
            break;
        }
    }
    function astForPrintStmt(c, n) {
        var start = 1;
        var dest = null;
        REQ(n, SYM.print_stmt);
        if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT) {
            dest = astForExpr(c, CHILD(n, 2));
            start = 4;
        }
        var seq = [];
        for (var i = start, j = 0; i < NCH(n); i += 2, ++j) {
            seq[j] = astForExpr(c, CHILD(n, i));
        }
        var nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
        return new astnodes_69.Print(dest, seq, nl, n.lineno, n.col_offset);
    }
    function astForStmt(c, n) {
        if (n.type === SYM.stmt) {
            asserts_1.assert(NCH(n) === 1);
            n = CHILD(n, 0);
        }
        if (n.type === SYM.simple_stmt) {
            asserts_1.assert(numStmts(n) === 1);
            n = CHILD(n, 0);
        }
        if (n.type === SYM.small_stmt) {
            REQ(n, SYM.small_stmt);
            n = CHILD(n, 0);
            switch (n.type) {
                case SYM.ExprStmt: return astForExprStmt(c, n);
                case SYM.print_stmt: return astForPrintStmt(c, n);
                case SYM.del_stmt: return astForDelStmt(c, n);
                case SYM.pass_stmt: return new astnodes_67.Pass(n.lineno, n.col_offset);
                case SYM.flow_stmt: return astForFlowStmt(c, n);
                case SYM.import_stmt: return astForImportStmt(c, n);
                case SYM.GlobalStmt: return astForGlobalStmt(c, n);
                case SYM.NonLocalStmt: return astForNonLocalStmt(c, n);
                case SYM.exec_stmt: return astForExecStmt(c, n);
                case SYM.assert_stmt: return astForAssertStmt(c, n);
                default: asserts_1.fail("unhandled small_stmt");
            }
        }
        else {
            var ch = CHILD(n, 0);
            REQ(n, SYM.compound_stmt);
            switch (ch.type) {
                case SYM.if_stmt: return astForIfStmt(c, ch);
                case SYM.while_stmt: return astForWhileStmt(c, ch);
                case SYM.for_stmt: return astForForStmt(c, ch);
                case SYM.try_stmt: return astForTryStmt(c, ch);
                case SYM.with_stmt: return astForWithStmt(c, ch);
                case SYM.funcdef: return astForFuncdef(c, ch, []);
                case SYM.classdef: return astForClassdef(c, ch, []);
                case SYM.decorated: return astForDecorated(c, ch);
                default: asserts_1.fail("unhandled compound_stmt");
            }
        }
    }
    function astFromParse(n, filename) {
        var c = new Compiling("utf-8", filename);
        var stmts = [];
        var ch;
        var k = 0;
        switch (n.type) {
            case SYM.file_input:
                for (var i = 0; i < NCH(n) - 1; ++i) {
                    var ch = CHILD(n, i);
                    if (n.type === TOK.T_NEWLINE)
                        continue;
                    REQ(ch, SYM.stmt);
                    var num = numStmts(ch);
                    if (num === 1) {
                        stmts[k++] = astForStmt(c, ch);
                    }
                    else {
                        ch = CHILD(ch, 0);
                        REQ(ch, SYM.simple_stmt);
                        for (var j = 0; j < num; ++j) {
                            stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                        }
                    }
                }
                return new astnodes_57.Module(stmts);
            case SYM.eval_input:
                asserts_1.fail("todo;");
            case SYM.single_input:
                asserts_1.fail("todo;");
            default:
                asserts_1.fail("todo;");
        }
    }
    exports.astFromParse = astFromParse;
    ;
    function astDump(node) {
        var _format = function (node) {
            if (node === null) {
                return "None";
            }
            else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum) {
                return node.prototype._astname + "()";
            }
            else if (node._astname !== undefined) {
                var fields = [];
                for (var i = 0; i < node._fields.length; i += 2) {
                    var a = node._fields[i]; // field name
                    var b = node._fields[i + 1](node); // field getter func
                    fields.push([a, _format(b)]);
                }
                var attrs = [];
                for (var i = 0; i < fields.length; ++i) {
                    var field = fields[i];
                    attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
                }
                var fieldstr = attrs.join(',');
                return node._astname + "(" + fieldstr + ")";
            }
            else if (base_1.isArrayLike(node)) {
                var elems = [];
                for (var i = 0; i < node.length; ++i) {
                    var x = node[i];
                    elems.push(_format(x));
                }
                var elemsstr = elems.join(',');
                return "[" + elemsstr.replace(/^\s+/, '') + "]";
            }
            else {
                var ret;
                if (node === true)
                    ret = "True";
                else if (node === false)
                    ret = "False";
                else
                    ret = "" + node;
                return ret;
            }
        };
        return _format(node);
    }
    exports.astDump = astDump;
    ;
});

/* Flags for def-use information */
define('pytools/SymbolConstants',["require", "exports"], function (require, exports) {
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

define('pytools/Symbol',["require", "exports", './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6, SymbolConstants_7, SymbolConstants_8, SymbolConstants_9, SymbolConstants_10) {
    "use strict";
    var Symbol = (function () {
        /**
         * @constructor
         * @param {string} name
         * @param {number} flags
         * @param {Array.<SymbolTableScope>} namespaces
         */
        function Symbol(name, flags, namespaces) {
            this.__name = name;
            this.__flags = flags;
            this.__scope = (flags >> SymbolConstants_9.SCOPE_OFF) & SymbolConstants_8.SCOPE_MASK;
            this.__namespaces = namespaces || [];
        }
        Symbol.prototype.get_name = function () { return this.__name; };
        Symbol.prototype.is_referenced = function () { return !!(this.__flags & SymbolConstants_10.USE); };
        Symbol.prototype.is_parameter = function () {
            return !!(this.__flags & SymbolConstants_4.DEF_PARAM);
        };
        Symbol.prototype.is_global = function () {
            return this.__scope === SymbolConstants_7.GLOBAL_IMPLICIT || this.__scope == SymbolConstants_6.GLOBAL_EXPLICIT;
        };
        Symbol.prototype.is_declared_global = function () {
            return this.__scope == SymbolConstants_6.GLOBAL_EXPLICIT;
        };
        Symbol.prototype.is_local = function () {
            return !!(this.__flags & SymbolConstants_1.DEF_BOUND);
        };
        Symbol.prototype.is_free = function () { return this.__scope == SymbolConstants_5.FREE; };
        Symbol.prototype.is_imported = function () { return !!(this.__flags & SymbolConstants_2.DEF_IMPORT); };
        Symbol.prototype.is_assigned = function () { return !!(this.__flags & SymbolConstants_3.DEF_LOCAL); };
        Symbol.prototype.is_namespace = function () { return this.__namespaces && this.__namespaces.length > 0; };
        Symbol.prototype.get_namespaces = function () { return this.__namespaces; };
        return Symbol;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Symbol;
});

define('pytools/SymbolTableScope',["require", "exports", './asserts', './Symbol', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, asserts_1, Symbol_1, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6, SymbolConstants_7, SymbolConstants_8) {
    "use strict";
    var astScopeCounter = 0;
    var SymbolTableScope = (function () {
        /**
         * @constructor
         * @param {Object} table
         * @param {string} name
         * @param {string} type
         * @param {number} lineno
         */
        function SymbolTableScope(table, name, type, ast, lineno) {
            this.symFlags = {};
            this.name = name;
            this.varnames = [];
            /**
             * @type Array.<SymbolTableScope>
             */
            this.children = [];
            this.blockType = type;
            this.isNested = false;
            this.hasFree = false;
            this.childHasFree = false; // true if child block has free vars including free refs to globals
            this.generator = false;
            this.varargs = false;
            this.varkeywords = false;
            this.returnsValue = false;
            this.lineno = lineno;
            this.table = table;
            if (table.cur && (table.cur.nested || table.cur.blockType === SymbolConstants_4.FunctionBlock))
                this.isNested = true;
            ast.scopeId = astScopeCounter++;
            table.stss[ast.scopeId] = this;
            // cache of Symbols for returning to other parts of code
            this.symbols = {};
        }
        SymbolTableScope.prototype.get_type = function () { return this.blockType; };
        SymbolTableScope.prototype.get_name = function () { return this.name; };
        SymbolTableScope.prototype.get_lineno = function () { return this.lineno; };
        SymbolTableScope.prototype.is_nested = function () { return this.isNested; };
        SymbolTableScope.prototype.has_children = function () { return this.children.length > 0; };
        SymbolTableScope.prototype.get_identifiers = function () { return this._identsMatching(function (x) { return true; }); };
        SymbolTableScope.prototype.lookup = function (name) {
            var sym;
            if (!this.symbols.hasOwnProperty(name)) {
                var flags = this.symFlags[name];
                var namespaces = this.__check_children(name);
                sym = this.symbols[name] = new Symbol_1.default(name, flags, namespaces);
            }
            else {
                sym = this.symbols[name];
            }
            return sym;
        };
        SymbolTableScope.prototype.__check_children = function (name) {
            //print("  check_children:", name);
            var ret = [];
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                if (child.name === name)
                    ret.push(child);
            }
            return ret;
        };
        SymbolTableScope.prototype._identsMatching = function (f) {
            var ret = [];
            for (var k in this.symFlags) {
                if (this.symFlags.hasOwnProperty(k)) {
                    if (f(this.symFlags[k]))
                        ret.push(k);
                }
            }
            ret.sort();
            return ret;
        };
        SymbolTableScope.prototype.get_parameters = function () {
            asserts_1.assert(this.get_type() == 'function', "get_parameters only valid for function scopes");
            if (!this._funcParams)
                this._funcParams = this._identsMatching(function (x) { return x & SymbolConstants_1.DEF_PARAM; });
            return this._funcParams;
        };
        SymbolTableScope.prototype.get_locals = function () {
            asserts_1.assert(this.get_type() == 'function', "get_locals only valid for function scopes");
            if (!this._funcLocals)
                this._funcLocals = this._identsMatching(function (x) { return x & SymbolConstants_2.DEF_BOUND; });
            return this._funcLocals;
        };
        SymbolTableScope.prototype.get_globals = function () {
            asserts_1.assert(this.get_type() == 'function', "get_globals only valid for function scopes");
            if (!this._funcGlobals) {
                this._funcGlobals = this._identsMatching(function (x) {
                    var masked = (x >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
                    return masked == SymbolConstants_6.GLOBAL_IMPLICIT || masked == SymbolConstants_5.GLOBAL_EXPLICIT;
                });
            }
            return this._funcGlobals;
        };
        SymbolTableScope.prototype.get_frees = function () {
            asserts_1.assert(this.get_type() == 'function', "get_frees only valid for function scopes");
            if (!this._funcFrees) {
                this._funcFrees = this._identsMatching(function (x) {
                    var masked = (x >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
                    return masked == SymbolConstants_3.FREE;
                });
            }
            return this._funcFrees;
        };
        SymbolTableScope.prototype.get_methods = function () {
            asserts_1.assert(this.get_type() == 'class', "get_methods only valid for class scopes");
            if (!this._classMethods) {
                // todo; uniq?
                var all = [];
                for (var i = 0; i < this.children.length; ++i)
                    all.push(this.children[i].name);
                all.sort();
                this._classMethods = all;
            }
            return this._classMethods;
        };
        SymbolTableScope.prototype.getScope = function (name) {
            //print("getScope");
            //for (var k in this.symFlags) print(k);
            var v = this.symFlags[name];
            if (v === undefined)
                return 0;
            return (v >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
        };
        return SymbolTableScope;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = SymbolTableScope;
});

define('pytools/symtable',["require", "exports", './asserts', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './base', './SymbolTableScope', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, asserts_1, astnodes_1, astnodes_2, astnodes_3, astnodes_4, astnodes_5, astnodes_6, astnodes_7, astnodes_8, astnodes_9, astnodes_10, astnodes_11, astnodes_12, astnodes_13, astnodes_14, astnodes_15, astnodes_16, astnodes_17, astnodes_18, astnodes_19, astnodes_20, astnodes_21, astnodes_22, astnodes_23, astnodes_24, astnodes_25, astnodes_26, astnodes_27, astnodes_28, astnodes_29, astnodes_30, astnodes_31, astnodes_32, astnodes_33, astnodes_34, astnodes_35, astnodes_36, astnodes_37, astnodes_38, astnodes_39, astnodes_40, astnodes_41, astnodes_42, astnodes_43, astnodes_44, astnodes_45, astnodes_46, astnodes_47, astnodes_48, base_1, SymbolTableScope_1, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6, SymbolConstants_7, SymbolConstants_8, SymbolConstants_9, SymbolConstants_10, SymbolConstants_11, SymbolConstants_12, SymbolConstants_13, SymbolConstants_14, SymbolConstants_15, SymbolConstants_16) {
    "use strict";
    /**
     * @param {string} message
     * @param {string} fileName
     * @param {number=} lineNumber
     */
    function syntaxError(message, fileName, lineNumber) {
        asserts_1.assert(base_1.isString(message), "message must be a string");
        asserts_1.assert(base_1.isString(fileName), "fileName must be a string");
        if (base_1.isDef(lineNumber)) {
            asserts_1.assert(base_1.isNumber(lineNumber), "lineNumber must be a number");
        }
        var e = new SyntaxError(message /*, fileName*/);
        e['fileName'] = fileName;
        if (typeof lineNumber === 'number') {
            e['lineNumber'] = lineNumber;
        }
        return e;
    }
    /**
     * @param {string|null} priv
     * @param {string} name
     */
    function mangleName(priv, name) {
        var strpriv = null;
        if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_')
            return name;
        // don't mangle __id__
        if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_')
            return name;
        // don't mangle classes that are all _ (obscure much?)
        strpriv = priv;
        strpriv.replace(/_/g, '');
        if (strpriv === '')
            return name;
        strpriv = priv;
        strpriv.replace(/^_*/, '');
        strpriv = '_' + strpriv + name;
        return strpriv;
    }
    var SymbolTable = (function () {
        /**
         * @constructor
         * @param {string} fileName
         */
        function SymbolTable(fileName) {
            this.visitExpr = function (e) {
                asserts_1.assert(e !== undefined, "visitExpr called with undefined");
                //print("  e: ", e.constructor.name);
                switch (e.constructor) {
                    case astnodes_6.BoolOp:
                        this.SEQExpr(e.values);
                        break;
                    case astnodes_5.BinOp:
                        this.visitExpr(e.left);
                        this.visitExpr(e.right);
                        break;
                    case astnodes_45.UnaryOp:
                        this.visitExpr(e.operand);
                        break;
                    case astnodes_27.Lambda:
                        this.addDef("lambda", SymbolConstants_7.DEF_LOCAL, e.lineno);
                        if (e.args.defaults)
                            this.SEQExpr(e.args.defaults);
                        this.enterBlock("lambda", SymbolConstants_10.FunctionBlock, e, e.lineno);
                        this.visitArguments(e.args, e.lineno);
                        this.visitExpr(e.body);
                        this.exitBlock();
                        break;
                    case astnodes_23.IfExp:
                        this.visitExpr(e.test);
                        this.visitExpr(e.body);
                        this.visitExpr(e.orelse);
                        break;
                    case astnodes_13.Dict:
                        this.SEQExpr(e.keys);
                        this.SEQExpr(e.values);
                        break;
                    case astnodes_30.ListComp:
                        this.newTmpname(e.lineno);
                        this.visitExpr(e.elt);
                        this.visitComprehension(e.generators, 0);
                        break;
                    case astnodes_20.GeneratorExp:
                        this.visitGenexp(e);
                        break;
                    case astnodes_48.Yield:
                        if (e.value)
                            this.visitExpr(e.value);
                        this.cur.generator = true;
                        if (this.cur.returnsValue) {
                            throw syntaxError("'return' with argument inside generator", this.fileName);
                        }
                        break;
                    case astnodes_10.Compare:
                        this.visitExpr(e.left);
                        this.SEQExpr(e.comparators);
                        break;
                    case astnodes_8.Call:
                        this.visitExpr(e.func);
                        this.SEQExpr(e.args);
                        for (var i = 0; i < e.keywords.length; ++i)
                            this.visitExpr(e.keywords[i].value);
                        //print(JSON.stringify(e.starargs, null, 2));
                        //print(JSON.stringify(e.kwargs, null,2));
                        if (e.starargs)
                            this.visitExpr(e.starargs);
                        if (e.kwargs)
                            this.visitExpr(e.kwargs);
                        break;
                    case astnodes_32.Num:
                    case astnodes_40.Str:
                        break;
                    case astnodes_3.Attribute:
                        this.visitExpr(e.value);
                        break;
                    case astnodes_41.Subscript:
                        this.visitExpr(e.value);
                        this.visitSlice(e.slice);
                        break;
                    case astnodes_31.Name:
                        this.addDef(e.id, e.ctx === astnodes_28.Load ? SymbolConstants_15.USE : SymbolConstants_7.DEF_LOCAL, e.lineno);
                        break;
                    case astnodes_29.List:
                    case astnodes_44.Tuple:
                        this.SEQExpr(e.elts);
                        break;
                    default:
                        asserts_1.fail("Unhandled type " + e.constructor.name + " in visitExpr");
                }
            };
            this.visitComprehension = function (lcs, startAt) {
                var len = lcs.length;
                for (var i = startAt; i < len; ++i) {
                    var lc = lcs[i];
                    this.visitExpr(lc.target);
                    this.visitExpr(lc.iter);
                    this.SEQExpr(lc.ifs);
                }
            };
            /**
             * This is probably not correct for names. What are they?
             * @param {Array.<Object>} names
             * @param {number} lineno
             */
            this.visitAlias = function (names, lineno) {
                /* Compute store_name, the name actually bound by the import
                    operation.  It is diferent than a->name when a->name is a
                    dotted package name (e.g. spam.eggs)
                */
                for (var i = 0; i < names.length; ++i) {
                    var a = names[i];
                    // DGH: The RHS used to be Python strings.
                    var name = a.asname === null ? a.name : a.asname;
                    var storename = name;
                    var dot = name.indexOf('.');
                    if (dot !== -1)
                        storename = name.substr(0, dot);
                    if (name !== "*") {
                        this.addDef(storename, SymbolConstants_6.DEF_IMPORT, lineno);
                    }
                    else {
                        if (this.cur.blockType !== SymbolConstants_14.ModuleBlock) {
                            throw syntaxError("import * only allowed at module level", this.fileName);
                        }
                    }
                }
            };
            /**
             * @param {Object} e
             */
            this.visitGenexp = function (e) {
                var outermost = e.generators[0];
                // outermost is evaled in current scope
                this.visitExpr(outermost.iter);
                this.enterBlock("genexpr", SymbolConstants_10.FunctionBlock, e, e.lineno);
                this.cur.generator = true;
                this.addDef(".0", SymbolConstants_8.DEF_PARAM, e.lineno);
                this.visitExpr(outermost.target);
                this.SEQExpr(outermost.ifs);
                this.visitComprehension(e.generators, 1);
                this.visitExpr(e.elt);
                this.exitBlock();
            };
            this.visitExcepthandlers = function (handlers) {
                for (var i = 0, eh; eh = handlers[i]; ++i) {
                    if (eh.type)
                        this.visitExpr(eh.type);
                    if (eh.name)
                        this.visitExpr(eh.name);
                    this.SEQStmt(eh.body);
                }
            };
            /**
             * @param {Object} ste The Symbol Table Scope.
             */
            this.analyzeBlock = function (ste, bound, free, global) {
                var local = {};
                var scope = {};
                var newglobal = {};
                var newbound = {};
                var newfree = {};
                if (ste.blockType == SymbolConstants_2.ClassBlock) {
                    _dictUpdate(newglobal, global);
                    if (bound)
                        _dictUpdate(newbound, bound);
                }
                for (var name in ste.symFlags) {
                    var flags = ste.symFlags[name];
                    this.analyzeName(ste, scope, name, flags, bound, local, free, global);
                }
                if (ste.blockType !== SymbolConstants_2.ClassBlock) {
                    if (ste.blockType === SymbolConstants_10.FunctionBlock)
                        _dictUpdate(newbound, local);
                    if (bound)
                        _dictUpdate(newbound, bound);
                    _dictUpdate(newglobal, global);
                }
                var allfree = {};
                var childlen = ste.children.length;
                for (var i = 0; i < childlen; ++i) {
                    var c = ste.children[i];
                    this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
                    if (c.hasFree || c.childHasFree)
                        ste.childHasFree = true;
                }
                _dictUpdate(newfree, allfree);
                if (ste.blockType === SymbolConstants_10.FunctionBlock)
                    this.analyzeCells(scope, newfree);
                this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === SymbolConstants_2.ClassBlock);
                _dictUpdate(free, newfree);
            };
            this.analyzeChildBlock = function (entry, bound, free, global, childFree) {
                var tempBound = {};
                _dictUpdate(tempBound, bound);
                var tempFree = {};
                _dictUpdate(tempFree, free);
                var tempGlobal = {};
                _dictUpdate(tempGlobal, global);
                this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
                _dictUpdate(childFree, tempFree);
            };
            this.analyzeCells = function (scope, free) {
                for (var name in scope) {
                    var flags = scope[name];
                    if (flags !== SymbolConstants_13.LOCAL)
                        continue;
                    if (free[name] === undefined)
                        continue;
                    scope[name] = SymbolConstants_1.CELL;
                    delete free[name];
                }
            };
            /**
             * store scope info back into the st symbols dict. symbols is modified,
             * others are not.
             */
            this.updateSymbols = function (symbols, scope, bound, free, classflag) {
                for (var name in symbols) {
                    var flags = symbols[name];
                    var w = scope[name];
                    flags |= w << SymbolConstants_16.SCOPE_OFF;
                    symbols[name] = flags;
                }
                var freeValue = SymbolConstants_9.FREE << SymbolConstants_16.SCOPE_OFF;
                var pos = 0;
                for (var name in free) {
                    var o = symbols[name];
                    if (o !== undefined) {
                        // it could be a free variable in a method of the class that has
                        // the same name as a local or global in the class scope
                        if (classflag && (o & (SymbolConstants_3.DEF_BOUND | SymbolConstants_5.DEF_GLOBAL))) {
                            var i = o | SymbolConstants_4.DEF_FREE_CLASS;
                            symbols[name] = i;
                        }
                        // else it's not free, probably a cell
                        continue;
                    }
                    if (bound[name] === undefined)
                        continue;
                    symbols[name] = freeValue;
                }
            };
            /**
             * @param {Object} ste The Symbol Table Scope.
             * @param {string} name
             */
            this.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
                if (flags & SymbolConstants_5.DEF_GLOBAL) {
                    if (flags & SymbolConstants_8.DEF_PARAM)
                        throw syntaxError("name '" + name + "' is local and global", this.fileName, ste.lineno);
                    dict[name] = SymbolConstants_11.GLOBAL_EXPLICIT;
                    global[name] = null;
                    if (bound && bound[name] !== undefined)
                        delete bound[name];
                    return;
                }
                if (flags & SymbolConstants_3.DEF_BOUND) {
                    dict[name] = SymbolConstants_13.LOCAL;
                    local[name] = null;
                    delete global[name];
                    return;
                }
                if (bound && bound[name] !== undefined) {
                    dict[name] = SymbolConstants_9.FREE;
                    ste.hasFree = true;
                    free[name] = null;
                }
                else if (global && global[name] !== undefined) {
                    dict[name] = SymbolConstants_12.GLOBAL_IMPLICIT;
                }
                else {
                    if (ste.isNested)
                        ste.hasFree = true;
                    dict[name] = SymbolConstants_12.GLOBAL_IMPLICIT;
                }
            };
            this.analyze = function () {
                var free = {};
                var global = {};
                this.analyzeBlock(this.top, null, free, global);
            };
            this.fileName = fileName;
            this.cur = null;
            this.top = null;
            this.stack = [];
            this.global = null; // points at top level module symFlags
            this.curClass = null; // current class or null
            this.tmpname = 0;
            // mapping from ast nodes to their scope if they have one. we add an
            // id to the ast node when a scope is created for it, and store it in
            // here for the compiler to lookup later.
            this.stss = {};
        }
        /**
         * Lookup the SymbolTableScope for a scopeId of the AST.
         */
        SymbolTable.prototype.getStsForAst = function (ast) {
            asserts_1.assert(ast.scopeId !== undefined, "ast wasn't added to st?");
            var v = this.stss[ast.scopeId];
            asserts_1.assert(v !== undefined, "unknown sym tab entry");
            return v;
        };
        SymbolTable.prototype.SEQStmt = function (nodes) {
            var len = nodes.length;
            for (var i = 0; i < len; ++i) {
                var val = nodes[i];
                if (val)
                    this.visitStmt(val);
            }
        };
        SymbolTable.prototype.SEQExpr = function (nodes) {
            var len = nodes.length;
            for (var i = 0; i < len; ++i) {
                var val = nodes[i];
                if (val)
                    this.visitExpr(val);
            }
        };
        SymbolTable.prototype.enterBlock = function (name, blockType, ast, lineno) {
            //  name = fixReservedNames(name);
            var prev = null;
            if (this.cur) {
                prev = this.cur;
                this.stack.push(this.cur);
            }
            this.cur = new SymbolTableScope_1.default(this, name, blockType, ast, lineno);
            if (name === 'top') {
                this.global = this.cur.symFlags;
            }
            if (prev) {
                prev.children.push(this.cur);
            }
        };
        SymbolTable.prototype.exitBlock = function () {
            //print("exitBlock");
            this.cur = null;
            if (this.stack.length > 0)
                this.cur = this.stack.pop();
        };
        SymbolTable.prototype.visitParams = function (args, toplevel) {
            for (var i = 0; i < args.length; ++i) {
                var arg = args[i];
                if (arg.constructor === astnodes_31.Name) {
                    asserts_1.assert(arg.ctx === astnodes_33.Param || (arg.ctx === astnodes_39.Store && !toplevel));
                    this.addDef(arg.id, SymbolConstants_8.DEF_PARAM, arg.lineno);
                }
                else {
                    // Tuple isn't supported
                    throw syntaxError("invalid expression in parameter list", this.fileName);
                }
            }
        };
        ;
        SymbolTable.prototype.visitArguments = function (a, lineno) {
            if (a.args)
                this.visitParams(a.args, true);
            if (a.vararg) {
                this.addDef(a.vararg, SymbolConstants_8.DEF_PARAM, lineno);
                this.cur.varargs = true;
            }
            if (a.kwarg) {
                this.addDef(a.kwarg, SymbolConstants_8.DEF_PARAM, lineno);
                this.cur.varkeywords = true;
            }
        };
        /**
         * @param {number} lineno
         */
        SymbolTable.prototype.newTmpname = function (lineno) {
            this.addDef("_[" + (++this.tmpname) + "]", SymbolConstants_7.DEF_LOCAL, lineno);
        };
        /**
         * @param {string} name
         * @param {number} flag
         * @param {number} lineno
         */
        SymbolTable.prototype.addDef = function (name, flag, lineno) {
            var mangled = mangleName(this.curClass, name);
            //  mangled = fixReservedNames(mangled);
            var val = this.cur.symFlags[mangled];
            if (val !== undefined) {
                if ((flag & SymbolConstants_8.DEF_PARAM) && (val & SymbolConstants_8.DEF_PARAM)) {
                    throw syntaxError("duplicate argument '" + name + "' in function definition", this.fileName, lineno);
                }
                val |= flag;
            }
            else {
                val = flag;
            }
            this.cur.symFlags[mangled] = val;
            if (flag & SymbolConstants_8.DEF_PARAM) {
                this.cur.varnames.push(mangled);
            }
            else if (flag & SymbolConstants_5.DEF_GLOBAL) {
                val = flag;
                var fromGlobal = this.global[mangled];
                if (fromGlobal !== undefined)
                    val |= fromGlobal;
                this.global[mangled] = val;
            }
        };
        SymbolTable.prototype.visitSlice = function (s) {
            switch (s.constructor) {
                case astnodes_38.Slice:
                    if (s.lower)
                        this.visitExpr(s.lower);
                    if (s.upper)
                        this.visitExpr(s.upper);
                    if (s.step)
                        this.visitExpr(s.step);
                    break;
                case astnodes_17.ExtSlice:
                    for (var i = 0; i < s.dims.length; ++i)
                        this.visitSlice(s.dims[i]);
                    break;
                case astnodes_26.Index:
                    this.visitExpr(s.value);
                    break;
                case astnodes_14.Ellipsis:
                    break;
            }
        };
        /**
         * @param {Object} s
         */
        SymbolTable.prototype.visitStmt = function (s) {
            asserts_1.assert(s !== undefined, "visitStmt called with undefined");
            switch (s.constructor) {
                case astnodes_19.FunctionDef:
                    this.addDef(s.name, SymbolConstants_7.DEF_LOCAL, s.lineno);
                    if (s.args.defaults)
                        this.SEQExpr(s.args.defaults);
                    if (s.decorator_list)
                        this.SEQExpr(s.decorator_list);
                    this.enterBlock(s.name, SymbolConstants_10.FunctionBlock, s, s.lineno);
                    this.visitArguments(s.args, s.lineno);
                    this.SEQStmt(s.body);
                    this.exitBlock();
                    break;
                case astnodes_9.ClassDef:
                    this.addDef(s.name, SymbolConstants_7.DEF_LOCAL, s.lineno);
                    this.SEQExpr(s.bases);
                    if (s.decorator_list)
                        this.SEQExpr(s.decorator_list);
                    this.enterBlock(s.name, SymbolConstants_2.ClassBlock, s, s.lineno);
                    var tmp = this.curClass;
                    this.curClass = s.name;
                    this.SEQStmt(s.body);
                    this.curClass = tmp;
                    this.exitBlock();
                    break;
                case astnodes_37.Return_:
                    if (s.value) {
                        this.visitExpr(s.value);
                        this.cur.returnsValue = true;
                        if (this.cur.generator) {
                            throw syntaxError("'return' with argument inside generator", this.fileName);
                        }
                    }
                    break;
                case astnodes_12.Delete_:
                    this.SEQExpr(s.targets);
                    break;
                case astnodes_2.Assign:
                    this.SEQExpr(s.targets);
                    this.visitExpr(s.value);
                    break;
                case astnodes_4.AugAssign:
                    this.visitExpr(s.target);
                    this.visitExpr(s.value);
                    break;
                case astnodes_35.Print:
                    if (s.dest)
                        this.visitExpr(s.dest);
                    this.SEQExpr(s.values);
                    break;
                case astnodes_18.For_:
                    this.visitExpr(s.target);
                    this.visitExpr(s.iter);
                    this.SEQStmt(s.body);
                    if (s.orelse)
                        this.SEQStmt(s.orelse);
                    break;
                case astnodes_46.While_:
                    this.visitExpr(s.test);
                    this.SEQStmt(s.body);
                    if (s.orelse)
                        this.SEQStmt(s.orelse);
                    break;
                case astnodes_22.If_:
                    this.visitExpr(s.test);
                    this.SEQStmt(s.body);
                    if (s.orelse)
                        this.SEQStmt(s.orelse);
                    break;
                case astnodes_36.Raise:
                    if (s.type) {
                        this.visitExpr(s.type);
                        if (s.inst) {
                            this.visitExpr(s.inst);
                            if (s.tback)
                                this.visitExpr(s.tback);
                        }
                    }
                    break;
                case astnodes_42.TryExcept:
                    this.SEQStmt(s.body);
                    this.SEQStmt(s.orelse);
                    this.visitExcepthandlers(s.handlers);
                    break;
                case astnodes_43.TryFinally:
                    this.SEQStmt(s.body);
                    this.SEQStmt(s.finalbody);
                    break;
                case astnodes_1.Assert:
                    this.visitExpr(s.test);
                    if (s.msg)
                        this.visitExpr(s.msg);
                    break;
                case astnodes_24.Import_:
                case astnodes_25.ImportFrom:
                    this.visitAlias(s.names, s.lineno);
                    break;
                case astnodes_15.Exec:
                    this.visitExpr(s.body);
                    if (s.globals) {
                        this.visitExpr(s.globals);
                        if (s.locals)
                            this.visitExpr(s.locals);
                    }
                    break;
                case astnodes_21.Global:
                    var nameslen = s.names.length;
                    for (var i = 0; i < nameslen; ++i) {
                        var name = mangleName(this.curClass, s.names[i]);
                        //              name = fixReservedNames(name);
                        var cur = this.cur.symFlags[name];
                        if (cur & (SymbolConstants_7.DEF_LOCAL | SymbolConstants_15.USE)) {
                            if (cur & SymbolConstants_7.DEF_LOCAL) {
                                throw syntaxError("name '" + name + "' is assigned to before global declaration", this.fileName, s.lineno);
                            }
                            else {
                                throw syntaxError("name '" + name + "' is used prior to global declaration", this.fileName, s.lineno);
                            }
                        }
                        this.addDef(name, SymbolConstants_5.DEF_GLOBAL, s.lineno);
                    }
                    break;
                case astnodes_16.Expr:
                    this.visitExpr(s.value);
                    break;
                case astnodes_34.Pass:
                case astnodes_7.Break_:
                case astnodes_11.Continue_:
                    // nothing
                    break;
                case astnodes_47.With_:
                    this.newTmpname(s.lineno);
                    this.visitExpr(s.context_expr);
                    if (s.optional_vars) {
                        this.newTmpname(s.lineno);
                        this.visitExpr(s.optional_vars);
                    }
                    this.SEQStmt(s.body);
                    break;
                default:
                    asserts_1.fail("Unhandled type " + s.constructor.name + " in visitStmt");
            }
        };
        return SymbolTable;
    }());
    function _dictUpdate(a, b) {
        for (var kb in b) {
            a[kb] = b[kb];
        }
    }
    /**
     * @param {Object} ast
     * @param {string} fileName
     */
    var symbolTable = function (ast, fileName) {
        var ret = new SymbolTable(fileName);
        ret.enterBlock("top", SymbolConstants_14.ModuleBlock, ast, 0);
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
        mangleName: mangleName,
        LOCAL: SymbolConstants_13.LOCAL,
        GLOBAL_EXPLICIT: SymbolConstants_11.GLOBAL_EXPLICIT,
        GLOBAL_IMPLICIT: SymbolConstants_12.GLOBAL_IMPLICIT,
        FREE: SymbolConstants_9.FREE,
        CELL: SymbolConstants_1.CELL,
        FunctionBlock: SymbolConstants_10.FunctionBlock,
        dumpSymbolTable: dumpSymbolTable
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = that;
});

define('pytools/sk-compiler',["require", "exports", './asserts', './parser', './builder', './symtable', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './astnodes', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, asserts_1, parser_1, builder_1, symtable_1, astnodes_1, astnodes_2, astnodes_3, astnodes_4, astnodes_5, astnodes_6, astnodes_7, astnodes_8, astnodes_9, astnodes_10, astnodes_11, astnodes_12, astnodes_13, astnodes_14, astnodes_15, astnodes_16, astnodes_17, astnodes_18, astnodes_19, astnodes_20, astnodes_21, astnodes_22, astnodes_23, astnodes_24, astnodes_25, astnodes_26, astnodes_27, astnodes_28, astnodes_29, astnodes_30, astnodes_31, astnodes_32, astnodes_33, astnodes_34, astnodes_35, astnodes_36, astnodes_37, astnodes_38, astnodes_39, astnodes_40, astnodes_41, astnodes_42, astnodes_43, astnodes_44, astnodes_45, astnodes_46, astnodes_47, astnodes_48, astnodes_49, astnodes_50, astnodes_51, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6) {
    "use strict";
    /** @param {...*} x */
    var out;
    var gensymcount = 0;
    var Compiler = (function () {
        /**
         * @constructor
         * @param {string} fileName
         * @param {Object} st
         * @param {number} flags
         * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
         */
        function Compiler(fileName, st, flags, sourceCodeForAnnotation) {
            this.fileName = fileName;
            /**
             * @type {Object}
             * @private
             */
            this.st = st;
            this.flags = flags;
            this.interactive = false;
            this.nestlevel = 0;
            this.u = null;
            /**
             * @type Array.<CompilerUnit>
             * @private
             */
            this.stack = [];
            this.result = [];
            // this.gensymcount = 0;
            /**
             * @type Array.<CompilerUnit>
             * @private
             */
            this.allUnits = [];
            this.source = sourceCodeForAnnotation ? sourceCodeForAnnotation.split("\n") : false;
        }
        Compiler.prototype.getSourceLine = function (lineno) {
            asserts_1.assert(!!this.source);
            return this.source[lineno - 1];
        };
        Compiler.prototype.annotateSource = function (ast) {
            if (this.source) {
                var lineno = ast.lineno;
                var col_offset = ast.col_offset;
                out('\n//');
                out('\n// line ', lineno, ':');
                out('\n// ', this.getSourceLine(lineno));
                //
                out('\n// ');
                for (var i = 0; i < col_offset; ++i) {
                    out(" ");
                }
                out("^");
                out("\n//");
                out('\nSk.currLineNo = ', lineno, ';Sk.currColNo = ', col_offset, ';');
                out("\nSk.currFilename = '", this.fileName, "';\n\n");
            }
        };
        Compiler.prototype.gensym = function (hint) {
            hint = hint || '';
            hint = '$' + hint;
            hint += gensymcount++;
            return hint;
        };
        Compiler.prototype.niceName = function (roughName) {
            return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
        };
        /**
         * @param {string} hint basename for gensym
         * @param {...*} rest
         */
        Compiler.prototype._gr = function (hint, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, argA, argB, argC, argD, argE) {
            var v = this.gensym(hint);
            out("var ", v, "=");
            for (var i = 1; i < arguments.length; ++i) {
                out(arguments[i]);
            }
            out(";");
            return v;
        };
        /**
        * Function to test if an interrupt should occur if the program has been running for too long.
        * This function is executed at every test/branch operation.
        */
        Compiler.prototype._interruptTest = function () {
            out("if (typeof Sk.execStart === 'undefined') {Sk.execStart=new Date()}");
            out("if (Sk.execLimit !== null && new Date() - Sk.execStart > Sk.execLimit) {throw new Sk.builtin.TimeLimitError(Sk.timeoutMsg())}");
        };
        Compiler.prototype._jumpfalse = function (test, block) {
            var cond = this._gr('jfalse', "(", test, "===false||!Sk.misceval.isTrue(", test, "))");
            this._interruptTest();
            out("if(", cond, "){/*test failed */$blk=", block, ";continue;}");
        };
        Compiler.prototype._jumpundef = function (test, block) {
            this._interruptTest();
            out("if(typeof ", test, " === 'undefined'){$blk=", block, ";continue;}");
        };
        Compiler.prototype._jumptrue = function (test, block) {
            var cond = this._gr('jtrue', "(", test, "===true||Sk.misceval.isTrue(", test, "))");
            this._interruptTest();
            out("if(", cond, "){/*test passed */$blk=", block, ";continue;}");
        };
        Compiler.prototype._jump = function (block) {
            this._interruptTest();
            out("$blk=", block, ";/* jump */continue;");
        };
        Compiler.prototype.ctupleorlist = function (e, data, tuporlist) {
            asserts_1.assert(tuporlist === 'tuple' || tuporlist === 'list');
            if (e.ctx === astnodes_43.Store) {
                for (var i = 0; i < e.elts.length; ++i) {
                    this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
                }
            }
            else if (e.ctx === astnodes_33.Load) {
                var items = [];
                for (var i = 0; i < e.elts.length; ++i) {
                    items.push(this._gr('elem', this.vexpr(e.elts[i])));
                }
                return this._gr('load' + tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
            }
        };
        Compiler.prototype.cdict = function (e) {
            asserts_1.assert(e.values.length === e.keys.length);
            var items = [];
            for (var i = 0; i < e.values.length; ++i) {
                var v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
                items.push(this.vexpr(e.keys[i]));
                items.push(v);
            }
            return this._gr('loaddict', "new Sk.builtins['dict']([", items, "])");
        };
        Compiler.prototype.clistcompgen = function (tmpname, generators, genIndex, elt) {
            var start = this.newBlock('list gen start');
            var skip = this.newBlock('list gen skip');
            var anchor = this.newBlock('list gen anchor');
            var l = generators[genIndex];
            var toiter = this.vexpr(l.iter);
            var iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
            this._jump(start);
            this.setBlock(start);
            // load targets
            var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
            this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
            var target = this.vexpr(l.target, nexti);
            var n = l.ifs.length;
            for (var i = 0; i < n; ++i) {
                var ifres = this.vexpr(l.ifs[i]);
                this._jumpfalse(ifres, start);
            }
            if (++genIndex < generators.length) {
                this.clistcompgen(tmpname, generators, genIndex, elt);
            }
            if (genIndex >= generators.length) {
                var velt = this.vexpr(elt);
                out(tmpname, ".v.push(", velt, ");");
                this._jump(skip);
                this.setBlock(skip);
            }
            this._jump(start);
            this.setBlock(anchor);
            return tmpname;
        };
        Compiler.prototype.clistcomp = function (e) {
            asserts_1.assert(e instanceof astnodes_32.ListComp);
            var tmp = this._gr("_compr", "new Sk.builtins['list']([])");
            return this.clistcompgen(tmp, e.generators, 0, e.elt);
        };
        Compiler.prototype.cyield = function (e) {
            if (this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                throw new SyntaxError("'yield' outside function");
            var val = 'null';
            if (e.value)
                val = this.vexpr(e.value);
            var nextBlock = this.newBlock('after yield');
            // return a pair: resume target block and yielded value
            out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
            this.setBlock(nextBlock);
            return '$gen.gi$sentvalue'; // will either be null if none sent, or the value from gen.send(value)
        };
        Compiler.prototype.ccompare = function (e) {
            asserts_1.assert(e.ops.length === e.comparators.length);
            var cur = this.vexpr(e.left);
            var n = e.ops.length;
            var done = this.newBlock("done");
            var fres = this._gr('compareres', 'null');
            for (var i = 0; i < n; ++i) {
                var rhs = this.vexpr(e.comparators[i]);
                var res = this._gr('compare', "Sk.builtin.bool(Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", e.ops[i].prototype._astname, "'))");
                out(fres, '=', res, ';');
                this._jumpfalse(res, done);
                cur = rhs;
            }
            this._jump(done);
            this.setBlock(done);
            return fres;
        };
        Compiler.prototype.ccall = function (e) {
            var func = this.vexpr(e.func);
            var args = this.vseqexpr(e.args);
            if (e.keywords.length > 0 || e.starargs || e.kwargs) {
                var kwarray = [];
                for (var i = 0; i < e.keywords.length; ++i) {
                    kwarray.push("'" + e.keywords[i].arg + "'");
                    kwarray.push(this.vexpr(e.keywords[i].value));
                }
                var keywords = "[" + kwarray.join(",") + "]";
                var starargs = "undefined";
                var kwargs = "undefined";
                if (e.starargs)
                    starargs = this.vexpr(e.starargs);
                if (e.kwargs)
                    kwargs = this.vexpr(e.kwargs);
                return this._gr('call', "Sk.misceval.call(", func, ",", kwargs, ",", starargs, ",", keywords, args.length > 0 ? "," : "", args, ")");
            }
            else {
                return this._gr('call', "Sk.misceval.callsim(", func, args.length > 0 ? "," : "", args, ")");
            }
        };
        Compiler.prototype.cslice = function (s) {
            asserts_1.assert(s instanceof astnodes_42.Slice);
            var low = s.lower ? this.vexpr(s.lower) : 'null';
            var high = s.upper ? this.vexpr(s.upper) : 'null';
            var step = s.step ? this.vexpr(s.step) : 'null';
            return this._gr('slice', "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
        };
        Compiler.prototype.vslicesub = function (s) {
            var subs;
            switch (s.constructor) {
                case Number:
                case String:
                    // Already compiled, should only happen for augmented assignments
                    subs = s;
                    break;
                case astnodes_29.Index:
                    subs = this.vexpr(s.value);
                    break;
                case astnodes_42.Slice:
                    subs = this.cslice(s);
                    break;
                case astnodes_18.Ellipsis:
                case astnodes_20.ExtSlice:
                    asserts_1.fail("todo;");
                    break;
                default:
                    asserts_1.fail("invalid subscript kind");
            }
            return subs;
        };
        Compiler.prototype.vslice = function (s, ctx, obj, dataToStore) {
            var subs = this.vslicesub(s);
            return this.chandlesubscr(ctx, obj, subs, dataToStore);
        };
        Compiler.prototype.chandlesubscr = function (ctx, obj, subs, data) {
            if (ctx === astnodes_33.Load || ctx === astnodes_6.AugLoad)
                return this._gr('lsubscr', "Sk.abstr.objectGetItem(", obj, ",", subs, ")");
            else if (ctx === astnodes_43.Store || ctx === astnodes_7.AugStore)
                out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
            else if (ctx === astnodes_15.Del)
                out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
            else
                asserts_1.fail("handlesubscr fail");
        };
        Compiler.prototype.cboolop = function (e) {
            asserts_1.assert(e instanceof astnodes_9.BoolOp);
            var jtype;
            var ifFailed;
            if (e.op === astnodes_1.And)
                jtype = this._jumpfalse;
            else
                jtype = this._jumptrue;
            var end = this.newBlock('end of boolop');
            var s = e.values;
            var n = s.length;
            var retval;
            for (var i = 0; i < n; ++i) {
                var expres = this.vexpr(s[i]);
                if (i === 0) {
                    retval = this._gr('boolopsucc', expres);
                }
                out(retval, "=", expres, ";");
                jtype.call(this, expres, end);
            }
            this._jump(end);
            this.setBlock(end);
            return retval;
        };
        /**
         *
         * compiles an expression. to 'return' something, it'll gensym a var and store
         * into that var so that the calling code doesn't have avoid just pasting the
         * returned name.
         *
         * @param {Object} e
         * @param {string=} data data to store in a store operation
         * @param {Object=} augstoreval value to store to for an aug operation (not
         * vexpr'd yet)
         */
        Compiler.prototype.vexpr = function (e, data, augstoreval) {
            if (e.lineno > this.u.lineno) {
                this.u.lineno = e.lineno;
                this.u.linenoSet = false;
            }
            //this.annotateSource(e);
            switch (e.constructor) {
                case astnodes_9.BoolOp:
                    return this.cboolop(e);
                case astnodes_8.BinOp:
                    return this._gr('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
                case astnodes_49.UnaryOp:
                    return this._gr('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
                case astnodes_30.Lambda:
                    return this.clambda(e);
                case astnodes_26.IfExp:
                    return this.cifexp(e);
                case astnodes_17.Dict:
                    return this.cdict(e);
                case astnodes_32.ListComp:
                    return this.clistcomp(e);
                case astnodes_23.GeneratorExp:
                    return this.cgenexp(e);
                case astnodes_51.Yield:
                    return this.cyield(e);
                case astnodes_13.Compare:
                    return this.ccompare(e);
                case astnodes_11.Call:
                    var result = this.ccall(e);
                    // After the function call, we've returned to this line
                    this.annotateSource(e);
                    return result;
                case astnodes_36.Num:
                    {
                        if (e.n.isFloat()) {
                            return 'Sk.builtin.numberToPy(' + e.n.value + ')';
                        }
                        else if (e.n.isInt()) {
                            return "Sk.ffi.numberToIntPy(" + e.n.value + ")";
                        }
                        else if (e.n.isLong()) {
                            return "Sk.ffi.longFromString('" + e.n.text + "', " + e.n.radix + ")";
                        }
                        asserts_1.fail("unhandled Num type");
                    }
                case astnodes_44.Str:
                    {
                        return this._gr('str', 'Sk.builtin.stringToPy(', toStringLiteralJS(e.s), ')');
                    }
                case astnodes_4.Attribute:
                    var val;
                    if (e.ctx !== astnodes_7.AugStore)
                        val = this.vexpr(e.value);
                    var mangled = toStringLiteralJS(e.attr);
                    mangled = mangled.substring(1, mangled.length - 1);
                    mangled = mangleName(this.u.private_, mangled);
                    mangled = fixReservedWords(mangled);
                    mangled = fixReservedNames(mangled);
                    switch (e.ctx) {
                        case astnodes_6.AugLoad:
                        case astnodes_33.Load:
                            return this._gr("lattr", "Sk.abstr.gattr(", val, ",'", mangled, "')");
                        case astnodes_7.AugStore:
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            out("}");
                            break;
                        case astnodes_43.Store:
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            break;
                        case astnodes_15.Del:
                            asserts_1.fail("todo;");
                            break;
                        case astnodes_37.Param:
                        default:
                            asserts_1.fail("invalid attribute expression");
                    }
                    break;
                case astnodes_45.Subscript:
                    var val;
                    switch (e.ctx) {
                        case astnodes_6.AugLoad:
                        case astnodes_33.Load:
                        case astnodes_43.Store:
                        case astnodes_15.Del:
                            return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                        case astnodes_7.AugStore:
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            this.vslice(e.slice, e.ctx, val, data);
                            out("}");
                            break;
                        case astnodes_37.Param:
                        default:
                            asserts_1.fail("invalid subscript expression");
                    }
                    break;
                case astnodes_35.Name:
                    return this.nameop(e.id, e.ctx, data);
                case astnodes_31.List:
                    return this.ctupleorlist(e, data, 'list');
                case astnodes_48.Tuple:
                    return this.ctupleorlist(e, data, 'tuple');
                default:
                    asserts_1.fail("unhandled case in vexpr");
            }
        };
        /**
         * @param {Array.<Object>} exprs
         * @param {Array.<string>=} data
         */
        Compiler.prototype.vseqexpr = function (exprs, data) {
            /**
             * @const
             * @type {boolean}
             */
            var missingData = (typeof data === 'undefined');
            asserts_1.assert(missingData || exprs.length === data.length);
            var ret = [];
            for (var i = 0; i < exprs.length; ++i) {
                ret.push(this.vexpr(exprs[i], (missingData ? undefined : data[i])));
            }
            return ret;
        };
        Compiler.prototype.caugassign = function (s) {
            asserts_1.assert(s instanceof astnodes_5.AugAssign);
            var e = s.target;
            switch (e.constructor) {
                case astnodes_4.Attribute:
                    var auge = new astnodes_4.Attribute(e.value, e.attr, astnodes_6.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = astnodes_7.AugStore;
                    return this.vexpr(auge, res, e.value);
                case astnodes_45.Subscript: {
                    // Only compile the subscript value once
                    var augsub = this.vslicesub(e.slice);
                    var auge_1 = new astnodes_45.Subscript(e.value, augsub, astnodes_6.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge_1);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge_1.ctx = astnodes_7.AugStore;
                    return this.vexpr(auge_1, res, e.value);
                }
                case astnodes_35.Name:
                    var to = this.nameop(e.id, astnodes_33.Load);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
                    return this.nameop(e.id, astnodes_43.Store, res);
                default:
                    asserts_1.fail("unhandled case in augassign");
            }
        };
        /**
         * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
         */
        Compiler.prototype.exprConstant = function (e) {
            switch (e.constructor) {
                case astnodes_36.Num:
                    asserts_1.fail("Trying to call the runtime for Num");
                    // return Sk.misceval.isTrue(e.n);
                    break;
                case astnodes_44.Str:
                    asserts_1.fail("Trying to call the runtime for Str");
                    // return Sk.misceval.isTrue(e.s);
                    break;
                case astnodes_35.Name:
                // todo; do __debug__ test here if opt
                default:
                    return -1;
            }
        };
        Compiler.prototype.newBlock = function (name) {
            var ret = this.u.blocknum++;
            this.u.blocks[ret] = [];
            this.u.blocks[ret]._name = name || '<unnamed>';
            return ret;
        };
        Compiler.prototype.setBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.curblock = n;
        };
        Compiler.prototype.pushBreakBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.breakBlocks.push(n);
        };
        Compiler.prototype.popBreakBlock = function () {
            this.u.breakBlocks.pop();
        };
        Compiler.prototype.pushContinueBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.continueBlocks.push(n);
        };
        Compiler.prototype.popContinueBlock = function () {
            this.u.continueBlocks.pop();
        };
        Compiler.prototype.pushExceptBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.exceptBlocks.push(n);
        };
        Compiler.prototype.popExceptBlock = function () {
            this.u.exceptBlocks.pop();
        };
        Compiler.prototype.pushFinallyBlock = function (n) {
            asserts_1.assert(n >= 0 && n < this.u.blocknum);
            this.u.finallyBlocks.push(n);
        };
        Compiler.prototype.popFinallyBlock = function () {
            this.u.finallyBlocks.pop();
        };
        Compiler.prototype.setupExcept = function (eb) {
            out("$exc.push(", eb, ");");
            //this.pushExceptBlock(eb);
        };
        Compiler.prototype.endExcept = function () {
            out("$exc.pop();");
        };
        Compiler.prototype.outputLocals = function (unit) {
            var have = {};
            for (var i = 0; unit.argnames && i < unit.argnames.length; ++i)
                have[unit.argnames[i]] = true;
            unit.localnames.sort();
            var output = [];
            for (var i = 0; i < unit.localnames.length; ++i) {
                var name = unit.localnames[i];
                if (have[name] === undefined) {
                    output.push(name);
                    have[name] = true;
                }
            }
            if (output.length > 0)
                return "var " + output.join(",") + "; /* locals */";
            return "";
        };
        Compiler.prototype.outputAllUnits = function () {
            var ret = '';
            for (var j = 0; j < this.allUnits.length; ++j) {
                var unit = this.allUnits[j];
                ret += unit.prefixCode;
                ret += this.outputLocals(unit);
                ret += unit.varDeclsCode;
                ret += unit.switchCode;
                var blocks = unit.blocks;
                for (var i = 0; i < blocks.length; ++i) {
                    ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
                    ret += blocks[i].join('');
                }
                ret += unit.suffixCode;
            }
            return ret;
        };
        Compiler.prototype.cif = function (s) {
            asserts_1.assert(s instanceof astnodes_25.If_);
            var constant = this.exprConstant(s.test);
            if (constant === 0) {
                if (s.orelse)
                    this.vseqstmt(s.orelse);
            }
            else if (constant === 1) {
                this.vseqstmt(s.body);
            }
            else {
                var end = this.newBlock('end of if');
                var next = this.newBlock('next branch of if');
                var test = this.vexpr(s.test);
                this._jumpfalse(test, next);
                this.vseqstmt(s.body);
                this._jump(end);
                this.setBlock(next);
                if (s.orelse)
                    this.vseqstmt(s.orelse);
                this._jump(end);
            }
            this.setBlock(end);
        };
        Compiler.prototype.cwhile = function (s) {
            var constant = this.exprConstant(s.test);
            if (constant === 0) {
                if (s.orelse)
                    this.vseqstmt(s.orelse);
            }
            else {
                var top = this.newBlock('while test');
                this._jump(top);
                this.setBlock(top);
                var next = this.newBlock('after while');
                var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
                var body = this.newBlock('while body');
                this._jumpfalse(this.vexpr(s.test), orelse ? orelse : next);
                this._jump(body);
                this.pushBreakBlock(next);
                this.pushContinueBlock(top);
                this.setBlock(body);
                this.vseqstmt(s.body);
                this._jump(top);
                this.popContinueBlock();
                this.popBreakBlock();
                if (s.orelse.length > 0) {
                    this.setBlock(orelse);
                    this.vseqstmt(s.orelse);
                    this._jump(next);
                }
                this.setBlock(next);
            }
        };
        Compiler.prototype.cfor = function (s) {
            var start = this.newBlock('for start');
            var cleanup = this.newBlock('for cleanup');
            var end = this.newBlock('for end');
            this.pushBreakBlock(end);
            this.pushContinueBlock(start);
            // get the iterator
            var toiter = this.vexpr(s.iter);
            var iter;
            if (this.u.ste.generator) {
                // if we're in a generator, we have to store the iterator to a local
                // so it's preserved (as we cross blocks here and assume it survives)
                iter = "$loc." + this.gensym("iter");
                out(iter, "=Sk.abstr.iter(", toiter, ");");
            }
            else
                iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
            this._jump(start);
            this.setBlock(start);
            // load targets
            var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
            this._jumpundef(nexti, cleanup); // todo; this should be handled by StopIteration
            var target = this.vexpr(s.target, nexti);
            // execute body
            this.vseqstmt(s.body);
            // jump to top of loop
            this._jump(start);
            this.setBlock(cleanup);
            this.popContinueBlock();
            this.popBreakBlock();
            this.vseqstmt(s.orelse);
            this._jump(end);
            this.setBlock(end);
        };
        Compiler.prototype.craise = function (s) {
            if (s && s.type && s.type.id && (s.type.id === "StopIteration")) {
                // currently, we only handle StopIteration, and all it does it return
                // undefined which is what our iterator protocol requires.
                //
                // totally hacky, but good enough for now.
                out("return undefined;");
            }
            else {
                var inst = '';
                if (s.inst) {
                    // handles: raise Error, arguments
                    inst = this.vexpr(s.inst);
                    out("throw ", this.vexpr(s.type), "(", inst, ");");
                }
                else if (s.type) {
                    if (s.type.func) {
                        // handles: raise Error(arguments)
                        out("throw ", this.vexpr(s.type), ";");
                    }
                    else {
                        // handles: raise Error
                        out("throw ", this.vexpr(s.type), "('');");
                    }
                }
                else {
                    // re-raise
                    out("throw $err;");
                }
            }
        };
        Compiler.prototype.ctryexcept = function (s) {
            var n = s.handlers.length;
            // Create a block for each except clause
            var handlers = [];
            for (var i = 0; i < n; ++i) {
                handlers.push(this.newBlock("except_" + i + "_"));
            }
            var unhandled = this.newBlock("unhandled");
            var orelse = this.newBlock("orelse");
            var end = this.newBlock("end");
            this.setupExcept(handlers[0]);
            this.vseqstmt(s.body);
            this.endExcept();
            this._jump(orelse);
            for (var i = 0; i < n; ++i) {
                this.setBlock(handlers[i]);
                var handler = s.handlers[i];
                if (!handler.type && i < n - 1) {
                    throw new SyntaxError("default 'except:' must be last");
                }
                if (handler.type) {
                    // should jump to next handler if err not isinstance of handler.type
                    var handlertype = this.vexpr(handler.type);
                    var next = (i == n - 1) ? unhandled : handlers[i + 1];
                    // this check is not right, should use isinstance, but exception objects
                    // are not yet proper Python objects
                    var check = this._gr('instance', "$err instanceof ", handlertype);
                    this._jumpfalse(check, next);
                }
                if (handler.name) {
                    this.vexpr(handler.name, "$err");
                }
                // Need to execute finally before leaving body if an exception is raised
                this.vseqstmt(handler.body);
                // Should jump to finally, but finally is not implemented yet
                this._jump(end);
            }
            // If no except clause catches exception, throw it again
            this.setBlock(unhandled);
            // Should execute finally first
            out("throw $err;");
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
            // Should jump to finally, but finally is not implemented yet
            this._jump(end);
            this.setBlock(end);
        };
        Compiler.prototype.ctryfinally = function (s) {
            out("/*todo; tryfinally*/");
            // everything but the finally?
            this.ctryexcept(s.body[0]);
        };
        Compiler.prototype.cassert = function (s) {
            /* todo; warnings method
            if (s.test instanceof Tuple && s.test.elts.length > 0)
                Sk.warn("assertion is always true, perhaps remove parentheses?");
            */
            var test = this.vexpr(s.test);
            var end = this.newBlock("end");
            this._jumptrue(test, end);
            // todo; exception handling
            // maybe replace with fail?? or just an alert?
            out("throw new Sk.builtin.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
            this.setBlock(end);
        };
        /**
         * @param {string} name
         * @param {string} asname
         * @param {string=} mod
         */
        Compiler.prototype.cimportas = function (name, asname, mod) {
            var src = name;
            var dotLoc = src.indexOf(".");
            var cur = mod;
            if (dotLoc !== -1) {
                // if there's dots in the module name, __import__ will have returned
                // the top-level module. so, we need to extract the actual module by
                // getattr'ing up through the names, and then storing the leaf under
                // the name it was to be imported as.
                src = src.substr(dotLoc + 1);
                while (dotLoc !== -1) {
                    dotLoc = src.indexOf(".");
                    var attr = dotLoc !== -1 ? src.substr(0, dotLoc) : src;
                    cur = this._gr('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
                    src = src.substr(dotLoc + 1);
                }
            }
            return this.nameop(asname, astnodes_43.Store, cur);
        };
        ;
        Compiler.prototype.cimport = function (s) {
            var n = s.names.length;
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                var mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS(alias.name), ',$gbl,$loc,[])');
                if (alias.asname) {
                    this.cimportas(alias.name, alias.asname, mod);
                }
                else {
                    var lastDot = alias.name.indexOf('.');
                    if (lastDot !== -1) {
                        this.nameop(alias.name.substr(0, lastDot), astnodes_43.Store, mod);
                    }
                    else {
                        this.nameop(alias.name, astnodes_43.Store, mod);
                    }
                }
            }
        };
        ;
        Compiler.prototype.cfromimport = function (s) {
            var n = s.names.length;
            var names = [];
            for (var i = 0; i < n; ++i) {
                names[i] = s.names[i].name;
            }
            var namesString = names.map(function (name) { return toStringLiteralJS(name); }).join(', ');
            var mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS(s.module), ',$gbl,$loc,[', namesString, '])');
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                if (i === 0 && alias.name === "*") {
                    asserts_1.assert(n === 1);
                    out("Sk.importStar(", mod, ",$loc, $gbl);");
                    return;
                }
                var got = this._gr('item', 'Sk.abstr.gattr(', mod, ',', toStringLiteralJS(alias.name), ')');
                var storeName = alias.name;
                if (alias.asname)
                    storeName = alias.asname;
                this.nameop(storeName, astnodes_43.Store, got);
            }
        };
        ;
        /**
         * builds a code object (js function) for various constructs. used by def,
         * lambda, generator expressions. it isn't used for class because it seemed
         * different enough.
         *
         * handles:
         * - setting up a new scope
         * - decorators (if any)
         * - defaults setup
         * - setup for cell and free vars
         * - setup and modification for generators
         *
         * @param {Object} n ast node to build for
         * @param {string} coname name of code object to build
         * @param {Array} decorator_list ast of decorators if any
         * @param {*} args arguments to function, if any
         * @param {Function} callback called after setup to do actual work of function
         *
         * @returns the name of the newly created function or generator object.
         *
         */
        Compiler.prototype.buildcodeobj = function (n, coname, decorator_list, args, callback) {
            var decos = [];
            var defaults = [];
            var vararg = null;
            var kwarg = null;
            // decorators and defaults have to be evaluated out here before we enter
            // the new scope. we output the defaults and attach them to this code
            // object, but only once we know the name of it (so we do it after we've
            // exited the scope near the end of this function).
            if (decorator_list)
                decos = this.vseqexpr(decorator_list);
            if (args && args.defaults)
                defaults = this.vseqexpr(args.defaults);
            if (args && args.vararg)
                vararg = args.vararg;
            if (args && args.kwarg)
                kwarg = args.kwarg;
            /**
             * @const
             * @type {boolean}
             */
            var containingHasFree = this.u.ste.hasFree;
            /**
             * @const
             * @type {boolean}
             */
            var containingHasCell = this.u.ste.childHasFree;
            /**
             * enter the new scope, and create the first block
             * @const
             * @type {string}
             */
            var scopename = this.enterScope(coname, n, n.lineno);
            var isGenerator = this.u.ste.generator;
            /**
             * @const
             * @type {boolean}
             */
            var hasFree = this.u.ste.hasFree;
            /**
             * @const
             * @type {boolean}
             */
            var hasCell = this.u.ste.childHasFree;
            /**
             * @const
             * @type {boolean}
             */
            var descendantOrSelfHasFree = this.u.ste.hasFree;
            var entryBlock = this.newBlock('codeobj entry');
            //
            // the header of the function, and arguments
            //
            this.u.prefixCode = "var " + scopename + "=(function " + this.niceName(coname) + "$(";
            var funcArgs = [];
            if (isGenerator) {
                if (kwarg) {
                    throw new SyntaxError(coname + "(): keyword arguments in generators not supported");
                }
                if (vararg) {
                    throw new SyntaxError(coname + "(): variable number of arguments in generators not supported");
                }
                funcArgs.push("$gen");
            }
            else {
                if (kwarg)
                    funcArgs.push("$kwa");
                for (var i = 0; args && i < args.args.length; ++i)
                    funcArgs.push(this.nameop(args.args[i].id, astnodes_37.Param));
            }
            if (descendantOrSelfHasFree) {
                funcArgs.push("$free");
            }
            this.u.prefixCode += funcArgs.join(",");
            this.u.prefixCode += "){";
            if (isGenerator)
                this.u.prefixCode += "\n// generator\n";
            if (containingHasFree)
                this.u.prefixCode += "\n// containing has free\n";
            if (containingHasCell)
                this.u.prefixCode += "\n// containing has cell\n";
            if (hasFree)
                this.u.prefixCode += "\n// has free\n";
            if (hasCell)
                this.u.prefixCode += "\n// has cell\n";
            //
            // set up standard dicts/variables
            //
            var locals = "{}";
            if (isGenerator) {
                entryBlock = "$gen.gi$resumeat";
                locals = "$gen.gi$locals";
            }
            var cells = "";
            if (hasCell)
                cells = ",$cell={}";
            // note special usage of 'this' to avoid having to slice globals into
            // all function invocations in call
            this.u.varDeclsCode += "var $blk=" + entryBlock + ",$exc=[],$loc=" + locals + cells + ",$gbl=this,$err;";
            //
            // copy all parameters that are also cells into the cells dict. this is so
            // they can be accessed correctly by nested scopes.
            //
            for (var i = 0; args && i < args.args.length; ++i) {
                var id = args.args[i].id;
                if (this.isCell(id)) {
                    this.u.varDeclsCode += "$cell." + id + "=" + id + ";";
                }
            }
            //
            // make sure correct number of arguments were passed (generators handled below)
            //
            if (!isGenerator) {
                var minargs = args ? args.args.length - defaults.length : 0;
                var maxargs = vararg ? Infinity : (args ? args.args.length : 0);
                var kw = kwarg ? true : false;
                this.u.varDeclsCode += "Sk.builtin.pyCheckArgs(\"" + coname +
                    "\", arguments, " + minargs + ", " + maxargs + ", " + kw +
                    ", " + descendantOrSelfHasFree + ");";
            }
            //
            // initialize default arguments. we store the values of the defaults to
            // this code object as .$defaults just below after we exit this scope.
            //
            if (defaults.length > 0) {
                // defaults have to be "right justified" so if there's less defaults
                // than args we offset to make them match up (we don't need another
                // correlation in the ast)
                var offset = args.args.length - defaults.length;
                for (var i = 0; i < defaults.length; ++i) {
                    var argname = this.nameop(args.args[i + offset].id, astnodes_37.Param);
                    this.u.varDeclsCode += "if(typeof " + argname + " === 'undefined')" + argname + "=" + scopename + ".$defaults[" + i + "];";
                }
            }
            //
            // initialize vararg, if any
            //
            if (vararg) {
                var start = funcArgs.length;
                this.u.varDeclsCode += vararg + "=new Sk.builtins['tuple'](Array.prototype.slice.call(arguments," + start + ")); /*vararg*/";
            }
            //
            // initialize kwarg, if any
            //
            if (kwarg) {
                this.u.varDeclsCode += kwarg + "=new Sk.builtins['dict']($kwa);";
            }
            //
            // finally, set up the block switch that the jump code expects
            //
            // Old switch code
            // this.u.switchCode += "while(true){switch($blk){";
            // this.u.suffixCode = "}break;}});";
            // New switch code to catch exceptions
            this.u.switchCode = "while(true){try{switch($blk){";
            this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}});";
            //
            // jump back to the handler so it can do the main actual work of the
            // function
            //
            callback.call(this, scopename);
            //
            // get a list of all the argument names (used to attach to the code
            // object, and also to allow us to declare only locals that aren't also
            // parameters).
            var argnames;
            if (args && args.args.length > 0) {
                var argnamesarr = [];
                for (var i = 0; i < args.args.length; ++i) {
                    argnamesarr.push(args.args[i].id);
                }
                argnames = argnamesarr.join("', '");
                // store to unit so we know what local variables not to declare
                this.u.argnames = argnamesarr;
            }
            //
            // and exit the code object scope
            //
            this.exitScope();
            //
            // attach the default values we evaluated at the beginning to the code
            // object so that it can get at them to set any arguments that are left
            // unset.
            //
            if (defaults.length > 0)
                out(scopename, ".$defaults=[", defaults.join(','), "];");
            //
            // attach co_varnames (only the argument names) for keyword argument
            // binding.
            //
            if (argnames) {
                out(scopename, ".co_varnames=['", argnames, "'];");
            }
            //
            // attach flags
            //
            if (kwarg) {
                out(scopename, ".co_kwargs=1;");
            }
            //
            // build either a 'function' or 'generator'. the function is just a simple
            // constructor call. the generator is more complicated. it needs to make a
            // new generator every time it's called, so the thing that's returned is
            // actually a function that makes the generator (and passes arguments to
            // the function onwards to the generator). this should probably actually
            // be a function object, rather than a js function like it is now. we also
            // have to build the argument names to pass to the generator because it
            // needs to store all locals into itself so that they're maintained across
            // yields.
            //
            // todo; possibly this should be outside?
            //
            var frees = "";
            if (hasFree) {
                frees = ",$cell";
                // if the scope we're in where we're defining this one has free
                // vars, they may also be cell vars, so we pass those to the
                // closure too.
                if (containingHasFree)
                    frees += ",$free";
            }
            if (isGenerator)
                // Keyword and variable arguments are not currently supported in generators.
                // The call to pyCheckArgs assumes they can't be true.
                if (args && args.args.length > 0) {
                    return this._gr("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgs(\"", coname, "\",arguments,", args.args.length - defaults.length, ",", args.args.length, ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
                }
                else {
                    return this._gr("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgs(\"", coname, "\",arguments,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
                }
            else {
                return this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
            }
        };
        Compiler.prototype.cfunction = function (s) {
            asserts_1.assert(s instanceof astnodes_22.FunctionDef);
            var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function (scopename) {
                this.vseqstmt(s.body);
                out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
            });
            this.nameop(s.name, astnodes_43.Store, funcorgen);
        };
        Compiler.prototype.clambda = function (e) {
            asserts_1.assert(e instanceof astnodes_30.Lambda);
            var func = this.buildcodeobj(e, "<lambda>", null, e.args, function (scopename) {
                var val = this.vexpr(e.body);
                out("return ", val, ";");
            });
            return func;
        };
        Compiler.prototype.cifexp = function (e) {
            var next = this.newBlock('next of ifexp');
            var end = this.newBlock('end of ifexp');
            var ret = this._gr('res', 'null');
            var test = this.vexpr(e.test);
            this._jumpfalse(test, next);
            out(ret, '=', this.vexpr(e.body), ';');
            this._jump(end);
            this.setBlock(next);
            out(ret, '=', this.vexpr(e.orelse), ';');
            this._jump(end);
            this.setBlock(end);
            return ret;
        };
        Compiler.prototype.cgenexpgen = function (generators, genIndex, elt) {
            var start = this.newBlock('start for ' + genIndex);
            var skip = this.newBlock('skip for ' + genIndex);
            var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
            var end = this.newBlock('end for ' + genIndex);
            var ge = generators[genIndex];
            var iter;
            if (genIndex === 0) {
                // the outer most iterator is evaluated in the scope outside so we
                // have to evaluate it outside and store it into the generator as a
                // local, which we retrieve here.
                iter = "$loc.$iter0";
            }
            else {
                var toiter = this.vexpr(ge.iter);
                iter = "$loc." + this.gensym("iter");
                out(iter, "=", "Sk.abstr.iter(", toiter, ");");
            }
            this._jump(start);
            this.setBlock(start);
            // load targets
            var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
            this._jumpundef(nexti, end); // todo; this should be handled by StopIteration
            var target = this.vexpr(ge.target, nexti);
            var n = ge.ifs.length;
            for (var i = 0; i < n; ++i) {
                var ifres = this.vexpr(ge.ifs[i]);
                this._jumpfalse(ifres, start);
            }
            if (++genIndex < generators.length) {
                this.cgenexpgen(generators, genIndex, elt);
            }
            if (genIndex >= generators.length) {
                var velt = this.vexpr(elt);
                out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
                this.setBlock(skip);
            }
            this._jump(start);
            this.setBlock(end);
            if (genIndex === 1)
                out("return null;");
        };
        Compiler.prototype.cgenexp = function (e) {
            var gen = this.buildcodeobj(e, "<genexpr>", null, null, function (scopename) {
                this.cgenexpgen(e.generators, 0, e.elt);
            });
            // call the generator maker to get the generator. this is kind of dumb,
            // but the code builder builds a wrapper that makes generators for normal
            // function generators, so we just do it outside (even just new'ing it
            // inline would be fine).
            var gener = this._gr("gener", "Sk.misceval.callsim(", gen, ");");
            // stuff the outermost iterator into the generator after evaluating it
            // outside of the function. it's retrieved by the fixed name above.
            out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
            return gener;
        };
        Compiler.prototype.cclass = function (s) {
            asserts_1.assert(s instanceof astnodes_12.ClassDef);
            var decos = s.decorator_list;
            // decorators and bases need to be eval'd out here
            //this.vseqexpr(decos);
            var bases = this.vseqexpr(s.bases);
            /**
             * @const
             * @type {string}
             */
            var scopename = this.enterScope(s.name, s, s.lineno);
            var entryBlock = this.newBlock('class entry');
            this.u.prefixCode = "var " + scopename + "=(function $" + s.name + "$class_outer($globals,$locals,$rest){var $gbl=$globals,$loc=$locals;";
            this.u.switchCode += "return(function " + s.name + "(){";
            this.u.switchCode += "var $blk=" + entryBlock + ",$exc=[];while(true){switch($blk){";
            this.u.suffixCode = "}break;}}).apply(null,$rest);});";
            this.u.private_ = s.name;
            this.cbody(s.body);
            out("break;");
            // build class
            // apply decorators
            this.exitScope();
            var wrapped = this._gr('built', 'Sk.misceval.buildClass($gbl,', scopename, ',', toStringLiteralJS(s.name), ',[', bases, '])');
            // store our new class under the right name
            this.nameop(s.name, astnodes_43.Store, wrapped);
        };
        Compiler.prototype.ccontinue = function (s) {
            if (this.u.continueBlocks.length === 0)
                throw new SyntaxError("'continue' outside loop");
            // todo; continue out of exception blocks
            this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
        };
        /**
         * compiles a statement
         */
        Compiler.prototype.vstmt = function (s) {
            this.u.lineno = s.lineno;
            this.u.linenoSet = false;
            this.annotateSource(s);
            switch (s.constructor) {
                case astnodes_22.FunctionDef:
                    this.cfunction(s);
                    break;
                case astnodes_12.ClassDef:
                    this.cclass(s);
                    break;
                case astnodes_41.Return_:
                    if (this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                        throw new SyntaxError("'return' outside function");
                    if (s.value)
                        out("return ", this.vexpr(s.value), ";");
                    else
                        out("return null;");
                    break;
                case astnodes_16.Delete_:
                    this.vseqexpr(s.targets);
                    break;
                case astnodes_3.Assign:
                    var n = s.targets.length;
                    var val = this.vexpr(s.value);
                    for (var i = 0; i < n; ++i)
                        this.vexpr(s.targets[i], val);
                    break;
                case astnodes_5.AugAssign:
                    return this.caugassign(s);
                case astnodes_39.Print:
                    this.cprint(s);
                    break;
                case astnodes_21.For_:
                    return this.cfor(s);
                case astnodes_50.While_:
                    return this.cwhile(s);
                case astnodes_25.If_:
                    return this.cif(s);
                case astnodes_40.Raise:
                    return this.craise(s);
                case astnodes_46.TryExcept:
                    return this.ctryexcept(s);
                case astnodes_47.TryFinally:
                    return this.ctryfinally(s);
                case astnodes_2.Assert:
                    return this.cassert(s);
                case astnodes_27.Import_:
                    return this.cimport(s);
                case astnodes_28.ImportFrom:
                    return this.cfromimport(s);
                case astnodes_24.Global:
                    break;
                case astnodes_19.Expr:
                    this.vexpr(s.value);
                    break;
                case astnodes_38.Pass:
                    break;
                case astnodes_10.Break_:
                    if (this.u.breakBlocks.length === 0)
                        throw new SyntaxError("'break' outside loop");
                    this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
                    break;
                case astnodes_14.Continue_:
                    this.ccontinue(s);
                    break;
                default:
                    asserts_1.fail("unhandled case in vstmt");
            }
        };
        Compiler.prototype.vseqstmt = function (stmts) {
            for (var i = 0; i < stmts.length; ++i)
                this.vstmt(stmts[i]);
        };
        Compiler.prototype.isCell = function (name) {
            var mangled = mangleName(this.u.private_, name);
            var scope = this.u.ste.getScope(mangled);
            var dict = null;
            if (scope === SymbolConstants_5.CELL)
                return true;
            return false;
        };
        /**
         * @param {string} name
         * @param {Object} ctx
         * @param {string=} dataToStore
         */
        Compiler.prototype.nameop = function (name, ctx, dataToStore) {
            if ((ctx === astnodes_43.Store || ctx === astnodes_7.AugStore || ctx === astnodes_15.Del) && name === "__debug__") {
                throw new SyntaxError("can not assign to __debug__");
            }
            if ((ctx === astnodes_43.Store || ctx === astnodes_7.AugStore || ctx === astnodes_15.Del) && name === "None") {
                throw new SyntaxError("can not assign to None");
            }
            if (name === "None")
                return "Sk.builtin.none.none$";
            if (name === "True")
                return "Sk.ffi.bool.True";
            if (name === "False")
                return "Sk.ffi.bool.False";
            // Have to do this before looking it up in the scope
            var mangled = mangleName(this.u.private_, name);
            var op = 0;
            var optype = OP_NAME;
            var scope = this.u.ste.getScope(mangled);
            var dict = null;
            switch (scope) {
                case SymbolConstants_4.FREE:
                    dict = "$free";
                    optype = OP_DEREF;
                    break;
                case SymbolConstants_5.CELL:
                    dict = "$cell";
                    optype = OP_DEREF;
                    break;
                case SymbolConstants_1.LOCAL:
                    // can't do FAST in generators or at module/class scope
                    if (this.u.ste.blockType === SymbolConstants_6.FunctionBlock && !this.u.ste.generator)
                        optype = OP_FAST;
                    break;
                case SymbolConstants_3.GLOBAL_IMPLICIT:
                    if (this.u.ste.blockType === SymbolConstants_6.FunctionBlock)
                        optype = OP_GLOBAL;
                    break;
                case SymbolConstants_2.GLOBAL_EXPLICIT:
                    optype = OP_GLOBAL;
                default:
                    break;
            }
            // have to do this after looking it up in the scope
            mangled = fixReservedNames(mangled);
            mangled = fixReservedWords(mangled);
            //print("mangled", mangled);
            // TODO TODO TODO todo; import * at global scope failing here
            asserts_1.assert(scope || name.charAt(1) === '_');
            // in generator or at module scope, we need to store to $loc, rather that
            // to actual JS stack variables.
            var mangledNoPre = mangled;
            if (this.u.ste.generator || this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                mangled = "$loc." + mangled;
            else if (optype === OP_FAST || optype === OP_NAME)
                this.u.localnames.push(mangled);
            switch (optype) {
                case OP_FAST:
                    switch (ctx) {
                        case astnodes_33.Load:
                        case astnodes_37.Param:
                            // Need to check that it is bound!
                            out("if (typeof ", mangled, " === 'undefined') { throw new Error('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                            return mangled;
                        case astnodes_43.Store:
                            out(mangled, "=", dataToStore, ";");
                            break;
                        case astnodes_15.Del:
                            out("delete ", mangled, ";");
                            break;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_NAME:
                    switch (ctx) {
                        case astnodes_33.Load:
                            var v = this.gensym('loadname');
                            // can't be || for loc.x = 0 or null
                            out("var ", v, "=(typeof ", mangled, " !== 'undefined') ? ", mangled, ":Sk.misceval.loadname('", mangledNoPre, "',$gbl);");
                            return v;
                        case astnodes_43.Store:
                            out(mangled, "=", dataToStore, ";");
                            break;
                        case astnodes_15.Del:
                            out("delete ", mangled, ";");
                            break;
                        case astnodes_37.Param:
                            return mangled;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_GLOBAL:
                    switch (ctx) {
                        case astnodes_33.Load:
                            return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                        case astnodes_43.Store:
                            out("$gbl.", mangledNoPre, "=", dataToStore, ';');
                            break;
                        case astnodes_15.Del:
                            out("delete $gbl.", mangledNoPre);
                            break;
                        default:
                            asserts_1.fail("unhandled case in name op_global");
                    }
                    break;
                case OP_DEREF:
                    switch (ctx) {
                        case astnodes_33.Load:
                            return dict + "." + mangledNoPre;
                        case astnodes_43.Store:
                            out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                            break;
                        case astnodes_37.Param:
                            return mangledNoPre;
                        default:
                            asserts_1.fail("unhandled case in name op_deref");
                    }
                    break;
                default:
                    asserts_1.fail("unhandled case");
            }
        };
        /**
         * @method enterScope
         * @param {string} name
         * @return {string} The generated name of the scope, usually $scopeN.
         */
        Compiler.prototype.enterScope = function (name, key, lineno) {
            var u = new CompilerUnit();
            u.ste = this.st.getStsForAst(key);
            u.name = name;
            u.firstlineno = lineno;
            if (this.u && this.u.private_)
                u.private_ = this.u.private_;
            this.stack.push(this.u);
            this.allUnits.push(u);
            var scopeName = this.gensym('scope');
            u.scopename = scopeName;
            this.u = u;
            this.u.activateScope();
            this.nestlevel++;
            return scopeName;
        };
        Compiler.prototype.exitScope = function () {
            var prev = this.u;
            this.nestlevel--;
            if (this.stack.length - 1 >= 0)
                this.u = this.stack.pop();
            else
                this.u = null;
            if (this.u)
                this.u.activateScope();
            if (prev.name !== "<module>") {
                var mangled = prev.name;
                mangled = fixReservedWords(mangled);
                mangled = fixReservedNames(mangled);
                out(prev.scopename, ".co_name=Sk.builtin.stringToPy('", mangled, "');");
            }
        };
        Compiler.prototype.cbody = function (stmts) {
            for (var i = 0; i < stmts.length; ++i) {
                this.vstmt(stmts[i]);
            }
        };
        Compiler.prototype.cprint = function (s) {
            asserts_1.assert(s instanceof astnodes_39.Print);
            var dest = 'null';
            if (s.dest) {
                dest = this.vexpr(s.dest);
            }
            var n = s.values.length;
            for (var i = 0; i < n; ++i) {
                out("Sk.misceval.print_(Sk.ffi.remapToJs(new Sk.builtins.str(", this.vexpr(s.values[i]), ")));");
            }
            if (s.nl) {
                out("Sk.misceval.print_('\\n');");
            }
        };
        Compiler.prototype.cmod = function (mod) {
            /**
             * @const
             * @type {string}
             */
            var modf = this.enterScope("<module>", mod, 0);
            var entryBlock = this.newBlock('module entry');
            this.u.prefixCode = "var " + modf + "=(function($modname){";
            this.u.varDeclsCode = "var $blk=" + entryBlock + ",$exc=[],$gbl={},$loc=$gbl,$err;$gbl.__name__=$modname;Sk.globals=$gbl;";
            this.u.switchCode = "try {while(true){try{switch($blk){";
            this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}}catch(err){if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) { Sk.misceval.print_(err.toString() + '\\n'); return $loc; } else { throw err; } } });";
            switch (mod.constructor) {
                case astnodes_34.Module:
                    this.cbody(mod.body);
                    out("return $loc;");
                    break;
                default:
                    asserts_1.fail("todo; unhandled case in compilerMod");
            }
            this.exitScope();
            this.result.push(this.outputAllUnits());
            return modf;
        };
        return Compiler;
    }());
    var CompilerUnit = (function () {
        /**
         * @constructor
         *
         * Stuff that changes on entry/exit of code blocks. must be saved and restored
         * when returning to a block.
         *
         * Corresponds to the body of a module, class, or function.
         */
        function CompilerUnit() {
            /**
             * @type {?Object}
             */
            this.ste = null;
            this.name = null;
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
        CompilerUnit.prototype.activateScope = function () {
            var self = this;
            out = function () {
                var b = self.blocks[self.curblock];
                for (var i = 0; i < arguments.length; ++i)
                    b.push(arguments[i]);
            };
        };
        return CompilerUnit;
    }());
    var reservedWords_ = { 'abstract': true, 'as': true, 'boolean': true,
        'break': true, 'byte': true, 'case': true, 'catch': true, 'char': true,
        'class': true, 'continue': true, 'const': true, 'debugger': true,
        'default': true, 'delete': true, 'do': true, 'double': true, 'else': true,
        'enum': true, 'export': true, 'extends': true, 'false': true,
        'final': true, 'finally': true, 'float': true, 'for': true,
        'function': true, 'goto': true, 'if': true, 'implements': true,
        'import': true, 'in': true, 'instanceof': true, 'int': true,
        'interface': true, 'is': true, 'long': true, 'namespace': true,
        'native': true, 'new': true, 'null': true, 'package': true,
        'private': true, 'protected': true, 'public': true, 'return': true,
        'short': true, 'static': true, 'super': false, 'switch': true,
        'synchronized': true, 'this': true, 'throw': true, 'throws': true,
        'transient': true, 'true': true, 'try': true, 'typeof': true, 'use': true,
        'var': true, 'void': true, 'volatile': true, 'while': true, 'with': true
    };
    function fixReservedWords(name) {
        if (reservedWords_[name] !== true)
            return name;
        return name + "_$rw$";
    }
    var reservedNames_ = { '__defineGetter__': true, '__defineSetter__': true,
        'apply': true, 'call': true, 'eval': true, 'hasOwnProperty': true,
        'isPrototypeOf': true,
        '__lookupGetter__': true, '__lookupSetter__': true,
        '__noSuchMethod__': true, 'propertyIsEnumerable': true,
        'toSource': true, 'toLocaleString': true, 'toString': true,
        'unwatch': true, 'valueOf': true, 'watch': true, 'length': true
    };
    function fixReservedNames(name) {
        if (reservedNames_[name])
            return name + "_$rn$";
        return name;
    }
    /**
     * @param {string} priv
     * @param {string} name
     * @return {string} The mangled name.
     */
    function mangleName(priv, name) {
        var strpriv = null;
        if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_')
            return name;
        // don't mangle __id__
        if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_')
            return name;
        // don't mangle classes that are all _ (obscure much?)
        strpriv = priv;
        strpriv.replace(/_/g, '');
        if (strpriv === '')
            return name;
        strpriv = priv;
        strpriv.replace(/^_*/, '');
        return '_' + strpriv + name;
    }
    var toStringLiteralJS = function (value) {
        // single is preferred
        var quote = "'";
        if (value.indexOf("'") !== -1 && value.indexOf('"') === -1) {
            quote = '"';
        }
        var len = value.length;
        var ret = quote;
        for (var i = 0; i < len; ++i) {
            var c = value.charAt(i);
            if (c === quote || c === '\\')
                ret += '\\' + c;
            else if (c === '\t')
                ret += '\\t';
            else if (c === '\n')
                ret += '\\n';
            else if (c === '\r')
                ret += '\\r';
            else if (c < ' ' || c >= 0x7f) {
                var ashex = c.charCodeAt(0).toString(16);
                if (ashex.length < 2)
                    ashex = "0" + ashex;
                ret += "\\x" + ashex;
            }
            else
                ret += c;
        }
        ret += quote;
        return ret;
    };
    var OP_FAST = 0;
    var OP_GLOBAL = 1;
    var OP_DEREF = 2;
    var OP_NAME = 3;
    var D_NAMES = 0;
    var D_FREEVARS = 1;
    var D_CELLVARS = 2;
    /**
     * @param {string} source the code
     * @param {string} fileName where it came from
     *
     * @return {{funcname: string, code: string}}
     */
    var compile = function (source, fileName) {
        var cst = parser_1.parse(fileName, source);
        var ast = builder_1.astFromParse(cst, fileName);
        var st = symtable_1.default.symbolTable(ast, fileName);
        var c = new Compiler(fileName, st, 0, source);
        return { 'funcname': c.cmod(ast), 'code': c.result.join('') };
    };
    var resetCompiler = function () {
        gensymcount = 0;
    };
    var that = {
        'compile': compile,
        'resetCompiler': resetCompiler
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = that;
});

define('pytools',["require", "exports", './pytools/parser', './pytools/builder', './pytools/sk-compiler'], function (require, exports, parser_1, builder_1, sk_compiler_1) {
    "use strict";
    /**
     * This file is referenced by the requireJS config.js and pulls in all the other files.
     *
     * We are using the Basic AMD Hybrid Format (John Hann).
     */
    /*
    import core from './pytools/core';
    // import base from './pytools/base';
      var that = require('pytools/core');
    
      // that.base = require('pytools/base');
    
      //that.asserts = require('pytools/asserts');
      that.tables = require('pytools/tables');
      that.astnodes = require('pytools/astnodes');
    
      that.parser = require('pytools/parser');
      that.builder = require('pytools/builder');
      that.symtable = require('pytools/symtable');
      that.tokenize = require('pytools/Tokenizer');
      that.numericLiteral = require('pytools/numericLiteral');
    
      that.skCompiler = require('pytools/sk-compiler');
    */
    var pytools = {
        parser: { parse: parser_1.parse, parseTreeDump: parser_1.parseTreeDump },
        builder: { astFromParse: builder_1.astFromParse, astDump: builder_1.astDump },
        skCompiler: sk_compiler_1.default
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = pytools;
});

  var library = require('pytools');
  /**
   * @suppress {undefinedVars}
   */
  (function() {
    if (typeof module !== 'undefined' && module.exports)
    {
      // export library for node
      module.exports = library;
    }
    else if (globalDefine)
    {
      // define library for global amd loader that is already present
      (function (define) {
        define(function(require, exports, module) {return library;});
      }(globalDefine));
    }
    else
    {
      // define library on global namespace for inline script loading
      global['PYTOOLS'] = library;
    }
  })();
}(/** @type {*} */(this), undefined));

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
            [299, null],
            [267, null],
            [265, null],
            [320, null],
            [270, null],
            [321, null],
            [289, null],
            [297, null],
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
    /**
     * We're looking for something that is truthy, not just true.
     */
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

define('pytools/base',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * Null function used for default values of callbacks, etc.
     * @return {void} Nothing.
     */
    function nullFunction() { }
    exports.nullFunction = nullFunction;
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
    function abstractMethod() {
        throw Error('unimplemented abstract method');
    }
    exports.abstractMethod = abstractMethod;
    // ==============================================================================
    // Language Enhancements
    // ==============================================================================
    /**
     * This is a "fixed" version of the typeof operator.  It differs from the typeof
     * operator in such a way that null returns 'null' and arrays return 'array'.
     * @param {*} value The value to get the type of.
     * @return {string} The name of the type.
     */
    function typeOf(value) {
        var s = typeof value;
        if (s === 'object') {
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
                if (className === '[object Window]') {
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
                if ((className === '[object Array]' ||
                    // In IE all non value types are wrapped as objects across window
                    // boundaries (not iframe though) so we have to do object detection
                    // for this edge case.
                    typeof value.length === 'number' &&
                        typeof value.splice !== 'undefined' &&
                        typeof value.propertyIsEnumerable !== 'undefined' &&
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
                if ((className === '[object Function]' ||
                    typeof value.call !== 'undefined' &&
                        typeof value.propertyIsEnumerable !== 'undefined' &&
                        !value.propertyIsEnumerable('call'))) {
                    return 'function';
                }
            }
            else {
                return 'null';
            }
        }
        else if (s === 'function' && typeof value.call === 'undefined') {
            // In Safari typeof nodeList returns 'function', and on Firefox typeof
            // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps. We
            // would like to return object for those and we can detect an invalid
            // function by making sure that the function object has a call method.
            return 'object';
        }
        return s;
    }
    exports.typeOf = typeOf;
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
    /**
     * Returns true if the specified value is null.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is null.
     */
    function isNull(val) {
        return val === null;
    }
    exports.isNull = isNull;
    /**
     * Returns true if the specified value is defined and not null.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is defined and not null.
     */
    function isDefAndNotNull(val) {
        // Note that undefined == null.
        return val != null;
    }
    exports.isDefAndNotNull = isDefAndNotNull;
    /**
     * Returns true if the specified value is an array.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is an array.
     */
    function isArray(val) {
        return typeOf(val) === 'array';
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
        var type = typeOf(val);
        return type === 'array' || type === 'object' && typeof val.length === 'number';
    }
    exports.isArrayLike = isArrayLike;
    /**
     * Returns true if the object looks like a Date. To qualify as Date-like the
     * value needs to be an object and have a getFullYear() function.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a like a Date.
     */
    function isDateLike(val) {
        return isObject(val) && typeof val.getFullYear === 'function';
    }
    exports.isDateLike = isDateLike;
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
    function isBoolean(val) {
        return typeof val === 'boolean';
    }
    exports.isBoolean = isBoolean;
    /**
     * Returns true if the specified value is a number.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a number.
     */
    function isNumber(val) {
        return typeof val === 'number';
    }
    exports.isNumber = isNumber;
    /**
     * Returns true if the specified value is a function.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is a function.
     */
    function isFunction(val) {
        return typeOf(val) === 'function';
    }
    exports.isFunction = isFunction;
    /**
     * Returns true if the specified value is an object.  This includes arrays and
     * functions.
     * @param {*} val Variable to test.
     * @return {boolean} Whether variable is an object.
     */
    function isObject(val) {
        var type = typeof val;
        return type === 'object' && val !== null || type === 'function';
        // return Object(val) === val also works, but is slower, especially if val is
        // not an object.
    }
    exports.isObject = isObject;
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
    function bindNative_(fn, selfObj, var_args) {
        return (fn.call.apply(fn.bind, arguments));
    }
    exports.bindNative_ = bindNative_;
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
    function bindJs_(fn, selfObj, var_args) {
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
    }
    exports.bindJs_ = bindJs_;
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
    function partial(fn, var_args) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            // Prepend the bound arguments to the current arguments.
            var newArgs = Array.prototype.slice.call(arguments);
            newArgs.unshift.apply(newArgs, args);
            return fn.apply(this, newArgs);
        };
    }
    exports.partial = partial;
    /**
     * Copies all the members of a source object to a target object. This method
     * does not work on all browsers for all objects that contain keys such as
     * toString or hasOwnProperty. Use base.object.extend for this purpose.
     * @param {Object} target Target.
     * @param {Object} source Source.
     */
    function mixin(target, source) {
        for (var x in source) {
            if (source.hasOwnProperty(x)) {
                target[x] = source[x];
            }
        }
        // For IE7 or lower, the for-in-loop does not contain any properties that are
        // not enumerable on the prototype object (for example, isPrototypeOf from
        // Object.prototype) but also it will not include 'replace' on objects that
        // extend String and change 'replace' (not that it is common for anyone to
        // extend anything except Object).
    }
    exports.mixin = mixin;
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
    function getMsg(str, opt_values) {
        var values = opt_values || {};
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                var value = ('' + values[key]).replace(/\$/g, '$$$$');
                str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
            }
        }
        return str;
    }
    exports.getMsg = getMsg;
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
    function getMsgWithFallback(a, b) {
        return a;
    }
    exports.getMsgWithFallback = getMsgWithFallback;
    /**
     * Exports a property unobfuscated into the object's namespace.
     * ex. base.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
     * ex. base.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
     * @param {Object} object Object whose static property is being exported.
     * @param {string} publicName Unobfuscated name to export.
     * @param {*} symbol Object the name should point to.
     */
    function exportProperty(object, publicName, symbol) {
        object[publicName] = symbol;
    }
    exports.exportProperty = exportProperty;
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
    function inherits(childCtor, parentCtor) {
        /** @constructor */
        function tempCtor() { }
        ;
        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor();
        /** @override */
        childCtor.prototype.constructor = childCtor;
    }
    exports.inherits = inherits;
});
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
/*
export function baseCall(me, opt_methodName, var_args) {
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
        return caller['superClass_'].constructor.apply(
            me, Array.prototype.slice.call(arguments, 1));
    }

    var args = Array.prototype.slice.call(arguments, 2);
    var foundCaller = false;
    for (var ctor = me.constructor;
        ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
        if (ctor.prototype[opt_methodName] === caller) {
            foundCaller = true;
        } else if (foundCaller) {
            return ctor.prototype[opt_methodName].apply(me, args);
        }
    }

    // If we did not find the caller in the prototype chain, then one of two
    // things happened:
    // 1) The caller is an instance method.
    // 2) This method was not called by the right caller.
    if (me[opt_methodName] === caller) {
        return me.constructor.prototype[opt_methodName].apply(me, args);
    } else {
        throw Error(
            'base.base called from a method of one name ' +
            'to a method of a different name');
    }
}
*/
/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the aliases
 * applied.  In uncompiled code the function is simply run since the aliases as
 * written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = base.dom") or classes
 *     (e.g. "var Timer = base.Timer").
 */
/*
export function scope(fn) {
    fn.call(base.global);
}
*/
;
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
    /* we have to use string and ctor to be able to build patterns up. + on /.../
        * does something strange. */
    // const Whitespace = "[ \\f\\t]*";
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
    // const String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'", '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');
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
    // let pseudoprog;
    // let single3prog;
    // let double3prog;
    // const endprogs = {};
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
    var tabsize = 8;
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
    // function any(x) { return group.apply(null, arguments) + "*"; }
    /** @param {...*} x */
    function maybe(x) { return group.apply(null, arguments) + "?"; }
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
                    // var v = this.grammar.labels[i][1];
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
            // var state = this.stack[this.stack.length - 1].state;
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
        var lineno = 1;
        var column = 0;
        var prefix = "";
        var T_COMMENT = Tokens_1.default.T_COMMENT;
        var T_NL = Tokens_1.default.T_NL;
        var T_OP = Tokens_1.default.T_OP;
        var tokenizer = new Tokenizer_1.default(filename, style === "single_input", function (type, value, start, end, line) {
            // var s_lineno = start[0];
            // var s_column = start[1];
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
        // non-term
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

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define('pytools/types',["require", "exports"], function (require, exports) {
    "use strict";
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
    var In = (function () {
        function In() {
        }
        return In;
    }());
    exports.In = In;
    var NotIn = (function () {
        function NotIn() {
        }
        return NotIn;
    }());
    exports.NotIn = NotIn;
    var ASTSpan = (function () {
        function ASTSpan() {
            this.minChar = -1; // -1 = "undefined" or "compiler generated"
            this.limChar = -1; // -1 = "undefined" or "compiler generated"   
        }
        return ASTSpan;
    }());
    exports.ASTSpan = ASTSpan;
    var AST = (function (_super) {
        __extends(AST, _super);
        function AST() {
            _super.apply(this, arguments);
        }
        return AST;
    }(ASTSpan));
    exports.AST = AST;
    var ModuleElement = (function (_super) {
        __extends(ModuleElement, _super);
        function ModuleElement() {
            _super.apply(this, arguments);
        }
        return ModuleElement;
    }(AST));
    exports.ModuleElement = ModuleElement;
    var Statement = (function (_super) {
        __extends(Statement, _super);
        function Statement() {
            _super.apply(this, arguments);
        }
        return Statement;
    }(ModuleElement));
    exports.Statement = Statement;
    var IterationStatement = (function (_super) {
        __extends(IterationStatement, _super);
        function IterationStatement() {
            _super.apply(this, arguments);
        }
        return IterationStatement;
    }(Statement));
    exports.IterationStatement = IterationStatement;
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
    var Expression = (function (_super) {
        __extends(Expression, _super);
        function Expression(body) {
            _super.call(this);
            this.body = body;
        }
        return Expression;
    }(Statement));
    exports.Expression = Expression;
    var UnaryExpression = (function (_super) {
        __extends(UnaryExpression, _super);
        function UnaryExpression() {
            _super.apply(this, arguments);
        }
        return UnaryExpression;
    }(Expression));
    exports.UnaryExpression = UnaryExpression;
    var Suite = (function () {
        function Suite(body) {
            this.body = body;
        }
        return Suite;
    }());
    exports.Suite = Suite;
    var FunctionDef = (function (_super) {
        __extends(FunctionDef, _super);
        function FunctionDef(name, args, body, decorator_list, lineno, col_offset) {
            _super.call(this);
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return FunctionDef;
    }(Statement));
    exports.FunctionDef = FunctionDef;
    var ClassDef = (function (_super) {
        __extends(ClassDef, _super);
        function ClassDef(name, bases, body, decorator_list, lineno, col_offset) {
            _super.call(this);
            this.name = name;
            this.bases = bases;
            this.body = body;
            this.decorator_list = decorator_list;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ClassDef;
    }(Statement));
    exports.ClassDef = ClassDef;
    var ReturnStatement = (function (_super) {
        __extends(ReturnStatement, _super);
        function ReturnStatement(value, lineno, col_offset) {
            _super.call(this);
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ReturnStatement;
    }(Statement));
    exports.ReturnStatement = ReturnStatement;
    var DeleteExpression = (function (_super) {
        __extends(DeleteExpression, _super);
        function DeleteExpression(targets, lineno, col_offset) {
            _super.call(this, targets);
            this.targets = targets;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return DeleteExpression;
    }(UnaryExpression));
    exports.DeleteExpression = DeleteExpression;
    var Assign = (function (_super) {
        __extends(Assign, _super);
        function Assign(targets, value, lineno, col_offset) {
            _super.call(this);
            this.targets = targets;
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Assign;
    }(Statement));
    exports.Assign = Assign;
    var AugAssign = (function (_super) {
        __extends(AugAssign, _super);
        function AugAssign(target, op, value, lineno, col_offset) {
            _super.call(this);
            this.target = target;
            this.op = op;
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return AugAssign;
    }(Statement));
    exports.AugAssign = AugAssign;
    var Print = (function (_super) {
        __extends(Print, _super);
        function Print(dest, values, nl, lineno, col_offset) {
            _super.call(this);
            this.dest = dest;
            this.values = values;
            this.nl = nl;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Print;
    }(Statement));
    exports.Print = Print;
    var ForStatement = (function (_super) {
        __extends(ForStatement, _super);
        function ForStatement(target, iter, body, orelse, lineno, col_offset) {
            _super.call(this);
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ForStatement;
    }(IterationStatement));
    exports.ForStatement = ForStatement;
    var WhileStatement = (function (_super) {
        __extends(WhileStatement, _super);
        function WhileStatement(test, body, orelse, lineno, col_offset) {
            _super.call(this);
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return WhileStatement;
    }(IterationStatement));
    exports.WhileStatement = WhileStatement;
    var IfStatement = (function (_super) {
        __extends(IfStatement, _super);
        function IfStatement(test, consequent, alternate, lineno, col_offset) {
            _super.call(this);
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return IfStatement;
    }(Statement));
    exports.IfStatement = IfStatement;
    var WithStatement = (function (_super) {
        __extends(WithStatement, _super);
        function WithStatement(context_expr, optional_vars, body, lineno, col_offset) {
            _super.call(this);
            this.context_expr = context_expr;
            this.optional_vars = optional_vars;
            this.body = body;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return WithStatement;
    }(Statement));
    exports.WithStatement = WithStatement;
    var Raise = (function (_super) {
        __extends(Raise, _super);
        function Raise(type, inst, tback, lineno, col_offset) {
            _super.call(this);
            this.type = type;
            this.inst = inst;
            this.tback = tback;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Raise;
    }(Statement));
    exports.Raise = Raise;
    var TryExcept = (function (_super) {
        __extends(TryExcept, _super);
        function TryExcept(body, handlers, orelse, lineno, col_offset) {
            _super.call(this);
            this.body = body;
            this.handlers = handlers;
            this.orelse = orelse;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return TryExcept;
    }(Statement));
    exports.TryExcept = TryExcept;
    var TryFinally = (function (_super) {
        __extends(TryFinally, _super);
        function TryFinally(body, finalbody, lineno, col_offset) {
            _super.call(this);
            this.body = body;
            this.finalbody = finalbody;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return TryFinally;
    }(Statement));
    exports.TryFinally = TryFinally;
    var Assert = (function (_super) {
        __extends(Assert, _super);
        function Assert(test, msg, lineno, col_offset) {
            _super.call(this);
            this.test = test;
            this.msg = msg;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Assert;
    }(Statement));
    exports.Assert = Assert;
    var ImportStatement = (function (_super) {
        __extends(ImportStatement, _super);
        function ImportStatement(names, lineno, col_offset) {
            _super.call(this);
            this.names = names;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ImportStatement;
    }(Statement));
    exports.ImportStatement = ImportStatement;
    var ImportFrom = (function (_super) {
        __extends(ImportFrom, _super);
        function ImportFrom(module, names, level, lineno, col_offset) {
            _super.call(this);
            this.module = module;
            this.names = names;
            this.level = level;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ImportFrom;
    }(Statement));
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
    var Expr = (function (_super) {
        __extends(Expr, _super);
        function Expr(value, lineno, col_offset) {
            _super.call(this);
            this.value = value;
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Expr;
    }(Statement));
    exports.Expr = Expr;
    var Pass = (function () {
        function Pass(lineno, col_offset) {
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return Pass;
    }());
    exports.Pass = Pass;
    var BreakStatement = (function (_super) {
        __extends(BreakStatement, _super);
        function BreakStatement(lineno, col_offset) {
            _super.call(this);
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return BreakStatement;
    }(Statement));
    exports.BreakStatement = BreakStatement;
    var ContinueStatement = (function (_super) {
        __extends(ContinueStatement, _super);
        function ContinueStatement(lineno, col_offset) {
            _super.call(this);
            this.lineno = lineno;
            this.col_offset = col_offset;
        }
        return ContinueStatement;
    }(Statement));
    exports.ContinueStatement = ContinueStatement;
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
            // Do nothing yet.
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
    var Comprehension = (function () {
        function Comprehension(target, iter, ifs) {
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
        }
        return Comprehension;
    }());
    exports.Comprehension = Comprehension;
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
    var Arguments = (function () {
        function Arguments(args, vararg, kwarg, defaults) {
            this.args = args;
            this.vararg = vararg;
            this.kwarg = kwarg;
            this.defaults = defaults;
        }
        return Arguments;
    }());
    exports.Arguments = Arguments;
    var Keyword = (function () {
        function Keyword(arg, value) {
            this.arg = arg;
            this.value = value;
        }
        return Keyword;
    }());
    exports.Keyword = Keyword;
    var Alias = (function () {
        function Alias(name, asname) {
            this.name = name;
            this.asname = asname;
        }
        return Alias;
    }());
    exports.Alias = Alias;
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
    ReturnStatement.prototype['_astname'] = 'ReturnStatement';
    ReturnStatement.prototype['_fields'] = [
        'value', function (n) { return n.value; }
    ];
    DeleteExpression.prototype['_astname'] = 'Delete';
    DeleteExpression.prototype['_fields'] = [
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
    ForStatement.prototype['_astname'] = 'ForStatement';
    ForStatement.prototype['_fields'] = [
        'target', function (n) { return n.target; },
        'iter', function (n) { return n.iter; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    WhileStatement.prototype['_astname'] = 'WhileStatement';
    WhileStatement.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'body', function (n) { return n.body; },
        'orelse', function (n) { return n.orelse; }
    ];
    IfStatement.prototype['_astname'] = 'IfStatement';
    IfStatement.prototype['_fields'] = [
        'test', function (n) { return n.test; },
        'consequent', function (n) { return n.consequent; },
        'alternate', function (n) { return n.alternate; }
    ];
    WithStatement.prototype['_astname'] = 'WithStatement';
    WithStatement.prototype['_fields'] = [
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
    ImportStatement.prototype['_astname'] = 'Import';
    ImportStatement.prototype['_fields'] = [
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
    BreakStatement.prototype['_astname'] = 'BreakStatement';
    BreakStatement.prototype['_fields'] = [];
    ContinueStatement.prototype['_astname'] = 'ContinueStatement';
    ContinueStatement.prototype['_fields'] = [];
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
    In.prototype['_astname'] = 'In';
    In.prototype['_isenum'] = true;
    NotIn.prototype['_astname'] = 'NotIn';
    NotIn.prototype['_isenum'] = true;
    Comprehension.prototype['_astname'] = 'Comprehension';
    Comprehension.prototype['_fields'] = [
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
    Arguments.prototype['_astname'] = 'Arguments';
    Arguments.prototype['_fields'] = [
        'args', function (n) { return n.args; },
        'vararg', function (n) { return n.vararg; },
        'kwarg', function (n) { return n.kwarg; },
        'defaults', function (n) { return n.defaults; }
    ];
    Keyword.prototype['_astname'] = 'Keyword';
    Keyword.prototype['_fields'] = [
        'arg', function (n) { return n.arg; },
        'value', function (n) { return n.value; }
    ];
    Alias.prototype['_astname'] = 'Alias';
    Alias.prototype['_fields'] = [
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

define('pytools/builder',["require", "exports", './asserts', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './base', './tables', './Tokens', './numericLiteral'], function (require, exports, asserts_1, types_1, types_2, types_3, types_4, types_5, types_6, types_7, types_8, types_9, types_10, types_11, types_12, types_13, types_14, types_15, types_16, types_17, types_18, types_19, types_20, types_21, types_22, types_23, types_24, types_25, types_26, types_27, types_28, types_29, types_30, types_31, types_32, types_33, types_34, types_35, types_36, types_37, types_38, types_39, types_40, types_41, types_42, types_43, types_44, types_45, types_46, types_47, types_48, types_49, types_50, types_51, types_52, types_53, types_54, types_55, types_56, types_57, types_58, types_59, types_60, types_61, types_62, types_63, types_64, types_65, types_66, types_67, types_68, types_69, types_70, types_71, types_72, types_73, types_74, types_75, types_76, types_77, types_78, types_79, types_80, types_81, types_82, types_83, types_84, types_85, types_86, base_1, tables_1, Tokens_1, numericLiteral_1) {
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
        asserts_1.assert(ctx !== types_10.AugStore && ctx !== types_9.AugLoad);
        var s = null;
        var exprName = null;
        switch (e.constructor) {
            case types_7.Attribute:
            case types_59.Name:
                if (ctx === types_74.Store)
                    forbiddenCheck(c, n, e.attr, n.lineno);
                e.ctx = ctx;
                break;
            case types_77.Subscript:
                e.ctx = ctx;
                break;
            case types_50.List:
                e.ctx = ctx;
                s = e.elts;
                break;
            case types_80.Tuple:
                if (e.elts.length === 0)
                    throw syntaxError("can't assign to ()", c.c_filename, n.lineno);
                e.ctx = ctx;
                s = e.elts;
                break;
            case types_49.Lambda:
                exprName = "lambda";
                break;
            case types_17.Call:
                exprName = "function call";
                break;
            case types_15.BoolOp:
            case types_11.BinOp:
            case types_82.UnaryOp:
                exprName = "operator";
                break;
            case types_35.GeneratorExp:
                exprName = "generator expression";
                break;
            case types_86.Yield:
                exprName = "yield expression";
                break;
            case types_51.ListComp:
                exprName = "list comprehension";
                break;
            case types_24.Dict:
            case types_64.Num:
            case types_75.Str:
                exprName = "literal";
                break;
            case types_19.Compare:
                exprName = "comparison expression";
                break;
            case types_41.IfExp:
                exprName = "conditional expression";
                break;
            default:
                asserts_1.fail("unhandled expression in assignment");
        }
        if (exprName) {
            throw syntaxError("can't " + (ctx === types_74.Store ? "assign to" : "delete") + " " + exprName, c.c_filename, n.lineno);
        }
        if (s) {
            for (var i = 0; i < s.length; ++i) {
                setContext(c, s[i], ctx, n);
            }
        }
    }
    var operatorMap = {};
    (function () {
        operatorMap[TOK.T_VBAR] = types_13.BitOr;
        operatorMap[TOK.T_VBAR] = types_13.BitOr;
        operatorMap[TOK.T_CIRCUMFLEX] = types_14.BitXor;
        operatorMap[TOK.T_AMPER] = types_12.BitAnd;
        operatorMap[TOK.T_LEFTSHIFT] = types_53.LShift;
        operatorMap[TOK.T_RIGHTSHIFT] = types_72.RShift;
        operatorMap[TOK.T_PLUS] = types_1.Add;
        operatorMap[TOK.T_MINUS] = types_76.Sub;
        operatorMap[TOK.T_STAR] = types_58.Mult;
        operatorMap[TOK.T_SLASH] = types_25.Div;
        operatorMap[TOK.T_DOUBLESLASH] = types_32.FloorDiv;
        operatorMap[TOK.T_PERCENT] = types_56.Mod;
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
                case TOK.T_LESS: return types_54.Lt;
                case TOK.T_GREATER: return types_37.Gt;
                case TOK.T_EQEQUAL: return types_27.Eq;
                case TOK.T_LESSEQUAL: return types_55.LtE;
                case TOK.T_GREATEREQUAL: return types_38.GtE;
                case TOK.T_NOTEQUAL: return types_62.NotEq;
                case TOK.T_NAME:
                    if (n.value === "in")
                        return types_45.In;
                    if (n.value === "is")
                        return types_47.Is;
            }
        }
        else if (NCH(n) === 2) {
            if (CHILD(n, 0).type === TOK.T_NAME) {
                if (CHILD(n, 1).value === "in")
                    return types_63.NotIn;
                if (CHILD(n, 0).value === "is")
                    return types_48.IsNot;
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
            return new types_28.ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
        else if (NCH(exc) === 2)
            return new types_28.ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
        else if (NCH(exc) === 4) {
            var e = astForExpr(c, CHILD(exc, 3));
            setContext(c, e, types_74.Store, CHILD(exc, 3));
            return new types_28.ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
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
            var exceptSt = new types_78.TryExcept(body, handlers, orelse, n.lineno, n.col_offset);
            if (!finally_)
                return exceptSt;
            /* if a 'finally' is present too, we nest the TryExcept within a
                TryFinally to emulate try ... except ... finally */
            body = [exceptSt];
        }
        asserts_1.assert(finally_ !== null);
        return new types_79.TryFinally(body, finally_, n.lineno, n.col_offset);
    }
    function astForDottedName(c, n) {
        REQ(n, SYM.dotted_name);
        var lineno = n.lineno;
        var col_offset = n.col_offset;
        var id = strobj(CHILD(n, 0).value);
        var e = new types_59.Name(id, types_52.Load, lineno, col_offset);
        for (var i = 2; i < NCH(n); i += 2) {
            id = strobj(CHILD(n, i).value);
            e = new types_7.Attribute(e, id, types_52.Load, lineno, col_offset);
        }
        return e;
    }
    function astForDecorator(c, n) {
        /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
        REQ(n, SYM.decorator);
        REQ(CHILD(n, 0), TOK.T_AT);
        REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
        var nameExpr = astForDottedName(c, CHILD(n, 1));
        if (NCH(n) === 3)
            return nameExpr;
        else if (NCH(n) === 5)
            return new types_17.Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
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
            setContext(c, optionalVars, types_74.Store, n);
            suiteIndex = 4;
        }
        return new types_85.WithStatement(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
    }
    function astForExecStmt(c, n) {
        var globals = null, locals = null;
        var nchildren = NCH(n);
        asserts_1.assert(nchildren === 2 || nchildren === 4 || nchildren === 6);
        /* exec_stmt: 'exec' expr ['in' test [',' test]] */
        REQ(n, SYM.exec_stmt);
        var expr1 = astForExpr(c, CHILD(n, 1));
        if (nchildren >= 4)
            globals = astForExpr(c, CHILD(n, 3));
        if (nchildren === 6)
            locals = astForExpr(c, CHILD(n, 5));
        return new types_29.Exec(expr1, globals, locals, n.lineno, n.col_offset);
    }
    function astForIfStmt(c, n) {
        /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
            ['else' ':' suite]
        */
        REQ(n, SYM.if_stmt);
        if (NCH(n) === 4)
            return new types_40.IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
        var s = CHILD(n, 4).value;
        var decider = s.charAt(2); // elSe or elIf
        if (decider === 's') {
            return new types_40.IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
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
                    new types_40.IfStatement(astForExpr(c, CHILD(n, NCH(n) - 6)), astForSuite(c, CHILD(n, NCH(n) - 4)), astForSuite(c, CHILD(n, NCH(n) - 1)), CHILD(n, NCH(n) - 6).lineno, CHILD(n, NCH(n) - 6).col_offset)];
                nElif--;
            }
            for (var i = 0; i < nElif; ++i) {
                var off = 5 + (nElif - i - 1) * 4;
                orelse = [
                    new types_40.IfStatement(astForExpr(c, CHILD(n, off)), astForSuite(c, CHILD(n, off + 2)), orelse, CHILD(n, off).lineno, CHILD(n, off).col_offset)];
            }
            return new types_40.IfStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), orelse, n.lineno, n.col_offset);
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
        return new types_23.DeleteExpression(astForExprlist(c, CHILD(n, 1), types_22.Del), n.lineno, n.col_offset);
    }
    function astForGlobalStmt(c, n) {
        REQ(n, SYM.GlobalStmt);
        var s = [];
        for (var i = 1; i < NCH(n); i += 2) {
            s[(i - 1) / 2] = strobj(CHILD(n, i).value);
        }
        return new types_36.Global(s, n.lineno, n.col_offset);
    }
    function astForNonLocalStmt(c, n) {
        REQ(n, SYM.NonLocalStmt);
        var s = [];
        for (var i = 1; i < NCH(n); i += 2) {
            s[(i - 1) / 2] = strobj(CHILD(n, i).value);
        }
        return new types_60.NonLocal(s, n.lineno, n.col_offset);
    }
    function astForAssertStmt(c, n) {
        /* assert_stmt: 'assert' test [',' test] */
        REQ(n, SYM.assert_stmt);
        if (NCH(n) === 2)
            return new types_5.Assert(astForExpr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
        else if (NCH(n) === 4)
            return new types_5.Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.lineno, n.col_offset);
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
                    return new types_2.Alias(name_1, str == null ? null : strobj(str));
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
                        return new types_2.Alias(strobj(CHILD(n, 0).value), null);
                    else {
                        // create a string of the form a.b.c
                        var str_1 = '';
                        for (var i = 0; i < NCH(n); i += 2)
                            str_1 += CHILD(n, i).value + ".";
                        return new types_2.Alias(strobj(str_1.substr(0, str_1.length - 1)), null);
                    }
                case TOK.T_STAR:
                    return new types_2.Alias(strobj("*"), null);
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
            return new types_42.ImportStatement(aliases, lineno, col_offset);
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
            return new types_43.ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
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
                if (NCH(n) === 2)
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
            var t = astForExprlist(c, forch, types_74.Store);
            var expression = astForTestlist(c, CHILD(ch, 3));
            var lc;
            if (NCH(forch) === 1)
                lc = new types_20.Comprehension(t[0], expression, []);
            else
                lc = new types_20.Comprehension(new types_80.Tuple(t, types_74.Store, ch.lineno, ch.col_offset), expression, []);
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
        return new types_51.ListComp(elt, listcomps, n.lineno, n.col_offset);
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
            case TOK.T_PLUS: return new types_82.UnaryOp(types_81.UAdd, expression, n.lineno, n.col_offset);
            case TOK.T_MINUS: return new types_82.UnaryOp(types_83.USub, expression, n.lineno, n.col_offset);
            case TOK.T_TILDE: return new types_82.UnaryOp(types_46.Invert, expression, n.lineno, n.col_offset);
        }
        asserts_1.fail("unhandled UnaryExpr");
    }
    function astForForStmt(c, n) {
        var seq = [];
        REQ(n, SYM.for_stmt);
        if (NCH(n) === 9)
            seq = astForSuite(c, CHILD(n, 8));
        var nodeTarget = CHILD(n, 1);
        var _target = astForExprlist(c, nodeTarget, types_74.Store);
        var target;
        if (NCH(nodeTarget) === 1)
            target = _target[0];
        else
            target = new types_80.Tuple(_target, types_74.Store, n.lineno, n.col_offset);
        return new types_33.ForStatement(target, astForTestlist(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 5)), seq, n.lineno, n.col_offset);
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
                    if (e.constructor === types_49.Lambda)
                        throw syntaxError("lambda cannot contain assignment", c.c_filename, n.lineno);
                    else if (e.constructor !== types_59.Name)
                        throw syntaxError("keyword can't be an expression", c.c_filename, n.lineno);
                    var key = e.id;
                    forbiddenCheck(c, CHILD(ch, 0), key, n.lineno);
                    for (var k = 0; k < nkeywords; ++k) {
                        var tmp = keywords[k].arg;
                        if (tmp === key)
                            throw syntaxError("keyword argument repeated", c.c_filename, n.lineno);
                    }
                    keywords[nkeywords++] = new types_39.Keyword(key, astForExpr(c, CHILD(ch, 2)));
                }
            }
            else if (ch.type === TOK.T_STAR)
                vararg = astForExpr(c, CHILD(n, ++i));
            else if (ch.type === TOK.T_DOUBLESTAR)
                kwarg = astForExpr(c, CHILD(n, ++i));
        }
        return new types_17.Call(func, args, keywords, vararg, kwarg, func.lineno, func.col_offset);
    }
    function astForTrailer(c, n, leftExpr) {
        /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME
            subscriptlist: subscript (',' subscript)* [',']
            subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
            */
        REQ(n, SYM.trailer);
        if (CHILD(n, 0).type === TOK.T_LPAR) {
            if (NCH(n) === 2)
                return new types_17.Call(leftExpr, [], [], null, null, n.lineno, n.col_offset);
            else
                return astForCall(c, CHILD(n, 1), leftExpr);
        }
        else if (CHILD(n, 0).type === TOK.T_DOT)
            return new types_7.Attribute(leftExpr, strobj(CHILD(n, 1).value), types_52.Load, n.lineno, n.col_offset);
        else {
            REQ(CHILD(n, 0), TOK.T_LSQB);
            REQ(CHILD(n, 2), TOK.T_RSQB);
            n = CHILD(n, 1);
            if (NCH(n) === 1)
                return new types_77.Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), types_52.Load, n.lineno, n.col_offset);
            else {
                /* The grammar is ambiguous here. The ambiguity is resolved
                    by treating the sequence as a tuple literal if there are
                    no slice features.
                */
                var simple = true;
                var slices = [];
                for (var j = 0; j < NCH(n); j += 2) {
                    var slc = astForSlice(c, CHILD(n, j));
                    if (slc.constructor !== types_44.Index)
                        simple = false;
                    slices[j / 2] = slc;
                }
                if (!simple) {
                    return new types_77.Subscript(leftExpr, new types_31.ExtSlice(slices), types_52.Load, n.lineno, n.col_offset);
                }
                var elts = [];
                for (var j = 0; j < slices.length; ++j) {
                    var slc_1 = slices[j];
                    asserts_1.assert(slc_1.constructor === types_44.Index && slc_1.value !== null && slc_1.value !== undefined);
                    elts[j] = slc_1.value;
                }
                var e = new types_80.Tuple(elts, types_52.Load, n.lineno, n.col_offset);
                return new types_77.Subscript(leftExpr, new types_44.Index(e), types_52.Load, n.lineno, n.col_offset);
            }
        }
    }
    function astForFlowStmt(c, n) {
        var ch;
        REQ(n, SYM.flow_stmt);
        ch = CHILD(n, 0);
        switch (ch.type) {
            case SYM.break_stmt: return new types_16.BreakStatement(n.lineno, n.col_offset);
            case SYM.continue_stmt: return new types_21.ContinueStatement(n.lineno, n.col_offset);
            case SYM.yield_stmt:
                return new types_30.Expr(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
            case SYM.return_stmt:
                if (NCH(ch) === 1)
                    return new types_71.ReturnStatement(null, n.lineno, n.col_offset);
                else
                    return new types_71.ReturnStatement(astForTestlist(c, CHILD(ch, 1)), n.lineno, n.col_offset);
            case SYM.raise_stmt:
                if (NCH(ch) === 1)
                    return new types_70.Raise(null, null, null, n.lineno, n.col_offset);
                else if (NCH(ch) === 2)
                    return new types_70.Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.lineno, n.col_offset);
                else if (NCH(ch) === 4)
                    return new types_70.Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), null, n.lineno, n.col_offset);
                else if (NCH(ch) === 6)
                    return new types_70.Raise(astForExpr(c, CHILD(ch, 1)), astForExpr(c, CHILD(ch, 3)), astForExpr(c, CHILD(ch, 5)), n.lineno, n.col_offset);
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
                return new types_3.Arguments([], null, null, []);
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
                            args[k++] = new types_59.Name(id, types_66.Param, ch.lineno, ch.col_offset);
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
        return new types_3.Arguments(args, vararg, kwarg, defaults);
    }
    function astForFuncdef(c, n, decoratorSeq) {
        /* funcdef: 'def' NAME parameters ':' suite */
        REQ(n, SYM.funcdef);
        var name = strobj(CHILD(n, 1).value);
        forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value, n.lineno);
        var args = astForArguments(c, CHILD(n, 2));
        var body = astForSuite(c, CHILD(n, 4));
        return new types_34.FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
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
            return new types_18.ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
        if (CHILD(n, 3).type === TOK.T_RPAR)
            return new types_18.ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);
        var bases = astForClassBases(c, CHILD(n, 3));
        var s = astForSuite(c, CHILD(n, 6));
        return new types_18.ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
    }
    function astForLambdef(c, n) {
        var args;
        var expression;
        if (NCH(n) === 3) {
            args = new types_3.Arguments([], null, null, []);
            expression = astForExpr(c, CHILD(n, 2));
        }
        else {
            args = astForArguments(c, CHILD(n, 1));
            expression = astForExpr(c, CHILD(n, 3));
        }
        return new types_49.Lambda(args, expression, n.lineno, n.col_offset);
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
                if (NCH(n) === 2)
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
            var t = astForExprlist(c, forch, types_74.Store);
            var expression = astForExpr(c, CHILD(ch, 3));
            var ge;
            if (NCH(forch) === 1)
                ge = new types_20.Comprehension(t[0], expression, []);
            else
                ge = new types_20.Comprehension(new types_80.Tuple(t, types_74.Store, ch.lineno, ch.col_offset), expression, []);
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
        return new types_35.GeneratorExp(elt, genexps, n.lineno, n.col_offset);
    }
    function astForWhileStmt(c, n) {
        /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
        REQ(n, SYM.while_stmt);
        if (NCH(n) === 4)
            return new types_84.WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
        else if (NCH(n) === 7)
            return new types_84.WhileStatement(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
        asserts_1.fail("wrong number of tokens for 'while' stmt");
    }
    function astForAugassign(c, n) {
        REQ(n, SYM.augassign);
        n = CHILD(n, 0);
        switch (n.value.charAt(0)) {
            case '+': return types_1.Add;
            case '-': return types_76.Sub;
            case '/':
                if (n.value.charAt(1) === '/')
                    return types_32.FloorDiv;
                return types_25.Div;
            case '%': return types_56.Mod;
            case '<': return types_53.LShift;
            case '>': return types_72.RShift;
            case '&': return types_12.BitAnd;
            case '^': return types_14.BitXor;
            case '|': return types_13.BitOr;
            case '*':
                if (n.value.charAt(1) === '*')
                    return types_68.Pow;
                return types_58.Mult;
            default: asserts_1.fail("invalid augassign");
        }
    }
    function astForBinop(c, n) {
        /* Must account for a sequence of expressions.
            How should A op B op C by represented?
            BinOp(BinOp(A, op, B), op, C).
        */
        var result = new types_11.BinOp(astForExpr(c, CHILD(n, 0)), getOperator(CHILD(n, 1)), astForExpr(c, CHILD(n, 2)), n.lineno, n.col_offset);
        var nops = (NCH(n) - 1) / 2;
        for (var i = 1; i < nops; ++i) {
            var nextOper = CHILD(n, i * 2 + 1);
            var newoperator = getOperator(nextOper);
            var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
            result = new types_11.BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
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
            return new types_80.Tuple(seqForTestlist(c, n), types_52.Load, n.lineno, n.col_offset);
        }
    }
    function astForExprStmt(c, n) {
        REQ(n, SYM.ExprStmt);
        if (NCH(n) === 1)
            return new types_30.Expr(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
        else if (CHILD(n, 1).type === SYM.augassign) {
            var ch = CHILD(n, 0);
            var expr1 = astForTestlist(c, ch);
            switch (expr1.constructor) {
                case types_35.GeneratorExp: throw syntaxError("augmented assignment to generator expression not possible", c.c_filename, n.lineno);
                case types_86.Yield: throw syntaxError("augmented assignment to yield expression not possible", c.c_filename, n.lineno);
                case types_59.Name:
                    var varName = expr1.id;
                    forbiddenCheck(c, ch, varName, n.lineno);
                    break;
                case types_7.Attribute:
                case types_77.Subscript:
                    break;
                default:
                    throw syntaxError("illegal expression for augmented assignment", c.c_filename, n.lineno);
            }
            setContext(c, expr1, types_74.Store, ch);
            ch = CHILD(n, 2);
            var expr2;
            if (ch.type === SYM.testlist)
                expr2 = astForTestlist(c, ch);
            else
                expr2 = astForExpr(c, ch);
            return new types_8.AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
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
                setContext(c, e, types_74.Store, CHILD(n, i));
                targets[i / 2] = e;
            }
            var value = CHILD(n, NCH(n) - 1);
            var expression;
            if (value.type === SYM.testlist)
                expression = astForTestlist(c, value);
            else
                expression = astForExpr(c, value);
            return new types_6.Assign(targets, expression, n.lineno, n.col_offset);
        }
    }
    function astForIfexpr(c, n) {
        asserts_1.assert(NCH(n) === 5);
        return new types_41.IfExp(astForExpr(c, CHILD(n, 2)), astForExpr(c, CHILD(n, 0)), astForExpr(c, CHILD(n, 4)), n.lineno, n.col_offset);
    }
    // escape() was deprecated in JavaScript 1.5. Use encodeURI or encodeURIComponent instead.
    function escape(s) {
        return encodeURIComponent(s);
    }
    /**
     * s is a python-style string literal, including quote characters and u/r/b
     * prefixes. Returns decoded string object.
     */
    function parsestr(c, s) {
        // 
        // const encodeUtf8 = function(s) { return unescape(encodeURIComponent(s)); };
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
            return new types_26.Ellipsis();
        if (NCH(n) === 1 && ch.type === SYM.IfExpr)
            return new types_44.Index(astForExpr(c, ch));
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
                step = new types_59.Name(strobj("None"), types_52.Load, ch.lineno, ch.col_offset);
            }
            else {
                ch = CHILD(ch, 1);
                if (ch.type === SYM.IfExpr)
                    step = astForExpr(c, ch);
            }
        }
        return new types_73.Slice(lower, upper, step);
    }
    function astForAtomExpr(c, n) {
        var ch = CHILD(n, 0);
        switch (ch.type) {
            case TOK.T_NAME:
                // All names start in Load context, but may be changed later
                return new types_59.Name(strobj(ch.value), types_52.Load, n.lineno, n.col_offset);
            case TOK.T_STRING:
                return new types_75.Str(parsestrplus(c, n), n.lineno, n.col_offset);
            case TOK.T_NUMBER:
                return new types_64.Num(parsenumber(c, ch.value, n.lineno), n.lineno, n.col_offset);
            case TOK.T_LPAR:
                ch = CHILD(n, 1);
                if (ch.type === TOK.T_RPAR)
                    return new types_80.Tuple([], types_52.Load, n.lineno, n.col_offset);
                if (ch.type === SYM.YieldExpr)
                    return astForExpr(c, ch);
                if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                    return astForGenexp(c, ch);
                return astForTestlistGexp(c, ch);
            case TOK.T_LSQB:
                ch = CHILD(n, 1);
                if (ch.type === TOK.T_RSQB)
                    return new types_50.List([], types_52.Load, n.lineno, n.col_offset);
                REQ(ch, SYM.listmaker);
                if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                    return new types_50.List(seqForTestlist(c, ch), types_52.Load, n.lineno, n.col_offset);
                else
                    return astForListcomp(c, ch);
            case TOK.T_LBRACE:
                /* dictmaker: test ':' test (',' test ':' test)* [','] */
                ch = CHILD(n, 1);
                // var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
                var keys = [];
                var values = [];
                for (var i = 0; i < NCH(ch); i += 4) {
                    keys[i / 4] = astForExpr(c, CHILD(ch, i));
                    values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
                }
                return new types_24.Dict(keys, values, n.lineno, n.col_offset);
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
            e = new types_11.BinOp(e, types_68.Pow, f, n.lineno, n.col_offset);
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
                        return new types_15.BoolOp(types_4.And, seq, n.lineno, n.col_offset);
                    asserts_1.assert(CHILD(n, 1).value === "or");
                    return new types_15.BoolOp(types_65.Or, seq, n.lineno, n.col_offset);
                case SYM.NotExpr:
                    if (NCH(n) === 1) {
                        n = CHILD(n, 0);
                        continue LOOP;
                    }
                    else {
                        return new types_82.UnaryOp(types_61.Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
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
                        return new types_19.Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
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
                    return new types_86.Yield(exp, n.lineno, n.col_offset);
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
        return new types_69.Print(dest, seq, nl, n.lineno, n.col_offset);
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
                case SYM.pass_stmt: return new types_67.Pass(n.lineno, n.col_offset);
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
                return new types_57.Module(stmts);
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

define('pytools/reservedNames',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * TODO: Reserved for whom?
     */
    var reservedNames = {
        '__defineGetter__': true,
        '__defineSetter__': true,
        'apply': true,
        'call': true,
        'eval': true,
        'hasOwnProperty': true,
        'isPrototypeOf': true,
        '__lookupGetter__': true,
        '__lookupSetter__': true,
        '__noSuchMethod__': true,
        'propertyIsEnumerable': true,
        'toSource': true,
        'toLocaleString': true,
        'toString': true,
        'unwatch': true,
        'valueOf': true,
        'watch': true,
        'length': true
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = reservedNames;
});

define('pytools/reservedWords',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * TODO: Reserved for whom?
     */
    var reservedWords = {
        'abstract': true,
        'as': true,
        'boolean': true,
        'break': true,
        'byte': true,
        'case': true,
        'catch': true,
        'char': true,
        'class': true,
        'continue': true,
        'const': true,
        'debugger': true,
        'default': true,
        'delete': true,
        'do': true,
        'double': true,
        'else': true,
        'enum': true,
        'export': true,
        'extends': true,
        'false': true,
        'final': true,
        'finally': true,
        'float': true,
        'for': true,
        'function': true,
        'goto': true,
        'if': true,
        'implements': true,
        'import': true,
        'in': true,
        'instanceof': true,
        'int': true,
        'interface': true,
        'is': true,
        'long': true,
        'namespace': true,
        'native': true,
        'new': true,
        'null': true,
        'package': true,
        'private': true,
        'protected': true,
        'public': true,
        'return': true,
        'short': true,
        'static': true,
        'super': false,
        'switch': true,
        'synchronized': true,
        'this': true,
        'throw': true,
        'throws': true,
        'transient': true,
        'true': true,
        'try': true,
        'typeof': true,
        'use': true,
        'var': true,
        'void': true,
        'volatile': true,
        'while': true,
        'with': true
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = reservedWords;
});

define('pytools/dictUpdate',["require", "exports"], function (require, exports) {
    "use strict";
    function default_1(a, b) {
        for (var kb in b) {
            if (b.hasOwnProperty(kb)) {
                a[kb] = b[kb];
            }
        }
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
});

define('pytools/mangleName',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * @param {string|null} priv
     * @param {string} name
     */
    function default_1(priv, name) {
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
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
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
            return this.__scope === SymbolConstants_7.GLOBAL_IMPLICIT || this.__scope === SymbolConstants_6.GLOBAL_EXPLICIT;
        };
        Symbol.prototype.is_declared_global = function () {
            return this.__scope === SymbolConstants_6.GLOBAL_EXPLICIT;
        };
        Symbol.prototype.is_local = function () {
            return !!(this.__flags & SymbolConstants_1.DEF_BOUND);
        };
        Symbol.prototype.is_free = function () { return this.__scope === SymbolConstants_5.FREE; };
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
            // print("  check_children:", name);
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
            asserts_1.assert(this.get_type() === 'function', "get_parameters only valid for function scopes");
            if (!this._funcParams)
                this._funcParams = this._identsMatching(function (x) { return !!(x & SymbolConstants_1.DEF_PARAM); });
            return this._funcParams;
        };
        SymbolTableScope.prototype.get_locals = function () {
            asserts_1.assert(this.get_type() === 'function', "get_locals only valid for function scopes");
            if (!this._funcLocals)
                this._funcLocals = this._identsMatching(function (x) { return !!(x & SymbolConstants_2.DEF_BOUND); });
            return this._funcLocals;
        };
        SymbolTableScope.prototype.get_globals = function () {
            asserts_1.assert(this.get_type() === 'function', "get_globals only valid for function scopes");
            if (!this._funcGlobals) {
                this._funcGlobals = this._identsMatching(function (x) {
                    var masked = (x >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
                    return masked === SymbolConstants_6.GLOBAL_IMPLICIT || masked === SymbolConstants_5.GLOBAL_EXPLICIT;
                });
            }
            return this._funcGlobals;
        };
        SymbolTableScope.prototype.get_frees = function () {
            asserts_1.assert(this.get_type() === 'function', "get_frees only valid for function scopes");
            if (!this._funcFrees) {
                this._funcFrees = this._identsMatching(function (x) {
                    var masked = (x >> SymbolConstants_8.SCOPE_OFF) & SymbolConstants_7.SCOPE_MASK;
                    return masked === SymbolConstants_3.FREE;
                });
            }
            return this._funcFrees;
        };
        SymbolTableScope.prototype.get_methods = function () {
            asserts_1.assert(this.get_type() === 'class', "get_methods only valid for class scopes");
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
            // print("getScope");
            // for (var k in this.symFlags) print(k);
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

define('pytools/syntaxError',["require", "exports", './asserts', './base'], function (require, exports, asserts_1, base_1) {
    "use strict";
    /**
     * @param {string} message
     * @param {string} fileName
     * @param {number=} lineNumber
     */
    function default_1(message, fileName, lineNumber) {
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
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
});

define('pytools/SymbolTable',["require", "exports", './asserts', './dictUpdate', './mangleName', './SymbolTableScope', './syntaxError', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './types', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants', './SymbolConstants'], function (require, exports, asserts_1, dictUpdate_1, mangleName_1, SymbolTableScope_1, syntaxError_1, types_1, types_2, types_3, types_4, types_5, types_6, types_7, types_8, types_9, types_10, types_11, types_12, types_13, types_14, types_15, types_16, types_17, types_18, types_19, types_20, types_21, types_22, types_23, types_24, types_25, types_26, types_27, types_28, types_29, types_30, types_31, types_32, types_33, types_34, types_35, types_36, types_37, types_38, types_39, types_40, types_41, types_42, types_43, types_44, types_45, types_46, types_47, types_48, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6, SymbolConstants_7, SymbolConstants_8, SymbolConstants_9, SymbolConstants_10, SymbolConstants_11, SymbolConstants_12, SymbolConstants_13, SymbolConstants_14, SymbolConstants_15, SymbolConstants_16) {
    "use strict";
    var SymbolTable = (function () {
        /**
         * @constructor
         * @param {string} fileName
         */
        function SymbolTable(fileName) {
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
            // print("exitBlock");
            this.cur = null;
            if (this.stack.length > 0)
                this.cur = this.stack.pop();
        };
        SymbolTable.prototype.visitParams = function (args, toplevel) {
            for (var i = 0; i < args.length; ++i) {
                var arg = args[i];
                if (arg.constructor === types_31.Name) {
                    asserts_1.assert(arg.ctx === types_33.Param || (arg.ctx === types_39.Store && !toplevel));
                    this.addDef(arg.id, SymbolConstants_8.DEF_PARAM, arg.lineno);
                }
                else {
                    // Tuple isn't supported
                    throw syntaxError_1.default("invalid expression in parameter list", this.fileName);
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
         * @return {void}
         */
        SymbolTable.prototype.newTmpname = function (lineno) {
            this.addDef("_[" + (++this.tmpname) + "]", SymbolConstants_7.DEF_LOCAL, lineno);
        };
        /**
         * @param {string} name
         * @param {number} flag
         * @param {number} lineno
         * @return {void}
         */
        SymbolTable.prototype.addDef = function (name, flag, lineno) {
            var mangled = mangleName_1.default(this.curClass, name);
            //  mangled = fixReservedNames(mangled);
            var val = this.cur.symFlags[mangled];
            if (val !== undefined) {
                if ((flag & SymbolConstants_8.DEF_PARAM) && (val & SymbolConstants_8.DEF_PARAM)) {
                    throw syntaxError_1.default("duplicate argument '" + name + "' in function definition", this.fileName, lineno);
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
                case types_38.Slice:
                    if (s.lower)
                        this.visitExpr(s.lower);
                    if (s.upper)
                        this.visitExpr(s.upper);
                    if (s.step)
                        this.visitExpr(s.step);
                    break;
                case types_17.ExtSlice:
                    for (var i = 0; i < s.dims.length; ++i)
                        this.visitSlice(s.dims[i]);
                    break;
                case types_26.Index:
                    this.visitExpr(s.value);
                    break;
                case types_14.Ellipsis:
                    break;
            }
        };
        /**
         * @param {Object} s
         */
        SymbolTable.prototype.visitStmt = function (s) {
            asserts_1.assert(s !== undefined, "visitStmt called with undefined");
            switch (s.constructor) {
                case types_19.FunctionDef:
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
                case types_9.ClassDef:
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
                case types_37.ReturnStatement: {
                    var rs = s;
                    if (rs.value) {
                        this.visitExpr(rs.value);
                        this.cur.returnsValue = true;
                        if (this.cur.generator) {
                            throw syntaxError_1.default("'return' with argument inside generator", this.fileName);
                        }
                    }
                    break;
                }
                case types_12.DeleteExpression:
                    this.SEQExpr(s.targets);
                    break;
                case types_2.Assign:
                    this.SEQExpr(s.targets);
                    this.visitExpr(s.value);
                    break;
                case types_4.AugAssign:
                    this.visitExpr(s.target);
                    this.visitExpr(s.value);
                    break;
                case types_35.Print:
                    if (s.dest)
                        this.visitExpr(s.dest);
                    this.SEQExpr(s.values);
                    break;
                case types_18.ForStatement: {
                    var fs = s;
                    this.visitExpr(fs.target);
                    this.visitExpr(fs.iter);
                    this.SEQStmt(fs.body);
                    if (fs.orelse)
                        this.SEQStmt(fs.orelse);
                    break;
                }
                case types_46.WhileStatement: {
                    var ws = s;
                    this.visitExpr(ws.test);
                    this.SEQStmt(ws.body);
                    if (ws.orelse)
                        this.SEQStmt(ws.orelse);
                    break;
                }
                case types_22.IfStatement: {
                    var ifs = s;
                    this.visitExpr(ifs.test);
                    this.SEQStmt(ifs.consequent);
                    if (ifs.alternate) {
                        this.SEQStmt(ifs.alternate);
                    }
                    break;
                }
                case types_36.Raise:
                    if (s.type) {
                        this.visitExpr(s.type);
                        if (s.inst) {
                            this.visitExpr(s.inst);
                            if (s.tback)
                                this.visitExpr(s.tback);
                        }
                    }
                    break;
                case types_42.TryExcept:
                    this.SEQStmt(s.body);
                    this.SEQStmt(s.orelse);
                    this.visitExcepthandlers(s.handlers);
                    break;
                case types_43.TryFinally:
                    this.SEQStmt(s.body);
                    this.SEQStmt(s.finalbody);
                    break;
                case types_1.Assert:
                    this.visitExpr(s.test);
                    if (s.msg)
                        this.visitExpr(s.msg);
                    break;
                case types_24.ImportStatement: {
                    var imps = s;
                    this.visitAlias(imps.names, imps.lineno);
                    break;
                }
                case types_25.ImportFrom: {
                    var impFrom = s;
                    this.visitAlias(impFrom.names, impFrom.lineno);
                    break;
                }
                case types_15.Exec:
                    this.visitExpr(s.body);
                    if (s.globals) {
                        this.visitExpr(s.globals);
                        if (s.locals)
                            this.visitExpr(s.locals);
                    }
                    break;
                case types_21.Global:
                    var nameslen = s.names.length;
                    for (var i = 0; i < nameslen; ++i) {
                        var name = mangleName_1.default(this.curClass, s.names[i]);
                        //              name = fixReservedNames(name);
                        var cur = this.cur.symFlags[name];
                        if (cur & (SymbolConstants_7.DEF_LOCAL | SymbolConstants_15.USE)) {
                            if (cur & SymbolConstants_7.DEF_LOCAL) {
                                throw syntaxError_1.default("name '" + name + "' is assigned to before global declaration", this.fileName, s.lineno);
                            }
                            else {
                                throw syntaxError_1.default("name '" + name + "' is used prior to global declaration", this.fileName, s.lineno);
                            }
                        }
                        this.addDef(name, SymbolConstants_5.DEF_GLOBAL, s.lineno);
                    }
                    break;
                case types_16.Expr:
                    this.visitExpr(s.value);
                    break;
                case types_34.Pass:
                case types_7.BreakStatement:
                case types_11.ContinueStatement:
                    // nothing
                    break;
                case types_47.WithStatement: {
                    var ws = s;
                    this.newTmpname(ws.lineno);
                    this.visitExpr(ws.context_expr);
                    if (ws.optional_vars) {
                        this.newTmpname(ws.lineno);
                        this.visitExpr(ws.optional_vars);
                    }
                    this.SEQStmt(ws.body);
                    break;
                }
                default:
                    asserts_1.fail("Unhandled type " + s.constructor.name + " in visitStmt");
            }
        };
        SymbolTable.prototype.visitExpr = function (e) {
            asserts_1.assert(e !== undefined, "visitExpr called with undefined");
            // print("  e: ", e.constructor.name);
            switch (e.constructor) {
                case types_6.BoolOp:
                    this.SEQExpr(e.values);
                    break;
                case types_5.BinOp:
                    this.visitExpr(e.left);
                    this.visitExpr(e.right);
                    break;
                case types_45.UnaryOp:
                    this.visitExpr(e.operand);
                    break;
                case types_27.Lambda:
                    this.addDef("lambda", SymbolConstants_7.DEF_LOCAL, e.lineno);
                    if (e.args.defaults)
                        this.SEQExpr(e.args.defaults);
                    this.enterBlock("lambda", SymbolConstants_10.FunctionBlock, e, e.lineno);
                    this.visitArguments(e.args, e.lineno);
                    this.visitExpr(e.body);
                    this.exitBlock();
                    break;
                case types_23.IfExp:
                    this.visitExpr(e.test);
                    this.visitExpr(e.body);
                    this.visitExpr(e.orelse);
                    break;
                case types_13.Dict:
                    this.SEQExpr(e.keys);
                    this.SEQExpr(e.values);
                    break;
                case types_30.ListComp:
                    this.newTmpname(e.lineno);
                    this.visitExpr(e.elt);
                    this.visitComprehension(e.generators, 0);
                    break;
                case types_20.GeneratorExp:
                    this.visitGenexp(e);
                    break;
                case types_48.Yield:
                    if (e.value)
                        this.visitExpr(e.value);
                    this.cur.generator = true;
                    if (this.cur.returnsValue) {
                        throw syntaxError_1.default("'return' with argument inside generator", this.fileName);
                    }
                    break;
                case types_10.Compare:
                    this.visitExpr(e.left);
                    this.SEQExpr(e.comparators);
                    break;
                case types_8.Call:
                    this.visitExpr(e.func);
                    this.SEQExpr(e.args);
                    for (var i = 0; i < e.keywords.length; ++i)
                        this.visitExpr(e.keywords[i].value);
                    // print(JSON.stringify(e.starargs, null, 2));
                    // print(JSON.stringify(e.kwargs, null,2));
                    if (e.starargs)
                        this.visitExpr(e.starargs);
                    if (e.kwargs)
                        this.visitExpr(e.kwargs);
                    break;
                case types_32.Num:
                case types_40.Str:
                    break;
                case types_3.Attribute:
                    this.visitExpr(e.value);
                    break;
                case types_41.Subscript:
                    this.visitExpr(e.value);
                    this.visitSlice(e.slice);
                    break;
                case types_31.Name:
                    this.addDef(e.id, e.ctx === types_28.Load ? SymbolConstants_15.USE : SymbolConstants_7.DEF_LOCAL, e.lineno);
                    break;
                case types_29.List:
                case types_44.Tuple:
                    this.SEQExpr(e.elts);
                    break;
                default:
                    asserts_1.fail("Unhandled type " + e.constructor.name + " in visitExpr");
            }
        };
        SymbolTable.prototype.visitComprehension = function (lcs, startAt) {
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
        SymbolTable.prototype.visitAlias = function (names, lineno) {
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
                        throw syntaxError_1.default("import * only allowed at module level", this.fileName);
                    }
                }
            }
        };
        /**
         * @param {Object} e
         */
        SymbolTable.prototype.visitGenexp = function (e) {
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
        SymbolTable.prototype.visitExcepthandlers = function (handlers) {
            for (var i = 0, eh; eh = handlers[i]; ++i) {
                if (eh.type)
                    this.visitExpr(eh.type);
                if (eh.name)
                    this.visitExpr(eh.name);
                this.SEQStmt(eh.body);
            }
        };
        /**
         * @param {SymbolTableScope} ste The Symbol Table Scope.
         */
        SymbolTable.prototype.analyzeBlock = function (ste, bound, free, global) {
            var local = {};
            var scope = {};
            var newglobal = {};
            var newbound = {};
            var newfree = {};
            if (ste.blockType === SymbolConstants_2.ClassBlock) {
                dictUpdate_1.default(newglobal, global);
                if (bound)
                    dictUpdate_1.default(newbound, bound);
            }
            for (var name_1 in ste.symFlags) {
                if (ste.symFlags.hasOwnProperty(name_1)) {
                    var flags = ste.symFlags[name_1];
                    this.analyzeName(ste, scope, name_1, flags, bound, local, free, global);
                }
            }
            if (ste.blockType !== SymbolConstants_2.ClassBlock) {
                if (ste.blockType === SymbolConstants_10.FunctionBlock)
                    dictUpdate_1.default(newbound, local);
                if (bound)
                    dictUpdate_1.default(newbound, bound);
                dictUpdate_1.default(newglobal, global);
            }
            var allfree = {};
            var childlen = ste.children.length;
            for (var i = 0; i < childlen; ++i) {
                var c = ste.children[i];
                this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
                if (c.hasFree || c.childHasFree)
                    ste.childHasFree = true;
            }
            dictUpdate_1.default(newfree, allfree);
            if (ste.blockType === SymbolConstants_10.FunctionBlock)
                this.analyzeCells(scope, newfree);
            this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === SymbolConstants_2.ClassBlock);
            dictUpdate_1.default(free, newfree);
        };
        SymbolTable.prototype.analyzeChildBlock = function (entry, bound, free, global, childFree) {
            var tempBound = {};
            dictUpdate_1.default(tempBound, bound);
            var tempFree = {};
            dictUpdate_1.default(tempFree, free);
            var tempGlobal = {};
            dictUpdate_1.default(tempGlobal, global);
            this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
            dictUpdate_1.default(childFree, tempFree);
        };
        SymbolTable.prototype.analyzeCells = function (scope, free) {
            for (var name_2 in scope) {
                if (scope.hasOwnProperty(name_2)) {
                    var flags = scope[name_2];
                    if (flags !== SymbolConstants_13.LOCAL)
                        continue;
                    if (free[name_2] === undefined)
                        continue;
                    scope[name_2] = SymbolConstants_1.CELL;
                    delete free[name_2];
                }
            }
        };
        /**
         * store scope info back into the st symbols dict. symbols is modified,
         * others are not.
         */
        SymbolTable.prototype.updateSymbols = function (symbols, scope, bound, free, classflag) {
            for (var name_3 in symbols) {
                if (symbols.hasOwnProperty(name_3)) {
                    var flags = symbols[name_3];
                    var w = scope[name_3];
                    flags |= w << SymbolConstants_16.SCOPE_OFF;
                    symbols[name_3] = flags;
                }
            }
            var freeValue = SymbolConstants_9.FREE << SymbolConstants_16.SCOPE_OFF;
            for (var name_4 in free) {
                if (free.hasOwnProperty(name_4)) {
                    var o = symbols[name_4];
                    if (o !== undefined) {
                        // it could be a free variable in a method of the class that has
                        // the same name as a local or global in the class scope
                        if (classflag && (o & (SymbolConstants_3.DEF_BOUND | SymbolConstants_5.DEF_GLOBAL))) {
                            var i = o | SymbolConstants_4.DEF_FREE_CLASS;
                            symbols[name_4] = i;
                        }
                        // else it's not free, probably a cell
                        continue;
                    }
                    if (bound[name_4] === undefined)
                        continue;
                    symbols[name_4] = freeValue;
                }
            }
        };
        /**
         * @param {Object} ste The Symbol Table Scope.
         * @param {string} name
         */
        SymbolTable.prototype.analyzeName = function (ste, dict, name, flags, bound, local, free, global) {
            if (flags & SymbolConstants_5.DEF_GLOBAL) {
                if (flags & SymbolConstants_8.DEF_PARAM)
                    throw syntaxError_1.default("name '" + name + "' is local and global", this.fileName, ste.lineno);
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
        SymbolTable.prototype.analyze = function () {
            var free = {};
            var global = {};
            this.analyzeBlock(this.top, null, free, global);
        };
        return SymbolTable;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = SymbolTable;
});

define('pytools/symtable',["require", "exports", './SymbolTable', './SymbolConstants'], function (require, exports, SymbolTable_1, SymbolConstants_1) {
    "use strict";
    /**
     * @methdod symbolTable
     * @param {Object} ast
     * @param {string} fileName
     * @return {SymbolTable}
     */
    function symbolTable(ast, fileName) {
        var st = new SymbolTable_1.default(fileName);
        st.enterBlock("top", SymbolConstants_1.ModuleBlock, ast, 0);
        st.top = st.cur;
        // This is a good place to fump the AST for debugging.
        for (var i = 0; i < ast.body.length; ++i) {
            st.visitStmt(ast.body[i]);
        }
        st.exitBlock();
        st.analyze();
        return st;
    }
    exports.symbolTable = symbolTable;
    /**
     * @method dumpSymbolTable
     * @param st {SymbolTable}
     * @return {string}
     */
    function dumpSymbolTable(st) {
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
    }
    exports.dumpSymbolTable = dumpSymbolTable;
    ;
});

define('pytools/toStringLiteralJS',["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * FIXME: Argument should be declared as string but not allowed by TypeScript compiler.
     */
    function default_1(value) {
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
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    ;
});

define('py-to-sk/sk-compiler',["require", "exports", '../pytools/asserts', '../pytools/parser', '../pytools/builder', '../pytools/reservedNames', '../pytools/reservedWords', '../pytools/symtable', '../pytools/toStringLiteralJS', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants'], function (require, exports, asserts_1, parser_1, builder_1, reservedNames_1, reservedWords_1, symtable_1, toStringLiteralJS_1, types_1, types_2, types_3, types_4, types_5, types_6, types_7, types_8, types_9, types_10, types_11, types_12, types_13, types_14, types_15, types_16, types_17, types_18, types_19, types_20, types_21, types_22, types_23, types_24, types_25, types_26, types_27, types_28, types_29, types_30, types_31, types_32, types_33, types_34, types_35, types_36, types_37, types_38, types_39, types_40, types_41, types_42, types_43, types_44, types_45, types_46, types_47, types_48, types_49, types_50, types_51, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6) {
    "use strict";
    var OP_FAST = 0;
    var OP_GLOBAL = 1;
    var OP_DEREF = 2;
    var OP_NAME = 3;
    // const D_NAMES = 0;
    // const D_FREEVARS = 1;
    // const D_CELLVARS = 2;
    /**
     * The output function is scoped at the module level so that it is available without being a parameter.
     * @param {...*} x
     */
    var out;
    /**
     * We keep track of how many time gensym method on the Compiler is called because ... ?
     */
    var gensymCount = 0;
    /**
     * FIXME: CompilerUnit is coupled to this module by the out variable.
     */
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
            // The 'arguments' object cannot be referenced in an arrow function in ES3 and ES5.
            // That's why we use a standard function expression.
            var self = this;
            out = function () {
                var b = self.blocks[self.curblock];
                for (var i = 0; i < arguments.length; ++i)
                    b.push(arguments[i]);
            };
        };
        return CompilerUnit;
    }());
    var Compiler = (function () {
        /**
         * @constructor
         * @param fileName {string}
         * @param st {SymbolTable}
         * @param flags {number}
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
            hint += gensymCount++;
            return hint;
        };
        Compiler.prototype.niceName = function (roughName) {
            return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
        };
        /**
         * @method _gr
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
            if (e.ctx === types_43.Store) {
                for (var i = 0; i < e.elts.length; ++i) {
                    this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
                }
            }
            else if (e.ctx === types_33.Load) {
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
            // var target = this.vexpr(l.target, nexti);
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
            asserts_1.assert(e instanceof types_32.ListComp);
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
            asserts_1.assert(s instanceof types_42.Slice);
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
                case types_29.Index:
                    subs = this.vexpr(s.value);
                    break;
                case types_42.Slice:
                    subs = this.cslice(s);
                    break;
                case types_18.Ellipsis:
                case types_20.ExtSlice:
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
            if (ctx === types_33.Load || ctx === types_6.AugLoad)
                return this._gr('lsubscr', "Sk.abstr.objectGetItem(", obj, ",", subs, ")");
            else if (ctx === types_43.Store || ctx === types_7.AugStore)
                out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
            else if (ctx === types_15.Del)
                out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
            else
                asserts_1.fail("handlesubscr fail");
        };
        Compiler.prototype.cboolop = function (e) {
            asserts_1.assert(e instanceof types_9.BoolOp);
            var jtype;
            if (e.op === types_1.And)
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
            // this.annotateSource(e);
            switch (e.constructor) {
                case types_9.BoolOp:
                    return this.cboolop(e);
                case types_8.BinOp:
                    return this._gr('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
                case types_49.UnaryOp:
                    return this._gr('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
                case types_30.Lambda:
                    return this.clambda(e);
                case types_26.IfExp:
                    return this.cifexp(e);
                case types_17.Dict:
                    return this.cdict(e);
                case types_32.ListComp:
                    return this.clistcomp(e);
                case types_23.GeneratorExp:
                    return this.cgenexp(e);
                case types_51.Yield:
                    return this.cyield(e);
                case types_13.Compare:
                    return this.ccompare(e);
                case types_11.Call:
                    var result = this.ccall(e);
                    // After the function call, we've returned to this line
                    this.annotateSource(e);
                    return result;
                case types_36.Num:
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
                case types_44.Str:
                    {
                        return this._gr('str', 'Sk.builtin.stringToPy(', toStringLiteralJS_1.default(e.s), ')');
                    }
                case types_4.Attribute:
                    var val;
                    if (e.ctx !== types_7.AugStore)
                        val = this.vexpr(e.value);
                    var mangled = toStringLiteralJS_1.default(e.attr);
                    mangled = mangled.substring(1, mangled.length - 1);
                    mangled = mangleName(this.u.private_, mangled);
                    mangled = fixReservedWords(mangled);
                    mangled = fixReservedNames(mangled);
                    switch (e.ctx) {
                        case types_6.AugLoad:
                        case types_33.Load:
                            return this._gr("lattr", "Sk.abstr.gattr(", val, ",'", mangled, "')");
                        case types_7.AugStore:
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            out("}");
                            break;
                        case types_43.Store:
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            break;
                        case types_15.Del:
                            asserts_1.fail("todo;");
                            break;
                        case types_37.Param:
                        default:
                            asserts_1.fail("invalid attribute expression");
                    }
                    break;
                case types_45.Subscript:
                    switch (e.ctx) {
                        case types_6.AugLoad:
                        case types_33.Load:
                        case types_43.Store:
                        case types_15.Del:
                            return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                        case types_7.AugStore: {
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            var val_1 = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            this.vslice(e.slice, e.ctx, val_1, data);
                            out("}");
                            break;
                        }
                        case types_37.Param:
                        default:
                            asserts_1.fail("invalid subscript expression");
                    }
                    break;
                case types_35.Name:
                    return this.nameop(e.id, e.ctx, data);
                case types_31.List:
                    return this.ctupleorlist(e, data, 'list');
                case types_48.Tuple:
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
            asserts_1.assert(s instanceof types_5.AugAssign);
            var e = s.target;
            switch (e.constructor) {
                case types_4.Attribute: {
                    var auge = new types_4.Attribute(e.value, e.attr, types_6.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = types_7.AugStore;
                    return this.vexpr(auge, res, e.value);
                }
                case types_45.Subscript: {
                    // Only compile the subscript value once
                    var augsub = this.vslicesub(e.slice);
                    var auge = new types_45.Subscript(e.value, augsub, types_6.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = types_7.AugStore;
                    return this.vexpr(auge, res, e.value);
                }
                case types_35.Name: {
                    var to = this.nameop(e.id, types_33.Load);
                    var val = this.vexpr(s.value);
                    var res = this._gr('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
                    return this.nameop(e.id, types_43.Store, res);
                }
                default:
                    asserts_1.fail("unhandled case in augassign");
            }
        };
        /**
         * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
         */
        Compiler.prototype.exprConstant = function (e) {
            switch (e.constructor) {
                case types_36.Num:
                    asserts_1.fail("Trying to call the runtime for Num");
                    // return Sk.misceval.isTrue(e.n);
                    break;
                case types_44.Str:
                    asserts_1.fail("Trying to call the runtime for Str");
                    // return Sk.misceval.isTrue(e.s);
                    break;
                case types_35.Name:
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
            // this.pushExceptBlock(eb);
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
            asserts_1.assert(s instanceof types_25.IfStatement);
            var constant = this.exprConstant(s.test);
            if (constant === 0) {
                if (s.alternate) {
                    this.vseqstmt(s.alternate);
                }
            }
            else if (constant === 1) {
                this.vseqstmt(s.consequent);
            }
            else {
                var end = this.newBlock('end of if');
                var next = this.newBlock('next branch of if');
                var test = this.vexpr(s.test);
                this._jumpfalse(test, next);
                this.vseqstmt(s.consequent);
                this._jump(end);
                this.setBlock(next);
                if (s.alternate) {
                    this.vseqstmt(s.alternate);
                }
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
            // var target = this.vexpr(s.target, nexti);
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
                    var next = (i === n - 1) ? unhandled : handlers[i + 1];
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
            return this.nameop(asname, types_43.Store, cur);
        };
        ;
        Compiler.prototype.cimport = function (s) {
            var n = s.names.length;
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                var mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS_1.default(alias.name), ',$gbl,$loc,[])');
                if (alias.asname) {
                    this.cimportas(alias.name, alias.asname, mod);
                }
                else {
                    var lastDot = alias.name.indexOf('.');
                    if (lastDot !== -1) {
                        this.nameop(alias.name.substr(0, lastDot), types_43.Store, mod);
                    }
                    else {
                        this.nameop(alias.name, types_43.Store, mod);
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
            var namesString = names.map(function (name) { return toStringLiteralJS_1.default(name); }).join(', ');
            var mod = this._gr('module', 'Sk.builtin.__import__(', toStringLiteralJS_1.default(s.module), ',$gbl,$loc,[', namesString, '])');
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                if (i === 0 && alias.name === "*") {
                    asserts_1.assert(n === 1);
                    out("Sk.importStar(", mod, ",$loc, $gbl);");
                    return;
                }
                var got = this._gr('item', 'Sk.abstr.gattr(', mod, ',', toStringLiteralJS_1.default(alias.name), ')');
                var storeName = alias.name;
                if (alias.asname)
                    storeName = alias.asname;
                this.nameop(storeName, types_43.Store, got);
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
                    funcArgs.push(this.nameop(args.args[i].id, types_37.Param));
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
                    var argname = this.nameop(args.args[i + offset].id, types_37.Param);
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
            asserts_1.assert(s instanceof types_22.FunctionDef);
            var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function (scopename) {
                this.vseqstmt(s.body);
                out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
            });
            this.nameop(s.name, types_43.Store, funcorgen);
        };
        Compiler.prototype.clambda = function (e) {
            asserts_1.assert(e instanceof types_30.Lambda);
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
            // var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
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
            // var target = this.vexpr(ge.target, nexti);
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
            asserts_1.assert(s instanceof types_12.ClassDef);
            // var decos = s.decorator_list;
            // decorators and bases need to be eval'd out here
            // this.vseqexpr(decos);
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
            var wrapped = this._gr('built', 'Sk.misceval.buildClass($gbl,', scopename, ',', toStringLiteralJS_1.default(s.name), ',[', bases, '])');
            // store our new class under the right name
            this.nameop(s.name, types_43.Store, wrapped);
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
                case types_22.FunctionDef:
                    this.cfunction(s);
                    break;
                case types_12.ClassDef:
                    this.cclass(s);
                    break;
                case types_41.ReturnStatement: {
                    if (this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                        throw new SyntaxError("'return' outside function");
                    if (s.value)
                        out("return ", this.vexpr(s.value), ";");
                    else
                        out("return null;");
                    break;
                }
                case types_16.DeleteExpression:
                    this.vseqexpr(s.targets);
                    break;
                case types_3.Assign:
                    var n = s.targets.length;
                    var val = this.vexpr(s.value);
                    for (var i = 0; i < n; ++i)
                        this.vexpr(s.targets[i], val);
                    break;
                case types_5.AugAssign:
                    return this.caugassign(s);
                case types_39.Print:
                    this.cprint(s);
                    break;
                case types_21.ForStatement:
                    return this.cfor(s);
                case types_50.WhileStatement:
                    return this.cwhile(s);
                case types_25.IfStatement:
                    return this.cif(s);
                case types_40.Raise:
                    return this.craise(s);
                case types_46.TryExcept:
                    return this.ctryexcept(s);
                case types_47.TryFinally:
                    return this.ctryfinally(s);
                case types_2.Assert:
                    return this.cassert(s);
                case types_27.ImportStatement:
                    return this.cimport(s);
                case types_28.ImportFrom:
                    return this.cfromimport(s);
                case types_24.Global:
                    break;
                case types_19.Expr:
                    this.vexpr(s.value);
                    break;
                case types_38.Pass:
                    break;
                case types_10.BreakStatement:
                    if (this.u.breakBlocks.length === 0)
                        throw new SyntaxError("'break' outside loop");
                    this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
                    break;
                case types_14.ContinueStatement:
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
            if ((ctx === types_43.Store || ctx === types_7.AugStore || ctx === types_15.Del) && name === "__debug__") {
                throw new SyntaxError("can not assign to __debug__");
            }
            if ((ctx === types_43.Store || ctx === types_7.AugStore || ctx === types_15.Del) && name === "None") {
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
            // print("mangled", mangled);
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
                        case types_33.Load:
                        case types_37.Param:
                            // Need to check that it is bound!
                            out("if (typeof ", mangled, " === 'undefined') { throw new Error('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                            return mangled;
                        case types_43.Store:
                            out(mangled, "=", dataToStore, ";");
                            break;
                        case types_15.Del:
                            out("delete ", mangled, ";");
                            break;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_NAME:
                    switch (ctx) {
                        case types_33.Load:
                            var v = this.gensym('loadname');
                            // can't be || for loc.x = 0 or null
                            out("var ", v, "=(typeof ", mangled, " !== 'undefined') ? ", mangled, ":Sk.misceval.loadname('", mangledNoPre, "',$gbl);");
                            return v;
                        case types_43.Store:
                            out(mangled, "=", dataToStore, ";");
                            break;
                        case types_15.Del:
                            out("delete ", mangled, ";");
                            break;
                        case types_37.Param:
                            return mangled;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_GLOBAL:
                    switch (ctx) {
                        case types_33.Load:
                            return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                        case types_43.Store:
                            out("$gbl.", mangledNoPre, "=", dataToStore, ';');
                            break;
                        case types_15.Del:
                            out("delete $gbl.", mangledNoPre);
                            break;
                        default:
                            asserts_1.fail("unhandled case in name op_global");
                    }
                    break;
                case OP_DEREF:
                    switch (ctx) {
                        case types_33.Load:
                            return dict + "." + mangledNoPre;
                        case types_43.Store:
                            out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                            break;
                        case types_37.Param:
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
            asserts_1.assert(s instanceof types_39.Print);
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
                case types_34.Module:
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
    /**
     * Appends "_$rw$" to any word that is in the list of reserved words.
     */
    function fixReservedWords(word) {
        if (reservedWords_1.default[word] !== true) {
            return word;
        }
        return word + "_$rw$";
    }
    /**
     * Appends "_$rn$" to any name that is in the list of reserved names.
     */
    function fixReservedNames(name) {
        if (reservedNames_1.default[name])
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
    /**
     * @param {string} source the code
     * @param {string} fileName where it came from
     *
     * @return {{funcname: string, code: string}}
     */
    function compile(source, fileName) {
        var cst = parser_1.parse(fileName, source);
        var ast = builder_1.astFromParse(cst, fileName);
        var st = symtable_1.symbolTable(ast, fileName);
        var c = new Compiler(fileName, st, 0, source);
        return { 'funcname': c.cmod(ast), 'code': c.result.join('') };
    }
    exports.compile = compile;
    ;
    function resetCompiler() {
        gensymCount = 0;
    }
    exports.resetCompiler = resetCompiler;
    ;
});

define('py-to-es/ts-compiler',["require", "exports", '../pytools/asserts', '../pytools/base', '../pytools/parser', '../pytools/builder', '../pytools/reservedNames', '../pytools/reservedWords', '../pytools/symtable', '../pytools/toStringLiteralJS', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/types', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants', '../pytools/SymbolConstants'], function (require, exports, asserts_1, base_1, parser_1, builder_1, reservedNames_1, reservedWords_1, symtable_1, toStringLiteralJS_1, types_1, types_2, types_3, types_4, types_5, types_6, types_7, types_8, types_9, types_10, types_11, types_12, types_13, types_14, types_15, types_16, types_17, types_18, types_19, types_20, types_21, types_22, types_23, types_24, types_25, types_26, types_27, types_28, types_29, types_30, types_31, types_32, types_33, types_34, types_35, types_36, types_37, types_38, types_39, types_40, types_41, types_42, types_43, types_44, types_45, types_46, types_47, types_48, types_49, types_50, SymbolConstants_1, SymbolConstants_2, SymbolConstants_3, SymbolConstants_4, SymbolConstants_5, SymbolConstants_6) {
    "use strict";
    var OP_FAST = 0;
    var OP_GLOBAL = 1;
    var OP_DEREF = 2;
    var OP_NAME = 3;
    // const D_NAMES = 0;
    // const D_FREEVARS = 1;
    // const D_CELLVARS = 2;
    var Precedence = {
        Sequence: 0,
        Yield: 1,
        Await: 1,
        Assignment: 1,
        Conditional: 2,
        ArrowFunction: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        BitwiseOR: 5,
        BitwiseXOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        TaggedTemplate: 17,
        Member: 18,
        Primary: 19
    };
    // Flags
    var F_ALLOW_IN = 1;
    var F_ALLOW_CALL = 1 << 1;
    var F_ALLOW_UNPARATH_NEW = 1 << 2;
    // const F_FUNC_BODY = 1 << 3;
    // const F_DIRECTIVE_CTX = 1 << 4;
    var F_SEMICOLON_OPT = 1 << 5;
    // Expression flag sets
    // NOTE: Flag order:
    // F_ALLOW_IN
    // F_ALLOW_CALL
    // F_ALLOW_UNPARATH_NEW
    // const E_FTT = F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
    // const E_TTF = F_ALLOW_IN | F_ALLOW_CALL;
    var E_TTT = F_ALLOW_IN | F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
    // const E_TFF = F_ALLOW_IN;
    // const E_FFT = F_ALLOW_UNPARATH_NEW;
    // const E_TFT = F_ALLOW_IN | F_ALLOW_UNPARATH_NEW;
    // Statement flag sets
    // NOTE: Flag order:
    // F_ALLOW_IN
    // F_FUNC_BODY
    // F_DIRECTIVE_CTX
    // F_SEMICOLON_OPT
    var S_TFFF = F_ALLOW_IN;
    // const S_TFFT = F_ALLOW_IN | F_SEMICOLON_OPT;
    // const S_FFFF = 0x00;
    // const S_TFTF = F_ALLOW_IN | F_DIRECTIVE_CTX;
    // const S_TTFF = F_ALLOW_IN | F_FUNC_BODY;
    /**
     * The output function is scoped at the module level so that it is available without being a parameter.
     * @param {...*} x
     */
    var out;
    /**
     * We keep track of how many time gensym method on the Compiler is called because ... ?
     */
    var gensymCount = 0;
    /**
     *
     */
    var base;
    /**
     *
     */
    var indent;
    /**
     *
     */
    var space;
    function updateDeeply(target, override) {
        var key, val;
        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }
        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    }
                    else {
                        target[key] = updateDeeply({}, val);
                    }
                }
                else {
                    target[key] = val;
                }
            }
        }
        return target;
    }
    /**
     * flatten an array to a string, where the array can contain
     * either strings or nested arrays
     */
    function flattenToString(arr) {
        var i, iz, elem, result = '';
        for (i = 0, iz = arr.length; i < iz; ++i) {
            elem = arr[i];
            result += base_1.isArray(elem) ? flattenToString(elem) : elem;
        }
        return result;
    }
    function withIndent(fn) {
        var previousBase = base;
        base += indent;
        fn(base);
        base = previousBase;
    }
    /**
     * FIXME: CompilerUnit is coupled to this module by the out variable.
     */
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
            // The 'arguments' object cannot be referenced in an arrow function in ES3 and ES5.
            // That's why we use a standard function expression.
            var self = this;
            out = function () {
                var b = self.blocks[self.curblock];
                for (var i = 0; i < arguments.length; ++i)
                    b.push(arguments[i]);
            };
        };
        return CompilerUnit;
    }());
    var Compiler = (function () {
        /**
         * @constructor
         * @param fileName {string}
         * @param st {SymbolTable}
         * @param flags {number}
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
                // const lineno = ast.lineno;
                var col_offset = ast.col_offset;
                // out('\n//');
                // out('\n// line ', lineno, ':');
                // out('\n// ', this.getSourceLine(lineno));
                //
                // out('\n// ');
                for (var i = 0; i < col_offset; ++i) {
                    out(" ");
                }
            }
        };
        Compiler.prototype.gensym = function (hint) {
            hint = hint || '';
            hint = '$' + hint;
            hint += gensymCount++;
            return hint;
        };
        Compiler.prototype.niceName = function (roughName) {
            return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
        };
        Compiler.prototype.emitArgs = function (arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, argA, argB, argC, argD, argE) {
            for (var i = 1; i < arguments.length; ++i) {
                out(arguments[i]);
            }
        };
        Compiler.prototype.ctupleorlist = function (e, data, tuporlist) {
            asserts_1.assert(tuporlist === 'tuple' || tuporlist === 'list');
            if (e.ctx === types_42.Store) {
                for (var i = 0; i < e.elts.length; ++i) {
                    this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
                }
            }
            else if (e.ctx === types_32.Load) {
                // const items = [];
                for (var i = 0; i < e.elts.length; ++i) {
                }
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
        };
        Compiler.prototype.clistcompgen = function (tmpname, generators, genIndex, elt) {
            var start = this.newBlock('list gen start');
            var skip = this.newBlock('list gen skip');
            var anchor = this.newBlock('list gen anchor');
            var l = generators[genIndex];
            // const toiter = this.vexpr(l.iter);
            this.setBlock(start);
            var n = l.ifs.length;
            for (var i = 0; i < n; ++i) {
            }
            if (++genIndex < generators.length) {
                this.clistcompgen(tmpname, generators, genIndex, elt);
            }
            if (genIndex >= generators.length) {
                var velt = this.vexpr(elt);
                out(tmpname, ".v.push(", velt, ");");
                this.setBlock(skip);
            }
            this.setBlock(anchor);
            return tmpname;
        };
        Compiler.prototype.clistcomp = function (e) {
            asserts_1.assert(e instanceof types_31.ListComp);
            // return this.clistcompgen(tmp, e.generators, 0, e.elt);
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
            for (var i = 0; i < n; ++i) {
                var rhs = this.vexpr(e.comparators[i]);
                cur = rhs;
            }
            this.setBlock(done);
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
                // const keywords = "[" + kwarray.join(",") + "]";
                var starargs = "undefined";
                var kwargs = "undefined";
                if (e.starargs) {
                    starargs = this.vexpr(e.starargs);
                }
                if (e.kwargs) {
                    kwargs = this.vexpr(e.kwargs);
                }
            }
            else {
                this.emitArgs(func, "(", args, ")");
            }
        };
        Compiler.prototype.cslice = function (s) {
            asserts_1.assert(s instanceof types_41.Slice);
            // const low = s.lower ? this.vexpr(s.lower) : 'null';
            // const high = s.upper ? this.vexpr(s.upper) : 'null';
            // const step = s.step ? this.vexpr(s.step) : 'null';
        };
        Compiler.prototype.vslicesub = function (s) {
            var subs;
            switch (s.constructor) {
                case Number:
                case String:
                    // Already compiled, should only happen for augmented assignments
                    subs = s;
                    break;
                case types_28.Index:
                    subs = this.vexpr(s.value);
                    break;
                case types_41.Slice:
                    subs = this.cslice(s);
                    break;
                case types_17.Ellipsis:
                case types_19.ExtSlice:
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
            if (ctx === types_32.Load || ctx === types_5.AugLoad) {
            }
            else if (ctx === types_42.Store || ctx === types_6.AugStore)
                out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
            else if (ctx === types_14.Del)
                out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
            else
                asserts_1.fail("handlesubscr fail");
        };
        Compiler.prototype.cboolop = function (e) {
            asserts_1.assert(e instanceof types_8.BoolOp);
            var end = this.newBlock('end of boolop');
            var s = e.values;
            var n = s.length;
            var retval;
            for (var i = 0; i < n; ++i) {
                var expres = this.vexpr(s[i]);
                if (i === 0) {
                }
                out(retval, " = ", expres, ";");
            }
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
            // this.annotateSource(e);
            switch (e.constructor) {
                case types_8.BoolOp:
                    return this.cboolop(e);
                case types_7.BinOp:
                    return this.emitArgs('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
                case types_48.UnaryOp:
                    return this.emitArgs('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
                case types_29.Lambda:
                    return this.clambda(e);
                case types_25.IfExp:
                    return this.cifexp(e);
                case types_16.Dict:
                    return this.cdict(e);
                case types_31.ListComp:
                    return this.clistcomp(e);
                case types_22.GeneratorExp:
                    return this.cgenexp(e);
                case types_50.Yield:
                    return this.cyield(e);
                case types_12.Compare:
                    return this.ccompare(e);
                case types_10.Call:
                    var result = this.ccall(e);
                    // After the function call, we've returned to this line
                    this.annotateSource(e);
                    return result;
                case types_35.Num: {
                    var num = e;
                    if (num.n.isFloat()) {
                        return num.n.value.toString();
                    }
                    else if (num.n.isInt()) {
                        return num.n.value.toString();
                    }
                    else if (e.n.isLong()) {
                        return "longFromString('" + e.n.text + "', " + e.n.radix + ")";
                    }
                    asserts_1.fail("unhandled Num type");
                }
                case types_43.Str: {
                    var str = e;
                    return toStringLiteralJS_1.default(str.s);
                }
                case types_3.Attribute:
                    var val;
                    if (e.ctx !== types_6.AugStore)
                        val = this.vexpr(e.value);
                    var mangled = toStringLiteralJS_1.default(e.attr);
                    mangled = mangled.substring(1, mangled.length - 1);
                    mangled = mangleName(this.u.private_, mangled);
                    mangled = fixReservedWords(mangled);
                    mangled = fixReservedNames(mangled);
                    switch (e.ctx) {
                        case types_5.AugLoad:
                        case types_32.Load:
                            return this.emitArgs("lattr", "Sk.abstr.gattr(", val, ",'", mangled, "')");
                        case types_6.AugStore:
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            out("}");
                            break;
                        case types_42.Store:
                            out("Sk.abstr.sattr(", val, ",'", mangled, "',", data, ");");
                            break;
                        case types_14.Del:
                            asserts_1.fail("todo;");
                            break;
                        case types_36.Param:
                        default:
                            asserts_1.fail("invalid attribute expression");
                    }
                    break;
                case types_44.Subscript:
                    switch (e.ctx) {
                        case types_5.AugLoad:
                        case types_32.Load:
                        case types_42.Store:
                        case types_14.Del:
                            return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                        case types_6.AugStore: {
                            out("if(typeof ", data, " !== 'undefined'){"); // special case to avoid re-store if inplace worked
                            var val_1 = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                            this.vslice(e.slice, e.ctx, val_1, data);
                            out("}");
                            break;
                        }
                        case types_36.Param:
                        default:
                            asserts_1.fail("invalid subscript expression");
                    }
                    break;
                case types_34.Name:
                    return this.nameop(e.id, e.ctx, data);
                case types_30.List:
                    return this.ctupleorlist(e, data, 'list');
                case types_47.Tuple:
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
            asserts_1.assert(s instanceof types_4.AugAssign);
            var e = s.target;
            switch (e.constructor) {
                case types_3.Attribute: {
                    var auge = new types_3.Attribute(e.value, e.attr, types_5.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this.emitArgs('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = types_6.AugStore;
                    return this.vexpr(auge, res, e.value);
                }
                case types_44.Subscript: {
                    // Only compile the subscript value once
                    var augsub = this.vslicesub(e.slice);
                    var auge = new types_44.Subscript(e.value, augsub, types_5.AugLoad, e.lineno, e.col_offset);
                    var aug = this.vexpr(auge);
                    var val = this.vexpr(s.value);
                    var res = this.emitArgs('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
                    auge.ctx = types_6.AugStore;
                    return this.vexpr(auge, res, e.value);
                }
                case types_34.Name: {
                    var to = this.nameop(e.id, types_32.Load);
                    var val = this.vexpr(s.value);
                    var res = this.emitArgs('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
                    return this.nameop(e.id, types_42.Store, res);
                }
                default:
                    asserts_1.fail("unhandled case in augassign");
            }
        };
        /**
         * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
         */
        Compiler.prototype.exprConstant = function (e) {
            switch (e.constructor) {
                case types_35.Num:
                    asserts_1.fail("Trying to call the runtime for Num");
                    // return Sk.misceval.isTrue(e.n);
                    break;
                case types_43.Str:
                    asserts_1.fail("Trying to call the runtime for Str");
                    // return Sk.misceval.isTrue(e.s);
                    break;
                case types_34.Name:
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
            // this.pushExceptBlock(eb);
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
                    // ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
                    ret += blocks[i].join('');
                }
                ret += unit.suffixCode;
            }
            return ret;
        };
        Compiler.prototype.generateExpression = function (expression, s, flags) {
            return "";
        };
        Compiler.prototype.generateStatements = function (statement, s, flags) {
            return "";
        };
        Compiler.prototype.maybeBlock = function (one, flags) {
            return "";
        };
        Compiler.prototype.maybeBlockSuffix = function (one, two) {
            return "";
        };
        Compiler.prototype.ifStatement = function (stmt, flags) {
            var _this = this;
            asserts_1.assert(stmt instanceof types_24.IfStatement);
            asserts_1.assert(base_1.isNumber(flags));
            var result;
            var bodyFlags;
            var semicolonOptional;
            withIndent(function () {
                result = [
                    'if' + space + '(',
                    _this.generateExpression(stmt.test, Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            semicolonOptional = !!(flags & F_SEMICOLON_OPT);
            bodyFlags = S_TFFF;
            if (semicolonOptional) {
                bodyFlags |= F_SEMICOLON_OPT;
            }
            if (stmt.alternate) {
                result.push(this.maybeBlock(stmt.consequent, S_TFFF));
                result = this.maybeBlockSuffix(stmt.consequent, result);
            }
            else {
                result.push(this.maybeBlock(stmt.consequent, bodyFlags));
            }
            return result;
        };
        Compiler.prototype.cwhile = function (s, flags) {
            var constant = this.exprConstant(s.test);
            if (constant === 0) {
                if (s.orelse)
                    this.vseqstmt(s.orelse, flags);
            }
            else {
                var top = this.newBlock('while test');
                this.setBlock(top);
                var next = this.newBlock('after while');
                var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
                var body = this.newBlock('while body');
                this.pushBreakBlock(next);
                this.pushContinueBlock(top);
                this.setBlock(body);
                this.vseqstmt(s.body, flags);
                this.popContinueBlock();
                this.popBreakBlock();
                if (s.orelse.length > 0) {
                    this.setBlock(orelse);
                    this.vseqstmt(s.orelse, flags);
                }
                this.setBlock(next);
            }
        };
        Compiler.prototype.cfor = function (s, flags) {
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
                iter = this.emitArgs("iter", "Sk.abstr.iter(", toiter, ")");
            this.setBlock(start);
            // load targets
            // var nexti = this.emitArgs('next', "Sk.abstr.iternext(", iter, ")");
            // var target = this.vexpr(s.target, nexti);
            // execute body
            this.vseqstmt(s.body, flags);
            this.setBlock(cleanup);
            this.popContinueBlock();
            this.popBreakBlock();
            this.vseqstmt(s.orelse, flags);
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
        Compiler.prototype.ctryexcept = function (s, flags) {
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
            this.vseqstmt(s.body, flags);
            this.endExcept();
            for (var i = 0; i < n; ++i) {
                this.setBlock(handlers[i]);
                var handler = s.handlers[i];
                if (!handler.type && i < n - 1) {
                    throw new SyntaxError("default 'except:' must be last");
                }
                if (handler.type) {
                }
                if (handler.name) {
                    this.vexpr(handler.name, "$err");
                }
                // Need to execute finally before leaving body if an exception is raised
                this.vseqstmt(handler.body, flags);
            }
            // If no except clause catches exception, throw it again
            this.setBlock(unhandled);
            // Should execute finally first
            out("throw $err;");
            this.setBlock(orelse);
            this.vseqstmt(s.orelse, flags);
            this.setBlock(end);
        };
        Compiler.prototype.ctryfinally = function (s, flags) {
            out("/*todo; tryfinally*/");
            // everything but the finally?
            this.ctryexcept(s.body[0], flags);
        };
        Compiler.prototype.cassert = function (s) {
            /* todo; warnings method
            if (s.test instanceof Tuple && s.test.elts.length > 0)
                Sk.warn("assertion is always true, perhaps remove parentheses?");
            */
            // var test = this.vexpr(s.test);
            var end = this.newBlock("end");
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
                    cur = this.emitArgs('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
                    src = src.substr(dotLoc + 1);
                }
            }
            return this.nameop(asname, types_42.Store, cur);
        };
        ;
        Compiler.prototype.cimport = function (s) {
            var n = s.names.length;
            for (var i = 0; i < n; ++i) {
                var alias = s.names[i];
                var mod = this.emitArgs('module', 'Sk.builtin.__import__(', toStringLiteralJS_1.default(alias.name), ',$gbl,$loc,[])');
                if (alias.asname) {
                    this.cimportas(alias.name, alias.asname, mod);
                }
                else {
                    var lastDot = alias.name.indexOf('../pytools');
                    if (lastDot !== -1) {
                        this.nameop(alias.name.substr(0, lastDot), types_42.Store, mod);
                    }
                    else {
                        this.nameop(alias.name, types_42.Store, mod);
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
            // const namesString = names.map(function(name) { return toStringLiteralJS(name); }).join(', ');
            for (var i_1 = 0; i_1 < n; ++i_1) {
                var alias = s.names[i_1];
                if (i_1 === 0 && alias.name === "*") {
                    asserts_1.assert(n === 1);
                    out("import * from " + toStringLiteralJS_1.default(s.module) + ";");
                    return;
                }
            }
        };
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
                    funcArgs.push(this.nameop(args.args[i].id, types_36.Param));
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
                    this.u.varDeclsCode += "$cell." + id + " = " + id + ";";
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
                    var argname = this.nameop(args.args[i + offset].id, types_36.Param);
                    this.u.varDeclsCode += "if(typeof " + argname + " === 'undefined')" + argname + " = " + scopename + ".$defaults[" + i + "];";
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
            // build either a 'function' or 'generator'../pytools the function is just a simple
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
                    return this.emitArgs("gener", "new Sk.builtins['function']((function(){var $origargs=Array.prototype.slice.call(arguments);Sk.builtin.pyCheckArgs(\"", coname, "\",arguments,", args.args.length - defaults.length, ",", args.args.length, ");return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");}))");
                }
                else {
                    return this.emitArgs("gener", "new Sk.builtins['function']((function(){Sk.builtin.pyCheckArgs(\"", coname, "\",arguments,0,0);return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");}))");
                }
            else {
                return this.emitArgs("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees, ")");
            }
        };
        Compiler.prototype.cfunction = function (s) {
            asserts_1.assert(s instanceof types_21.FunctionDef);
            var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function (scopename) {
                this.vseqstmt(s.body);
                out("return Sk.builtin.none.none$;"); // if we fall off the bottom, we want the ret to be None
            });
            this.nameop(s.name, types_42.Store, funcorgen);
        };
        Compiler.prototype.clambda = function (e) {
            asserts_1.assert(e instanceof types_29.Lambda);
            var func = this.buildcodeobj(e, "<lambda>", null, e.args, function (scopename) {
                var val = this.vexpr(e.body);
                out("return ", val, ";");
            });
            return func;
        };
        Compiler.prototype.cifexp = function (e) {
            var next = this.newBlock('next of ifexp');
            var end = this.newBlock('end of ifexp');
            var ret = this.emitArgs('res', 'null');
            // var test = this.vexpr(e.test);
            out(ret, '=', this.vexpr(e.body), ';');
            this.setBlock(next);
            out(ret, '=', this.vexpr(e.orelse), ';');
            this.setBlock(end);
            return ret;
        };
        Compiler.prototype.cgenexpgen = function (generators, genIndex, elt) {
            var start = this.newBlock('start for ' + genIndex);
            var skip = this.newBlock('skip for ' + genIndex);
            // var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
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
                out(iter, " = ", "Sk.abstr.iter(", toiter, ");");
            }
            this.setBlock(start);
            // load targets
            // var nexti = this.emitArgs('next', "Sk.abstr.iternext(", iter, ")");
            // var target = this.vexpr(ge.target, nexti);
            var n = ge.ifs.length;
            for (var i = 0; i < n; ++i) {
            }
            if (++genIndex < generators.length) {
                this.cgenexpgen(generators, genIndex, elt);
            }
            if (genIndex >= generators.length) {
                var velt = this.vexpr(elt);
                out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
                this.setBlock(skip);
            }
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
            var gener = this.emitArgs("gener", "Sk.misceval.callsim(", gen, ");");
            // stuff the outermost iterator into the generator after evaluating it
            // outside of the function. it's retrieved by the fixed name above.
            out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
            return gener;
        };
        Compiler.prototype.cclass = function (s, flags) {
            asserts_1.assert(s instanceof types_11.ClassDef);
            // var decos = s.decorator_list;
            // decorators and bases need to be eval'd out here
            // this.vseqexpr(decos);
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
            this.cbody(s.body, flags);
            out("break;");
            // build class
            // apply decorators
            this.exitScope();
            var wrapped = this.emitArgs('built', 'Sk.misceval.buildClass($gbl,', scopename, ',', toStringLiteralJS_1.default(s.name), ',[', bases, '])');
            // store our new class under the right name
            this.nameop(s.name, types_42.Store, wrapped);
        };
        Compiler.prototype.ccontinue = function (s) {
            if (this.u.continueBlocks.length === 0)
                throw new SyntaxError("'continue' outside loop");
        };
        /**
         * compiles a statement
         */
        Compiler.prototype.vstmt = function (s, flags) {
            this.u.lineno = s.lineno;
            this.u.linenoSet = false;
            this.annotateSource(s);
            switch (s.constructor) {
                case types_21.FunctionDef:
                    this.cfunction(s);
                    break;
                case types_11.ClassDef:
                    this.cclass(s, flags);
                    break;
                case types_40.ReturnStatement: {
                    var rs = s;
                    if (this.u.ste.blockType !== SymbolConstants_6.FunctionBlock)
                        throw new SyntaxError("'return' outside function");
                    if (rs.value)
                        out("return ", this.vexpr(rs.value), ";");
                    else
                        out("return null;");
                    break;
                }
                case types_15.DeleteExpression:
                    this.vseqexpr(s.targets);
                    break;
                case types_2.Assign: {
                    var assign = s;
                    var n = assign.targets.length;
                    var val = this.vexpr(assign.value);
                    for (var i = 0; i < n; ++i)
                        this.vexpr(assign.targets[i], val);
                    break;
                }
                case types_4.AugAssign: {
                    return this.caugassign(s);
                }
                case types_38.Print: {
                    this.cprint(s);
                    break;
                }
                case types_20.ForStatement: {
                    return this.cfor(s, flags);
                }
                case types_49.WhileStatement: {
                    return this.cwhile(s, flags);
                }
                case types_24.IfStatement: {
                    return this.ifStatement(s, flags);
                }
                case types_39.Raise: {
                    return this.craise(s);
                }
                case types_45.TryExcept: {
                    return this.ctryexcept(s, flags);
                }
                case types_46.TryFinally: {
                    return this.ctryfinally(s, flags);
                }
                case types_1.Assert: {
                    return this.cassert(s);
                }
                case types_26.ImportStatement:
                    return this.cimport(s);
                case types_27.ImportFrom:
                    return this.cfromimport(s);
                case types_23.Global:
                    break;
                case types_18.Expr:
                    this.vexpr(s.value);
                    break;
                case types_37.Pass:
                    break;
                case types_9.BreakStatement:
                    if (this.u.breakBlocks.length === 0)
                        throw new SyntaxError("'break' outside loop");
                    break;
                case types_13.ContinueStatement:
                    this.ccontinue(s);
                    break;
                default:
                    asserts_1.fail("unhandled case in vstmt");
            }
        };
        Compiler.prototype.vseqstmt = function (stmts, flags) {
            for (var i = 0; i < stmts.length; ++i)
                this.vstmt(stmts[i], flags);
        };
        Compiler.prototype.isCell = function (name) {
            var mangled = mangleName(this.u.private_, name);
            var scope = this.u.ste.getScope(mangled);
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
            if ((ctx === types_42.Store || ctx === types_6.AugStore || ctx === types_14.Del) && name === "__debug__") {
                throw new SyntaxError("can not assign to __debug__");
            }
            if ((ctx === types_42.Store || ctx === types_6.AugStore || ctx === types_14.Del) && name === "None") {
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
            // print("mangled", mangled);
            // TODO TODO TODO todo; import * at global scope failing here
            asserts_1.assert(scope || name.charAt(1) === '_');
            // in generator or at module scope, we need to store to $loc, rather that
            // to actual JS stack variables.
            var mangledNoPre = mangled;
            if (this.u.ste.generator || this.u.ste.blockType !== SymbolConstants_6.FunctionBlock) {
            }
            else if (optype === OP_FAST || optype === OP_NAME)
                this.u.localnames.push(mangled);
            switch (optype) {
                case OP_FAST:
                    switch (ctx) {
                        case types_32.Load:
                        case types_36.Param:
                            // Need to check that it is bound!
                            out("if (typeof ", mangled, " === 'undefined') { throw new Error('local variable \\\'", mangled, "\\\' referenced before assignment'); }\n");
                            return mangled;
                        case types_42.Store:
                            out(mangled, " = ", dataToStore, ";");
                            break;
                        case types_14.Del:
                            out("delete ", mangled, ";");
                            break;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_NAME:
                    switch (ctx) {
                        case types_32.Load:
                            out(mangledNoPre);
                            break;
                        case types_42.Store:
                            out(mangled, " = ", dataToStore, ";");
                            break;
                        case types_14.Del:
                            out("delete ", mangled, ";");
                            break;
                        case types_36.Param:
                            return mangled;
                        default:
                            asserts_1.fail("unhandled");
                    }
                    break;
                case OP_GLOBAL:
                    switch (ctx) {
                        case types_32.Load:
                            return mangledNoPre;
                        case types_42.Store:
                            out("$gbl.", mangledNoPre, " = ", dataToStore, ';');
                            break;
                        case types_14.Del:
                            out("delete $gbl.", mangledNoPre);
                            break;
                        default:
                            asserts_1.fail("unhandled case in name op_global");
                    }
                    break;
                case OP_DEREF:
                    switch (ctx) {
                        case types_32.Load:
                            return dict + "." + mangledNoPre;
                        case types_42.Store:
                            out(dict, ".", mangledNoPre, " = ", dataToStore, ";");
                            break;
                        case types_36.Param:
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
        /**
         *
         */
        Compiler.prototype.cbody = function (stmts, flags) {
            for (var i = 0; i < stmts.length; ++i) {
                this.vstmt(stmts[i], flags);
            }
        };
        Compiler.prototype.cprint = function (s) {
            asserts_1.assert(s instanceof types_38.Print);
            var dest = 'null';
            if (s.dest) {
                dest = this.vexpr(s.dest);
            }
            var n = s.values.length;
            for (var i = 0; i < n; ++i) {
            }
            if (s.nl) {
            }
        };
        Compiler.prototype.cmod = function (mod, flags) {
            var modf = this.enterScope("<module>", mod, 0);
            /* const entryBlock = */ this.newBlock('module entry');
            // this.u.prefixCode = "var " + modf + "=(function($modname){";
            // this.u.varDeclsCode = "var $blk=" + entryBlock + ",$exc=[],$gbl={},$loc=$gbl,$err;$gbl.__name__=$modname;Sk.globals=$gbl;";
            // this.u.switchCode = "try {while(true){try{switch($blk){";
            // this.u.suffixCode = "}}catch(err){if ($exc.length>0) {$err=err;$blk=$exc.pop();continue;} else {throw err;}}}}catch(err){if (err instanceof Sk.builtin.SystemExit && !Sk.throwSystemExit) { Sk.misceval.print_(err.toString() + '\\n'); return $loc; } else { throw err; } } });";
            switch (mod.constructor) {
                case types_33.Module:
                    this.cbody(mod.body, flags);
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
    /**
     * Appends "_$rw$" to any word that is in the list of reserved words.
     */
    function fixReservedWords(word) {
        if (reservedWords_1.default[word] !== true) {
            return word;
        }
        return word + "_$rw$";
    }
    /**
     * Appends "_$rn$" to any name that is in the list of reserved names.
     */
    function fixReservedNames(name) {
        if (reservedNames_1.default[name])
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
    /**
     * @param {string} source the code
     * @param {string} fileName where it came from
     *
     * @return {{funcname: string, code: string}}
     */
    function compile(source, fileName) {
        var cst = parser_1.parse(fileName, source);
        var ast = builder_1.astFromParse(cst, fileName);
        var st = symtable_1.symbolTable(ast, fileName);
        var c = new Compiler(fileName, st, 0, source);
        /**
         * flags are used to confition the code generation.
         */
        var flags = 0;
        // TODO: Get rif of the funcname
        return { funcname: c.cmod(ast, flags), code: c.result.join('') };
    }
    exports.compile = compile;
    ;
    function resetCompiler() {
        gensymCount = 0;
    }
    exports.resetCompiler = resetCompiler;
    ;
});

/*
  Copyright (C) 2015 David Holmes <david.geo.holmes@gmail.com>
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
define('estools/esprima',["require", "exports"], function (require, exports) {
    "use strict";
    var source;
    var strict;
    var index;
    var lineNumber;
    var lineStart;
    var length;
    var lookahead;
    var state;
    var extra;
    var Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9
    };
    var TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    // A function following one of those tokens is an expression.
    var FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
        'return', 'case', 'delete', 'throw', 'void',
        // assignment operators
        '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
        '&=', '|=', '^=', ',',
        // binary/unary operators
        '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
        '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
        '<=', '<', '>', '!=', '!=='];
    var Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };
    var PlaceHolders = {
        ArrowParameterPlaceHolder: {
            type: 'ArrowParameterPlaceHolder'
        }
    };
    var PropertyKind = {
        Data: 1,
        Get: 2,
        Set: 4
    };
    // Error messages should be identical to V8.
    var Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictDuplicateProperty: 'Duplicate data property in object literal not allowed in strict mode',
        AccessorDataProperty: 'Object literal may not have data and accessor property with the same name',
        AccessorGetSet: 'Object literal may not have multiple get/set accessors with the same name',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode'
    };
    // See also tools/generate-unicode-regex.py.
    var Regex = {
        NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
        NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
    };
    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.
    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }
    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39); // 0..9
    }
    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }
    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }
    // 7.2 White Space
    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }
    // 7.3 Line Terminators
    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }
    // 7.6 Identifier Names and Identifiers
    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||
            (ch >= 0x41 && ch <= 0x5A) ||
            (ch >= 0x61 && ch <= 0x7A) ||
            (ch === 0x5C) ||
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
    }
    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||
            (ch >= 0x41 && ch <= 0x5A) ||
            (ch >= 0x61 && ch <= 0x7A) ||
            (ch >= 0x30 && ch <= 0x39) ||
            (ch === 0x5C) ||
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
    }
    // 7.6.1.2 Future Reserved Words
    function isFutureReservedWord(id) {
        switch (id) {
            case 'class':
            case 'enum':
            case 'export':
            case 'extends':
            case 'import':
            case 'super':
                return true;
            default:
                return false;
        }
    }
    function isStrictModeReservedWord(id) {
        switch (id) {
            case 'implements':
            case 'interface':
            case 'package':
            case 'private':
            case 'protected':
            case 'public':
            case 'static':
            case 'yield':
            case 'let':
                return true;
            default:
                return false;
        }
    }
    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }
    // 7.6.1.1 Keywords
    function isKeyword(id) {
        if (strict && isStrictModeReservedWord(id)) {
            return true;
        }
        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatibility with SpiderMonkey and ES.next.
        // Some others are from future reserved words.
        switch (id.length) {
            case 2:
                return (id === 'if') || (id === 'in') || (id === 'do');
            case 3:
                return (id === 'var') || (id === 'for') || (id === 'new') ||
                    (id === 'try') || (id === 'let');
            case 4:
                return (id === 'this') || (id === 'else') || (id === 'case') ||
                    (id === 'void') || (id === 'with') || (id === 'enum');
            case 5:
                return (id === 'while') || (id === 'break') || (id === 'catch') ||
                    (id === 'throw') || (id === 'const') || (id === 'yield') ||
                    (id === 'class') || (id === 'super');
            case 6:
                return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                    (id === 'switch') || (id === 'export') || (id === 'import');
            case 7:
                return (id === 'default') || (id === 'finally') || (id === 'extends');
            case 8:
                return (id === 'function') || (id === 'continue') || (id === 'debugger');
            case 10:
                return (id === 'instanceof');
            default:
                return false;
        }
    }
    // 7.4 Comments
    function addComment(type, value, start, end, loc) {
        var comment;
        assert(typeof start === 'number', 'Comment must have valid position');
        // Because the way the actual token is scanned, often the comments
        // (if any) are skipped twice during the lexical analysis.
        // Thus, we need to skip adding a comment if the comment array already
        // handled it.
        if (state.lastCommentStart >= start) {
            return;
        }
        state.lastCommentStart = start;
        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }
    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;
        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };
        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }
        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }
    function skipMultiLineComment() {
        var start, loc, ch, comment;
        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }
        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                ++index;
                lineStart = index;
                if (index >= length) {
                    throwUnexpectedToken();
                }
            }
            else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            }
            else {
                ++index;
            }
        }
        throwUnexpectedToken();
    }
    function skipComment() {
        var ch, start;
        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);
            if (isWhiteSpace(ch)) {
                ++index;
            }
            else if (isLineTerminator(ch)) {
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            }
            else if (ch === 0x2F) {
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                }
                else if (ch === 0x2A) {
                    ++index;
                    ++index;
                    skipMultiLineComment();
                }
                else {
                    break;
                }
            }
            else if (start && ch === 0x2D) {
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                }
                else {
                    break;
                }
            }
            else if (ch === 0x3C) {
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
    }
    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;
        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            }
            else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }
    function scanUnicodeCodePointEscape() {
        var ch, code, cu1, cu2;
        ch = source[index];
        code = 0;
        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }
        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }
        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }
        // UTF-16 Encoding
        if (code <= 0xFFFF) {
            return String.fromCharCode(code);
        }
        cu1 = ((code - 0x10000) >> 10) + 0xD800;
        cu2 = ((code - 0x10000) & 1023) + 0xDC00;
        return String.fromCharCode(cu1, cu2);
    }
    function getEscapedIdentifier() {
        var ch, id;
        ch = source.charCodeAt(index++);
        id = String.fromCharCode(ch);
        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (ch === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            ch = scanHexEscape('u');
            if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
                throwUnexpectedToken();
            }
            id = ch;
        }
        while (index < length) {
            ch = source.charCodeAt(index);
            if (!isIdentifierPart(ch)) {
                break;
            }
            ++index;
            id += String.fromCharCode(ch);
            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (ch === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                ch = scanHexEscape('u');
                if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                    throwUnexpectedToken();
                }
                id += ch;
            }
        }
        return id;
    }
    function getIdentifier() {
        var start, ch;
        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getEscapedIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            }
            else {
                break;
            }
        }
        return source.slice(start, index);
    }
    function scanIdentifier() {
        var start, id, type;
        start = index;
        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();
        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        }
        else if (isKeyword(id)) {
            type = Token.Keyword;
        }
        else if (id === 'null') {
            type = Token.NullLiteral;
        }
        else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        }
        else {
            type = Token.Identifier;
        }
        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }
    // 7.7 Punctuators
    function scanPunctuator() {
        var start = index, code = source.charCodeAt(index), code2, ch1 = source[index], ch2, ch3, ch4;
        switch (code) {
            // Check for most common single-character punctuators.
            case 0x2E: // . dot
            case 0x28: // ( open bracket
            case 0x29: // ) close bracket
            case 0x3B: // ; semicolon
            case 0x2C: // , comma
            case 0x7B: // { open curly brace
            case 0x7D: // } close curly brace
            case 0x5B: // [
            case 0x5D: // ]
            case 0x3A: // :
            case 0x3F: // ?
            case 0x7E:
                ++index;
                if (extra.tokenize) {
                    if (code === 0x28) {
                        extra.openParenToken = extra.tokens.length;
                    }
                    else if (code === 0x7B) {
                        extra.openCurlyToken = extra.tokens.length;
                    }
                }
                return {
                    type: Token.Punctuator,
                    value: String.fromCharCode(code),
                    lineNumber: lineNumber,
                    lineStart: lineStart,
                    start: start,
                    end: index
                };
            default:
                code2 = source.charCodeAt(index + 1);
                // '=' (U+003D) marks an assignment or comparison operator.
                if (code2 === 0x3D) {
                    switch (code) {
                        case 0x2B: // +
                        case 0x2D: // -
                        case 0x2F: // /
                        case 0x3C: // <
                        case 0x3E: // >
                        case 0x5E: // ^
                        case 0x7C: // |
                        case 0x25: // %
                        case 0x26: // &
                        case 0x2A:
                            index += 2;
                            return {
                                type: Token.Punctuator,
                                value: String.fromCharCode(code) + String.fromCharCode(code2),
                                lineNumber: lineNumber,
                                lineStart: lineStart,
                                start: start,
                                end: index
                            };
                        case 0x21: // !
                        case 0x3D:
                            index += 2;
                            // !== and ===
                            if (source.charCodeAt(index) === 0x3D) {
                                ++index;
                            }
                            return {
                                type: Token.Punctuator,
                                value: source.slice(start, index),
                                lineNumber: lineNumber,
                                lineStart: lineStart,
                                start: start,
                                end: index
                            };
                    }
                }
        }
        // 4-character punctuator: >>>=
        ch4 = source.substr(index, 4);
        if (ch4 === '>>>=') {
            index += 4;
            return {
                type: Token.Punctuator,
                value: ch4,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }
        // 3-character punctuators: === !== >>> <<= >>=
        ch3 = ch4.substr(0, 3);
        if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
            index += 3;
            return {
                type: Token.Punctuator,
                value: ch3,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }
        // Other 2-character punctuators: ++ -- << >> && ||
        ch2 = ch3.substr(0, 2);
        if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
            index += 2;
            return {
                type: Token.Punctuator,
                value: ch2,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }
        // 1-character punctuators: < > = ! + - * % & | ^ /
        if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
            ++index;
            return {
                type: Token.Punctuator,
                value: ch1,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }
        throwUnexpectedToken();
    }
    // 7.8.3 Numeric Literals
    function scanHexLiteral(start) {
        var number = '';
        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }
        if (number.length === 0) {
            throwUnexpectedToken();
        }
        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }
        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }
    function scanBinaryLiteral(start) {
        var ch, number;
        number = '';
        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }
        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }
        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }
        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }
    function scanOctalLiteral(prefix, start) {
        var number, octal;
        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        }
        else {
            octal = false;
            ++index;
            number = '';
        }
        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }
        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }
        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }
        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }
    function isImplicitOctalLiteral() {
        var i, ch;
        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }
        return true;
    }
    function scanNumericLiteral() {
        var number, start, ch;
        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'), 'Numeric literal must start with a decimal digit or a decimal point');
        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];
            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }
                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }
        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }
        if (ch === 'e' || ch === 'E') {
            number += source[index++];
            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            }
            else {
                throwUnexpectedToken();
            }
        }
        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }
        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }
    // 7.8.4 String Literals
    function scanStringLiteral() {
        var str = '', quote, start, ch, code, unescaped, restore, octal = false, startLineNumber, startLineStart;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        quote = source[index];
        assert((quote === '\'' || quote === '"'), 'String literal must starts with a quote');
        start = index;
        ++index;
        while (index < length) {
            ch = source[index++];
            if (ch === quote) {
                quote = '';
                break;
            }
            else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                        case 'u':
                        case 'x':
                            if (source[index] === '{') {
                                ++index;
                                str += scanUnicodeCodePointEscape();
                            }
                            else {
                                restore = index;
                                unescaped = scanHexEscape(ch);
                                if (unescaped) {
                                    str += unescaped;
                                }
                                else {
                                    index = restore;
                                    str += ch;
                                }
                            }
                            break;
                        case 'n':
                            str += '\n';
                            break;
                        case 'r':
                            str += '\r';
                            break;
                        case 't':
                            str += '\t';
                            break;
                        case 'b':
                            str += '\b';
                            break;
                        case 'f':
                            str += '\f';
                            break;
                        case 'v':
                            str += '\x0B';
                            break;
                        default:
                            if (isOctalDigit(ch)) {
                                code = '01234567'.indexOf(ch);
                                // \0 is not octal escape sequence
                                if (code !== 0) {
                                    octal = true;
                                }
                                if (index < length && isOctalDigit(source[index])) {
                                    octal = true;
                                    code = code * 8 + '01234567'.indexOf(source[index++]);
                                    // 3 digits are only allowed when string starts
                                    // with 0, 1, 2, 3
                                    if ('0123'.indexOf(ch) >= 0 &&
                                        index < length &&
                                        isOctalDigit(source[index])) {
                                        code = code * 8 + '01234567'.indexOf(source[index++]);
                                    }
                                }
                                str += String.fromCharCode(code);
                            }
                            else {
                                str += ch;
                            }
                            break;
                    }
                }
                else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            }
            else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            }
            else {
                str += ch;
            }
        }
        if (quote !== '') {
            throwUnexpectedToken();
        }
        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            startLineNumber: startLineNumber,
            startLineStart: startLineStart,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }
    function testRegExp(pattern, flags) {
        var tmp = pattern, value;
        if (flags.indexOf('u') >= 0) {
            // Replace each astral symbol and every Unicode code point
            // escape sequence with a single ASCII symbol to avoid throwing on
            // regular expressions that are only valid in combination with the
            // `/u` flag.
            // Note: replacing with the ASCII symbol `x` might cause false
            // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
            // perfectly valid pattern that is equivalent to `[a-b]`, but it
            // would be replaced by `[x-b]` which throws an error.
            tmp = tmp
                .replace(/\\u\{([0-9a-fA-F]+)\}/g, function ($0, $1) {
                if (parseInt($1, 16) <= 0x10FFFF) {
                    return 'x';
                }
                throwError(Messages.InvalidRegExp);
            })
                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
        }
        // First, detect invalid regular expressions.
        try {
            value = new RegExp(tmp);
        }
        catch (e) {
            throwError(Messages.InvalidRegExp);
        }
        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        }
        catch (exception) {
            return null;
        }
    }
    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;
        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];
        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwError(Messages.UnterminatedRegExp);
                }
                str += ch;
            }
            else if (isLineTerminator(ch.charCodeAt(0))) {
                throwError(Messages.UnterminatedRegExp);
            }
            else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            }
            else {
                if (ch === '/') {
                    terminated = true;
                    break;
                }
                else if (ch === '[') {
                    classMarker = true;
                }
            }
        }
        if (!terminated) {
            throwError(Messages.UnterminatedRegExp);
        }
        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }
    function scanRegExpFlags() {
        var ch, str, flags, restore;
        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }
            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    }
                    else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                }
                else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            }
            else {
                flags += ch;
                str += ch;
            }
        }
        return {
            value: flags,
            literal: str
        };
    }
    function scanRegExp() {
        var start, body, flags, value;
        lookahead = null;
        skipComment();
        start = index;
        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }
        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }
    function collectRegex() {
        var pos, loc, regex, token;
        skipComment();
        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };
        regex = scanRegExp();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };
        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }
            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }
        return regex;
    }
    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }
    function advanceSlash() {
        var prevToken, checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ']') {
                return scanPunctuator();
            }
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                    checkToken.type === 'Keyword' &&
                    (checkToken.value === 'if' ||
                        checkToken.value === 'while' ||
                        checkToken.value === 'for' ||
                        checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                    extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                }
                else if (extra.tokens[extra.openCurlyToken - 4] &&
                    extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                }
                else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
            return collectRegex();
        }
        return scanPunctuator();
    }
    function advance() {
        var ch;
        skipComment();
        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }
        ch = source.charCodeAt(index);
        if (isIdentifierStart(ch)) {
            return scanIdentifier();
        }
        // Very common: ( and ) and ;
        if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
            return scanPunctuator();
        }
        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (ch === 0x27 || ch === 0x22) {
            return scanStringLiteral();
        }
        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (ch === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }
        if (isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }
        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && ch === 0x2F) {
            return advanceSlash();
        }
        return scanPunctuator();
    }
    function collectToken() {
        var loc, token, value, entry;
        skipComment();
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };
        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };
        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            extra.tokens.push(entry);
        }
        return token;
    }
    function lex() {
        var token;
        token = lookahead;
        index = token.end;
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;
        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        index = token.end;
        lineNumber = token.lineNumber;
        lineStart = token.lineStart;
        return token;
    }
    function peek() {
        var pos, line, start;
        pos = index;
        line = lineNumber;
        start = lineStart;
        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        index = pos;
        lineNumber = line;
        lineStart = start;
    }
    var Position = (function () {
        function Position() {
            this.line = lineNumber;
            this.column = index - lineStart;
        }
        return Position;
    }());
    exports.Position = Position;
    var SourceLocation = (function () {
        function SourceLocation() {
            this.start = new Position();
            this.end = null;
        }
        return SourceLocation;
    }());
    exports.SourceLocation = SourceLocation;
    var WrappingSourceLocation = (function () {
        function WrappingSourceLocation(startToken) {
            if (startToken.type === Token.StringLiteral) {
                this.start = {
                    line: startToken.startLineNumber,
                    column: startToken.start - startToken.startLineStart
                };
            }
            else {
                this.start = {
                    line: startToken.lineNumber,
                    column: startToken.start - startToken.lineStart
                };
            }
            this.end = null;
        }
        return WrappingSourceLocation;
    }());
    exports.WrappingSourceLocation = WrappingSourceLocation;
    var Node = (function () {
        function Node() {
            // Skip comment.
            index = lookahead.start;
            if (lookahead.type === Token.StringLiteral) {
                lineNumber = lookahead.startLineNumber;
                lineStart = lookahead.startLineStart;
            }
            else {
                lineNumber = lookahead.lineNumber;
                lineStart = lookahead.lineStart;
            }
            if (extra.range) {
                this.range = [index, 0];
            }
            if (extra.loc) {
                this.loc = new SourceLocation();
            }
        }
        Node.prototype.processComment = function () {
            var lastChild, leadingComments, trailingComments, bottomRight = extra.bottomRightStack, i, comment, last = bottomRight[bottomRight.length - 1];
            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }
            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            }
            else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }
            // Eating the stack.
            if (last) {
                while (last && last.range[0] >= this.range[0]) {
                    lastChild = last;
                    last = bottomRight.pop();
                }
            }
            if (lastChild) {
                if (lastChild.leadingComments && lastChild.leadingComments[lastChild.leadingComments.length - 1].range[1] <= this.range[0]) {
                    this.leadingComments = lastChild.leadingComments;
                    lastChild.leadingComments = undefined;
                }
            }
            else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }
            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }
            bottomRight.push(this);
        };
        Node.prototype.finish = function () {
            if (extra.range) {
                this.range[1] = index;
            }
            if (extra.loc) {
                this.loc.end = new Position();
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }
            if (extra.attachComment) {
                this.processComment();
            }
        };
        Node.prototype.finishArrayExpression = function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        };
        Node.prototype.finishArrowFunctionExpression = function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.rest = null;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        };
        Node.prototype.finishAssignmentExpression = function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        };
        Node.prototype.finishBinaryExpression = function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        };
        Node.prototype.finishBlockStatement = function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        };
        Node.prototype.finishBreakStatement = function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        };
        Node.prototype.finishCallExpression = function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        };
        Node.prototype.finishCatchClause = function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        };
        Node.prototype.finishConditionalExpression = function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        };
        Node.prototype.finishContinueStatement = function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        };
        Node.prototype.finishDebuggerStatement = function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        };
        Node.prototype.finishDoWhileStatement = function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        };
        Node.prototype.finishEmptyStatement = function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        };
        Node.prototype.finishExpressionStatement = function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        };
        Node.prototype.finishForStatement = function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        };
        Node.prototype.finishForInStatement = function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        };
        Node.prototype.finishFunctionDeclaration = function (id, params, defaults, body) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.rest = null;
            this.generator = false;
            this.expression = false;
            this.finish();
            return this;
        };
        Node.prototype.finishFunctionExpression = function (id, params, defaults, body) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.rest = null;
            this.generator = false;
            this.expression = false;
            this.finish();
            return this;
        };
        Node.prototype.finishIdentifier = function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        };
        Node.prototype.finishIfStatement = function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        };
        Node.prototype.finishLabeledStatement = function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        };
        Node.prototype.finishLiteral = function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        };
        Node.prototype.finishMemberExpression = function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        };
        Node.prototype.finishNewExpression = function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        };
        Node.prototype.finishObjectExpression = function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        };
        Node.prototype.finishPostfixExpression = function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        };
        Node.prototype.finishProgram = function (body) {
            this.type = Syntax.Program;
            this.body = body;
            this.finish();
            return this;
        };
        Node.prototype.finishProperty = function (kind, key, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        };
        Node.prototype.finishReturnStatement = function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        };
        Node.prototype.finishSequenceExpression = function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        };
        Node.prototype.finishSwitchCase = function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        };
        Node.prototype.finishSwitchStatement = function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        };
        Node.prototype.finishThisExpression = function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        };
        Node.prototype.finishThrowStatement = function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        };
        Node.prototype.finishTryStatement = function (block, guardedHandlers, handlers, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = guardedHandlers;
            this.handlers = handlers;
            this.finalizer = finalizer;
            this.finish();
            return this;
        };
        Node.prototype.finishUnaryExpression = function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        };
        Node.prototype.finishVariableDeclaration = function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        };
        Node.prototype.finishVariableDeclarator = function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        };
        Node.prototype.finishWhileStatement = function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        };
        Node.prototype.finishWithStatement = function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        };
        return Node;
    }());
    exports.Node = Node;
    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }
    WrappingNode.prototype = Node.prototype;
    // Return true if there is a line terminator before the next token.
    function peekLineTerminator() {
        var pos, line, start, found;
        pos = index;
        line = lineNumber;
        start = lineStart;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;
        lineStart = start;
        return found;
    }
    function createError(line, pos, description) {
        var error = new Error('Line ' + line + ': ' + description);
        var e = error;
        e.index = pos;
        e.lineNumber = line;
        e.column = pos - lineStart + 1;
        e.description = description;
        return error;
    }
    // Throw an exception
    function throwError(messageFormat, arg2, agr3) {
        var args, msg;
        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        });
        throw createError(lineNumber, index, msg);
    }
    function tolerateError(messageFormat) {
        var args, msg, error;
        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        });
        error = createError(lineNumber, index, msg);
        if (extra.errors) {
            extra.errors.push(error);
        }
        else {
            throw error;
        }
    }
    // Throw an exception because of the token.
    function unexpectedTokenError(token, message) {
        var msg = Messages.UnexpectedToken;
        if (token) {
            msg = message ? message :
                (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                        (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                            (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                                Messages.UnexpectedToken;
            if (token.type === Token.Keyword) {
                if (isFutureReservedWord(token.value)) {
                    msg = Messages.UnexpectedReserved;
                }
                else if (strict && isStrictModeReservedWord(token.value)) {
                    msg = Messages.StrictReservedWord;
                }
            }
        }
        msg = msg.replace('%0', token ? token.value : 'ILLEGAL');
        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(lineNumber, index, msg);
    }
    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }
    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            extra.errors.push(error);
        }
        else {
            throw error;
        }
    }
    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.
    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }
    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;
        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            }
            else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            }
            else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        }
        else {
            expect(',');
        }
    }
    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.
    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }
    // Return true if the next token matches the specified punctuator.
    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }
    // Return true if the next token matches the specified keyword
    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }
    // Return true if the next token is an assignment operator
    function matchAssign() {
        var op;
        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }
    function consumeSemicolon() {
        var line, oldIndex = index, oldLineNumber = lineNumber, oldLineStart = lineStart, oldLookahead = lookahead;
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(index) === 0x3B || match(';')) {
            lex();
            return;
        }
        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            index = oldIndex;
            lineNumber = oldLineNumber;
            lineStart = oldLineStart;
            lookahead = oldLookahead;
            return;
        }
        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }
    // Return true if provided expression is LeftHandSideExpression
    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier || expr.type === Syntax.MemberExpression;
    }
    // 11.1.4 Array Initialiser
    function parseArrayInitialiser() {
        var elements = [], node = new Node();
        expect('[');
        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            }
            else {
                elements.push(parseAssignmentExpression());
                if (!match(']')) {
                    expect(',');
                }
            }
        }
        lex();
        return node.finishArrayExpression(elements);
    }
    // 11.1.5 Object Initialiser
    function parsePropertyFunction(param, first) {
        var previousStrict, body, node = new Node();
        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (first && strict && isRestrictedWord(param[0].name)) {
            tolerateUnexpectedToken(first, Messages.StrictParamName);
        }
        strict = previousStrict;
        return node.finishFunctionExpression(null, param, [], body);
    }
    function parsePropertyMethodFunction() {
        var previousStrict, param, method;
        previousStrict = strict;
        strict = true;
        param = parseParams();
        method = parsePropertyFunction(param.params);
        strict = previousStrict;
        return method;
    }
    function parseObjectPropertyKey() {
        var token, node = new Node();
        token = lex();
        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.
        if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        }
        return node.finishIdentifier(token.value);
    }
    function parseObjectProperty() {
        var token, key, id, value, param, node = new Node();
        token = lookahead;
        if (token.type === Token.Identifier) {
            id = parseObjectPropertyKey();
            // Property Assignment: Getter and Setter.
            if (token.value === 'get' && !(match(':') || match('('))) {
                key = parseObjectPropertyKey();
                expect('(');
                expect(')');
                value = parsePropertyFunction([]);
                return node.finishProperty('get', key, value, false, false);
            }
            if (token.value === 'set' && !(match(':') || match('('))) {
                key = parseObjectPropertyKey();
                expect('(');
                token = lookahead;
                if (token.type !== Token.Identifier) {
                    expect(')');
                    tolerateUnexpectedToken(token);
                    value = parsePropertyFunction([]);
                }
                else {
                    param = [parseVariableIdentifier()];
                    expect(')');
                    value = parsePropertyFunction(param, token);
                }
                return node.finishProperty('set', key, value, false, false);
            }
            if (match(':')) {
                lex();
                value = parseAssignmentExpression();
                return node.finishProperty('init', id, value, false, false);
            }
            if (match('(')) {
                value = parsePropertyMethodFunction();
                return node.finishProperty('init', id, value, true, false);
            }
            value = id;
            return node.finishProperty('init', id, value, false, true);
        }
        if (token.type === Token.EOF || token.type === Token.Punctuator) {
            throwUnexpectedToken(token);
        }
        else {
            key = parseObjectPropertyKey();
            if (match(':')) {
                lex();
                value = parseAssignmentExpression();
                return node.finishProperty('init', key, value, false, false);
            }
            if (match('(')) {
                value = parsePropertyMethodFunction();
                return node.finishProperty('init', key, value, true, false);
            }
            throwUnexpectedToken(lex());
        }
    }
    function parseObjectInitialiser() {
        var properties = [], property, name, key, kind, map = {}, toString = String, node = new Node();
        expect('{');
        while (!match('}')) {
            property = parseObjectProperty();
            if (property.key.type === Syntax.Identifier) {
                name = property.key.name;
            }
            else {
                name = toString(property.key.value);
            }
            kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;
            key = '$' + name;
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                if (map[key] === PropertyKind.Data) {
                    if (strict && kind === PropertyKind.Data) {
                        tolerateError(Messages.StrictDuplicateProperty);
                    }
                    else if (kind !== PropertyKind.Data) {
                        tolerateError(Messages.AccessorDataProperty);
                    }
                }
                else {
                    if (kind === PropertyKind.Data) {
                        tolerateError(Messages.AccessorDataProperty);
                    }
                    else if (map[key] & kind) {
                        tolerateError(Messages.AccessorGetSet);
                    }
                }
                map[key] |= kind;
            }
            else {
                map[key] = kind;
            }
            properties.push(property);
            if (!match('}')) {
                expectCommaSeparator();
            }
        }
        expect('}');
        return node.finishObjectExpression(properties);
    }
    // 11.1.6 The Grouping Operator
    function parseGroupExpression() {
        var expr;
        expect('(');
        if (match(')')) {
            lex();
            return PlaceHolders.ArrowParameterPlaceHolder;
        }
        ++state.parenthesisCount;
        expr = parseExpression();
        expect(')');
        return expr;
    }
    // 11.1 Primary Expressions
    function parsePrimaryExpression() {
        var type, token, expr, node;
        if (match('(')) {
            return parseGroupExpression();
        }
        if (match('[')) {
            return parseArrayInitialiser();
        }
        if (match('{')) {
            return parseObjectInitialiser();
        }
        type = lookahead.type;
        node = new Node();
        if (type === Token.Identifier) {
            expr = node.finishIdentifier(lex().value);
        }
        else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        }
        else if (type === Token.Keyword) {
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                expr = node.finishThisExpression();
            }
            else {
                throwUnexpectedToken(lex());
            }
        }
        else if (type === Token.BooleanLiteral) {
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        }
        else if (type === Token.NullLiteral) {
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        }
        else if (match('/') || match('/=')) {
            if (typeof extra.tokens !== 'undefined') {
                expr = node.finishLiteral(collectRegex());
            }
            else {
                expr = node.finishLiteral(scanRegExp());
            }
            peek();
        }
        else {
            throwUnexpectedToken(lex());
        }
        return expr;
    }
    // 11.2 Left-Hand-Side Expressions
    function parseArguments() {
        var args = [];
        expect('(');
        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }
        expect(')');
        return args;
    }
    function parseNonComputedProperty() {
        var token, node = new Node();
        token = lex();
        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }
        return node.finishIdentifier(token.value);
    }
    function parseNonComputedMember() {
        expect('.');
        return parseNonComputedProperty();
    }
    function parseComputedMember() {
        var expr;
        expect('[');
        expr = parseExpression();
        expect(']');
        return expr;
    }
    function parseNewExpression() {
        var callee, args, node = new Node();
        expectKeyword('new');
        callee = parseLeftHandSideExpression();
        args = match('(') ? parseArguments() : [];
        return node.finishNewExpression(callee, args);
    }
    function parseLeftHandSideExpressionAllowCall() {
        var expr, args, property, startToken, previousAllowIn = state.allowIn;
        startToken = lookahead;
        state.allowIn = true;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
        for (;;) {
            if (match('.')) {
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            }
            else if (match('(')) {
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            }
            else if (match('[')) {
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            }
            else {
                break;
            }
        }
        state.allowIn = previousAllowIn;
        return expr;
    }
    function parseLeftHandSideExpression() {
        var expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');
        startToken = lookahead;
        expr = matchKeyword('new') ? parseNewExpression() : parsePrimaryExpression();
        for (;;) {
            if (match('[')) {
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            }
            else if (match('.')) {
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            }
            else {
                break;
            }
        }
        return expr;
    }
    // 11.3 Postfix Expressions
    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;
        expr = parseLeftHandSideExpressionAllowCall();
        if (lookahead.type === Token.Punctuator) {
            if ((match('++') || match('--')) && !peekLineTerminator()) {
                // 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }
                if (!isLeftHandSide(expr)) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }
                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }
        return expr;
    }
    // 11.4 Unary Operators
    function parseUnaryExpression() {
        var token, expr, startToken;
        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        }
        else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            // 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }
            if (!isLeftHandSide(expr)) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
        }
        else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
        }
        else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = parseUnaryExpression();
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
        }
        else {
            expr = parsePostfixExpression();
        }
        return expr;
    }
    function binaryPrecedence(token, allowIn) {
        var prec = 0;
        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }
        switch (token.value) {
            case '||':
                prec = 1;
                break;
            case '&&':
                prec = 2;
                break;
            case '&':
                prec = 3;
                break;
            case '==':
            case '!=':
            case '===':
            case '!==':
                prec = 4;
                break;
            case '<':
            case '>':
            case '<=':
            case '>=':
            case 'instanceof':
                prec = 5;
                break;
            case 'in':
                prec = allowIn ? 6 : 0;
                break;
            case '>>>':
                prec = 7;
                break;
            case '+':
            case '-':
                prec = 8;
                break;
            case '*':
            case '/':
                prec = 9;
                break;
            case '^':
                prec = 10;
                break;
            case '|':
                prec = 11;
                break;
            case '%':
            case '<<':
            case '>>':
                prec = 12;
                break;
            default:
                break;
        }
        return prec;
    }
    // 11.5 Multiplicative Operators
    // 11.6 Additive Operators
    // 11.7 Bitwise Shift Operators
    // 11.8 Relational Operators
    // 11.9 Equality Operators
    // 11.10 Binary Bitwise Operators
    // 11.11 Binary Logical Operators
    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;
        marker = lookahead;
        left = parseUnaryExpression();
        if (left === PlaceHolders.ArrowParameterPlaceHolder) {
            return left;
        }
        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        token.prec = prec;
        lex();
        markers = [marker, lookahead];
        right = parseUnaryExpression();
        stack = [left, token, right];
        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {
            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }
            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = parseUnaryExpression();
            stack.push(expr);
        }
        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }
        return expr;
    }
    // 11.12 Conditional Operator
    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;
        startToken = lookahead;
        expr = parseBinaryExpression();
        if (expr === PlaceHolders.ArrowParameterPlaceHolder) {
            return expr;
        }
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = parseAssignmentExpression();
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = parseAssignmentExpression();
            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
        }
        return expr;
    }
    // [ES6] 14.2 Arrow Function
    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return parseAssignmentExpression();
    }
    function reinterpretAsCoverFormalsList(expressions) {
        var i, len, param, params, defaults, defaultCount, options, rest, token;
        params = [];
        defaults = [];
        defaultCount = 0;
        rest = null;
        options = {
            paramSet: {}
        };
        for (i = 0, len = expressions.length; i < len; i += 1) {
            param = expressions[i];
            if (param.type === Syntax.Identifier) {
                params.push(param);
                defaults.push(null);
                validateParam(options, param, param.name);
            }
            else if (param.type === Syntax.AssignmentExpression) {
                params.push(param.left);
                defaults.push(param.right);
                ++defaultCount;
                validateParam(options, param.left, param.left.name);
            }
            else {
                return null;
            }
        }
        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }
        if (defaultCount === 0) {
            defaults = [];
        }
        return {
            params: params,
            defaults: defaults,
            rest: rest,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }
    function parseArrowFunctionExpression(options, node) {
        var previousStrict, body;
        expect('=>');
        previousStrict = strict;
        body = parseConciseBody();
        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }
        strict = previousStrict;
        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }
    // 11.13 Assignment Operators
    function parseAssignmentExpression() {
        var oldParenthesisCount, token, expr, right, list, startToken;
        oldParenthesisCount = state.parenthesisCount;
        startToken = lookahead;
        token = lookahead;
        expr = parseConditionalExpression();
        if (expr === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            if (state.parenthesisCount === oldParenthesisCount ||
                state.parenthesisCount === (oldParenthesisCount + 1)) {
                if (expr.type === Syntax.Identifier) {
                    list = reinterpretAsCoverFormalsList([expr]);
                }
                else if (expr.type === Syntax.AssignmentExpression) {
                    list = reinterpretAsCoverFormalsList([expr]);
                }
                else if (expr.type === Syntax.SequenceExpression) {
                    list = reinterpretAsCoverFormalsList(expr.expressions);
                }
                else if (expr === PlaceHolders.ArrowParameterPlaceHolder) {
                    list = reinterpretAsCoverFormalsList([]);
                }
                if (list) {
                    return parseArrowFunctionExpression(list, new WrappingNode(startToken));
                }
            }
        }
        if (matchAssign()) {
            // LeftHandSideExpression
            if (!isLeftHandSide(expr)) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            // 11.13.1
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
            }
            token = lex();
            right = parseAssignmentExpression();
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
        }
        return expr;
    }
    // 11.14 Comma Operator
    function parseExpression() {
        var expr, startToken = lookahead, expressions;
        expr = parseAssignmentExpression();
        if (match(',')) {
            expressions = [expr];
            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(parseAssignmentExpression());
            }
            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }
        return expr;
    }
    // 12.1 Block
    function parseStatementList() {
        var list = [], statement;
        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }
        return list;
    }
    function parseBlock() {
        var block, node = new Node();
        expect('{');
        block = parseStatementList();
        expect('}');
        return node.finishBlockStatement(block);
    }
    // 12.2 Variable Statement
    function parseVariableIdentifier() {
        var token, node = new Node();
        token = lex();
        if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            }
            else {
                throwUnexpectedToken(token);
            }
        }
        return node.finishIdentifier(token.value);
    }
    function parseVariableDeclaration(kind) {
        var init = null, id, node = new Node();
        id = parseVariableIdentifier();
        // 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }
        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        }
        else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }
        return node.finishVariableDeclarator(id, init);
    }
    function parseVariableDeclarationList(kind) {
        var list = [];
        do {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        } while (index < length);
        return list;
    }
    function parseVariableStatement(node) {
        var declarations;
        expectKeyword('var');
        declarations = parseVariableDeclarationList();
        consumeSemicolon();
        return node.finishVariableDeclaration(declarations, 'var');
    }
    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations, node = new Node();
        expectKeyword(kind);
        declarations = parseVariableDeclarationList(kind);
        consumeSemicolon();
        return node.finishVariableDeclaration(declarations, kind);
    }
    // 12.3 Empty Statement
    function parseEmptyStatement(ignore) {
        var node = new Node();
        expect(';');
        return node.finishEmptyStatement();
    }
    // 12.4 Expression Statement
    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }
    // 12.5 If statement
    function parseIfStatement(node) {
        var test, consequent, alternate;
        expectKeyword('if');
        expect('(');
        test = parseExpression();
        expect(')');
        consequent = parseStatement();
        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        }
        else {
            alternate = null;
        }
        return node.finishIfStatement(test, consequent, alternate);
    }
    // 12.6 Iteration Statements
    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;
        expectKeyword('do');
        oldInIteration = state.inIteration;
        state.inIteration = true;
        body = parseStatement();
        state.inIteration = oldInIteration;
        expectKeyword('while');
        expect('(');
        test = parseExpression();
        expect(')');
        if (match(';')) {
            lex();
        }
        return node.finishDoWhileStatement(body, test);
    }
    function parseWhileStatement(node) {
        var test, body, oldInIteration;
        expectKeyword('while');
        expect('(');
        test = parseExpression();
        expect(')');
        oldInIteration = state.inIteration;
        state.inIteration = true;
        body = parseStatement();
        state.inIteration = oldInIteration;
        return node.finishWhileStatement(test, body);
    }
    function parseForVariableDeclaration() {
        var token, declarations, node = new Node();
        token = lex();
        declarations = parseVariableDeclarationList();
        return node.finishVariableDeclaration(declarations, token.value);
    }
    function parseForStatement(node) {
        var init, test, update, left, right, body, oldInIteration, previousAllowIn = state.allowIn;
        init = test = update = null;
        expectKeyword('for');
        expect('(');
        if (match(';')) {
            lex();
        }
        else {
            if (matchKeyword('var') || matchKeyword('let')) {
                state.allowIn = false;
                init = parseForVariableDeclaration();
                state.allowIn = previousAllowIn;
                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }
            else {
                state.allowIn = false;
                init = parseExpression();
                state.allowIn = previousAllowIn;
                if (matchKeyword('in')) {
                    // LeftHandSideExpression
                    if (!isLeftHandSide(init)) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                }
            }
            if (typeof left === 'undefined') {
                expect(';');
            }
        }
        if (typeof left === 'undefined') {
            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');
            if (!match(')')) {
                update = parseExpression();
            }
        }
        expect(')');
        oldInIteration = state.inIteration;
        state.inIteration = true;
        body = parseStatement();
        state.inIteration = oldInIteration;
        return (typeof left === 'undefined') ?
            node.finishForStatement(init, test, update, body) :
            node.finishForInStatement(left, right, body);
    }
    // 12.7 The continue statement
    function parseContinueStatement(node) {
        var label = null, key;
        expectKeyword('continue');
        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(index) === 0x3B) {
            lex();
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }
            return node.finishContinueStatement(null);
        }
        if (peekLineTerminator()) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }
            return node.finishContinueStatement(null);
        }
        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();
            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }
        consumeSemicolon();
        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }
        return node.finishContinueStatement(label);
    }
    // 12.8 The break statement
    function parseBreakStatement(node) {
        var label = null, key;
        expectKeyword('break');
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(index) === 0x3B) {
            lex();
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }
            return node.finishBreakStatement(null);
        }
        if (peekLineTerminator()) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }
            return node.finishBreakStatement(null);
        }
        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();
            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }
        consumeSemicolon();
        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }
        return node.finishBreakStatement(label);
    }
    // 12.9 The return statement
    function parseReturnStatement(node) {
        var argument = null;
        expectKeyword('return');
        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }
        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(index) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(index + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }
        if (peekLineTerminator()) {
            return node.finishReturnStatement(null);
        }
        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }
        consumeSemicolon();
        return node.finishReturnStatement(argument);
    }
    // 12.10 The with statement
    function parseWithStatement(node) {
        var object, body;
        if (strict) {
            // TODO(ikarienator): Should we update the test cases instead?
            skipComment();
            tolerateError(Messages.StrictModeWith);
        }
        expectKeyword('with');
        expect('(');
        object = parseExpression();
        expect(')');
        body = parseStatement();
        return node.finishWithStatement(object, body);
    }
    // 12.10 The swith statement
    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();
        if (matchKeyword('default')) {
            lex();
            test = null;
        }
        else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');
        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            consequent.push(statement);
        }
        return node.finishSwitchCase(test, consequent);
    }
    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;
        expectKeyword('switch');
        expect('(');
        discriminant = parseExpression();
        expect(')');
        expect('{');
        cases = [];
        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }
        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;
        while (index < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }
        state.inSwitch = oldInSwitch;
        expect('}');
        return node.finishSwitchStatement(discriminant, cases);
    }
    // 12.13 The throw statement
    function parseThrowStatement(node) {
        var argument;
        expectKeyword('throw');
        if (peekLineTerminator()) {
            throwError(Messages.NewlineAfterThrow);
        }
        argument = parseExpression();
        consumeSemicolon();
        return node.finishThrowStatement(argument);
    }
    // 12.14 The try statement
    function parseCatchClause() {
        var param, body, node = new Node();
        expectKeyword('catch');
        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }
        param = parseVariableIdentifier();
        // 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }
        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }
    function parseTryStatement(node) {
        var block, handlers = [], finalizer = null;
        expectKeyword('try');
        block = parseBlock();
        if (matchKeyword('catch')) {
            handlers.push(parseCatchClause());
        }
        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }
        if (handlers.length === 0 && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }
        return node.finishTryStatement(block, [], handlers, finalizer);
    }
    // 12.15 The debugger statement
    function parseDebuggerStatement(node) {
        expectKeyword('debugger');
        consumeSemicolon();
        return node.finishDebuggerStatement();
    }
    // 12 Statements
    function parseStatement() {
        var type = lookahead.type, expr, labeledBody, key, node;
        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }
        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        node = new Node();
        if (type === Token.Punctuator) {
            switch (lookahead.value) {
                case ';':
                    return parseEmptyStatement(node);
                case '(':
                    return parseExpressionStatement(node);
                default:
                    break;
            }
        }
        else if (type === Token.Keyword) {
            switch (lookahead.value) {
                case 'break':
                    return parseBreakStatement(node);
                case 'continue':
                    return parseContinueStatement(node);
                case 'debugger':
                    return parseDebuggerStatement(node);
                case 'do':
                    return parseDoWhileStatement(node);
                case 'for':
                    return parseForStatement(node);
                case 'function':
                    return parseFunctionDeclaration(node);
                case 'if':
                    return parseIfStatement(node);
                case 'return':
                    return parseReturnStatement(node);
                case 'switch':
                    return parseSwitchStatement(node);
                case 'throw':
                    return parseThrowStatement(node);
                case 'try':
                    return parseTryStatement(node);
                case 'var':
                    return parseVariableStatement(node);
                case 'while':
                    return parseWhileStatement(node);
                case 'with':
                    return parseWithStatement(node);
                default:
                    break;
            }
        }
        expr = parseExpression();
        // 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();
            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }
            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }
    // 13 Function Definition
    function parseFunctionSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted, oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesisCount, node = new Node();
        expect('{');
        while (index < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;
            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            }
            else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }
        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesisCount = state.parenthesizedCount;
        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;
        while (index < length) {
            if (match('}')) {
                break;
            }
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        expect('}');
        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesisCount;
        return node.finishBlockStatement(sourceElements);
    }
    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            }
            else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            }
            else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }
    function parseParam(options) {
        var token, param, def;
        token = lookahead;
        param = parseVariableIdentifier();
        validateParam(options, token, token.value);
        if (match('=')) {
            lex();
            def = parseAssignmentExpression();
            ++options.defaultCount;
        }
        options.params.push(param);
        options.defaults.push(def);
        return !match(')');
    }
    function parseParams(firstRestricted) {
        var options;
        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };
        expect('(');
        if (!match(')')) {
            options.paramSet = {};
            while (index < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }
        expect(')');
        if (options.defaultCount === 0) {
            options.defaults = [];
        }
        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }
    function parseFunctionDeclaration(ignore) {
        var id, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict, node = new Node();
        expectKeyword('function');
        token = lookahead;
        id = parseVariableIdentifier();
        if (strict) {
            if (isRestrictedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictFunctionName);
            }
        }
        else {
            if (isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            }
            else if (isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }
        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        return node.finishFunctionDeclaration(id, params, defaults, body);
    }
    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp, params = [], defaults = [], body, previousStrict, node = new Node();
        expectKeyword('function');
        if (!match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            }
            else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                }
                else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }
        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        return node.finishFunctionExpression(id, params, defaults, body);
    }
    // 14 Program
    function parseSourceElement() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
                case 'const':
                case 'let':
                    return parseConstLetDeclaration(lookahead.value);
                case 'function':
                    return parseFunctionDeclaration();
                default:
                    return parseStatement();
            }
        }
        if (lookahead.type !== Token.EOF) {
            return parseStatement();
        }
    }
    function parseSourceElements() {
        var sourceElement, sourceElements = [], token, directive, firstRestricted;
        while (index < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }
            sourceElement = parseSourceElement();
            sourceElements.push(sourceElement);
            if (sourceElement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            }
            else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }
        while (index < length) {
            sourceElement = parseSourceElement();
            /* istanbul ignore if */
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }
    function parseProgram() {
        var body, node;
        skipComment();
        peek();
        node = new Node();
        strict = false;
        body = parseSourceElements();
        return node.finishProgram(body);
    }
    function filterTokenLocation() {
        var i, entry, token, tokens = [];
        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }
        extra.tokens = tokens;
    }
    function tokenize(code, options) {
        var tokens;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };
        extra = {};
        // Options matching.
        options = options || {};
        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;
        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;
        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }
        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }
            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                }
                catch (lexError) {
                    if (extra.errors) {
                        extra.errors.push(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    }
                    else {
                        throw lexError;
                    }
                }
            }
            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        }
        catch (e) {
            throw e;
        }
        finally {
            extra = {};
        }
        return tokens;
    }
    exports.tokenize = tokenize;
    function parse(code, options) {
        var program;
        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            labelSet: {},
            parenthesisCount: 0,
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1
        };
        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;
            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = String(options.source);
            }
            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
        }
        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        }
        catch (e) {
            throw e;
        }
        finally {
            extra = {};
        }
        return program;
    }
    exports.parse = parse;
    // Deep copy.
    /* istanbul ignore next */
    exports.esprimaSyntax = (function () {
        var name, types = {};
        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }
        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }
        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }
        return types;
    }());
});

/*
  Copyright (C) 2015 David Holmes <david.geo.holmes@gmail.com>
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
define('estools/code',["require", "exports"], function (require, exports) {
    'use strict';
    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;
    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };
    ES6Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };
    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39; // 0..9
    }
    exports.isDecimalDigit = isDecimalDigit;
    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||
            0x61 <= ch && ch <= 0x66 ||
            0x41 <= ch && ch <= 0x46; // A..F
    }
    exports.isHexDigit = isHexDigit;
    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37; // 0..7
    }
    exports.isOctalDigit = isOctalDigit;
    // 7.2 White Space
    NON_ASCII_WHITESPACES = [
        0x1680, 0x180E,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];
    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }
    exports.isWhiteSpace = isWhiteSpace;
    // 7.3 Line Terminators
    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }
    exports.isLineTerminator = isLineTerminator;
    // 7.6 Identifier Names and Identifiers
    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) {
            return String.fromCharCode(cp);
        }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }
    IDENTIFIER_START = new Array(0x80);
    for (ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||
                ch >= 0x41 && ch <= 0x5A ||
                ch === 0x24 || ch === 0x5F; // $ (dollar) and _ (underscore)
    }
    IDENTIFIER_PART = new Array(0x80);
    for (ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||
                ch >= 0x41 && ch <= 0x5A ||
                ch >= 0x30 && ch <= 0x39 ||
                ch === 0x24 || ch === 0x5F; // $ (dollar) and _ (underscore)
    }
    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }
    exports.isIdentifierStartES5 = isIdentifierStartES5;
    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }
    exports.isIdentifierPartES5 = isIdentifierPartES5;
    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }
    exports.isIdentifierStartES6 = isIdentifierStartES6;
    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }
    exports.isIdentifierPartES6 = isIdentifierPartES6;
});

define('estools/estraverse',["require", "exports"], function (require, exports) {
    /*
      Copyright (C) 2015 David Holmes <david.geo.holmes@gmail.com>
      Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
      Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
    
      Redistribution and use in source and binary forms, with or without
      modification, are permitted provided that the following conditions are met:
    
        * Redistributions of source code must retain the above copyright
          notice, this list of conditions and the following disclaimer.
        * Redistributions in binary form must reproduce the above copyright
          notice, this list of conditions and the following disclaimer in the
          documentation and/or other materials provided with the distribution.
    
      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
      ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
      DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
      (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
      LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
      ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
      (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
      THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    */
    /*jslint vars:false, bitwise:true*/
    /*jshint indent:4*/
    /*global exports:true*/
    'use strict';
    var isArray, VisitorOption, VisitorKeys, objectCreate, objectKeys, BREAK, SKIP, REMOVE;
    var worklist;
    function ignoreJSHintError(what) {
        // No problem!
    }
    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }
    function deepCopy(obj) {
        var ret = {}, key, val;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                }
                else {
                    ret[key] = val;
                }
            }
        }
        return ret;
    }
    function shallowCopy(obj) {
        var ret = {}, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    ignoreJSHintError(shallowCopy);
    // based on LLVM libc++ upper_bound / lower_bound
    // MIT License
    function upperBound(array, func) {
        var diff, len, i, current;
        len = array.length;
        i = 0;
        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                len = diff;
            }
            else {
                i = current + 1;
                len -= diff + 1;
            }
        }
        return i;
    }
    function lowerBound(array, func) {
        var diff, len, i, current;
        len = array.length;
        i = 0;
        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                i = current + 1;
                len -= diff + 1;
            }
            else {
                len = diff;
            }
        }
        return i;
    }
    ignoreJSHintError(lowerBound);
    objectCreate = Object.create || (function () {
        function F() {
            // OK?
        }
        return function (o) {
            F.prototype = o;
            return new F();
        };
    })();
    objectKeys = Object.keys || function (o) {
        var keys = [], key;
        for (key in o) {
            if (o.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    };
    function extend(to, from) {
        var keys = objectKeys(from), key, i, len;
        for (i = 0, len = keys.length; i < len; i += 1) {
            key = keys[i];
            to[key] = from[key];
        }
        return to;
    }
    exports.Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        AwaitExpression: 'AwaitExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ComprehensionBlock: 'ComprehensionBlock',
        ComprehensionExpression: 'ComprehensionExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DebuggerStatement: 'DebuggerStatement',
        DirectiveStatement: 'DirectiveStatement',
        DoWhileStatement: 'DoWhileStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportBatchSpecifier: 'ExportBatchSpecifier',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        GeneratorExpression: 'GeneratorExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MethodDefinition: 'MethodDefinition',
        ModuleSpecifier: 'ModuleSpecifier',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        SuperExpression: 'SuperExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };
    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        AssignmentPattern: ['left', 'right'],
        ArrayExpression: ['elements'],
        ArrayPattern: ['elements'],
        ArrowFunctionExpression: ['params', 'body'],
        AwaitExpression: ['argument'],
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ClassBody: ['body'],
        ClassDeclaration: ['id', 'superClass', 'body'],
        ClassExpression: ['id', 'superClass', 'body'],
        ComprehensionBlock: ['left', 'right'],
        ComprehensionExpression: ['blocks', 'filter', 'body'],
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DebuggerStatement: [],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        EmptyStatement: [],
        ExportAllDeclaration: ['source'],
        ExportDefaultDeclaration: ['declaration'],
        ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
        ExportSpecifier: ['exported', 'local'],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        ForOfStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        GeneratorExpression: ['blocks', 'filter', 'body'],
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        ImportDeclaration: ['specifiers', 'source'],
        ImportDefaultSpecifier: ['local'],
        ImportNamespaceSpecifier: ['local'],
        ImportSpecifier: ['imported', 'local'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        MethodDefinition: ['key', 'value'],
        ModuleSpecifier: [],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        ObjectPattern: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        RestElement: ['argument'],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SpreadElement: ['argument'],
        SuperExpression: ['super'],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        TaggedTemplateExpression: ['tag', 'quasi'],
        TemplateElement: [],
        TemplateLiteral: ['quasis', 'expressions'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handler', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body'],
        YieldExpression: ['argument']
    };
    // unique id
    BREAK = {};
    SKIP = {};
    REMOVE = {};
    VisitorOption = {
        Break: BREAK,
        Skip: SKIP,
        Remove: REMOVE
    };
    function Reference(parent, key) {
        this.parent = parent;
        this.key = key;
    }
    Reference.prototype.replace = function replace(node) {
        this.parent[this.key] = node;
    };
    Reference.prototype.remove = function remove() {
        if (isArray(this.parent)) {
            this.parent.splice(this.key, 1);
            return true;
        }
        else {
            this.replace(null);
            return false;
        }
    };
    function Element(node, path, wrap, ref) {
        this.node = node;
        this.path = path;
        this.wrap = wrap;
        this.ref = ref;
    }
    function Controller() {
        // TODO: class
    }
    // API:
    // return property path array from root to current node
    Controller.prototype.path = function path() {
        var i, iz, j, jz, result, element;
        function addToPath(result, path) {
            if (isArray(path)) {
                for (j = 0, jz = path.length; j < jz; ++j) {
                    result.push(path[j]);
                }
            }
            else {
                result.push(path);
            }
        }
        // root node
        if (!this.__current.path) {
            return null;
        }
        // first node is sentinel, second node is root element
        result = [];
        for (i = 2, iz = this.__leavelist.length; i < iz; ++i) {
            element = this.__leavelist[i];
            addToPath(result, element.path);
        }
        addToPath(result, this.__current.path);
        return result;
    };
    // API:
    // return type of current node
    Controller.prototype.type = function () {
        var node = this.current();
        return node.type || this.__current.wrap;
    };
    // API:
    // return array of parent elements
    Controller.prototype.parents = function parents() {
        var i, iz, result;
        // first node is sentinel
        result = [];
        for (i = 1, iz = this.__leavelist.length; i < iz; ++i) {
            result.push(this.__leavelist[i].node);
        }
        return result;
    };
    // API:
    // return current node
    Controller.prototype.current = function current() {
        return this.__current.node;
    };
    Controller.prototype.__execute = function __execute(callback, element) {
        var previous, result;
        result = undefined;
        previous = this.__current;
        this.__current = element;
        this.__state = null;
        if (callback) {
            result = callback.call(this, element.node, this.__leavelist[this.__leavelist.length - 1].node);
        }
        this.__current = previous;
        return result;
    };
    // API:
    // notify control skip / break
    Controller.prototype.notify = function notify(flag) {
        this.__state = flag;
    };
    // API:
    // skip child nodes of current node
    Controller.prototype.skip = function () {
        this.notify(SKIP);
    };
    // API:
    // break traversals
    Controller.prototype['break'] = function () {
        this.notify(BREAK);
    };
    // API:
    // remove node
    Controller.prototype.remove = function () {
        this.notify(REMOVE);
    };
    Controller.prototype.__initialize = function (root, visitor) {
        this.visitor = visitor;
        this.root = root;
        this.__worklist = [];
        this.__leavelist = [];
        this.__current = null;
        this.__state = null;
        this.__fallback = visitor.fallback === 'iteration';
        this.__keys = VisitorKeys;
        if (visitor.keys) {
            this.__keys = extend(objectCreate(this.__keys), visitor.keys);
        }
    };
    function isNode(node) {
        if (node == null) {
            return false;
        }
        return typeof node === 'object' && typeof node.type === 'string';
    }
    function isProperty(nodeType, key) {
        return (nodeType === exports.Syntax.ObjectExpression || nodeType === exports.Syntax.ObjectPattern) && 'properties' === key;
    }
    Controller.prototype.traverse = function traverse(root, visitor) {
        var worklist, leavelist, element, node, nodeType, ret, key, current, current2, candidates, candidate, sentinel;
        this.__initialize(root, visitor);
        sentinel = {};
        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;
        // initialize
        worklist.push(new Element(root, null, null, null));
        leavelist.push(new Element(null, null, null, null));
        while (worklist.length) {
            element = worklist.pop();
            if (element === sentinel) {
                element = leavelist.pop();
                ret = this.__execute(visitor.leave, element);
                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }
                continue;
            }
            if (element.node) {
                ret = this.__execute(visitor.enter, element);
                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }
                worklist.push(sentinel);
                leavelist.push(element);
                if (this.__state === SKIP || ret === SKIP) {
                    continue;
                }
                node = element.node;
                nodeType = element.wrap || node.type;
                candidates = this.__keys[nodeType];
                if (!candidates) {
                    if (this.__fallback) {
                        candidates = objectKeys(node);
                    }
                    else {
                        throw new Error('Unknown node type ' + nodeType + '.');
                    }
                }
                current = candidates.length;
                while ((current -= 1) >= 0) {
                    key = candidates[current];
                    candidate = node[key];
                    if (!candidate) {
                        continue;
                    }
                    if (isArray(candidate)) {
                        current2 = candidate.length;
                        while ((current2 -= 1) >= 0) {
                            if (!candidate[current2]) {
                                continue;
                            }
                            if (isProperty(nodeType, candidates[current])) {
                                element = new Element(candidate[current2], [key, current2], 'Property', null);
                            }
                            else if (isNode(candidate[current2])) {
                                element = new Element(candidate[current2], [key, current2], null, null);
                            }
                            else {
                                continue;
                            }
                            worklist.push(element);
                        }
                    }
                    else if (isNode(candidate)) {
                        worklist.push(new Element(candidate, key, null, null));
                    }
                }
            }
        }
    };
    Controller.prototype.replace = function replace(root, visitor) {
        function removeElem(element) {
            var i, key, nextElem, parent;
            if (element.ref.remove()) {
                // When the reference is an element of an array.
                key = element.ref.key;
                parent = element.ref.parent;
                // If removed from array, then decrease following items' keys.
                i = worklist.length;
                while (i--) {
                    nextElem = worklist[i];
                    if (nextElem.ref && nextElem.ref.parent === parent) {
                        if (nextElem.ref.key < key) {
                            break;
                        }
                        --nextElem.ref.key;
                    }
                }
            }
        }
        var leavelist, node, nodeType, target, element, current, current2, candidates, candidate, sentinel, outer, key;
        this.__initialize(root, visitor);
        sentinel = {};
        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;
        // initialize
        outer = {
            root: root
        };
        element = new Element(root, null, null, new Reference(outer, 'root'));
        worklist.push(element);
        leavelist.push(element);
        while (worklist.length) {
            element = worklist.pop();
            if (element === sentinel) {
                element = leavelist.pop();
                target = this.__execute(visitor.leave, element);
                // node may be replaced with null,
                // so distinguish between undefined and null in this place
                if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                    // replace
                    element.ref.replace(target);
                }
                if (this.__state === REMOVE || target === REMOVE) {
                    removeElem(element);
                }
                if (this.__state === BREAK || target === BREAK) {
                    return outer.root;
                }
                continue;
            }
            target = this.__execute(visitor.enter, element);
            // node may be replaced with null,
            // so distinguish between undefined and null in this place
            if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                // replace
                element.ref.replace(target);
                element.node = target;
            }
            if (this.__state === REMOVE || target === REMOVE) {
                removeElem(element);
                element.node = null;
            }
            if (this.__state === BREAK || target === BREAK) {
                return outer.root;
            }
            // node may be null
            node = element.node;
            if (!node) {
                continue;
            }
            worklist.push(sentinel);
            leavelist.push(element);
            if (this.__state === SKIP || target === SKIP) {
                continue;
            }
            nodeType = element.wrap || node.type;
            candidates = this.__keys[nodeType];
            if (!candidates) {
                if (this.__fallback) {
                    candidates = objectKeys(node);
                }
                else {
                    throw new Error('Unknown node type ' + nodeType + '.');
                }
            }
            current = candidates.length;
            while ((current -= 1) >= 0) {
                key = candidates[current];
                candidate = node[key];
                if (!candidate) {
                    continue;
                }
                if (isArray(candidate)) {
                    current2 = candidate.length;
                    while ((current2 -= 1) >= 0) {
                        if (!candidate[current2]) {
                            continue;
                        }
                        if (isProperty(nodeType, candidates[current])) {
                            element = new Element(candidate[current2], [key, current2], 'Property', new Reference(candidate, current2));
                        }
                        else if (isNode(candidate[current2])) {
                            element = new Element(candidate[current2], [key, current2], null, new Reference(candidate, current2));
                        }
                        else {
                            continue;
                        }
                        worklist.push(element);
                    }
                }
                else if (isNode(candidate)) {
                    worklist.push(new Element(candidate, key, null, new Reference(node, key)));
                }
            }
        }
        return outer.root;
    };
    function traverse(root, visitor) {
        var controller = new Controller();
        return controller.traverse(root, visitor);
    }
    function replace(root, visitor) {
        var controller = new Controller();
        return controller.replace(root, visitor);
    }
    exports.replace = replace;
    function extendCommentRange(comment, tokens) {
        var target;
        target = upperBound(tokens, function search(token) {
            return token.range[0] > comment.range[0];
        });
        comment.extendedRange = [comment.range[0], comment.range[1]];
        if (target !== tokens.length) {
            comment.extendedRange[1] = tokens[target].range[0];
        }
        target -= 1;
        if (target >= 0) {
            comment.extendedRange[0] = tokens[target].range[1];
        }
        return comment;
    }
    function attachComments(tree, providedComments, tokens) {
        // At first, we should calculate extended comment ranges.
        var comments = [], comment, len, i, cursor;
        if (!tree.range) {
            throw new Error('attachComments needs range information');
        }
        // tokens array is empty, we attach comments to tree as 'leadingComments'
        if (!tokens.length) {
            if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                }
                tree.leadingComments = comments;
            }
            return tree;
        }
        for (i = 0, len = providedComments.length; i < len; i += 1) {
            comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
        }
        // This is based on John Freeman's implementation.
        cursor = 0;
        traverse(tree, {
            enter: function (node) {
                var comment;
                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                        break;
                    }
                    if (comment.extendedRange[1] === node.range[0]) {
                        if (!node.leadingComments) {
                            node.leadingComments = [];
                        }
                        node.leadingComments.push(comment);
                        comments.splice(cursor, 1);
                    }
                    else {
                        cursor += 1;
                    }
                }
                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }
                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });
        cursor = 0;
        traverse(tree, {
            leave: function (node) {
                var comment;
                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                        break;
                    }
                    if (node.range[1] === comment.extendedRange[0]) {
                        if (!node.trailingComments) {
                            node.trailingComments = [];
                        }
                        node.trailingComments.push(comment);
                        comments.splice(cursor, 1);
                    }
                    else {
                        cursor += 1;
                    }
                }
                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }
                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });
        return tree;
    }
    exports.attachComments = attachComments;
});

/*
  Copyright (C) 2015 David Holmes <david.geo.holmes@gmail.com>
  Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2015 Ingvar Stepanyan <me@rreverser.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>
  Copyright (C) 2012-2013 Michael Ficarra <escodegen.copyright@michael.ficarra.me>
  Copyright (C) 2012-2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2013 Irakli Gozalishvili <rfobic@gmail.com>
  Copyright (C) 2012 Robert Gust-Bardon <donate@robert.gust-bardon.org>
  Copyright (C) 2012 John Freeman <jfreeman08@gmail.com>
  Copyright (C) 2011-2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
define('estools/escodegen',["require", "exports", './code', './code', './estraverse'], function (require, exports, code_1, code_2, estraverse_1) {
    /*global exports:true, require:true, global:true*/
    'use strict';
    // import esutils from './esutils';
    var SourceNode, isArray, base, indent, json, renumber, hexadecimal, quotes, escapeless, newline, space, parentheses, semicolons, safeConcatenation, directive, extra, parse, sourceMap, sourceCode, preserveBlankLines;
    // Generation is done by generateExpression.
    function isExpression(node) {
        return CodeGenerator.Expression.hasOwnProperty(node.type);
    }
    // Generation is done by generateStatement.
    function isStatement(node) {
        return CodeGenerator.Statement.hasOwnProperty(node.type);
    }
    exports.Precedence = {
        Sequence: 0,
        Yield: 1,
        Await: 1,
        Assignment: 1,
        Conditional: 2,
        ArrowFunction: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        BitwiseOR: 5,
        BitwiseXOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        TaggedTemplate: 17,
        Member: 18,
        Primary: 19
    };
    var BinaryPrecedence = {
        '||': exports.Precedence.LogicalOR,
        '&&': exports.Precedence.LogicalAND,
        '|': exports.Precedence.BitwiseOR,
        '^': exports.Precedence.BitwiseXOR,
        '&': exports.Precedence.BitwiseAND,
        '==': exports.Precedence.Equality,
        '!=': exports.Precedence.Equality,
        '===': exports.Precedence.Equality,
        '!==': exports.Precedence.Equality,
        'is': exports.Precedence.Equality,
        'isnt': exports.Precedence.Equality,
        '<': exports.Precedence.Relational,
        '>': exports.Precedence.Relational,
        '<=': exports.Precedence.Relational,
        '>=': exports.Precedence.Relational,
        'in': exports.Precedence.Relational,
        'instanceof': exports.Precedence.Relational,
        '<<': exports.Precedence.BitwiseSHIFT,
        '>>': exports.Precedence.BitwiseSHIFT,
        '>>>': exports.Precedence.BitwiseSHIFT,
        '+': exports.Precedence.Additive,
        '-': exports.Precedence.Additive,
        '*': exports.Precedence.Multiplicative,
        '%': exports.Precedence.Multiplicative,
        '/': exports.Precedence.Multiplicative
    };
    // Flags
    var F_ALLOW_IN = 1;
    var F_ALLOW_CALL = 1 << 1;
    var F_ALLOW_UNPARATH_NEW = 1 << 2;
    var F_FUNC_BODY = 1 << 3;
    var F_DIRECTIVE_CTX = 1 << 4;
    var F_SEMICOLON_OPT = 1 << 5;
    // Expression flag sets
    // NOTE: Flag order:
    // F_ALLOW_IN
    // F_ALLOW_CALL
    // F_ALLOW_UNPARATH_NEW
    var E_FTT = F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
    var E_TTF = F_ALLOW_IN | F_ALLOW_CALL;
    var E_TTT = F_ALLOW_IN | F_ALLOW_CALL | F_ALLOW_UNPARATH_NEW;
    var E_TFF = F_ALLOW_IN;
    var E_FFT = F_ALLOW_UNPARATH_NEW;
    var E_TFT = F_ALLOW_IN | F_ALLOW_UNPARATH_NEW;
    // Statement flag sets
    // NOTE: Flag order:
    // F_ALLOW_IN
    // F_FUNC_BODY
    // F_DIRECTIVE_CTX
    // F_SEMICOLON_OPT
    var S_TFFF = F_ALLOW_IN, S_TFFT = F_ALLOW_IN | F_SEMICOLON_OPT, S_FFFF = 0x00, S_TFTF = F_ALLOW_IN | F_DIRECTIVE_CTX, S_TTFF = F_ALLOW_IN | F_FUNC_BODY;
    function getDefaultOptions() {
        // default options
        return {
            indent: null,
            base: null,
            parse: null,
            comment: false,
            format: {
                indent: {
                    style: '    ',
                    base: 0,
                    adjustMultilineComment: false
                },
                newline: '\n',
                space: ' ',
                json: false,
                renumber: false,
                hexadecimal: false,
                quotes: 'single',
                escapeless: false,
                compact: false,
                parentheses: true,
                semicolons: true,
                safeConcatenation: false,
                preserveBlankLines: false
            },
            moz: {
                comprehensionExpressionStartsWithAssignment: false,
                starlessGenerator: false
            },
            sourceMap: null,
            sourceMapRoot: null,
            sourceMapWithCode: false,
            directive: false,
            raw: true,
            verbatim: null,
            sourceCode: null
        };
    }
    function stringRepeat(str, num) {
        var result = '';
        for (num |= 0; num > 0; num >>>= 1, str += str) {
            if (num & 1) {
                result += str;
            }
        }
        return result;
    }
    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }
    function hasLineTerminator(str) {
        return (/[\r\n]/g).test(str);
    }
    function endsWithLineTerminator(str) {
        var len = str.length;
        return len && code_1.isLineTerminator(str.charCodeAt(len - 1));
    }
    function merge(target, override) {
        var key;
        for (key in override) {
            if (override.hasOwnProperty(key)) {
                target[key] = override[key];
            }
        }
        return target;
    }
    function updateDeeply(target, override) {
        var key, val;
        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }
        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    }
                    else {
                        target[key] = updateDeeply({}, val);
                    }
                }
                else {
                    target[key] = val;
                }
            }
        }
        return target;
    }
    exports.updateDeeply = updateDeeply;
    function generateNumber(value) {
        var result, point, temp, exponent, pos;
        if (value !== value) {
            throw new Error('Numeric literal whose value is NaN');
        }
        if (value < 0 || (value === 0 && 1 / value < 0)) {
            throw new Error('Numeric literal whose value is negative');
        }
        if (value === 1 / 0) {
            return json ? 'null' : renumber ? '1e400' : '1e+400';
        }
        result = '' + value;
        if (!renumber || result.length < 3) {
            return result;
        }
        point = result.indexOf('.');
        if (!json && result.charCodeAt(0) === 0x30 /* 0 */ && point === 1) {
            point = 0;
            result = result.slice(1);
        }
        temp = result;
        result = result.replace('e+', 'e');
        exponent = 0;
        if ((pos = temp.indexOf('e')) > 0) {
            exponent = +temp.slice(pos + 1);
            temp = temp.slice(0, pos);
        }
        if (point >= 0) {
            exponent -= temp.length - point - 1;
            temp = +(temp.slice(0, point) + temp.slice(point + 1)) + '';
        }
        pos = 0;
        while (temp.charCodeAt(temp.length + pos - 1) === 0x30 /* 0 */) {
            --pos;
        }
        if (pos !== 0) {
            exponent -= pos;
            temp = temp.slice(0, pos);
        }
        if (exponent !== 0) {
            temp += 'e' + exponent;
        }
        if ((temp.length < result.length ||
            (hexadecimal && value > 1e12 && Math.floor(value) === value && (temp = '0x' + value.toString(16)).length < result.length)) &&
            +temp === value) {
            result = temp;
        }
        return result;
    }
    // Generate valid RegExp expression.
    // This function is based on https://github.com/Constellation/iv Engine
    function escapeRegExpCharacter(ch, previousIsBackslash) {
        // not handling '\' and handling \u2028 or \u2029 to unicode escape sequence
        if ((ch & ~1) === 0x2028) {
            return (previousIsBackslash ? 'u' : '\\u') + ((ch === 0x2028) ? '2028' : '2029');
        }
        else if (ch === 10 || ch === 13) {
            return (previousIsBackslash ? '' : '\\') + ((ch === 10) ? 'n' : 'r');
        }
        return String.fromCharCode(ch);
    }
    function generateRegExp(reg) {
        var match, result, flags, i, iz, ch, characterInBrack, previousIsBackslash;
        result = reg.toString();
        if (reg.source) {
            // extract flag from toString result
            match = result.match(/\/([^/]*)$/);
            if (!match) {
                return result;
            }
            flags = match[1];
            result = '';
            characterInBrack = false;
            previousIsBackslash = false;
            for (i = 0, iz = reg.source.length; i < iz; ++i) {
                ch = reg.source.charCodeAt(i);
                if (!previousIsBackslash) {
                    if (characterInBrack) {
                        if (ch === 93) {
                            characterInBrack = false;
                        }
                    }
                    else {
                        if (ch === 47) {
                            result += '\\';
                        }
                        else if (ch === 91) {
                            characterInBrack = true;
                        }
                    }
                    result += escapeRegExpCharacter(ch, previousIsBackslash);
                    previousIsBackslash = ch === 92; // \
                }
                else {
                    // if new RegExp("\\\n') is provided, create /\n/
                    result += escapeRegExpCharacter(ch, previousIsBackslash);
                    // prevent like /\\[/]/
                    previousIsBackslash = false;
                }
            }
            return '/' + result + '/' + flags;
        }
        return result;
    }
    function escapeAllowedCharacter(code, next) {
        var hex;
        if (code === 0x08 /* \b */) {
            return '\\b';
        }
        if (code === 0x0C /* \f */) {
            return '\\f';
        }
        if (code === 0x09 /* \t */) {
            return '\\t';
        }
        hex = code.toString(16).toUpperCase();
        if (json || code > 0xFF) {
            return '\\u' + '0000'.slice(hex.length) + hex;
        }
        else if (code === 0x0000 && !code_1.isDecimalDigit(next)) {
            return '\\0';
        }
        else if (code === 0x000B /* \v */) {
            return '\\x0B';
        }
        else {
            return '\\x' + '00'.slice(hex.length) + hex;
        }
    }
    function escapeDisallowedCharacter(code) {
        if (code === 0x5C /* \ */) {
            return '\\\\';
        }
        if (code === 0x0A /* \n */) {
            return '\\n';
        }
        if (code === 0x0D /* \r */) {
            return '\\r';
        }
        if (code === 0x2028) {
            return '\\u2028';
        }
        if (code === 0x2029) {
            return '\\u2029';
        }
        throw new Error('Incorrectly classified character');
    }
    function escapeDirective(str) {
        var i, iz, code, quote;
        quote = quotes === 'double' ? '"' : '\'';
        for (i = 0, iz = str.length; i < iz; ++i) {
            code = str.charCodeAt(i);
            if (code === 0x27 /* ' */) {
                quote = '"';
                break;
            }
            else if (code === 0x22 /* " */) {
                quote = '\'';
                break;
            }
            else if (code === 0x5C /* \ */) {
                ++i;
            }
        }
        return quote + str + quote;
    }
    function escapeString(str) {
        var result = '', i, len, code, singleQuotes = 0, doubleQuotes = 0, single, quote;
        for (i = 0, len = str.length; i < len; ++i) {
            code = str.charCodeAt(i);
            if (code === 0x27 /* ' */) {
                ++singleQuotes;
            }
            else if (code === 0x22 /* " */) {
                ++doubleQuotes;
            }
            else if (code === 0x2F /* / */ && json) {
                result += '\\';
            }
            else if (code_1.isLineTerminator(code) || code === 0x5C /* \ */) {
                result += escapeDisallowedCharacter(code);
                continue;
            }
            else if ((json && code < 0x20 /* SP */) || !(json || escapeless || (code >= 0x20 /* SP */ && code <= 0x7E /* ~ */))) {
                result += escapeAllowedCharacter(code, str.charCodeAt(i + 1));
                continue;
            }
            result += String.fromCharCode(code);
        }
        single = !(quotes === 'double' || (quotes === 'auto' && doubleQuotes < singleQuotes));
        quote = single ? '\'' : '"';
        if (!(single ? singleQuotes : doubleQuotes)) {
            return quote + result + quote;
        }
        str = result;
        result = quote;
        for (i = 0, len = str.length; i < len; ++i) {
            code = str.charCodeAt(i);
            if ((code === 0x27 /* ' */ && single) || (code === 0x22 /* " */ && !single)) {
                result += '\\';
            }
            result += String.fromCharCode(code);
        }
        return result + quote;
    }
    /**
     * flatten an array to a string, where the array can contain
     * either strings or nested arrays
     */
    function flattenToString(arr) {
        var i, iz, elem, result = '';
        for (i = 0, iz = arr.length; i < iz; ++i) {
            elem = arr[i];
            result += isArray(elem) ? flattenToString(elem) : elem;
        }
        return result;
    }
    /**
     * convert generated to a SourceNode when source maps are enabled.
     */
    function toSourceNodeWhenNeeded(generated, node) {
        if (!sourceMap) {
            // with no source maps, generated is either an
            // array or a string.  if an array, flatten it.
            // if a string, just return it
            if (isArray(generated)) {
                return flattenToString(generated);
            }
            else {
                return generated;
            }
        }
        if (node == null) {
            if (generated instanceof SourceNode) {
                return generated;
            }
            else {
                node = {};
            }
        }
        if (node.loc == null) {
            return new SourceNode(null, null, sourceMap, generated, node.name || null);
        }
        return new SourceNode(node.loc.start.line, node.loc.start.column, (sourceMap === true ? node.loc.source || null : sourceMap), generated, node.name || null);
    }
    function noEmptySpace() {
        return (space) ? space : ' ';
    }
    function join(left, right) {
        var leftSource, rightSource, leftCharCode, rightCharCode;
        leftSource = toSourceNodeWhenNeeded(left).toString();
        if (leftSource.length === 0) {
            return [right];
        }
        rightSource = toSourceNodeWhenNeeded(right).toString();
        if (rightSource.length === 0) {
            return [left];
        }
        leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
        rightCharCode = rightSource.charCodeAt(0);
        if ((leftCharCode === 0x2B /* + */ || leftCharCode === 0x2D /* - */) && leftCharCode === rightCharCode ||
            code_2.isIdentifierPartES6(leftCharCode) && code_2.isIdentifierPartES6(rightCharCode) ||
            leftCharCode === 0x2F /* / */ && rightCharCode === 0x69 /* i */) {
            return [left, noEmptySpace(), right];
        }
        else if (code_1.isWhiteSpace(leftCharCode) || code_1.isLineTerminator(leftCharCode) ||
            code_1.isWhiteSpace(rightCharCode) || code_1.isLineTerminator(rightCharCode)) {
            return [left, right];
        }
        return [left, space, right];
    }
    function addIndent(stmt) {
        return [base, stmt];
    }
    function withIndent(fn) {
        var previousBase;
        previousBase = base;
        base += indent;
        fn(base);
        base = previousBase;
    }
    function calculateSpaces(str) {
        var i;
        for (i = str.length - 1; i >= 0; --i) {
            if (code_1.isLineTerminator(str.charCodeAt(i))) {
                break;
            }
        }
        return (str.length - 1) - i;
    }
    function adjustMultilineComment(value, specialBase) {
        var array, i, len, line, j, spaces, previousBase, sn;
        array = value.split(/\r\n|[\r\n]/);
        spaces = Number.MAX_VALUE;
        // first line doesn't have indentation
        for (i = 1, len = array.length; i < len; ++i) {
            line = array[i];
            j = 0;
            while (j < line.length && code_1.isWhiteSpace(line.charCodeAt(j))) {
                ++j;
            }
            if (spaces > j) {
                spaces = j;
            }
        }
        if (typeof specialBase !== 'undefined') {
            // pattern like
            // {
            //   var t = 20;  /*
            //                 * this is comment
            //                 */
            // }
            previousBase = base;
            if (array[1][spaces] === '*') {
                specialBase += ' ';
            }
            base = specialBase;
        }
        else {
            if (spaces & 1) {
                // /*
                //  *
                //  */
                // If spaces are odd number, above pattern is considered.
                // We waste 1 space.
                --spaces;
            }
            previousBase = base;
        }
        for (i = 1, len = array.length; i < len; ++i) {
            sn = toSourceNodeWhenNeeded(addIndent(array[i].slice(spaces)));
            array[i] = sourceMap ? sn.join('') : sn;
        }
        base = previousBase;
        return array.join('\n');
    }
    function generateComment(comment, specialBase) {
        if (comment.type === 'Line') {
            if (endsWithLineTerminator(comment.value)) {
                return '//' + comment.value;
            }
            else {
                // Always use LineTerminator
                var result = '//' + comment.value;
                if (!preserveBlankLines) {
                    result += '\n';
                }
                return result;
            }
        }
        if (extra.format.indent.adjustMultilineComment && /[\n\r]/.test(comment.value)) {
            return adjustMultilineComment('/*' + comment.value + '*/', specialBase);
        }
        return '/*' + comment.value + '*/';
    }
    function addComments(stmt, result) {
        var i, len, comment, save, tailingToStatement, specialBase, fragment, extRange, range, prevRange, prefix, infix, suffix, count;
        if (stmt.leadingComments && stmt.leadingComments.length > 0) {
            save = result;
            if (preserveBlankLines) {
                comment = stmt.leadingComments[0];
                result = [];
                extRange = comment.extendedRange;
                range = comment.range;
                prefix = sourceCode.substring(extRange[0], range[0]);
                count = (prefix.match(/\n/g) || []).length;
                if (count > 0) {
                    result.push(stringRepeat('\n', count));
                    result.push(addIndent(generateComment(comment)));
                }
                else {
                    result.push(prefix);
                    result.push(generateComment(comment));
                }
                prevRange = range;
                for (i = 1, len = stmt.leadingComments.length; i < len; i++) {
                    comment = stmt.leadingComments[i];
                    range = comment.range;
                    infix = sourceCode.substring(prevRange[1], range[0]);
                    count = (infix.match(/\n/g) || []).length;
                    result.push(stringRepeat('\n', count));
                    result.push(addIndent(generateComment(comment)));
                    prevRange = range;
                }
                suffix = sourceCode.substring(range[1], extRange[1]);
                count = (suffix.match(/\n/g) || []).length;
                result.push(stringRepeat('\n', count));
            }
            else {
                comment = stmt.leadingComments[0];
                result = [];
                if (safeConcatenation && stmt.type === estraverse_1.Syntax.Program && stmt.body.length === 0) {
                    result.push('\n');
                }
                result.push(generateComment(comment));
                if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result.push('\n');
                }
                for (i = 1, len = stmt.leadingComments.length; i < len; ++i) {
                    comment = stmt.leadingComments[i];
                    fragment = [generateComment(comment)];
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        fragment.push('\n');
                    }
                    result.push(addIndent(fragment));
                }
            }
            result.push(addIndent(save));
        }
        if (stmt.trailingComments) {
            if (preserveBlankLines) {
                comment = stmt.trailingComments[0];
                extRange = comment.extendedRange;
                range = comment.range;
                prefix = sourceCode.substring(extRange[0], range[0]);
                count = (prefix.match(/\n/g) || []).length;
                if (count > 0) {
                    result.push(stringRepeat('\n', count));
                    result.push(addIndent(generateComment(comment)));
                }
                else {
                    result.push(prefix);
                    result.push(generateComment(comment));
                }
            }
            else {
                tailingToStatement = !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
                specialBase = stringRepeat(' ', calculateSpaces(toSourceNodeWhenNeeded([base, result, indent]).toString()));
                for (i = 0, len = stmt.trailingComments.length; i < len; ++i) {
                    comment = stmt.trailingComments[i];
                    if (tailingToStatement) {
                        // We assume target like following script
                        //
                        // var t = 20;  /**
                        //               * This is comment of t
                        //               */
                        if (i === 0) {
                            // first case
                            result = [result, indent];
                        }
                        else {
                            result = [result, specialBase];
                        }
                        result.push(generateComment(comment, specialBase));
                    }
                    else {
                        result = [result, addIndent(generateComment(comment))];
                    }
                    if (i !== len - 1 && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                        result = [result, '\n'];
                    }
                }
            }
        }
        return result;
    }
    function generateBlankLines(start, end, result) {
        var j, newlineCount = 0;
        for (j = start; j < end; j++) {
            if (sourceCode[j] === '\n') {
                newlineCount++;
            }
        }
        for (j = 1; j < newlineCount; j++) {
            result.push(newline);
        }
    }
    function parenthesize(text, current, should) {
        if (current < should) {
            return ['(', text, ')'];
        }
        return text;
    }
    function generateVerbatimString(string) {
        var i, iz, result;
        result = string.split(/\r\n|\n/);
        for (i = 1, iz = result.length; i < iz; i++) {
            result[i] = newline + base + result[i];
        }
        return result;
    }
    function generateVerbatim(expr, precedence) {
        var verbatim, result, prec;
        verbatim = expr[extra.verbatim];
        if (typeof verbatim === 'string') {
            result = parenthesize(generateVerbatimString(verbatim), exports.Precedence.Sequence, precedence);
        }
        else {
            // verbatim is object
            result = generateVerbatimString(verbatim.content);
            prec = (verbatim.precedence != null) ? verbatim.precedence : exports.Precedence.Sequence;
            result = parenthesize(result, prec, precedence);
        }
        return toSourceNodeWhenNeeded(result, expr);
    }
    var CodeGenerator = (function () {
        function CodeGenerator() {
        }
        CodeGenerator.prototype.generateFunctionParams = function (node) {
            var i, iz, result, hasDefault;
            hasDefault = false;
            if (node.type === estraverse_1.Syntax.ArrowFunctionExpression &&
                !node.rest && (!node.defaults || node.defaults.length === 0) &&
                node.params.length === 1 && node.params[0].type === estraverse_1.Syntax.Identifier) {
                // arg => { } case
                result = [generateAsyncPrefix(node, true), generateIdentifier(node.params[0])];
            }
            else {
                result = node.type === estraverse_1.Syntax.ArrowFunctionExpression ? [generateAsyncPrefix(node, false)] : [];
                result.push('(');
                if (node.defaults) {
                    hasDefault = true;
                }
                for (i = 0, iz = node.params.length; i < iz; ++i) {
                    if (hasDefault && node.defaults[i]) {
                        // Handle default values.
                        result.push(this.generateAssignment(node.params[i], node.defaults[i], '=', exports.Precedence.Assignment, E_TTT));
                    }
                    else {
                        result.push(this.generatePattern(node.params[i], exports.Precedence.Assignment, E_TTT));
                    }
                    if (i + 1 < iz) {
                        result.push(',' + space);
                    }
                }
                if (node.rest) {
                    if (node.params.length) {
                        result.push(',' + space);
                    }
                    result.push('...');
                    result.push(generateIdentifier(node.rest));
                }
                result.push(')');
            }
            return result;
        };
        CodeGenerator.prototype.generatePattern = function (node, precedence, flags) {
            if (node.type === estraverse_1.Syntax.Identifier) {
                return generateIdentifier(node);
            }
            return this.generateExpression(node, precedence, flags);
        };
        CodeGenerator.prototype.generateStatement = function (stmt, flags) {
            var result, fragment;
            result = this[stmt.type](stmt, flags);
            // Attach comments
            if (extra.comment) {
                result = addComments(stmt, result);
            }
            fragment = toSourceNodeWhenNeeded(result).toString();
            if (stmt.type === estraverse_1.Syntax.Program && !safeConcatenation && newline === '' && fragment.charAt(fragment.length - 1) === '\n') {
                result = sourceMap ? toSourceNodeWhenNeeded(result).replaceRight(/\s+$/, '') : fragment.replace(/\s+$/, '');
            }
            return toSourceNodeWhenNeeded(result, stmt);
        };
        CodeGenerator.prototype.generateExpression = function (expr, precedence, flags) {
            var result, type;
            type = expr.type || estraverse_1.Syntax.Property;
            if (extra.verbatim && expr.hasOwnProperty(extra.verbatim)) {
                return generateVerbatim(expr, precedence);
            }
            result = this[type](expr, precedence, flags);
            if (extra.comment) {
                result = addComments(expr, result);
            }
            return toSourceNodeWhenNeeded(result, expr);
        };
        CodeGenerator.prototype.maybeBlock = function (stmt, flags) {
            var result, noLeadingComment, that = this;
            noLeadingComment = !extra.comment || !stmt.leadingComments;
            if (stmt.type === estraverse_1.Syntax.BlockStatement && noLeadingComment) {
                return [space, this.generateStatement(stmt, flags)];
            }
            if (stmt.type === estraverse_1.Syntax.EmptyStatement && noLeadingComment) {
                return ';';
            }
            withIndent(function () {
                result = [
                    newline,
                    addIndent(that.generateStatement(stmt, flags))
                ];
            });
            return result;
        };
        CodeGenerator.prototype.maybeBlockSuffix = function (stmt, result) {
            var ends = endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString());
            if (stmt.type === estraverse_1.Syntax.BlockStatement && (!extra.comment || !stmt.leadingComments) && !ends) {
                return [result, space];
            }
            if (ends) {
                return [result, base];
            }
            return [result, newline, base];
        };
        CodeGenerator.prototype.generateFunctionBody = function (node) {
            var result, expr;
            result = this.generateFunctionParams(node);
            if (node.type === estraverse_1.Syntax.ArrowFunctionExpression) {
                result.push(space);
                result.push('=>');
            }
            if (node.expression) {
                result.push(space);
                expr = this.generateExpression(node.body, exports.Precedence.Assignment, E_TTT);
                if (expr.toString().charAt(0) === '{') {
                    expr = ['(', expr, ')'];
                }
                result.push(expr);
            }
            else {
                result.push(this.maybeBlock(node.body, S_TTFF));
            }
            return result;
        };
        CodeGenerator.prototype.generateIterationForStatement = function (operator, stmt, flags) {
            var result = ['for' + space + '('], that = this;
            withIndent(function () {
                if (stmt.left.type === estraverse_1.Syntax.VariableDeclaration) {
                    withIndent(function () {
                        result.push(stmt.left.kind + noEmptySpace());
                        result.push(that.generateStatement(stmt.left.declarations[0], S_FFFF));
                    });
                }
                else {
                    result.push(that.generateExpression(stmt.left, exports.Precedence.Call, E_TTT));
                }
                result = join(result, operator);
                result = [join(result, that.generateExpression(stmt.right, exports.Precedence.Sequence, E_TTT)), ')'];
            });
            result.push(this.maybeBlock(stmt.body, flags));
            return result;
        };
        CodeGenerator.prototype.generatePropertyKey = function (expr, computed) {
            var result = [];
            if (computed) {
                result.push('[');
            }
            result.push(this.generateExpression(expr, exports.Precedence.Sequence, E_TTT));
            if (computed) {
                result.push(']');
            }
            return result;
        };
        CodeGenerator.prototype.generateAssignment = function (left, right, operator, precedence, flags) {
            if (exports.Precedence.Assignment < precedence) {
                flags |= F_ALLOW_IN;
            }
            return parenthesize([
                this.generateExpression(left, exports.Precedence.Call, flags),
                space + operator + space,
                this.generateExpression(right, exports.Precedence.Assignment, flags)
            ], exports.Precedence.Assignment, precedence);
        };
        CodeGenerator.prototype.semicolon = function (flags) {
            if (!semicolons && flags & F_SEMICOLON_OPT) {
                return '';
            }
            return ';';
        };
        return CodeGenerator;
    }());
    // Helpers.
    function generateIdentifier(node) {
        return toSourceNodeWhenNeeded(node.name, node);
    }
    function generateAsyncPrefix(node, spaceRequired) {
        return node.async ? 'async' + (spaceRequired ? noEmptySpace() : space) : '';
    }
    function generateStarSuffix(node) {
        var isGenerator = node.generator && !extra.moz.starlessGenerator;
        return isGenerator ? '*' + space : '';
    }
    function generateMethodPrefix(prop) {
        var func = prop.value;
        if (func.async) {
            return generateAsyncPrefix(func, !prop.computed);
        }
        else {
            // avoid space before method name
            return generateStarSuffix(func) ? '*' : '';
        }
    }
    // Statements.
    CodeGenerator.Statement = {
        BlockStatement: function (stmt, flags) {
            var range, content, result = ['{', newline], that = this;
            withIndent(function () {
                // handle functions without any code
                if (stmt.body.length === 0 && preserveBlankLines) {
                    range = stmt.range;
                    if (range[1] - range[0] > 2) {
                        content = sourceCode.substring(range[0] + 1, range[1] - 1);
                        if (content[0] === '\n') {
                            result = ['{'];
                        }
                        result.push(content);
                    }
                }
                var i, iz, fragment, bodyFlags;
                bodyFlags = S_TFFF;
                if (flags & F_FUNC_BODY) {
                    bodyFlags |= F_DIRECTIVE_CTX;
                }
                for (i = 0, iz = stmt.body.length; i < iz; ++i) {
                    if (preserveBlankLines) {
                        // handle spaces before the first line
                        if (i === 0) {
                            if (stmt.body[0].leadingComments) {
                                range = stmt.body[0].leadingComments[0].extendedRange;
                                content = sourceCode.substring(range[0], range[1]);
                                if (content[0] === '\n') {
                                    result = ['{'];
                                }
                            }
                            if (!stmt.body[0].leadingComments) {
                                generateBlankLines(stmt.range[0], stmt.body[0].range[0], result);
                            }
                        }
                        // handle spaces between lines
                        if (i > 0) {
                            if (!stmt.body[i - 1].trailingComments && !stmt.body[i].leadingComments) {
                                generateBlankLines(stmt.body[i - 1].range[1], stmt.body[i].range[0], result);
                            }
                        }
                    }
                    if (i === iz - 1) {
                        bodyFlags |= F_SEMICOLON_OPT;
                    }
                    if (stmt.body[i].leadingComments && preserveBlankLines) {
                        fragment = that.generateStatement(stmt.body[i], bodyFlags);
                    }
                    else {
                        fragment = addIndent(that.generateStatement(stmt.body[i], bodyFlags));
                    }
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        if (preserveBlankLines && i < iz - 1) {
                            // don't add a new line if there are leading coments
                            // in the next statement
                            if (!stmt.body[i + 1].leadingComments) {
                                result.push(newline);
                            }
                        }
                        else {
                            result.push(newline);
                        }
                    }
                    if (preserveBlankLines) {
                        // handle spaces after the last line
                        if (i === iz - 1) {
                            if (!stmt.body[i].trailingComments) {
                                generateBlankLines(stmt.body[i].range[1], stmt.range[1], result);
                            }
                        }
                    }
                }
            });
            result.push(addIndent('}'));
            return result;
        },
        BreakStatement: function (stmt, flags) {
            if (stmt.label) {
                return 'break ' + stmt.label.name + this.semicolon(flags);
            }
            return 'break' + this.semicolon(flags);
        },
        ContinueStatement: function (stmt, flags) {
            if (stmt.label) {
                return 'continue ' + stmt.label.name + this.semicolon(flags);
            }
            return 'continue' + this.semicolon(flags);
        },
        ClassBody: function (stmt, flags) {
            var result = ['{', newline], that = this;
            withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = stmt.body.length; i < iz; ++i) {
                    result.push(indent);
                    result.push(that.generateExpression(stmt.body[i], exports.Precedence.Sequence, E_TTT));
                    if (i + 1 < iz) {
                        result.push(newline);
                    }
                }
            });
            if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(base);
            result.push('}');
            return result;
        },
        ClassDeclaration: function (stmt, flags) {
            var result, fragment;
            result = ['class ' + stmt.id.name];
            if (stmt.superClass) {
                fragment = join('extends', this.generateExpression(stmt.superClass, exports.Precedence.Assignment, E_TTT));
                result = join(result, fragment);
            }
            result.push(space);
            result.push(this.generateStatement(stmt.body, S_TFFT));
            return result;
        },
        DirectiveStatement: function (stmt, flags) {
            if (extra.raw && stmt.raw) {
                return stmt.raw + this.semicolon(flags);
            }
            return escapeDirective(stmt.directive) + this.semicolon(flags);
        },
        DoWhileStatement: function (stmt, flags) {
            // Because `do 42 while (cond)` is Syntax Error. We need semicolon.
            var result = join('do', this.maybeBlock(stmt.body, S_TFFF));
            result = this.maybeBlockSuffix(stmt.body, result);
            return join(result, [
                'while' + space + '(',
                this.generateExpression(stmt.test, exports.Precedence.Sequence, E_TTT),
                ')' + this.semicolon(flags)
            ]);
        },
        CatchClause: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                var guard;
                result = [
                    'catch' + space + '(',
                    that.generateExpression(stmt.param, exports.Precedence.Sequence, E_TTT),
                    ')'
                ];
                if (stmt.guard) {
                    guard = that.generateExpression(stmt.guard, exports.Precedence.Sequence, E_TTT);
                    result.splice(2, 0, ' if ', guard);
                }
            });
            result.push(this.maybeBlock(stmt.body, S_TFFF));
            return result;
        },
        DebuggerStatement: function (stmt, flags) {
            return 'debugger' + this.semicolon(flags);
        },
        EmptyStatement: function (stmt, flags) {
            return ';';
        },
        ExportDeclaration: function (stmt, flags) {
            var result = ['export'], bodyFlags, that = this;
            bodyFlags = (flags & F_SEMICOLON_OPT) ? S_TFFT : S_TFFF;
            // export default HoistableDeclaration[Default]
            // export default AssignmentExpression[In] ;
            if (stmt['default']) {
                result = join(result, 'default');
                if (isStatement(stmt.declaration)) {
                    result = join(result, this.generateStatement(stmt.declaration, bodyFlags));
                }
                else {
                    result = join(result, this.generateExpression(stmt.declaration, exports.Precedence.Assignment, E_TTT) + this.semicolon(flags));
                }
                return result;
            }
            // export VariableStatement
            // export Declaration[Default]
            if (stmt.declaration) {
                return join(result, this.generateStatement(stmt.declaration, bodyFlags));
            }
            // export * FromClause ;
            // export ExportClause[NoReference] FromClause ;
            // export ExportClause ;
            if (stmt.specifiers) {
                if (stmt.specifiers.length === 0) {
                    result = join(result, '{' + space + '}');
                }
                else if (stmt.specifiers[0].type === estraverse_1.Syntax.ExportBatchSpecifier) {
                    result = join(result, this.generateExpression(stmt.specifiers[0], exports.Precedence.Sequence, E_TTT));
                }
                else {
                    result = join(result, '{');
                    withIndent(function (indent) {
                        var i, iz;
                        result.push(newline);
                        for (i = 0, iz = stmt.specifiers.length; i < iz; ++i) {
                            result.push(indent);
                            result.push(that.generateExpression(stmt.specifiers[i], exports.Precedence.Sequence, E_TTT));
                            if (i + 1 < iz) {
                                result.push(',' + newline);
                            }
                        }
                    });
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                        result.push(newline);
                    }
                    result.push(base + '}');
                }
                if (stmt.source) {
                    result = join(result, [
                        'from' + space,
                        // ModuleSpecifier
                        this.generateExpression(stmt.source, exports.Precedence.Sequence, E_TTT),
                        this.semicolon(flags)
                    ]);
                }
                else {
                    result.push(this.semicolon(flags));
                }
            }
            return result;
        },
        ExpressionStatement: function (stmt, flags) {
            var result, fragment;
            function isClassPrefixed(fragment) {
                var code;
                if (fragment.slice(0, 5) !== 'class') {
                    return false;
                }
                code = fragment.charCodeAt(5);
                return code === 0x7B /* '{' */ || code_1.isWhiteSpace(code) || code_1.isLineTerminator(code);
            }
            function isFunctionPrefixed(fragment) {
                var code;
                if (fragment.slice(0, 8) !== 'function') {
                    return false;
                }
                code = fragment.charCodeAt(8);
                return code === 0x28 /* '(' */ || code_1.isWhiteSpace(code) || code === 0x2A /* '*' */ || code_1.isLineTerminator(code);
            }
            function isAsyncPrefixed(fragment) {
                var code, i, iz;
                if (fragment.slice(0, 5) !== 'async') {
                    return false;
                }
                if (!code_1.isWhiteSpace(fragment.charCodeAt(5))) {
                    return false;
                }
                for (i = 6, iz = fragment.length; i < iz; ++i) {
                    if (!code_1.isWhiteSpace(fragment.charCodeAt(i))) {
                        break;
                    }
                }
                if (i === iz) {
                    return false;
                }
                if (fragment.slice(i, i + 8) !== 'function') {
                    return false;
                }
                code = fragment.charCodeAt(i + 8);
                return code === 0x28 /* '(' */ || code_1.isWhiteSpace(code) || code === 0x2A /* '*' */ || code_1.isLineTerminator(code);
            }
            result = [this.generateExpression(stmt.expression, exports.Precedence.Sequence, E_TTT)];
            // 12.4 '{', 'function', 'class' is not allowed in this position.
            // wrap expression with parentheses
            fragment = toSourceNodeWhenNeeded(result).toString();
            if (fragment.charCodeAt(0) === 0x7B /* '{' */ ||
                isClassPrefixed(fragment) ||
                isFunctionPrefixed(fragment) ||
                isAsyncPrefixed(fragment) ||
                (directive && (flags & F_DIRECTIVE_CTX) && stmt.expression.type === estraverse_1.Syntax.Literal && typeof stmt.expression.value === 'string')) {
                result = ['(', result, ')' + this.semicolon(flags)];
            }
            else {
                result.push(this.semicolon(flags));
            }
            return result;
        },
        ImportDeclaration: function (stmt, flags) {
            // ES6: 15.2.1 valid import declarations:
            //     - import ImportClause FromClause ;
            //     - import ModuleSpecifier ;
            var result, cursor, that = this;
            // If no ImportClause is present,
            // this should be `import ModuleSpecifier` so skip `from`
            // ModuleSpecifier is StringLiteral.
            if (stmt.specifiers.length === 0) {
                // import ModuleSpecifier ;
                return [
                    'import',
                    space,
                    // ModuleSpecifier
                    this.generateExpression(stmt.source, exports.Precedence.Sequence, E_TTT),
                    this.semicolon(flags)
                ];
            }
            // import ImportClause FromClause ;
            result = [
                'import'
            ];
            cursor = 0;
            // ImportedBinding
            if (stmt.specifiers[cursor].type === estraverse_1.Syntax.ImportDefaultSpecifier) {
                result = join(result, [
                    this.generateExpression(stmt.specifiers[cursor], exports.Precedence.Sequence, E_TTT)
                ]);
                ++cursor;
            }
            if (stmt.specifiers[cursor]) {
                if (cursor !== 0) {
                    result.push(',');
                }
                if (stmt.specifiers[cursor].type === estraverse_1.Syntax.ImportNamespaceSpecifier) {
                    // NameSpaceImport
                    result = join(result, [
                        space,
                        this.generateExpression(stmt.specifiers[cursor], exports.Precedence.Sequence, E_TTT)
                    ]);
                }
                else {
                    // NamedImports
                    result.push(space + '{');
                    if ((stmt.specifiers.length - cursor) === 1) {
                        // import { ... } from "...";
                        result.push(space);
                        result.push(this.generateExpression(stmt.specifiers[cursor], exports.Precedence.Sequence, E_TTT));
                        result.push(space + '}' + space);
                    }
                    else {
                        // import {
                        //    ...,
                        //    ...,
                        // } from "...";
                        withIndent(function (indent) {
                            var i, iz;
                            result.push(newline);
                            for (i = cursor, iz = stmt.specifiers.length; i < iz; ++i) {
                                result.push(indent);
                                result.push(that.generateExpression(stmt.specifiers[i], exports.Precedence.Sequence, E_TTT));
                                if (i + 1 < iz) {
                                    result.push(',' + newline);
                                }
                            }
                        });
                        if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                            result.push(newline);
                        }
                        result.push(base + '}' + space);
                    }
                }
            }
            result = join(result, [
                'from' + space,
                // ModuleSpecifier
                this.generateExpression(stmt.source, exports.Precedence.Sequence, E_TTT),
                this.semicolon(flags)
            ]);
            return result;
        },
        VariableDeclarator: function (stmt, flags) {
            var itemFlags = (flags & F_ALLOW_IN) ? E_TTT : E_FTT;
            if (stmt.init) {
                return [
                    this.generateExpression(stmt.id, exports.Precedence.Assignment, itemFlags),
                    space,
                    '=',
                    space,
                    this.generateExpression(stmt.init, exports.Precedence.Assignment, itemFlags)
                ];
            }
            return this.generatePattern(stmt.id, exports.Precedence.Assignment, itemFlags);
        },
        VariableDeclaration: function (stmt, flags) {
            // VariableDeclarator is typed as Statement,
            // but joined with comma (not LineTerminator).
            // So if comment is attached to target node, we should specialize.
            var result, i, iz, node, bodyFlags, that = this;
            result = [stmt.kind];
            bodyFlags = (flags & F_ALLOW_IN) ? S_TFFF : S_FFFF;
            function block() {
                node = stmt.declarations[0];
                if (extra.comment && node.leadingComments) {
                    result.push('\n');
                    result.push(addIndent(that.generateStatement(node, bodyFlags)));
                }
                else {
                    result.push(noEmptySpace());
                    result.push(that.generateStatement(node, bodyFlags));
                }
                for (i = 1, iz = stmt.declarations.length; i < iz; ++i) {
                    node = stmt.declarations[i];
                    if (extra.comment && node.leadingComments) {
                        result.push(',' + newline);
                        result.push(addIndent(that.generateStatement(node, bodyFlags)));
                    }
                    else {
                        result.push(',' + space);
                        result.push(that.generateStatement(node, bodyFlags));
                    }
                }
            }
            if (stmt.declarations.length > 1) {
                withIndent(block);
            }
            else {
                block();
            }
            result.push(this.semicolon(flags));
            return result;
        },
        ThrowStatement: function (stmt, flags) {
            return [join('throw', this.generateExpression(stmt.argument, exports.Precedence.Sequence, E_TTT)), this.semicolon(flags)];
        },
        TryStatement: function (stmt, flags) {
            var result, i, iz, guardedHandlers;
            result = ['try', this.maybeBlock(stmt.block, S_TFFF)];
            result = this.maybeBlockSuffix(stmt.block, result);
            if (stmt.handlers) {
                // old interface
                for (i = 0, iz = stmt.handlers.length; i < iz; ++i) {
                    result = join(result, this.generateStatement(stmt.handlers[i], S_TFFF));
                    if (stmt.finalizer || i + 1 !== iz) {
                        result = this.maybeBlockSuffix(stmt.handlers[i].body, result);
                    }
                }
            }
            else {
                guardedHandlers = stmt.guardedHandlers || [];
                for (i = 0, iz = guardedHandlers.length; i < iz; ++i) {
                    result = join(result, this.generateStatement(guardedHandlers[i], S_TFFF));
                    if (stmt.finalizer || i + 1 !== iz) {
                        result = this.maybeBlockSuffix(guardedHandlers[i].body, result);
                    }
                }
                // new interface
                if (stmt.handler) {
                    if (isArray(stmt.handler)) {
                        for (i = 0, iz = stmt.handler.length; i < iz; ++i) {
                            result = join(result, this.generateStatement(stmt.handler[i], S_TFFF));
                            if (stmt.finalizer || i + 1 !== iz) {
                                result = this.maybeBlockSuffix(stmt.handler[i].body, result);
                            }
                        }
                    }
                    else {
                        result = join(result, this.generateStatement(stmt.handler, S_TFFF));
                        if (stmt.finalizer) {
                            result = this.maybeBlockSuffix(stmt.handler.body, result);
                        }
                    }
                }
            }
            if (stmt.finalizer) {
                result = join(result, ['finally', this.maybeBlock(stmt.finalizer, S_TFFF)]);
            }
            return result;
        },
        SwitchStatement: function (stmt, flags) {
            var result, fragment, i, iz, bodyFlags, that = this;
            withIndent(function () {
                result = [
                    'switch' + space + '(',
                    that.generateExpression(stmt.discriminant, exports.Precedence.Sequence, E_TTT),
                    ')' + space + '{' + newline
                ];
            });
            if (stmt.cases) {
                bodyFlags = S_TFFF;
                for (i = 0, iz = stmt.cases.length; i < iz; ++i) {
                    if (i === iz - 1) {
                        bodyFlags |= F_SEMICOLON_OPT;
                    }
                    fragment = addIndent(this.generateStatement(stmt.cases[i], bodyFlags));
                    result.push(fragment);
                    if (!endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            }
            result.push(addIndent('}'));
            return result;
        },
        SwitchCase: function (stmt, flags) {
            var result, fragment, i, iz, bodyFlags, that = this;
            withIndent(function () {
                if (stmt.test) {
                    result = [
                        join('case', that.generateExpression(stmt.test, exports.Precedence.Sequence, E_TTT)),
                        ':'
                    ];
                }
                else {
                    result = ['default:'];
                }
                i = 0;
                iz = stmt.consequent.length;
                if (iz && stmt.consequent[0].type === estraverse_1.Syntax.BlockStatement) {
                    fragment = that.maybeBlock(stmt.consequent[0], S_TFFF);
                    result.push(fragment);
                    i = 1;
                }
                if (i !== iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                    result.push(newline);
                }
                bodyFlags = S_TFFF;
                for (; i < iz; ++i) {
                    if (i === iz - 1 && flags & F_SEMICOLON_OPT) {
                        bodyFlags |= F_SEMICOLON_OPT;
                    }
                    fragment = addIndent(that.generateStatement(stmt.consequent[i], bodyFlags));
                    result.push(fragment);
                    if (i + 1 !== iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                        result.push(newline);
                    }
                }
            });
            return result;
        },
        IfStatement: function (stmt, flags) {
            var result, bodyFlags, semicolonOptional, that = this;
            withIndent(function () {
                result = [
                    'if' + space + '(',
                    that.generateExpression(stmt.test, exports.Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            semicolonOptional = flags & F_SEMICOLON_OPT;
            bodyFlags = S_TFFF;
            if (semicolonOptional) {
                bodyFlags |= F_SEMICOLON_OPT;
            }
            if (stmt.alternate) {
                result.push(this.maybeBlock(stmt.consequent, S_TFFF));
                result = this.maybeBlockSuffix(stmt.consequent, result);
                if (stmt.alternate.type === estraverse_1.Syntax.IfStatement) {
                    result = join(result, ['else ', this.generateStatement(stmt.alternate, bodyFlags)]);
                }
                else {
                    result = join(result, join('else', this.maybeBlock(stmt.alternate, bodyFlags)));
                }
            }
            else {
                result.push(this.maybeBlock(stmt.consequent, bodyFlags));
            }
            return result;
        },
        ForStatement: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                result = ['for' + space + '('];
                if (stmt.init) {
                    if (stmt.init.type === estraverse_1.Syntax.VariableDeclaration) {
                        result.push(that.generateStatement(stmt.init, S_FFFF));
                    }
                    else {
                        // F_ALLOW_IN becomes false.
                        result.push(that.generateExpression(stmt.init, exports.Precedence.Sequence, E_FTT));
                        result.push(';');
                    }
                }
                else {
                    result.push(';');
                }
                if (stmt.test) {
                    result.push(space);
                    result.push(that.generateExpression(stmt.test, exports.Precedence.Sequence, E_TTT));
                    result.push(';');
                }
                else {
                    result.push(';');
                }
                if (stmt.update) {
                    result.push(space);
                    result.push(that.generateExpression(stmt.update, exports.Precedence.Sequence, E_TTT));
                    result.push(')');
                }
                else {
                    result.push(')');
                }
            });
            result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
            return result;
        },
        ForInStatement: function (stmt, flags) {
            return this.generateIterationForStatement('in', stmt, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF);
        },
        ForOfStatement: function (stmt, flags) {
            return this.generateIterationForStatement('of', stmt, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF);
        },
        LabeledStatement: function (stmt, flags) {
            return [stmt.label.name + ':', this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF)];
        },
        Program: function (stmt, flags) {
            var result, fragment, i, iz, bodyFlags;
            iz = stmt.body.length;
            result = [safeConcatenation && iz > 0 ? '\n' : ''];
            bodyFlags = S_TFTF;
            for (i = 0; i < iz; ++i) {
                if (!safeConcatenation && i === iz - 1) {
                    bodyFlags |= F_SEMICOLON_OPT;
                }
                if (preserveBlankLines) {
                    // handle spaces before the first line
                    if (i === 0) {
                        if (!stmt.body[0].leadingComments) {
                            generateBlankLines(stmt.range[0], stmt.body[i].range[0], result);
                        }
                    }
                    // handle spaces between lines
                    if (i > 0) {
                        if (!stmt.body[i - 1].trailingComments && !stmt.body[i].leadingComments) {
                            generateBlankLines(stmt.body[i - 1].range[1], stmt.body[i].range[0], result);
                        }
                    }
                }
                fragment = addIndent(this.generateStatement(stmt.body[i], bodyFlags));
                result.push(fragment);
                if (i + 1 < iz && !endsWithLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    if (preserveBlankLines) {
                        if (!stmt.body[i + 1].leadingComments) {
                            result.push(newline);
                        }
                    }
                    else {
                        result.push(newline);
                    }
                }
                if (preserveBlankLines) {
                    // handle spaces after the last line
                    if (i === iz - 1) {
                        if (!stmt.body[i].trailingComments) {
                            generateBlankLines(stmt.body[i].range[1], stmt.range[1], result);
                        }
                    }
                }
            }
            return result;
        },
        FunctionDeclaration: function (stmt, flags) {
            return [
                generateAsyncPrefix(stmt, true),
                'function',
                generateStarSuffix(stmt) || noEmptySpace(),
                generateIdentifier(stmt.id),
                this.generateFunctionBody(stmt)
            ];
        },
        ReturnStatement: function (stmt, flags) {
            if (stmt.argument) {
                return [join('return', this.generateExpression(stmt.argument, exports.Precedence.Sequence, E_TTT)), this.semicolon(flags)];
            }
            return ['return' + this.semicolon(flags)];
        },
        WhileStatement: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                result = [
                    'while' + space + '(',
                    that.generateExpression(stmt.test, exports.Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
            return result;
        },
        WithStatement: function (stmt, flags) {
            var result, that = this;
            withIndent(function () {
                result = [
                    'with' + space + '(',
                    that.generateExpression(stmt.object, exports.Precedence.Sequence, E_TTT),
                    ')'
                ];
            });
            result.push(this.maybeBlock(stmt.body, flags & F_SEMICOLON_OPT ? S_TFFT : S_TFFF));
            return result;
        }
    };
    merge(CodeGenerator.prototype, CodeGenerator.Statement);
    // Expressions.
    CodeGenerator.Expression = {
        SequenceExpression: function (expr, precedence, flags) {
            var result, i, iz;
            if (exports.Precedence.Sequence < precedence) {
                flags |= F_ALLOW_IN;
            }
            result = [];
            for (i = 0, iz = expr.expressions.length; i < iz; ++i) {
                result.push(this.generateExpression(expr.expressions[i], exports.Precedence.Assignment, flags));
                if (i + 1 < iz) {
                    result.push(',' + space);
                }
            }
            return parenthesize(result, exports.Precedence.Sequence, precedence);
        },
        AssignmentExpression: function (expr, precedence, flags) {
            return this.generateAssignment(expr.left, expr.right, expr.operator, precedence, flags);
        },
        ArrowFunctionExpression: function (expr, precedence, flags) {
            return parenthesize(this.generateFunctionBody(expr), exports.Precedence.ArrowFunction, precedence);
        },
        ConditionalExpression: function (expr, precedence, flags) {
            if (exports.Precedence.Conditional < precedence) {
                flags |= F_ALLOW_IN;
            }
            return parenthesize([
                this.generateExpression(expr.test, exports.Precedence.LogicalOR, flags),
                space + '?' + space,
                this.generateExpression(expr.consequent, exports.Precedence.Assignment, flags),
                space + ':' + space,
                this.generateExpression(expr.alternate, exports.Precedence.Assignment, flags)
            ], exports.Precedence.Conditional, precedence);
        },
        LogicalExpression: function (expr, precedence, flags) {
            return this.BinaryExpression(expr, precedence, flags);
        },
        BinaryExpression: function (expr, precedence, flags) {
            var result, currentPrecedence, fragment, leftSource;
            currentPrecedence = BinaryPrecedence[expr.operator];
            if (currentPrecedence < precedence) {
                flags |= F_ALLOW_IN;
            }
            fragment = this.generateExpression(expr.left, currentPrecedence, flags);
            leftSource = fragment.toString();
            if (leftSource.charCodeAt(leftSource.length - 1) === 0x2F /* / */ && code_2.isIdentifierPartES6(expr.operator.charCodeAt(0))) {
                result = [fragment, noEmptySpace(), expr.operator];
            }
            else {
                result = join(fragment, expr.operator);
            }
            fragment = this.generateExpression(expr.right, currentPrecedence + 1, flags);
            if (expr.operator === '/' && fragment.toString().charAt(0) === '/' ||
                expr.operator.slice(-1) === '<' && fragment.toString().slice(0, 3) === '!--') {
                // If '/' concats with '/' or `<` concats with `!--`, it is interpreted as comment start
                result.push(noEmptySpace());
                result.push(fragment);
            }
            else {
                result = join(result, fragment);
            }
            if (expr.operator === 'in' && !(flags & F_ALLOW_IN)) {
                return ['(', result, ')'];
            }
            return parenthesize(result, currentPrecedence, precedence);
        },
        CallExpression: function (expr, precedence, flags) {
            var result, i, iz;
            // F_ALLOW_UNPARATH_NEW becomes false.
            result = [this.generateExpression(expr.callee, exports.Precedence.Call, E_TTF)];
            result.push('(');
            for (i = 0, iz = expr['arguments'].length; i < iz; ++i) {
                result.push(this.generateExpression(expr['arguments'][i], exports.Precedence.Assignment, E_TTT));
                if (i + 1 < iz) {
                    result.push(',' + space);
                }
            }
            result.push(')');
            if (!(flags & F_ALLOW_CALL)) {
                return ['(', result, ')'];
            }
            return parenthesize(result, exports.Precedence.Call, precedence);
        },
        NewExpression: function (expr, precedence, flags) {
            var result, length, i, iz, itemFlags;
            length = expr['arguments'].length;
            // F_ALLOW_CALL becomes false.
            // F_ALLOW_UNPARATH_NEW may become false.
            itemFlags = (flags & F_ALLOW_UNPARATH_NEW && !parentheses && length === 0) ? E_TFT : E_TFF;
            result = join('new', this.generateExpression(expr.callee, exports.Precedence.New, itemFlags));
            if (!(flags & F_ALLOW_UNPARATH_NEW) || parentheses || length > 0) {
                result.push('(');
                for (i = 0, iz = length; i < iz; ++i) {
                    result.push(this.generateExpression(expr['arguments'][i], exports.Precedence.Assignment, E_TTT));
                    if (i + 1 < iz) {
                        result.push(',' + space);
                    }
                }
                result.push(')');
            }
            return parenthesize(result, exports.Precedence.New, precedence);
        },
        MemberExpression: function (expr, precedence, flags) {
            var result, fragment;
            // F_ALLOW_UNPARATH_NEW becomes false.
            result = [this.generateExpression(expr.object, exports.Precedence.Call, (flags & F_ALLOW_CALL) ? E_TTF : E_TFF)];
            if (expr.computed) {
                result.push('[');
                result.push(this.generateExpression(expr.property, exports.Precedence.Sequence, flags & F_ALLOW_CALL ? E_TTT : E_TFT));
                result.push(']');
            }
            else {
                if (expr.object.type === estraverse_1.Syntax.Literal && typeof expr.object.value === 'number') {
                    fragment = toSourceNodeWhenNeeded(result).toString();
                    // When the following conditions are all true,
                    //   1. No floating point
                    //   2. Don't have exponents
                    //   3. The last character is a decimal digit
                    //   4. Not hexadecimal OR octal number literal
                    // we should add a floating point.
                    if (fragment.indexOf('.') < 0 &&
                        !/[eExX]/.test(fragment) &&
                        code_1.isDecimalDigit(fragment.charCodeAt(fragment.length - 1)) &&
                        !(fragment.length >= 2 && fragment.charCodeAt(0) === 48) // '0'
                    ) {
                        result.push('.');
                    }
                }
                result.push('.');
                result.push(generateIdentifier(expr.property));
            }
            return parenthesize(result, exports.Precedence.Member, precedence);
        },
        UnaryExpression: function (expr, precedence, flags) {
            var result, fragment, rightCharCode, leftSource, leftCharCode;
            fragment = this.generateExpression(expr.argument, exports.Precedence.Unary, E_TTT);
            if (space === '') {
                result = join(expr.operator, fragment);
            }
            else {
                result = [expr.operator];
                if (expr.operator.length > 2) {
                    // delete, void, typeof
                    // get `typeof []`, not `typeof[]`
                    result = join(result, fragment);
                }
                else {
                    // Prevent inserting spaces between operator and argument if it is unnecessary
                    // like, `!cond`
                    leftSource = toSourceNodeWhenNeeded(result).toString();
                    leftCharCode = leftSource.charCodeAt(leftSource.length - 1);
                    rightCharCode = fragment.toString().charCodeAt(0);
                    if (((leftCharCode === 0x2B /* + */ || leftCharCode === 0x2D /* - */) && leftCharCode === rightCharCode) ||
                        (code_2.isIdentifierPartES6(leftCharCode) && code_2.isIdentifierPartES6(rightCharCode))) {
                        result.push(noEmptySpace());
                        result.push(fragment);
                    }
                    else {
                        result.push(fragment);
                    }
                }
            }
            return parenthesize(result, exports.Precedence.Unary, precedence);
        },
        YieldExpression: function (expr, precedence, flags) {
            var result;
            if (expr.delegate) {
                result = 'yield*';
            }
            else {
                result = 'yield';
            }
            if (expr.argument) {
                result = join(result, this.generateExpression(expr.argument, exports.Precedence.Yield, E_TTT));
            }
            return parenthesize(result, exports.Precedence.Yield, precedence);
        },
        AwaitExpression: function (expr, precedence, flags) {
            var result = join(expr.delegate ? 'await*' : 'await', this.generateExpression(expr.argument, exports.Precedence.Await, E_TTT));
            return parenthesize(result, exports.Precedence.Await, precedence);
        },
        UpdateExpression: function (expr, precedence, flags) {
            if (expr.prefix) {
                return parenthesize([
                    expr.operator,
                    this.generateExpression(expr.argument, exports.Precedence.Unary, E_TTT)
                ], exports.Precedence.Unary, precedence);
            }
            return parenthesize([
                this.generateExpression(expr.argument, exports.Precedence.Postfix, E_TTT),
                expr.operator
            ], exports.Precedence.Postfix, precedence);
        },
        FunctionExpression: function (expr, precedence, flags) {
            var result = [
                generateAsyncPrefix(expr, true),
                'function'
            ];
            if (expr.id) {
                result.push(generateStarSuffix(expr) || noEmptySpace());
                result.push(generateIdentifier(expr.id));
            }
            else {
                result.push(generateStarSuffix(expr) || space);
            }
            result.push(this.generateFunctionBody(expr));
            return result;
        },
        ExportBatchSpecifier: function (expr, precedence, flags) {
            return '*';
        },
        ArrayPattern: function (expr, precedence, flags) {
            return this.ArrayExpression(expr, precedence, flags);
        },
        ArrayExpression: function (expr, precedence, flags) {
            var result, multiline, that = this;
            if (!expr.elements.length) {
                return '[]';
            }
            multiline = expr.elements.length > 1;
            result = ['[', multiline ? newline : ''];
            withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = expr.elements.length; i < iz; ++i) {
                    if (!expr.elements[i]) {
                        if (multiline) {
                            result.push(indent);
                        }
                        if (i + 1 === iz) {
                            result.push(',');
                        }
                    }
                    else {
                        result.push(multiline ? indent : '');
                        result.push(that.generateExpression(expr.elements[i], exports.Precedence.Assignment, E_TTT));
                    }
                    if (i + 1 < iz) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });
            if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '');
            result.push(']');
            return result;
        },
        ClassExpression: function (expr, precedence, flags) {
            var result, fragment;
            result = ['class'];
            if (expr.id) {
                result = join(result, this.generateExpression(expr.id, exports.Precedence.Sequence, E_TTT));
            }
            if (expr.superClass) {
                fragment = join('extends', this.generateExpression(expr.superClass, exports.Precedence.Assignment, E_TTT));
                result = join(result, fragment);
            }
            result.push(space);
            result.push(this.generateStatement(expr.body, S_TFFT));
            return result;
        },
        MethodDefinition: function (expr, precedence, flags) {
            var result, fragment;
            if (expr['static']) {
                result = ['static' + space];
            }
            else {
                result = [];
            }
            if (expr.kind === 'get' || expr.kind === 'set') {
                fragment = [
                    join(expr.kind, this.generatePropertyKey(expr.key, expr.computed)),
                    this.generateFunctionBody(expr.value)
                ];
            }
            else {
                fragment = [
                    generateMethodPrefix(expr),
                    this.generatePropertyKey(expr.key, expr.computed),
                    this.generateFunctionBody(expr.value)
                ];
            }
            return join(result, fragment);
        },
        Property: function (expr, precedence, flags) {
            if (expr.kind === 'get' || expr.kind === 'set') {
                return [
                    expr.kind, noEmptySpace(),
                    this.generatePropertyKey(expr.key, expr.computed),
                    this.generateFunctionBody(expr.value)
                ];
            }
            if (expr.shorthand) {
                return this.generatePropertyKey(expr.key, expr.computed);
            }
            if (expr.method) {
                return [
                    generateMethodPrefix(expr),
                    this.generatePropertyKey(expr.key, expr.computed),
                    this.generateFunctionBody(expr.value)
                ];
            }
            return [
                this.generatePropertyKey(expr.key, expr.computed),
                ':' + space,
                this.generateExpression(expr.value, exports.Precedence.Assignment, E_TTT)
            ];
        },
        ObjectExpression: function (expr, precedence, flags) {
            var multiline, result, fragment, that = this;
            if (!expr.properties.length) {
                return '{}';
            }
            multiline = expr.properties.length > 1;
            withIndent(function () {
                fragment = that.generateExpression(expr.properties[0], exports.Precedence.Sequence, E_TTT);
            });
            if (!multiline) {
                // issues 4
                // Do not transform from
                //   dejavu.Class.declare({
                //       method2: function () {}
                //   });
                // to
                //   dejavu.Class.declare({method2: function () {
                //       }});
                if (!hasLineTerminator(toSourceNodeWhenNeeded(fragment).toString())) {
                    return ['{', space, fragment, space, '}'];
                }
            }
            withIndent(function (indent) {
                var i, iz;
                result = ['{', newline, indent, fragment];
                if (multiline) {
                    result.push(',' + newline);
                    for (i = 1, iz = expr.properties.length; i < iz; ++i) {
                        result.push(indent);
                        result.push(that.generateExpression(expr.properties[i], exports.Precedence.Sequence, E_TTT));
                        if (i + 1 < iz) {
                            result.push(',' + newline);
                        }
                    }
                }
            });
            if (!endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(base);
            result.push('}');
            return result;
        },
        ObjectPattern: function (expr, precedence, flags) {
            var result, i, iz, multiline, property, that = this;
            if (!expr.properties.length) {
                return '{}';
            }
            multiline = false;
            if (expr.properties.length === 1) {
                property = expr.properties[0];
                if (property.value.type !== estraverse_1.Syntax.Identifier) {
                    multiline = true;
                }
            }
            else {
                for (i = 0, iz = expr.properties.length; i < iz; ++i) {
                    property = expr.properties[i];
                    if (!property.shorthand) {
                        multiline = true;
                        break;
                    }
                }
            }
            result = ['{', multiline ? newline : ''];
            withIndent(function (indent) {
                var i, iz;
                for (i = 0, iz = expr.properties.length; i < iz; ++i) {
                    result.push(multiline ? indent : '');
                    result.push(that.generateExpression(expr.properties[i], exports.Precedence.Sequence, E_TTT));
                    if (i + 1 < iz) {
                        result.push(',' + (multiline ? newline : space));
                    }
                }
            });
            if (multiline && !endsWithLineTerminator(toSourceNodeWhenNeeded(result).toString())) {
                result.push(newline);
            }
            result.push(multiline ? base : '');
            result.push('}');
            return result;
        },
        ThisExpression: function (expr, precedence, flags) {
            return 'this';
        },
        Identifier: function (expr, precedence, flags) {
            return generateIdentifier(expr);
        },
        ImportDefaultSpecifier: function (expr, precedence, flags) {
            return generateIdentifier(expr.id);
        },
        ImportNamespaceSpecifier: function (expr, precedence, flags) {
            var result = ['*'];
            if (expr.id) {
                result.push(space + 'as' + noEmptySpace() + generateIdentifier(expr.id));
            }
            return result;
        },
        ImportSpecifier: function (expr, precedence, flags) {
            return this.ExportSpecifier(expr, precedence, flags);
        },
        ExportSpecifier: function (expr, precedence, flags) {
            var result = [expr.id.name];
            if (expr.name) {
                result.push(noEmptySpace() + 'as' + noEmptySpace() + generateIdentifier(expr.name));
            }
            return result;
        },
        Literal: function (expr, precedence, flags) {
            var raw;
            if (expr.hasOwnProperty('raw') && parse && extra.raw) {
                try {
                    raw = parse(expr.raw).body[0].expression;
                    if (raw.type === estraverse_1.Syntax.Literal) {
                        if (raw.value === expr.value) {
                            return expr.raw;
                        }
                    }
                }
                catch (e) {
                }
            }
            if (expr.value === null) {
                return 'null';
            }
            if (typeof expr.value === 'string') {
                return escapeString(expr.value);
            }
            if (typeof expr.value === 'number') {
                return generateNumber(expr.value);
            }
            if (typeof expr.value === 'boolean') {
                return expr.value ? 'true' : 'false';
            }
            return generateRegExp(expr.value);
        },
        GeneratorExpression: function (expr, precedence, flags) {
            return this.ComprehensionExpression(expr, precedence, flags);
        },
        ComprehensionExpression: function (expr, precedence, flags) {
            // GeneratorExpression should be parenthesized with (...), ComprehensionExpression with [...]
            // Due to https://bugzilla.mozilla.org/show_bug.cgi?id=883468 position of expr.body can differ in Spidermonkey and ES6
            var result, i, iz, fragment, that = this;
            result = (expr.type === estraverse_1.Syntax.GeneratorExpression) ? ['('] : ['['];
            if (extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = this.generateExpression(expr.body, exports.Precedence.Assignment, E_TTT);
                result.push(fragment);
            }
            if (expr.blocks) {
                withIndent(function () {
                    for (i = 0, iz = expr.blocks.length; i < iz; ++i) {
                        fragment = that.generateExpression(expr.blocks[i], exports.Precedence.Sequence, E_TTT);
                        if (i > 0 || extra.moz.comprehensionExpressionStartsWithAssignment) {
                            result = join(result, fragment);
                        }
                        else {
                            result.push(fragment);
                        }
                    }
                });
            }
            if (expr.filter) {
                result = join(result, 'if' + space);
                fragment = this.generateExpression(expr.filter, exports.Precedence.Sequence, E_TTT);
                result = join(result, ['(', fragment, ')']);
            }
            if (!extra.moz.comprehensionExpressionStartsWithAssignment) {
                fragment = this.generateExpression(expr.body, exports.Precedence.Assignment, E_TTT);
                result = join(result, fragment);
            }
            result.push((expr.type === estraverse_1.Syntax.GeneratorExpression) ? ')' : ']');
            return result;
        },
        ComprehensionBlock: function (expr, precedence, flags) {
            var fragment;
            if (expr.left.type === estraverse_1.Syntax.VariableDeclaration) {
                fragment = [
                    expr.left.kind, noEmptySpace(),
                    this.generateStatement(expr.left.declarations[0], S_FFFF)
                ];
            }
            else {
                fragment = this.generateExpression(expr.left, exports.Precedence.Call, E_TTT);
            }
            fragment = join(fragment, expr.of ? 'of' : 'in');
            fragment = join(fragment, this.generateExpression(expr.right, exports.Precedence.Sequence, E_TTT));
            return ['for' + space + '(', fragment, ')'];
        },
        SpreadElement: function (expr, precedence, flags) {
            return [
                '...',
                this.generateExpression(expr.argument, exports.Precedence.Assignment, E_TTT)
            ];
        },
        TaggedTemplateExpression: function (expr, precedence, flags) {
            var itemFlags = E_TTF;
            if (!(flags & F_ALLOW_CALL)) {
                itemFlags = E_TFF;
            }
            var result = [
                this.generateExpression(expr.tag, exports.Precedence.Call, itemFlags),
                this.generateExpression(expr.quasi, exports.Precedence.Primary, E_FFT)
            ];
            return parenthesize(result, exports.Precedence.TaggedTemplate, precedence);
        },
        TemplateElement: function (expr, precedence, flags) {
            // Don't use "cooked". Since tagged template can use raw template
            // representation. So if we do so, it breaks the script semantics.
            return expr.value.raw;
        },
        TemplateLiteral: function (expr, precedence, flags) {
            var result, i, iz;
            result = ['`'];
            for (i = 0, iz = expr.quasis.length; i < iz; ++i) {
                result.push(this.generateExpression(expr.quasis[i], exports.Precedence.Primary, E_TTT));
                if (i + 1 < iz) {
                    result.push('${' + space);
                    result.push(this.generateExpression(expr.expressions[i], exports.Precedence.Sequence, E_TTT));
                    result.push(space + '}');
                }
            }
            result.push('`');
            return result;
        },
        ModuleSpecifier: function (expr, precedence, flags) {
            return this.Literal(expr, precedence, flags);
        }
    };
    merge(CodeGenerator.prototype, CodeGenerator.Expression);
    function generateInternal(node) {
        var codegen;
        codegen = new CodeGenerator();
        if (isStatement(node)) {
            return codegen.generateStatement(node, S_TFFF);
        }
        if (isExpression(node)) {
            return codegen.generateExpression(node, exports.Precedence.Sequence, E_TTT);
        }
        throw new Error('Unknown node type: ' + node.type);
    }
    function generate(node, options) {
        var defaultOptions = getDefaultOptions(), result, pair;
        if (options != null) {
            // Obsolete options
            //
            //   `options.indent`
            //   `options.base`
            //
            // Instead of them, we can use `option.format.indent`.
            if (typeof options.indent === 'string') {
                defaultOptions.format.indent.style = options.indent;
            }
            if (typeof options.base === 'number') {
                defaultOptions.format.indent.base = options.base;
            }
            options = updateDeeply(defaultOptions, options);
            indent = options.format.indent.style;
            if (typeof options.base === 'string') {
                base = options.base;
            }
            else {
                base = stringRepeat(indent, options.format.indent.base);
            }
        }
        else {
            options = defaultOptions;
            indent = options.format.indent.style;
            base = stringRepeat(indent, options.format.indent.base);
        }
        json = options.format.json;
        renumber = options.format.renumber;
        hexadecimal = json ? false : options.format.hexadecimal;
        quotes = json ? 'double' : options.format.quotes;
        escapeless = options.format.escapeless;
        newline = options.format.newline;
        space = options.format.space;
        if (options.format.compact) {
            newline = space = indent = base = '';
        }
        parentheses = options.format.parentheses;
        semicolons = options.format.semicolons;
        safeConcatenation = options.format.safeConcatenation;
        directive = options.directive;
        parse = json ? null : options.parse;
        sourceMap = options.sourceMap;
        sourceCode = options.sourceCode;
        preserveBlankLines = options.format.preserveBlankLines && sourceCode !== null;
        extra = options;
        result = generateInternal(node);
        if (!sourceMap) {
            pair = { code: result.toString(), map: null };
            return options.sourceMapWithCode ? pair : pair.code;
        }
        pair = result.toStringWithSourceMap({
            file: options.file,
            sourceRoot: options.sourceMapRoot
        });
        if (options.sourceContent) {
            pair.map.setSourceContent(options.sourceMap, options.sourceContent);
        }
        if (options.sourceMapWithCode) {
            return pair;
        }
        return pair.map.toString();
    }
    exports.generate = generate;
    exports.FORMAT_MINIFY = {
        indent: {
            style: '',
            base: 0
        },
        renumber: true,
        hexadecimal: true,
        quotes: 'auto',
        escapeless: true,
        compact: true,
        parentheses: false,
        semicolons: false
    };
    exports.FORMAT_DEFAULTS = getDefaultOptions().format;
});

define('mstools/mathscript',["require", "exports", '../estools/esprima', '../estools/escodegen'], function (require, exports, esprima_1, escodegen_1) {
    "use strict";
    // import escodegen = require('davinci-mathscript/escodegen');
    // i mport estraverse = require('davinci-mathscript/estraverse');
    // import esutils = require('davinci-mathscript/esutils');
    /**
     * Provides the MathScript module
     *
     * @module mathscript
     */
    // This should match the global namespace (in build.js).
    var MATHSCRIPT_NAMESPACE = "Ms";
    // We're not really interested in those operators to do with ordering because many
    // interesting mathematical structures don't have an ordering relation.
    // In the following table, the first string is the operator symbol and the second
    // string is the name of the function in the MATHSCRIPT_NAMESPACE.
    var binOp = {
        '+': 'add',
        '-': 'sub',
        '*': 'mul',
        '/': 'div',
        '|': 'vbar',
        '^': 'wedge',
        '<<': 'lshift',
        '>>': 'rshift',
        '%': 'mod',
        '===': 'eq',
        '!==': 'ne'
    };
    // The increment and decrement operators are problematic from a timing perspective.
    var unaryOp = {
        '+': 'pos',
        '-': 'neg',
        '!': 'bang',
        '~': 'tilde' /*,'++':'increment','--':'decrement'*/
    };
    function parse(code, options) {
        var tree = esprima_1.parse(code, options);
        // console.log(JSON.stringify(tree), null, '\t');
        visit(tree);
        return tree;
    }
    exports.parse = parse;
    function transpile(code, options) {
        var tree = parse(code, options);
        return escodegen_1.generate(tree, null);
    }
    exports.transpile = transpile;
    function visit(node) {
        if (node && node.type) {
            switch (node.type) {
                case 'BlockStatement':
                    {
                        node.body.forEach(function (part, index) { visit(part); });
                    }
                    break;
                case 'FunctionDeclaration':
                    {
                        node.params.forEach(function (param, index) { visit(param); });
                        visit(node.body);
                    }
                    break;
                case 'Program':
                    {
                        node.body.forEach(function (node, index) {
                            visit(node);
                        });
                    }
                    break;
                case 'VariableDeclaration':
                    {
                        node.declarations.forEach(function (declaration, index) { visit(declaration); });
                    }
                    break;
                case 'VariableDeclarator':
                    {
                        if (node.init) {
                            visit(node.init);
                        }
                    }
                    break;
                case 'ConditionalExpression':
                    {
                        visit(node.test);
                        visit(node.consequent);
                        visit(node.alternate);
                    }
                    break;
                case 'BinaryExpression':
                case 'LogicalExpression':
                    {
                        if (node.operator && binOp[node.operator]) {
                            node.type = 'CallExpression';
                            node.callee = {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': { 'type': 'Identifier', 'name': MATHSCRIPT_NAMESPACE },
                                'property': {
                                    'type': 'Identifier', 'name': binOp[node.operator]
                                }
                            };
                            visit(node.left);
                            visit(node.right);
                            node['arguments'] = [node.left, node.right];
                        }
                        else {
                            visit(node.left);
                            visit(node.right);
                        }
                    }
                    break;
                case 'ExpressionStatement':
                    {
                        visit(node.expression);
                    }
                    break;
                case 'ForStatement':
                    {
                        visit(node.init);
                        visit(node.test);
                        visit(node.update);
                        visit(node.body);
                    }
                    break;
                case 'ForInStatement':
                    {
                        visit(node.left);
                        visit(node.right);
                        visit(node.body);
                    }
                    break;
                case 'IfStatement':
                    {
                        visit(node.test);
                        visit(node.consequent);
                        visit(node.alternate);
                    }
                    break;
                case 'ArrayExpression':
                    {
                        node['elements'].forEach(function (elem, index) { visit(elem); });
                    }
                    break;
                case 'AssignmentExpression':
                    {
                        if (node.operator && binOp[node.operator]) {
                            visit(node.left);
                            visit(node.right);
                        }
                        else {
                            visit(node.left);
                            visit(node.right);
                        }
                    }
                    break;
                case 'CallExpression':
                    {
                        visit(node.callee);
                        node['arguments'].forEach(function (argument, index) { visit(argument); });
                    }
                    break;
                case 'CatchClause':
                    {
                        visit(node.param);
                        visit(node.body);
                    }
                    break;
                case 'FunctionExpression':
                    {
                        visit(node.body);
                    }
                    break;
                case 'MemberExpression':
                    {
                        visit(node.object);
                    }
                    break;
                case 'NewExpression':
                    {
                        visit(node.callee);
                        node['arguments'].forEach(function (argument, index) { visit(argument); });
                    }
                    break;
                case 'ObjectExpression':
                    {
                        node['properties'].forEach(function (prop, index) { visit(prop); });
                    }
                    break;
                case 'ReturnStatement':
                    {
                        visit(node.argument);
                    }
                    break;
                case 'SequenceExpression':
                    {
                        node['expressions'].forEach(function (expr, index) { visit(expr); });
                    }
                    break;
                case 'SwitchCase':
                    {
                        visit(node.test);
                        node['consequent'].forEach(function (expr, index) { visit(expr); });
                    }
                    break;
                case 'SwitchStatement':
                    {
                        visit(node.discriminant);
                        node['cases'].forEach(function (kase, index) { visit(kase); });
                    }
                    break;
                case 'ThrowStatement':
                    {
                        visit(node.argument);
                    }
                    break;
                case 'TryStatement':
                    {
                        visit(node.block);
                        node['guardedHandlers'].forEach(function (guardedHandler, index) { visit(guardedHandler); });
                        node['handlers'].forEach(function (handler, index) { visit(handler); });
                        visit(node.finalizer);
                    }
                    break;
                case 'UnaryExpression':
                    {
                        if (node.operator && unaryOp[node.operator]) {
                            node.type = 'CallExpression';
                            node.callee = {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                    'type': 'Identifier',
                                    'name': MATHSCRIPT_NAMESPACE
                                },
                                'property': {
                                    'type': 'Identifier',
                                    'name': unaryOp[node.operator]
                                }
                            };
                            visit(node.argument);
                            node['arguments'] = [node.argument];
                        }
                        else {
                            visit(node.argument);
                        }
                    }
                    break;
                case 'UpdateExpression':
                    {
                        if (node.operator && unaryOp[node.operator]) {
                            node.type = 'CallExpression';
                            node.callee = {
                                'type': 'MemberExpression',
                                'computed': false,
                                'object': {
                                    'type': 'Identifier',
                                    'name': MATHSCRIPT_NAMESPACE
                                },
                                'property': {
                                    'type': 'Identifier',
                                    'name': unaryOp[node.operator]
                                }
                            };
                            visit(node.argument);
                            node['arguments'] = [node.argument];
                        }
                        else {
                            visit(node.argument);
                        }
                    }
                    break;
                case 'Property':
                    {
                        visit(node.key);
                        visit(node.value);
                    }
                    break;
                case 'WhileStatement':
                    {
                        visit(node.test);
                        visit(node.body);
                    }
                    break;
                case 'BreakStatement':
                case 'EmptyStatement':
                case 'Literal':
                case 'Identifier':
                case 'ThisExpression':
                case 'DebuggerStatement':
                    break;
                default: {
                    console.log(JSON.stringify(node, null, 2));
                }
            }
        }
        else {
            return;
        }
    }
    /**
     * Determines whether a property name is callable on an object.
     */
    function specialMethod(x, name) {
        return (x !== null) && (typeof x === 'object') && (typeof x[name] === 'function');
    }
    function binEval(lhs, rhs, lprop, rprop, fallback) {
        var result;
        if (specialMethod(lhs, lprop)) {
            result = lhs[lprop](rhs);
            if (typeof result !== 'undefined') {
                return result;
            }
            else {
                if (specialMethod(rhs, rprop)) {
                    result = rhs[rprop](lhs);
                    if (typeof result !== 'undefined') {
                        return result;
                    }
                }
            }
        }
        else if (specialMethod(rhs, rprop)) {
            result = rhs[rprop](lhs);
            if (typeof result !== 'undefined') {
                return result;
            }
        }
        // The fallback is for native types.
        return fallback(lhs, rhs);
    }
    function add(p, q) { return binEval(p, q, '__add__', '__radd__', function (a, b) { return a + b; }); }
    exports.add = add;
    function sub(p, q) { return binEval(p, q, '__sub__', '__rsub__', function (a, b) { return a - b; }); }
    exports.sub = sub;
    function mul(p, q) { return binEval(p, q, '__mul__', '__rmul__', function (a, b) { return a * b; }); }
    exports.mul = mul;
    function div(p, q) { return binEval(p, q, '__div__', '__rdiv__', function (a, b) { return a / b; }); }
    exports.div = div;
    function mod(p, q) { return binEval(p, q, '__mod__', '__rmod__', function (a, b) { return a % b; }); }
    exports.mod = mod;
    function bitwiseIOR(p, q) { return binEval(p, q, '__vbar__', '__rvbar__', function (a, b) { return a | b; }); }
    exports.bitwiseIOR = bitwiseIOR;
    function bitwiseXOR(p, q) { return binEval(p, q, '__wedge__', '__rwedge__', function (a, b) { return a ^ b; }); }
    exports.bitwiseXOR = bitwiseXOR;
    function lshift(p, q) { return binEval(p, q, '__lshift__', '__rlshift__', function (a, b) { return a << b; }); }
    exports.lshift = lshift;
    function rshift(p, q) { return binEval(p, q, '__rshift__', '__rrshift__', function (a, b) { return a >> b; }); }
    exports.rshift = rshift;
    function eq(p, q) { return binEval(p, q, '__eq__', '__req__', function (a, b) { return a === b; }); }
    exports.eq = eq;
    function ne(p, q) { return binEval(p, q, '__ne__', '__rne__', function (a, b) { return a !== b; }); }
    exports.ne = ne;
    function exp(x) {
        if (specialMethod(x, '__exp__')) {
            return x['__exp__']();
        }
        else {
            var s = x;
            var result = Math.exp(s);
            return result;
        }
    }
    exports.exp = exp;
    function neg(x) {
        if (specialMethod(x, '__neg__')) {
            return x['__neg__']();
        }
        else {
            return -x;
        }
    }
    exports.neg = neg;
    function pos(x) {
        if (specialMethod(x, '__pos__')) {
            return x['__pos__']();
        }
        else {
            return +x;
        }
    }
    exports.pos = pos;
    function bang(x) {
        if (specialMethod(x, '__bang__')) {
            return x['__bang__']();
        }
        else {
            return !x;
        }
    }
    exports.bang = bang;
    function tilde(x) {
        if (specialMethod(x, '__tilde__')) {
            return x['__tilde__']();
        }
        else {
            return ~x;
        }
    }
    exports.tilde = tilde;
});

define('pytools',["require", "exports", './pytools/parser', './pytools/builder', './py-to-sk/sk-compiler', './py-to-es/ts-compiler', './mstools/mathscript', './mstools/mathscript', './mstools/mathscript'], function (require, exports, parser_1, builder_1, sk_compiler_1, ts_compiler_1, mathscript_1, mathscript_2, mathscript_3) {
    "use strict";
    var pytools = {
        parser: { parse: parser_1.parse, parseTreeDump: parser_1.parseTreeDump },
        builder: { astFromParse: builder_1.astFromParse, astDump: builder_1.astDump },
        skCompiler: { compile: sk_compiler_1.compile, resetCompiler: sk_compiler_1.resetCompiler },
        tsCompiler: { compile: ts_compiler_1.compile, resetCompiler: ts_compiler_1.resetCompiler },
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

/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */ export function nullFunction() { }
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
export function abstractMethod() {
    throw Error('unimplemented abstract method');
}
// ==============================================================================
// Language Enhancements
// ==============================================================================
/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
export function typeOf(value) {
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
/**
 * Returns true if the specified value is not undefined.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
export function isDef(val) {
    return val !== undefined;
}
/**
 * Returns true if the specified value is null.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
export function isNull(val) {
    return val === null;
}
/**
 * Returns true if the specified value is defined and not null.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
export function isDefAndNotNull(val) {
    // Note that undefined == null.
    return val != null;
}
/**
 * Returns true if the specified value is an array.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
export function isArray(val) {
    return typeOf(val) === 'array';
}
/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
export function isArrayLike(val) {
    var type = typeOf(val);
    return type === 'array' || type === 'object' && typeof val.length === 'number';
}
/**
 * Returns true if the object looks like a Date. To qualify as Date-like the
 * value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
export function isDateLike(val) {
    return isObject(val) && typeof val.getFullYear === 'function';
}
/**
 * Returns true if the specified value is a string.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
export function isString(val) {
    return typeof val === 'string';
}
/**
 * Returns true if the specified value is a boolean.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
export function isBoolean(val) {
    return typeof val === 'boolean';
}
/**
 * Returns true if the specified value is a number.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
export function isNumber(val) {
    return typeof val === 'number';
}
/**
 * Returns true if the specified value is a function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
export function isFunction(val) {
    return typeOf(val) === 'function';
}
/**
 * Returns true if the specified value is an object.  This includes arrays and
 * functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
export function isObject(val) {
    var type = typeof val;
    return type === 'object' && val !== null || type === 'function';
    // return Object(val) === val also works, but is slower, especially if val is
    // not an object.
}
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
export function bindNative_(fn, selfObj, var_args) {
    return (fn.call.apply(fn.bind, arguments));
}
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
export function bindJs_(fn, selfObj, var_args) {
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
/*
export function partial(fn, var_args) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        // Prepend the bound arguments to the current arguments.
        var newArgs = Array.prototype.slice.call(arguments);
        newArgs.unshift.apply(newArgs, args);
        return fn.apply(this, newArgs);
    };
}
*/
/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use base.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
export function mixin(target, source) {
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
export function getMsg(str, opt_values) {
    var values = opt_values || {};
    for (var key in values) {
        if (values.hasOwnProperty(key)) {
            var value = ('' + values[key]).replace(/\$/g, '$$$$');
            str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
        }
    }
    return str;
}
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
export function getMsgWithFallback(a, b) {
    return a;
}
/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. base.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. base.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
export function exportProperty(object, publicName, symbol) {
    object[publicName] = symbol;
}
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
export function inherits(childCtor, parentCtor) {
    /** @constructor */
    function tempCtor() { }
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    /** @override */
    childCtor.prototype.constructor = childCtor;
}
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

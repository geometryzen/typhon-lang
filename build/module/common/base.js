/**
 * Null function used for default values of callbacks, etc.
 */
export function nullFunction() { }
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

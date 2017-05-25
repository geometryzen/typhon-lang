/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
export declare function nullFunction(): void;
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
export declare function abstractMethod(): void;
/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
export declare function typeOf(value: any): "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "null";
/**
 * Returns true if the specified value is not undefined.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
export declare function isDef(val: any): boolean;
/**
 * Returns true if the specified value is null.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
export declare function isNull(val: any): boolean;
/**
 * Returns true if the specified value is defined and not null.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
export declare function isDefAndNotNull(val: any): boolean;
/**
 * Returns true if the specified value is an array.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
export declare function isArray(val: any): boolean;
/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
export declare function isArrayLike(val: any): boolean;
/**
 * Returns true if the object looks like a Date. To qualify as Date-like the
 * value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
export declare function isDateLike(val: any): boolean;
/**
 * Returns true if the specified value is a string.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
export declare function isString(val: any): boolean;
/**
 * Returns true if the specified value is a boolean.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
export declare function isBoolean(val: any): boolean;
/**
 * Returns true if the specified value is a number.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
export declare function isNumber(val: any): boolean;
/**
 * Returns true if the specified value is a function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
export declare function isFunction(val: any): boolean;
/**
 * Returns true if the specified value is an object.  This includes arrays and
 * functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
export declare function isObject(val: any): boolean;
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
export declare function bindNative_(fn: any, selfObj: any, var_args: any): any;
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
export declare function bindJs_(fn: any, selfObj: any, var_args: any): () => any;
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
/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use base.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
export declare function mixin(target: any, source: any): void;
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
export declare function getMsg(str: string, opt_values: any): string;
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
export declare function getMsgWithFallback(a: string, b: string): string;
/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. base.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. base.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
export declare function exportProperty(object: any, publicName: any, symbol: any): void;
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
export declare function inherits(childCtor: any, parentCtor: any): void;

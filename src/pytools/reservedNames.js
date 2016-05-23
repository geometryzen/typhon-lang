define(["require", "exports"], function (require, exports) {
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

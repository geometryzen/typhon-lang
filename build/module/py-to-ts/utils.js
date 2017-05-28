export function isClassNameByConvention(name) {
    var id = name.id;
    var N = id.length;
    if (N > 0) {
        var firstChar = id[0];
        return firstChar.toUpperCase() === firstChar;
    }
    else {
        return false;
    }
}
export function isMethod(functionDef) {
    for (var i = 0; i < functionDef.args.args.length; i++) {
        if (i === 0) {
            var arg = functionDef.args.args[i];
            if (arg.id === 'self') {
                return true;
            }
        }
        else {
            return false;
        }
    }
    return false;
}

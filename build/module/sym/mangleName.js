/**
 * @param priv
 * @param name
 */
export function mangleName(priv, name) {
    var strpriv = null;
    if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_') {
        return name;
    }
    // don't mangle dunder (double underscore) names e.g. __id__.
    if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_') {
        return name;
    }
    // don't mangle classes that are all _ (obscure much?)
    strpriv = priv;
    strpriv.replace(/_/g, '');
    if (strpriv === '') {
        return name;
    }
    strpriv = priv;
    strpriv.replace(/^_*/, '');
    strpriv = '_' + strpriv + name;
    return strpriv;
}

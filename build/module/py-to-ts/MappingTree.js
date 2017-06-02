import { assert } from '../pytools/asserts';
/**
 * A tree that enables ranges in the source document to be mapped to ranges in the target document.
 * The ordering of child nodes is not defined.
 * In many cases the children will be in target order owing to the writing process.
 * TODO: For more efficient searching, children should be sorted in source order.
 */
var MappingTree = (function () {
    /**
     *
     * @param source
     * @param target
     * @param children
     */
    function MappingTree(source, target, children) {
        this.children = children;
        assert(source, "source must be defined");
        assert(target, "target must be defined");
        this.source = source;
        this.target = target;
    }
    MappingTree.prototype.offset = function (rows, cols) {
        if (this.target) {
            this.target.offset(rows, cols);
        }
        if (this.children) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                child.offset(rows, cols);
            }
        }
    };
    return MappingTree;
}());
export { MappingTree };

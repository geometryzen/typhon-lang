import { assert } from '../pytools/asserts';
var Range = (function () {
    /**
     *
     */
    function Range(begin, end) {
        assert(begin, "begin must be defined");
        assert(end, "end must be defined");
        this.begin = begin;
        this.end = end;
    }
    return Range;
}());
export { Range };

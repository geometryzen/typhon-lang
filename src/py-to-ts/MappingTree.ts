import { assert } from '../pytools/asserts';
import { Range } from '../pytools/Range';
import { MutableRange } from '../pytools/MutableRange';

export class MappingTree {
    constructor(public readonly source: Range, public target: MutableRange, public readonly children: MappingTree[]) {
        assert(source, "source must be defined");
        assert(target, "target must be defined");
    }
    offset(rows: number, cols: number) {
        if (this.target) {
            this.target.offset(rows, cols);
        }
        if (this.children) {
            for (const child of this.children) {
                child.offset(rows, cols);
            }
        }
    }
}

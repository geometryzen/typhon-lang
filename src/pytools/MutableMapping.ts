import { Range } from './Range';
import { MutableRange } from './MutableRange';

export class MutableMapping {
    public readonly source: Range;
    public target: MutableRange;
    /**
     *
     */
    constructor(source: Range, target: MutableRange) {
        this.source = source;
        this.target = target;
    }
}

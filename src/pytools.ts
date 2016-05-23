import {parse, parseTreeDump} from './pytools/parser';
import {astFromParse, astDump} from './pytools/builder';
import {compile, resetCompiler} from './pytools/sk-compiler';

const pytools = {
    parser: { parse, parseTreeDump },
    builder: { astFromParse, astDump },
    skCompiler: { compile, resetCompiler }
}
export default pytools;

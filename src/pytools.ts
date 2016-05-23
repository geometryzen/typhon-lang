import {parse, parseTreeDump} from './pytools/parser';
import {astFromParse, astDump} from './pytools/builder';
import {compile as skCompile, resetCompiler as skReset} from './pytools/sk-compiler';
import {compile as tsCompile, resetCompiler as tsReset} from './pytools/ts-compiler';

const pytools = {
    parser: { parse, parseTreeDump },
    builder: { astFromParse, astDump },
    skCompiler: { compile: skCompile, resetCompiler: skReset },
    tsCompiler: { compile: tsCompile, resetCompiler: tsReset }
}
export default pytools;

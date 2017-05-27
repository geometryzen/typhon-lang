import { /* compileExpression, */ compile/*, compileSingle*/ } from './transpiler';

const fileName = 'foo.ts';

describe('transpiler', function () {

    xdescribe("reverse engineering", function () {
        it("", function () {
            const sourceText = "123";
            const sourceFile = ts.createSourceFile("foo.ts", sourceText, ts.ScriptTarget.ES2016, true, ts.ScriptKind.TS);
            delint(sourceFile);
        });
    });

    it('should be available', function () {
        expect(typeof compile).toBe('function');
    });

    xdescribe('ImportFrom', function () {
        it('everything from a module', function () {
            const result = compile('from visual import *', fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("import * from 'visual';");
        });
    });

    xdescribe('Assign', function () {
        it('Float', function () {
            const result = compile('x = 0.01', fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("x = 0.01;");
        });
    });

    xdescribe('Assign', function () {
        it('Integer', function () {
            const result = compile('x = 1', fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("x = 1;");
        });
    });

    xdescribe('Assign', function () {
        it('String', function () {
            const result = compile("name = 'David'", fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("name = 'David';");
        });
    });

    xdescribe('Num', function () {
        it('Float', function () {
            const result = compile('0.01', fileName);
            expect(typeof result).toBe('object');
            expect(typeof result.code).toBe('string');
            expect(result.code).toBe("0.01");
        });
    });

    xdescribe('FunctionCall', function () {
        it('TODO', function () {
            const result = compile('rate(100)', fileName);
            expect(result.code).toBe("rate(100)");
        });
    });

    xdescribe('IfStatement', function () {
        it('TODO', function () {
            const result = compile('if x < 1:\n  x = 3', fileName);
            expect(result.code).toBe("if (x < 1) { x = 3 }");
        });
    });
});

function delint(sourceFile: ts.SourceFile) {
    delintNode(sourceFile);

    function delintNode(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.DoStatement:
                if ((<ts.IterationStatement>node).statement.kind !== ts.SyntaxKind.Block) {
                    report(node, "A looping statement's contents should be wrapped in a block body.");
                }
                break;

            case ts.SyntaxKind.IfStatement:
                let ifStatement = (<ts.IfStatement>node);
                if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
                    report(ifStatement.thenStatement, "An if statement's contents should be wrapped in a block body.");
                }
                if (ifStatement.elseStatement &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
                    ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement) {
                    report(ifStatement.elseStatement, "An else statement's contents should be wrapped in a block body.");
                }
                break;

            case ts.SyntaxKind.BinaryExpression:
                let op = (<ts.BinaryExpression>node).operatorToken.kind;
                if (op === ts.SyntaxKind.EqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken) {
                    report(node, "Use '===' and '!=='.");
                }
                break;
            case ts.SyntaxKind.ExpressionStatement: {
                console.log(`ExpressionStatement`);
                break;
            }
            case ts.SyntaxKind.NumericLiteral: {
                console.log(`NumericLiteral`);
                break;
            }
            case ts.SyntaxKind.SourceFile: {
                console.log(`SourceFile`);
                break;
            }
            case ts.SyntaxKind.EndOfFileToken: {
                console.log(`EndOfFileToken`);
                break;
            }
            default: {
                console.log(`Unknown kind ${node.kind}`);
            }
        }
        ts.forEachChild(node, delintNode);
    }
    function report(node: ts.Node, message: string) {
        let { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        console.log(`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`);
    }
}

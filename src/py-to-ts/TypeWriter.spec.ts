import { TypeWriter } from './TypeWriter';
import { Position } from '../pytools/Position';
import { Range } from '../pytools/Range';

describe("TypeWriter", function () {
    describe("comma", function () {
        it("should only write the comma if there is no...", function () {
            const tw = new TypeWriter();
            tw.comma(null, null);
            const result = tw.snapshot();
            const text = result.text;
            const tree = result.tree;
            expect(text).toBe(",");
            expect(tree).toBeNull();
        });
        it("should map the source range to the target range", function () {
            const tw = new TypeWriter();
            const sourceBegin = new Position(2, 3);
            const sourceEnd = new Position(5, 7);
            tw.comma(sourceBegin, sourceEnd);
            const result = tw.snapshot();
            const text = result.text;
            expect(text).toBe(",");
            const tree = result.tree;
            expect(tree.children).toBeNull();
            const source = tree.source;
            const target = tree.target;
            expect(source.begin.line).toBe(sourceBegin.line);
            expect(source.begin.column).toBe(sourceBegin.column);
            expect(source.end.line).toBe(sourceEnd.line);
            expect(source.end.column).toBe(sourceEnd.column);
            expect(target.begin.line).toBe(1);
            expect(target.begin.column).toBe(0);
            expect(target.end.line).toBe(1);
            expect(target.end.column).toBe(1);
        });
        describe("insertSpaceAfterCommaDelimiter", function () {
            it("true", function () {
                const tw = new TypeWriter({ insertSpaceAfterCommaDelimiter: true });
                tw.comma(null, null);
                expect(tw.snapshot().text).toBe(", ");
            });
            it("false", function () {
                const tw = new TypeWriter({ insertSpaceAfterCommaDelimiter: false });
                tw.comma(null, null);
                expect(tw.snapshot().text).toBe(",");
            });
        });
    });
    describe("Braces", function () {
        it("{}", function () {
            const tw = new TypeWriter();
            tw.beginObject();
            tw.endObject();
            const result = tw.snapshot();
            const text = result.text;
            const tree = result.tree;
            expect(text).toBe("{}");
            expect(tree).toBeNull();
        });
        it("{a}", function () {
            const tw = new TypeWriter();
            tw.beginObject();
            const sourceBegin = new Position(2, 3);
            const sourceEnd = new Position(5, 7);
            tw.name("a", new Range(sourceBegin, sourceEnd));
            tw.endObject();
            const result = tw.snapshot();
            const text = result.text;
            const tree = result.tree;
            expect(text).toBe("{a}");
            expect(tree.children).toBeNull();

            expect(tree.source.begin.line).toBe(sourceBegin.line);
            expect(tree.source.begin.column).toBe(sourceBegin.column);
            expect(tree.source.end.line).toBe(sourceEnd.line);
            expect(tree.source.end.column).toBe(sourceEnd.column);

            expect(tree.target.begin.line).toBe(1);
            expect(tree.target.begin.column).toBe(1);
            expect(tree.target.end.line).toBe(1);
            expect(tree.target.end.column).toBe(2);
        });
        it("[a,b]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            const aBegin = new Position(1, 1);
            const aEnd = new Position(1, 2);
            tw.name("a", new Range(aBegin, aEnd));
            tw.comma(null, null);
            const bBegin = new Position(1, 3);
            const bEnd = new Position(1, 4);
            tw.name("b", new Range(bBegin, bEnd));
            tw.endBracket();
            const result = tw.snapshot();
            const text = result.text;
            const tree = result.tree;
            console.log(JSON.stringify(tree, null, 2));
            expect(text).toBe("[a,b]");
        });
        describe("insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets", function () {
            it("true", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true });
                tw.beginBracket();
                const sourceBegin = new Position(2, 3);
                const sourceEnd = new Position(5, 7);
                tw.name("a", new Range(sourceBegin, sourceEnd));
                tw.endBracket();
                const result = tw.snapshot();
                const text = result.text;
                // const tree = result.tree;
                expect(text).toBe("[ a ]");
                // console.lg(JSON.stringify(tree, null, 2));
                // expect(tree.length).toBe(1);
            });
            it("false", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false });
                tw.beginBracket();
                tw.name("a", null);
                tw.endBracket();
                expect(tw.snapshot().text).toBe("[a]");
            });
        });
        it("[a,b]", function () {
            const tw = new TypeWriter({
                insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
                insertSpaceAfterCommaDelimiter: true
            });
            tw.beginBracket();
            const aBegin = new Position(1, 1);
            const aEnd = new Position(1, 2);
            tw.name("a", new Range(aBegin, aEnd));
            tw.comma(null, null);
            const bBegin = new Position(1, 3);
            const bEnd = new Position(1, 4);
            tw.name("b", new Range(bBegin, bEnd));
            tw.endBracket();
            const result = tw.snapshot();
            const text = result.text;
            // const tree = result.tree;
            // console.lg(JSON.stringify(tree, null, 2));
            expect(text).toBe("[a, b]");
        });
    });
    describe("Brackets", function () {
        it("[]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            tw.endBracket();
            expect(tw.snapshot().text).toBe("[]");
        });
        it("[a]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            const sourceBegin = new Position(2, 3);
            const sourceEnd = new Position(5, 7);
            tw.name("a", new Range(sourceBegin, sourceEnd));
            tw.endBracket();
            const result = tw.snapshot();
            const text = result.text;
            // const tree = result.tree;
            expect(text).toBe("[a]");
            // expect(tree.length).toBe(1);
            // console.lg(JSON.stringify(mappings));
        });
        it("[a,b]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            tw.name("a", null);
            tw.comma(null, null);
            tw.name("b", null);
            tw.endBracket();
            expect(tw.snapshot().text).toBe("[a,b]");
        });
        describe("insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets", function () {
            it("true", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true });
                tw.beginBracket();
                const sourceBegin = new Position(2, 3);
                const sourceEnd = new Position(5, 7);
                tw.name("a", new Range(sourceBegin, sourceEnd));
                tw.endBracket();
                const result = tw.snapshot();
                const text = result.text;
                const tree = result.tree;
                // console.lg(JSON.stringify(tree, null, 2));
                expect(text).toBe("[ a ]");
                expect(tree.children).toBeNull();

                expect(tree.source.begin.line).toBe(sourceBegin.line);
                expect(tree.source.begin.column).toBe(sourceBegin.column);
                expect(tree.source.end.line).toBe(sourceEnd.line);
                expect(tree.source.end.column).toBe(sourceEnd.column);

                expect(tree.target.begin.line).toBe(1);
                expect(tree.target.begin.column).toBe(2);
                expect(tree.target.end.line).toBe(1);
                expect(tree.target.end.column).toBe(3);
            });
            it("false", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false });
                tw.beginBracket();
                const sourceBegin = new Position(2, 3);
                const sourceEnd = new Position(5, 7);
                tw.name("a", new Range(sourceBegin, sourceEnd));
                tw.endBracket();
                const result = tw.snapshot();
                const text = result.text;
                const tree = result.tree;
                // console.lg(JSON.stringify(tree, null, 2));
                expect(text).toBe("[a]");

                expect(tree.source.begin.line).toBe(sourceBegin.line);
                expect(tree.source.begin.column).toBe(sourceBegin.column);
                expect(tree.source.end.line).toBe(sourceEnd.line);
                expect(tree.source.end.column).toBe(sourceEnd.column);

                expect(tree.target.begin.line).toBe(1);
                expect(tree.target.begin.column).toBe(1);
                expect(tree.target.end.line).toBe(1);
                expect(tree.target.end.column).toBe(2);
            });
        });
    });
});

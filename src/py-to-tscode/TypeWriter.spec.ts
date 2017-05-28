import { TypeWriter } from './TypeWriter';

describe("TypeWriter", function () {
    describe("comma", function () {
        it("should only write the comma", function () {
            const tw = new TypeWriter();
            tw.comma();
            expect(tw.snapshot()).toBe(",");
        });
        describe("insertSpaceAfterCommaDelimiter", function () {
            it("true", function () {
                const tw = new TypeWriter({ insertSpaceAfterCommaDelimiter: true });
                tw.comma();
                expect(tw.snapshot()).toBe(", ");
            });
            it("false", function () {
                const tw = new TypeWriter({ insertSpaceAfterCommaDelimiter: false });
                tw.comma();
                expect(tw.snapshot()).toBe(",");
            });
        });
    });
    describe("Braces", function () {
        it("{}", function () {
            const tw = new TypeWriter();
            tw.beginObject();
            tw.endObject();
            expect(tw.snapshot()).toBe("{}");
        });
        it("{a}", function () {
            const tw = new TypeWriter();
            tw.beginObject();
            tw.write("a");
            tw.endObject();
            expect(tw.snapshot()).toBe("{a}");
        });
        it("[a,b]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            tw.write("a");
            tw.comma();
            tw.write("b");
            tw.endBracket();
            expect(tw.snapshot()).toBe("[a,b]");
        });
        describe("insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets", function () {
            it("true", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true });
                tw.beginBracket();
                tw.write("a");
                tw.endBracket();
                expect(tw.snapshot()).toBe("[ a ]");
            });
            it("false", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false });
                tw.beginBracket();
                tw.write("a");
                tw.endBracket();
                expect(tw.snapshot()).toBe("[a]");
            });
        });
    });
    describe("Brackets", function () {
        it("[]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            tw.endBracket();
            expect(tw.snapshot()).toBe("[]");
        });
        it("[a]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            tw.write("a");
            tw.endBracket();
            expect(tw.snapshot()).toBe("[a]");
        });
        it("[a,b]", function () {
            const tw = new TypeWriter();
            tw.beginBracket();
            tw.write("a");
            tw.comma();
            tw.write("b");
            tw.endBracket();
            expect(tw.snapshot()).toBe("[a,b]");
        });
        describe("insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets", function () {
            it("true", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true });
                tw.beginBracket();
                tw.write("a");
                tw.endBracket();
                expect(tw.snapshot()).toBe("[ a ]");
            });
            it("false", function () {
                const tw = new TypeWriter({ insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false });
                tw.beginBracket();
                tw.write("a");
                tw.endBracket();
                expect(tw.snapshot()).toBe("[a]");
            });
        });
    });
});

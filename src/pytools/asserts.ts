export function assert(condition: boolean, message?: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function fail(message: string): void {
    assert(false, message);
}

export function dictUpdate(a: object, b: object): void {
    for (let kb in b) {
        if (b.hasOwnProperty(kb)) {
            a[kb] = b[kb];
        }
    }
}

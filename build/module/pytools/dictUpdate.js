export default function (a, b) {
    for (var kb in b) {
        if (b.hasOwnProperty(kb)) {
            a[kb] = b[kb];
        }
    }
}

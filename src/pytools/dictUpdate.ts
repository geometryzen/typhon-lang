export default function(a, b) {
    for (let kb in b) {
        if (b.hasOwnProperty(kb)) {
            a[kb] = b[kb];
        }
    }
}

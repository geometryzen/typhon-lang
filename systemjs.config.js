(function (global) {
    System.config({
        paths: {
            'npm:': 'node_modules/'
        },
        map: {
            'generic-rbtree': 'npm:generic-rbtree/build/browser/index.js',
            'test': 'test',
            'tslib': 'npm:tslib/tslib.js'
        },
        packages: {
            'generic-rbtree': {
                defaultExtension: 'js'
            },
            'test': {
                defaultExtension: 'js'
            },
            'tslib': {
                defaultExtension: 'js'
            }
        }
    });
})(this);

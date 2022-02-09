## Contributing

### Prerequisites

npm install --global gh-pages
npm install --global jasmine-node
npm install --global karma-cli
npm install --global npm-scripts-info
npm install --global nyc
npm install --global open-cli
npm install --global trash-cli
npm install --global typedoc
npm install --global rollup
npm install --global sleep-ms
npm install --global sorcery

### Building

Open a terminal window.

Clone the editor-document repo:

```bash
git clone git://github.com/geometryzen/editor-document.git
```

Change to the repo directory:

```bash
cd editor-document
```

Install NPM:

```bash
npm install
npm update
```
to install the tooling dependencies (For this you need to have [Node.js](http://nodejs.org) installed).

Beware: Upgrading from 5.5.1 to 5.6.0 is problematic on Fedora (2018-01-19).

```bash
npm run build
npm run test
npm run docs
npm run pages
```

to compile the source using the TypeScript compiler (For this you need to have [TypeScript](http://www.typescriptlang.org) installed) and to package the individual files into a single JavaScript file.

## Making Changes

Make your changes to the TypeScript files in the _src_ directory. Do not edit the files in the _dist_ directory, these files will be generated.

## Testing

```bash
npm run test
```

## Versioning

The following files should be changed.

```
package.json
```

## Git

```bash
git add --all
git commit -m '...'
git tag -a 1.2.3 -m '...'
git push origin master --tags
npm publish
```

## Publishing

To see what will be published...
```
npx npm-packlist
```

## References
## Component library setup with React, TypeScript and Rollup
https://dev.to/siddharthvenkatesh/component-library-setup-with-react-typescript-and-rollup-onj

## How to use ESLint with TypeScript
https://khalilstemmler.com/blogs/typescript/eslint-for-typescript/

## Unit testing node applications with TypeScript — using mocha and chai
https://journal.artfuldev.com/unit-testing-node-applications-with-typescript-using-mocha-and-chai-384ef05f32b2

## Testing
https://mochajs.org/#command-line-usage
https://journal.artfuldev.com/unit-testing-node-applications-with-typescript-using-mocha-and-chai-384ef05f32b2
## How Setting Up Unit Tests with TypeScript
https://medium.com/swlh/how-to-setting-up-unit-tests-with-typescript-871c0f4f1609


```
root
| node_modules
| src
| test
| package.json
| tsconfig.json
```

We don't need all of these...
```
npm install --dev ts-node mocha nyc chai
npm install --dev @testdeck/mocha ts-mockito
```

Other files that must be added
```
test/tsconfig.json
register.js
./.mocharc.jso
./.nycrc.json
```

```
 npm i -D @istanbuljs/nyc-config-typescript
```


https://blog.jetbrains.com/dotnet/2020/09/10/unit-testing-in-typescript-code/
https://www.tsmean.com/articles/how-to-write-a-typescript-library/unit-testing/


## TypeScript and ts-node
https://inspirnathan.com/posts/30-ts-node-tutorial/
https://www.npmjs.com/package/@istanbuljs/nyc-config-typescript

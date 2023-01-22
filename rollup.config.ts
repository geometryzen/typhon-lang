import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
// import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.browser,
                format: 'umd',
                name: 'typhonLang',
                sourcemap: true
            },
            {
                file: pkg.main,
                format: 'cjs',
                name: 'typhonLang',
                sourcemap: true
            },
            {
                file: pkg.module,
                format: 'esm',
                sourcemap: true
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json' }),
            // terser()
        ]
    },
    {
        input: 'build/module/types/src/index.d.ts',
        output: [{ file: pkg.types, format: "esm" }],
        external: [/\.css$/],
        plugins: [dts()],
    }
];
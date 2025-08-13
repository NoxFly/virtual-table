import { defineConfig } from "tsup";

const copyrights = `
/**
 * @copyright 2025 NoxFly
 * @license MIT
 * @author NoxFly
 */
`.trim()

export default defineConfig({
    entry: {
        virtualTable: "src/index.ts"
    },
    keepNames: true,
    minifyIdentifiers: false,
    name: "virtualTable",
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: false,
    outDir: "dist",
    target: "es2020",
    minify: false,
    splitting: false,
    shims: false,
    treeshake: false,
    banner: {
        js: copyrights,
    }
});

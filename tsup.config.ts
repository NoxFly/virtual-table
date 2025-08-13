import { defineConfig } from "tsup";
import { execSync } from "child_process";

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
    },
    onSuccess: async () => {
        // Copy all .d.ts files
        execSync('cp src/*.d.ts dist/', { stdio: 'inherit' });
        // Copy all .css files
        execSync('cp -r src/styles/ dist/', { stdio: 'inherit' });
    }
});

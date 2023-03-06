import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import tsconfig from "./tsconfig.json" assert { type: "json" };

export default {
	input: "./test/src/index.ts",
	output: {
		dir: "./test/dist",
		format: "es",
		inlineDynamicImports: true,
	},
	plugins: [
		typescript({
			tsconfig: false,
			...tsconfig.compilerOptions,
		}),
		resolve(),
	],
};

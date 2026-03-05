import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/main.js",
  platform: "node",
  format: "cjs",
  sourcemap: true,
  tsconfig: "./tsconfig.json",
  external: ["bcrypt", "mongodb", "jsonwebtoken"],
}).catch(() => process.exit(1));

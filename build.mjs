import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/main.ts"],  // tu archivo principal
  bundle: true,                  // combina todos los imports en un solo archivo
  outfile: "dist/main.js",       // salida compilada
  platform: "node",              // para Node.js
  format: "cjs",                 // módulos ES
  sourcemap: true,               // opcional: sourcemaps
  tsconfig: "./tsconfig.json",   // usa tu tsconfig para alias
}).catch(() => process.exit(1));
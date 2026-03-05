# Kolsor-Server

## Running
Install dependencies
``` bash
npm i
```

Run in dev mode (`NODE_ENV=development`)
```bash
npm run dev
```
> [!IMPORTANT]
Change secrets in .env.example and rename it to .env

## Bundle
Although build and start commands exists in `package.json`, bundled version will crash in runtime due to esbuild being unable to resolve dynamic imports

A intermediate step will be added in order to generate a static map with all available routes

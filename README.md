# Kolsor-Server

## Developing
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

## Create bundle
```bash
npm run build
```

When running bundled version only public and node_modules (bcrypt, mongodb & jsonwebtoken) folders needs to be present to run (Needs testing)

## Running

### Docker
First run (If no bundle was created)
```bash
npm i && npm run build
```
Then use de compose.yml
```bash
STACK_NAME=kolsor JWT_SECRET=secret MONGO_PASSWORD=password docker compose up -d
```
> [!IMPORTANT]
Change secret and password with secure secret and password

### Manual

You can use the script
```bash
npm start
```
Or run dist/main.js however you prefer

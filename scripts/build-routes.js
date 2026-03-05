const path = require("path")
const fs = require("fs")

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(file => {
    
    const res = path.join(dir, file.name);
    return file.isDirectory() ? getFiles(res) : res;

  }).filter(f => ['.ts', '.tsx'].includes(path.extname(f)));
};

const createMap = (folderPath, aliasName) => {
  const root = path.join(process.cwd(), folderPath);
  const files = getFiles(root);

  let imports = '';
  let map = `export const ${aliasName}Map = {\n`;

  files.forEach((file, i) => {
    const rel = file.replace(root, '').replace(/\\/g, '/').replace(/^\//, '').replace(/\.(ts|tsx)$/, '');
    const varName = `${aliasName}_${i}`;
    const importPath = `${folderPath.replace('src/', '')}/${rel}`;
    
    imports += `import * as ${varName} from "${importPath}";\n`;

    map += `  "${rel}": ${varName},\n`;
  });
  return { imports, map: map + '};' };
};

const api = createMap('Api', 'Apis');
const pages = createMap('Pages', 'Pages');

fs.writeFileSync('./src/routeMap.ts', api.imports + pages.imports + '\n' + api.map + '\n' + pages.map);

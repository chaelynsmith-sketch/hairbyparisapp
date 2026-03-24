const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const routerDir = path.join(projectRoot, "node_modules", "expo-router");
const appSourceDir = path.join(projectRoot, "app");
const stagedRootDir = path.join(projectRoot, ".expo-router-build");
const stagedAppDir = path.join(stagedRootDir, "app");
const files = ["_ctx.js", "_ctx.web.js", "_ctx.android.js", "_ctx.ios.js", "_ctx-html.js"];

fs.rmSync(stagedRootDir, { recursive: true, force: true });
fs.mkdirSync(stagedRootDir, { recursive: true });
fs.rmSync(stagedAppDir, { recursive: true, force: true });
fs.cpSync(appSourceDir, stagedAppDir, { recursive: true });
for (const entry of ["components", "constants", "hooks", "locales", "providers", "services", "store", "types", "assets", "expo-env.d.ts", "tsconfig.json"]) {
  const sourcePath = path.join(projectRoot, entry);
  const targetPath = path.join(stagedRootDir, entry);

  if (!fs.existsSync(sourcePath)) {
    continue;
  }

  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    fs.cpSync(sourcePath, targetPath, { recursive: true });
  } else {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

for (const file of files) {
  const fullPath = path.join(routerDir, file);

  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const source = fs.readFileSync(fullPath, "utf8");
  const next = source
    .replace(/process\.env\.EXPO_ROUTER_APP_ROOT/g, '"../../.expo-router-build/app"')
    .replace(/"\.\.\/\.expo-router-build\/app"/g, '"../../.expo-router-build/app"')
    .replace(/"\.\/app"/g, '"../../.expo-router-build/app"')
    .replace(/"app"/g, '"../../.expo-router-build/app"')
    .replace(/process\.env\.EXPO_ROUTER_IMPORT_MODE/g, '"sync"');

  if (next !== source) {
    fs.writeFileSync(fullPath, next, "utf8");
  }
}

console.log("Patched expo-router app root for web export.");

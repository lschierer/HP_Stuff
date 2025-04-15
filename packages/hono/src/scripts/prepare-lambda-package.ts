import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

interface Package {
  name: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: { [key: string]: string };
  author?: string;
  license?: string;
  type?: string;
  devDependencies?: { [key: string]: string };
  dependencies: { [key: string]: string };
  keywords?: unknown[];
  repository?: string;
  private?: boolean;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const distDir = path.join(rootDir, "dist");
const lambdaDir = path.join(rootDir, "lambda-dist");
const packageJsonPath = path.join(rootDir, "package.json");

console.log("📦 Preparing Lambda deployment package...");

// 1. Create .lambda directory if it doesn't exist
if (!fs.existsSync(lambdaDir)) {
  fs.mkdirSync(lambdaDir, { recursive: true });
  console.log("✅ Created .lambda directory");
}

// 2. Copy necessary files from dist to .lambda
try {
  // Clear previous build if exists
  if (fs.existsSync(lambdaDir)) {
    fs.rmSync(lambdaDir, { recursive: true, force: true });
    fs.mkdirSync(lambdaDir, { recursive: true });
  }

  // Copy server files (needed for Lambda handler)
  fs.cpSync(path.join(distDir, "server"), path.join(lambdaDir, "server"), {
    recursive: true,
  });
  console.log("✅ Copied server files");

  // Copy shared files (needed by server)
  fs.cpSync(path.join(distDir, "shared"), path.join(lambdaDir, "shared"), {
    recursive: true,
  });
  console.log("✅ Copied shared files");

  // Copy static assets (styles, client-side JS)
  fs.cpSync(path.join(distDir, "styles"), path.join(lambdaDir, "styles"), {
    recursive: true,
  });
  fs.cpSync(path.join(distDir, "client"), path.join(lambdaDir, "client"), {
    recursive: true,
  });
  console.log("✅ Copied static assets");

  if (fs.existsSync(path.join(distDir, "Pages"))) {
    fs.cpSync(path.join(distDir, "Pages"), path.join(lambdaDir, "Pages"), {
      recursive: true,
    });
    console.log("✅ Copied Pages directory");
  }

  // Copy HTML files
  const htmlFiles = fs
    .readdirSync(distDir)
    .filter((file) => file.endsWith(".html"));
  htmlFiles.forEach((file) => {
    fs.copyFileSync(path.join(distDir, file), path.join(lambdaDir, file));
  });
  console.log("✅ Copied HTML files");

  // 3. Create a minimal package.json for Lambda
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
  ) as Package;
  const lambdaPackageJson: Package = {
    name: packageJson.name,
    version: packageJson.version,
    type: "module",
    dependencies: {},
  };

  // Only include production dependencies needed for Lambda
  const requiredDeps: string[] = [
    "hono",
    "@hono/node-server",
    "@hono/node-server/serve-static",
    "@hono/zod-validator",
    "zod",
    "gray-matter",
    "unified",
    "rehype-parse",
    "rehype-stringify",
    "unist-util-visit",
    "aws-lambda",
    "cosmiconfig",
    "yaml",
  ];

  requiredDeps.forEach((dep) => {
    if ("dependencies" in packageJson) {
      const dependencies = packageJson.dependencies as object;
      if (dep in dependencies) {
        lambdaPackageJson.dependencies[dep] =
          dependencies[dep as keyof typeof dependencies];
      }
    }
  });

  fs.writeFileSync(
    path.join(lambdaDir, "package.json"),
    JSON.stringify(lambdaPackageJson, null, 2)
  );
  console.log("✅ Created Lambda package.json");

  // 4. Create a Lambda entry point that maps to your handler
  const lambdaEntry = `
// Lambda entry point
export { handler } from './server/index.js';
`;
  fs.writeFileSync(path.join(lambdaDir, "index.mjs"), lambdaEntry);
  console.log("✅ Created Lambda entry point");

  // 5. Create a jsconfig.json file to help with module resolution
  const jsConfig = {
    compilerOptions: {
      baseUrl: ".",
      paths: {
        "@shared/*": ["./shared/*"],
        "@server/*": ["./server/*"],
      },
    },
  };

  fs.writeFileSync(
    path.join(lambdaDir, "jsconfig.json"),
    JSON.stringify(jsConfig, null, 2)
  );
  console.log("✅ Created jsconfig.json for module resolution");

  // 6. Fix imports in server files
  console.log("📦 Fixing module imports in server files...");

  // Function to recursively process all JS files
  function processJsFiles(directory: string) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        processJsFiles(fullPath);
      } else if (file.endsWith(".js")) {
        let content = fs.readFileSync(fullPath, "utf8");

        // Replace @shared imports with relative paths
        content = content.replace(
          /from\s+["']@shared\/(.*?)["']/g,
          (match, p1) => {
            // Calculate relative path from current file to shared directory
            const relativePath = path.relative(
              path.dirname(fullPath),
              path.join(lambdaDir, "shared")
            );
            return `from "${relativePath.startsWith(".") ? relativePath : "./" + relativePath}/${p1}"`;
          }
        );

        // Replace @server imports with relative paths
        content = content.replace(
          /from\s+["']@server\/(.*?)["']/g,
          (match, p1) => {
            // Calculate relative path from current file to server directory
            const relativePath = path.relative(
              path.dirname(fullPath),
              path.join(lambdaDir, "server")
            );
            return `from "${relativePath.startsWith(".") ? relativePath : "./" + relativePath}/${p1}"`;
          }
        );

        fs.writeFileSync(fullPath, content);
      }
    }
  }

  processJsFiles(lambdaDir);
  console.log("✅ Fixed module imports");

  // 7. Install production dependencies in the Lambda directory
  console.log("📦 Installing production dependencies...");
  execSync("npm install --omit=dev", {
    cwd: lambdaDir,
    stdio: "inherit",
  });
  console.log("✅ Installed production dependencies");

  // 8. Create a ZIP file for Lambda deployment
  console.log("📦 Creating Lambda deployment ZIP...");
  execSync(`cd ${lambdaDir} && zip -r ../lambda-deployment.zip .`, {
    stdio: "inherit",
  });
  console.log("✅ Created lambda-deployment.zip");

  console.log("🎉 Lambda package preparation complete!");
  console.log(
    `📁 Lambda package location: ${path.join(rootDir, "lambda-deployment.zip")}`
  );
} catch (error) {
  console.error("❌ Error preparing Lambda package:", error);
  process.exit(1);
}

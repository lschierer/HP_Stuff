import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Route, LambdaRoute } from "./types";

// Define __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Recursive function to walk a directory and return all file paths
export function walkDirectory(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    let results: string[] = [];
    fs.readdir(dir, (err, list) => {
      if (err) {
        reject(err);
        return;
      }
      
      let pending = list.length;
      if (!pending) {
        resolve(results);
        return;
      }
      
      list.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stat) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (stat.isDirectory()) {
            walkDirectory(filePath)
              .then(res => {
                results = results.concat(res);
                if (!--pending) resolve(results);
              })
              .catch(reject);
          } else {
            results.push(filePath);
            if (!--pending) resolve(results);
          }
        });
      });
    });
  });
}

// Helper function to get static routes
export function getStaticRoutes(): Promise<Route[]> {
  console.log("Getting static routes...");
  return Promise.resolve([]);
}

// Helper function to get API functions
export function getApiFunctions(): Promise<{ name: string; entry: string }[]> {
  console.log("Getting API functions...");
  return Promise.resolve([]);
}

// Synchronous versions for Pulumi's apply pattern
export function getStaticRoutesArray(): Route[] {
  console.log("Getting static routes array...");
  
  // For debugging, create a test route
  const testRoute: LambdaRoute = {
    type: "lambda",
    pathPattern: "/api/test",
    path: path.join(__dirname, "lambda-handler"),
    handler: "index.handler"
  };
  
  return [testRoute];
}

export function getApiFunctionsArray(): { name: string; entry: string }[] {
  console.log("Getting API functions array...");
  return [
    {
      name: "test",
      entry: path.join(__dirname, "lambda-handler")
    }
  ];
}

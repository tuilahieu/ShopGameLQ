import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { swaggerSpec } from "../src/config/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonContent = JSON.stringify(swaggerSpec, null, 2);

// Save openapi.json in backend directory
const backendJsonPath = path.join(__dirname, "../openapi.json");
fs.writeFileSync(backendJsonPath, jsonContent, "utf8");
console.log(`✅ File OpenAPI JSON created at: ${backendJsonPath}`);

// Save openapi.json in project root directory
const rootJsonPath = path.join(__dirname, "../../openapi.json");
fs.writeFileSync(rootJsonPath, jsonContent, "utf8");
console.log(`✅ File OpenAPI JSON created at: ${rootJsonPath}`);

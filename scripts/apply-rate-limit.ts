import fs from "fs";
import path from "path";

const dir = "src/app/api/sources";

function walkDir(d: string, cb: (f: string) => void) {
  const items = fs.readdirSync(d);
  for (const item of items) {
    const full = path.join(d, item);
    if (fs.statSync(full).isDirectory()) {
      walkDir(full, cb);
    } else if (full.endsWith("route.ts")) {
      cb(full);
    }
  }
}

function processFile(file: string) {
  let content = fs.readFileSync(file, "utf8");

  // Add checkRateLimit import if not exists
  if (!content.includes("checkRateLimit")) {
    content = 'import { checkRateLimit } from "@/server/lib/security/rate-limit";\n' + content;
  }

  // Inject rate limit check into GET handler
  // Match `export async function GET... ) {`
  const getRegex = /export\s+async\s+function\s+GET[\s\S]*?\)\s*\{/;
  const match = content.match(getRegex);
  
  if (match) {
    const matchedText = match[0];
    let reqVarName = "request";
    if (matchedText.includes("req:")) {
        reqVarName = "req";
    } else if (!matchedText.includes("request:") && !matchedText.includes("req:")) {
        // GET() { -> need to replace with GET(request: NextRequest) {
        content = content.replace("export async function GET() {", "export async function GET(request: NextRequest) {");
        if (!content.includes("NextRequest")) {
            content = content.replace('import { NextResponse }', 'import { NextRequest, NextResponse }');
        }
    }
    
    // Check if already has rate limit
    if (!content.includes("checkRateLimit(")) {
      const injection = `
  const rateLimit = await checkRateLimit(${reqVarName});
  if (!rateLimit.success) {
    return NextResponse.json({ error: { message: "Too Many Requests" } }, { status: 429, headers: rateLimit.headers });
  }
`;
      // Find the end of the matched text
      const bodyStartIndex = match.index! + match[0].length;
      
      content = content.slice(0, bodyStartIndex) + injection + content.slice(bodyStartIndex);
    }
  }

  // Fix `{ error: (error instanceof Error ? error.message : String(error)) || "Internal Server Error" }`
  content = content.replace(/\{\s*error:\s*\(error instanceof Error \? error\.message : String\(error\)\) \|\| "Internal Server Error"\s*\}/g, 
    `{ error: { message: (error instanceof Error ? error.message : String(error)) || "Internal Server Error" } }`);

  fs.writeFileSync(file, content);
}

walkDir(dir, processFile);
console.log("Done");

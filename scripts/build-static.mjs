import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const OUT = join(ROOT, "out");
const SITE = join(ROOT, "site");

function rewritePaths(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      rewritePaths(full);
      continue;
    }
    if (!/\.(html|js|css|json|txt)$/.test(entry)) continue;
    let content = readFileSync(full, "utf8");
    const depth = relative(SITE, dir).split("/").filter(Boolean).length;
    const prefix = depth === 0 ? "./" : "../".repeat(depth);
    content = content
      .replace(/"\/_next\//g, `"${prefix}_next/`)
      .replace(/'\/_next\//g, `'${prefix}_next/`)
      .replace(/href="\/(?!\/)/g, `href="${prefix}`)
      .replace(/src="\/(?!\/)/g, `src="${prefix}`);
    writeFileSync(full, content);
  }
}

console.log("\n MeetFlow — 정적 HTML 빌드 중...\n");

const build = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  cwd: ROOT,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

if (!existsSync(OUT)) {
  console.error("out/ 폴더가 생성되지 않았습니다.");
  process.exit(1);
}

if (existsSync(SITE)) rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
cpSync(OUT, SITE, { recursive: true });
if (existsSync(join(ROOT, "serve.json"))) {
  cpSync(join(ROOT, "serve.json"), join(SITE, "serve.json"));
}
rewritePaths(SITE);

const siteIndex = readFileSync(join(SITE, "index.html"), "utf8");
writeFileSync(join(ROOT, "index.html"), siteIndex);

const STATIC_DIRS = [
  "_next",
  "meetings",
  "dashboard",
  "calendar",
  "analytics",
  "notifications",
  "profile",
  "settings",
  "preview",
  "404.html",
];

for (const name of STATIC_DIRS) {
  const src = join(SITE, name);
  if (!existsSync(src)) continue;
  const dest = join(ROOT, name);
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}

console.log("\n 완료!\n");
console.log("  index.html        — 더블클릭 후 open.command 실행");
console.log("  site/             — 정적 파일 전체");
console.log("\n  확인 방법 (둘 중 하나):");
console.log("  1. open.command 더블클릭 → http://localhost:8080 (권장)");
console.log("  2. start.command 더블클릭 (동일)");
console.log("\n  ※ index.html만 더블클릭하면 CSS가 안 보일 수 있습니다.");
console.log("     반드시 open.command 로 여세요.\n");

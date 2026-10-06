// Menghasilkan ERD (Mermaid) dari prisma/schema.prisma. Pemakaian: npm run erd
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("prisma/schema.prisma", "utf8");
const enums = new Set([...src.matchAll(/^enum\s+(\w+)/gm)].map((m) => m[1]));
const models = [...src.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map((m) => ({
  name: m[1],
  lines: m[2].split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//") && !l.startsWith("@@")),
}));
const modelNames = new Set(models.map((m) => m.name));

const entities = [];
const relations = [];
for (const m of models) {
  const attrs = [];
  for (const line of m.lines) {
    const mt = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$/);
    if (!mt) continue;
    const [, name, type, list, opt, rest] = mt;
    if (modelNames.has(type)) {
      const rel = rest.match(/@relation\((?:"[^"]*",\s*)?fields:\s*\[([^\]]+)\]/);
      if (rel && !list) {
        const fks = rel[1].split(",").map((s) => s.trim());
        const unique = fks.length === 1 && m.lines.some((l) => l.startsWith(fks[0] + " ") && /@unique/.test(l));
        const left = opt ? "|o" : "||";
        relations.push(`  ${type} ${left}--${unique ? "o|" : "o{"} ${m.name} : "${name}"`);
      }
      continue;
    }
    const keys = [];
    if (/@id/.test(rest)) keys.push("PK");
    if (m.lines.some((l) => /@relation\(/.test(l) && new RegExp(`fields:\\s*\\[[^\\]]*\\b${name}\\b`).test(l))) keys.push("FK");
    if (/@unique/.test(rest)) keys.push("UK");
    const t = enums.has(type) ? `enum_${type}` : type;
    attrs.push(`    ${t}${list ? "_array" : ""} ${name}${keys.length ? " " + keys.join(",") : ""}${opt ? ' "opsional"' : ""}`);
  }
  entities.push(`  ${m.name} {\n${attrs.join("\n")}\n  }`);
}

const out = ["erDiagram", ...entities, ...relations].join("\n") + "\n";
mkdirSync("docs", { recursive: true });
writeFileSync("docs/erd.mmd", out);
console.log(`ERD: ${models.length} entitas, ${relations.length} relasi -> docs/erd.mmd`);

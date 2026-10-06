// Menghasilkan ERD (Mermaid) dari prisma/schema.prisma. Pemakaian: npm run erd
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("prisma/schema.prisma", "utf8");
const enums = new Set([...src.matchAll(/^enum\s+(\w+)/gm)].map((m) => m[1]));
// Nama yang ditampilkan adalah nama di basis data (@@map / @map), bukan nama di kode.
const models = [...src.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map((m) => ({
  name: m[1],
  tabel: m[2].match(/@@map\("([^"]+)"\)/)?.[1] ?? m[1],
  lines: m[2].split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//") && !l.startsWith("@@")),
}));
const modelNames = new Set(models.map((m) => m.name));
const namaTabel = Object.fromEntries(models.map((m) => [m.name, m.tabel]));
const namaEnum = Object.fromEntries(
  [...src.matchAll(/^enum\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map((m) => [m[1], m[2].match(/@@map\("([^"]+)"\)/)?.[1] ?? m[1]]),
);

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
        relations.push(`  ${namaTabel[type]} ${left}--${unique ? "o|" : "o{"} ${m.tabel} : "${name}"`);
      }
      continue;
    }
    const keys = [];
    if (/@id/.test(rest)) keys.push("PK");
    if (m.lines.some((l) => /@relation\(/.test(l) && new RegExp(`fields:\\s*\\[[^\\]]*\\b${name}\\b`).test(l))) keys.push("FK");
    if (/@unique/.test(rest)) keys.push("UK");
    const t = enums.has(type) ? `enum_${namaEnum[type]}` : type;
    const kolom = rest.match(/@map\("([^"]+)"\)/)?.[1] ?? name;
    attrs.push(`    ${t}${list ? "_array" : ""} ${kolom}${keys.length ? " " + keys.join(",") : ""}${opt ? ' "opsional"' : ""}`);
  }
  entities.push(`  ${m.tabel} {\n${attrs.join("\n")}\n  }`);
}

const out = ["erDiagram", ...entities, ...relations].join("\n") + "\n";
mkdirSync("docs", { recursive: true });
writeFileSync("docs/erd.mmd", out);
console.log(`ERD: ${models.length} entitas, ${relations.length} relasi -> docs/erd.mmd`);

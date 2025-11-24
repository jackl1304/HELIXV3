#!/usr/bin/env tsx
/**
 * Bulk-Migration: Ersetzt alle `from "lucide-react"` Importe im Client
 * durch `from "@/components/icons"`.
 * Keine inhaltliche Änderung – nur Quelle.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'client', 'src');
let changed = 0;
let scanned = 0;

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full); else if (/(tsx|ts)$/i.test(entry)) processFile(full);
  }
}

function processFile(file: string) {
  scanned++;
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('from "lucide-react"') && !original.includes("from 'lucide-react'")) return;

  // Skip if file is icons wrapper itself
  if (file.endsWith(path.join('components','icons','index.tsx'))) return;

  const updated = original.replace(/from\s+["']lucide-react["']/g, 'from "@/components/icons"');
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changed++;
    console.log('Migrated icon imports:', path.relative(root, file));
  }
}

walk(root);
console.log(`\nIcon Import Migration abgeschlossen: ${changed} Dateien geändert, ${scanned} gescannt.`);

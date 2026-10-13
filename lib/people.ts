import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type SeedPerson = {
  seed_order: number;
  name: string;
  gender: "male" | "female";
  company: string;
  linkedin_url: string;
  instagram_url: string;
};

function stripCode(cell: string): string {
  return cell.replace(/`/g, "").trim();
}

export function parsePeopleMarkdown(markdown: string): SeedPerson[] {
  const people: SeedPerson[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;

    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 6) throw new Error(`Unexpected row in data.md: ${line}`);

    const [order, gender, name, company, linkedin, instagram] = cells;
    const normalizedGender = gender.toLowerCase();
    if (normalizedGender !== "male" && normalizedGender !== "female") {
      throw new Error(`Unknown gender "${gender}" for ${name}`);
    }

    people.push({
      seed_order: Number(order),
      name,
      gender: normalizedGender,
      company,
      linkedin_url: stripCode(linkedin),
      instagram_url: stripCode(instagram),
    });
  }

  return people;
}

export async function loadSeedPeople(): Promise<SeedPerson[]> {
  const markdown = await readFile(path.join(process.cwd(), "data.md"), "utf8");
  const people = parsePeopleMarkdown(markdown);
  if (people.length === 0) throw new Error("data.md contains no people rows");
  return people;
}

export function instagramUsername(url: string): string {
  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  if (!match) throw new Error(`Not an Instagram profile URL: ${url}`);
  return match[1];
}

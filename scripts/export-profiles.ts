import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Person } from "@/lib/data";

type Row = {
  id: string;
  name: string;
  gender: "male" | "female";
  company: string;
  linkedin_url: string;
  instagram_url: string;
  photo_url: string | null;
  dating_profiles:
    | { needs: string[]; hobbies: string[]; interests: string[]; personal_details: string; uncertainties: string; summary: string }
    | null;
};

function initialsPhoto(name: string): string {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#F2DCE3"/><text x="50%" y="54%" text-anchor="middle" font-family="Georgia,serif" font-size="140" fill="#8E2948">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

async function main() {
  const { data, error } = await supabaseAdmin()
    .from("people")
    .select("id, name, gender, company, linkedin_url, instagram_url, photo_url, dating_profiles(*)")
    .order("seed_order");
  if (error) throw new Error(error.message);

  const people: Person[] = (data as unknown as Row[])
    .filter((row) => row.dating_profiles)
    .map((row) => {
      const profile = row.dating_profiles!;
      return {
        id: row.id,
        name: row.name,
        role: "Founder",
        company: row.company.split(",")[0]!.trim(),
        gender: row.gender,
        photo: row.photo_url?.startsWith("http") ? row.photo_url : initialsPhoto(row.name),
        summary: [profile.summary, profile.personal_details].filter(Boolean).join(" "),
        interests: [...new Set([...profile.hobbies, ...profile.interests])],
        values: profile.needs,
        details: [{ label: "Known for", value: row.company }],
        unknown: sentences(profile.uncertainties),
        linkedin: row.linkedin_url,
        instagram: row.instagram_url,
      };
    });

  await writeFile(path.join(process.cwd(), "lib", "people.json"), `${JSON.stringify(people, null, 2)}\n`);
  console.log(`Exported ${people.length} dating profiles to lib/people.json.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

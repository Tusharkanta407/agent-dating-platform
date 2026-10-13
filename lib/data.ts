// Real dating profiles exported from Supabase by `npm run export-profiles`.
import people from "./people.json";

export type Gender = "female" | "male";
export interface Person {
  id: string;
  name: string;
  role: string;
  company: string;
  gender: Gender;
  photo: string;
  summary: string;
  interests: string[];
  values: string[];
  details: { label: string; value: string }[];
  unknown: string[];
  linkedin: string;
  instagram: string;
}

export const PEOPLE: Person[] = people as Person[];
export const CANDIDATES: Person[] = PEOPLE;
export const candidatesFor = (rep: Person) =>
  CANDIDATES.filter((c) => c.gender !== rep.gender);
export const findPerson = (id: string) => PEOPLE.find((p) => p.id === id) ?? CANDIDATES.find((p) => p.id === id);

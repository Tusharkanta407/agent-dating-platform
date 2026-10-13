import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import people from "../lib/people.json";

const MANUAL_URLS: Record<string, string> = {
  "Ronnie Screwvala": "https://upload.wikimedia.org/wikipedia/commons/a/af/Ronnie_Screwvala%2C_Founder%2C_Unilazer_Ventures%2C_on_disruptive_leadership_%2828095075641%29_%28cropped2%29.jpg",
  "Vijay Shekhar Sharma": "https://upload.wikimedia.org/wikipedia/commons/8/86/Vijay_Shekhar_Sharma_%282019%29.jpg",
  "Vani Kola": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Vani_Kola_-_Indian_Venture_Capitalist.jpg",
  "Ankiti Bose": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Ankiti_Bose_-_Headshot.jpg",
  "Radhika Ghai": "https://s3.ap-south-1.amazonaws.com/assets.ynos.in/investor-profile-photos/I_901619.jpg",
};

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url.slice(0, 50)}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function main() {
  const avatarsDir = path.join(process.cwd(), "public", "avatars");
  await mkdir(avatarsDir, { recursive: true });

  const updatedPeople = [...people];

  for (let i = 0; i < updatedPeople.length; i++) {
    const p = updatedPeople[i];
    const targetPath = path.join(avatarsDir, `${p.id}.jpg`);
    const publicUrl = `/avatars/${p.id}.jpg`;

    let sourceUrl = MANUAL_URLS[p.name] || p.photo;

    console.log(`[${i + 1}/${updatedPeople.length}] Downloading ${p.name}...`);
    try {
      const buffer = await download(sourceUrl);
      await writeFile(targetPath, buffer);
      console.log(`  ✓ Saved ${p.name} (${buffer.length} bytes)`);
      p.photo = publicUrl;
    } catch (err) {
      console.warn(`  ✗ Failed with ${sourceUrl.slice(0, 60)}: ${(err as Error).message}`);
      // If manual url was not tried and there's a fallback or vice-versa
      if (!MANUAL_URLS[p.name]) {
        console.warn(`    Trying fallback for ${p.name}`);
      }
    }
  }

  // Update lib/people.json with the local URLs
  await writeFile(path.join(process.cwd(), "lib", "people.json"), JSON.stringify(updatedPeople, null, 2) + "\n");
  console.log("Updated lib/people.json with local /avatars/ paths!");
}

main().catch(console.error);

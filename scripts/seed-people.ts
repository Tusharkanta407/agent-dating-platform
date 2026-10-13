import "dotenv/config";
import { seedPeople } from "@/lib/profiles/build-next";

seedPeople()
  .then((count) => console.log(`Seeded ${count} people from data.md.`))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

import "server-only";
import { serverEnv } from "@/lib/env";
import { instagramUsername } from "@/lib/people";

const APIFY_BASE = "https://api.apify.com/v2";
const MAX_RAW_TEXT = 12_000;

export type ScrapeResult = {
  status: "ok" | "empty" | "failed";
  rawText: string;
  rawJson: unknown;
  photoUrl?: string;
  error?: string;
};

async function runActor(actorId: string, input: unknown): Promise<unknown[]> {
  const { APIFY_API_TOKEN } = serverEnv();
  const url = `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=240&format=json&clean=true`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${APIFY_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Apify ${actorId} returned ${response.status}: ${body.slice(0, 500)}`);
  }

  const items = await response.json();
  return Array.isArray(items) ? items : [];
}

function toText(value: unknown): string {
  return JSON.stringify(value, (_key, field) => (field === null || field === "" ? undefined : field), 1).slice(
    0,
    MAX_RAW_TEXT,
  );
}

function pickInstagram(item: Record<string, unknown>) {
  const posts = Array.isArray(item.latestPosts) ? item.latestPosts : [];
  return {
    username: item.username,
    fullName: item.fullName,
    biography: item.biography,
    category: item.businessCategoryName,
    externalUrl: item.externalUrl,
    followersCount: item.followersCount,
    postsCount: item.postsCount,
    recentPosts: posts.slice(0, 12).map((post: Record<string, unknown>) => ({
      caption: typeof post.caption === "string" ? post.caption.slice(0, 600) : undefined,
      hashtags: post.hashtags,
      location: post.locationName,
      type: post.type,
      timestamp: post.timestamp,
    })),
  };
}

export async function scrapeInstagram(profileUrl: string): Promise<ScrapeResult> {
  const { APIFY_INSTAGRAM_ACTOR } = serverEnv();
  try {
    const items = await runActor(APIFY_INSTAGRAM_ACTOR, { usernames: [instagramUsername(profileUrl)] });
    const item = items[0] as Record<string, unknown> | undefined;
    if (!item || item.error) {
      return { status: "empty", rawText: "", rawJson: items, error: item?.error ? String(item.error) : "No profile returned" };
    }
    const picked = pickInstagram(item);
    return {
      status: "ok",
      rawText: toText(picked),
      rawJson: picked,
      photoUrl: typeof item.profilePicUrlHD === "string" ? item.profilePicUrlHD : (item.profilePicUrl as string | undefined),
    };
  } catch (error) {
    return { status: "failed", rawText: "", rawJson: null, error: (error as Error).message };
  }
}

export async function scrapeLinkedIn(profileUrl: string): Promise<ScrapeResult> {
  const { APIFY_LINKEDIN_ACTOR } = serverEnv();
  try {
    const items = await runActor(APIFY_LINKEDIN_ACTOR, {
      urls: [profileUrl],
      profileUrls: [profileUrl],
      profileScraperMode: "Profile details no email ($4 per 1k)",
    });
    const item = items[0] as Record<string, unknown> | undefined;
    if (!item || item.error) {
      return { status: "empty", rawText: "", rawJson: items, error: item?.error ? String(item.error) : "No profile returned" };
    }
    return {
      status: "ok",
      rawText: toText(item),
      rawJson: item,
      photoUrl: (item.profilePic ?? item.profilePicture ?? item.photo) as string | undefined,
    };
  } catch (error) {
    return { status: "failed", rawText: "", rawJson: null, error: (error as Error).message };
  }
}

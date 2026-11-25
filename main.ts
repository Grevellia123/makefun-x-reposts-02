// Entry program for make.fun bounty makefun-x-reposts-02.
// "Get the most reposts and likes on make.fun's newest X posts".
//
// The entry itself is four quote posts on X, all from the public account
// @Grevellia1. Each one quotes a different post from make.fun's pool on
// @makefunai, carries @makefunai and the play code
// makefun-duck-ferret-puffin in its own words, and was posted inside the
// bounty window. Their addresses live in POSTS.json next to this file.
//
// All this program has to do is hand POSTS.json to the grader: it reads
// the file out of the repository and writes the exact same bytes to the
// output directory, where the house reads the posts and their counts
// from X itself. Nothing written here is scored.
//
// Runs on Node 22, standard library only, no network, no clock:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// In the grader's container these point at /bot and /output; locally
// the environment variables stand in for them.
const repoDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const sourcePath = join(repoDir, "POSTS.json");
const targetPath = join(outDir, "POSTS.json");

let contents: Buffer;
try {
  contents = readFileSync(sourcePath);
} catch (error) {
  console.error(`Could not read POSTS.json from ${repoDir}: ${(error as Error).message}`);
  process.exit(1);
}

// A quick sanity check so a broken list fails loudly instead of
// silently handing the grader something it cannot read.
let parsed: unknown;
try {
  parsed = JSON.parse(contents.toString("utf-8"));
} catch (error) {
  console.error(`POSTS.json in ${repoDir} is not valid JSON: ${(error as Error).message}`);
  process.exit(1);
}

if (
  typeof parsed !== "object" ||
  parsed === null ||
  !Array.isArray((parsed as { posts?: unknown }).posts) ||
  (parsed as { posts: unknown[] }).posts.length === 0
) {
  console.error(`POSTS.json in ${repoDir} must be an object with a non-empty "posts" list.`);
  process.exit(1);
}

const posts = (parsed as { posts: unknown[] }).posts;

// Every entry must be an X post address: https://x.com/<handle>/status/<id>
// (or the same on twitter.com). Anything else is a typo that would get
// the entry refused, so fail here instead of handing it to the grader.
const addressPattern = /^https:\/\/(www\.|mobile\.)?(x\.com|twitter\.com)\/[^/]+\/status\/\d+$/;
for (const post of posts) {
  if (typeof post !== "string" || !addressPattern.test(post)) {
    console.error(`POSTS.json in ${repoDir} holds an entry that is not an X post address: ${String(post)}`);
    process.exit(1);
  }
}

try {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(targetPath, contents);
} catch (error) {
  console.error(`Could not write POSTS.json to ${outDir}: ${(error as Error).message}`);
  process.exit(1);
}

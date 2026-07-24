// Fixes PostReaction unique index: (postId, authorId, emoji) → (postId, authorId)
// MySQL can't drop an index used by a FK, so we: create new index → drop FK → drop old index → re-add FK
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run(sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("OK:", sql.split("\n")[0].trim());
  } catch (e) {
    if (e.message.includes("Duplicate") || e.message.includes("already exists") || e.message.includes("Can't DROP")) {
      console.log("SKIP (already done):", sql.split("\n")[0].trim());
    } else {
      throw e;
    }
  }
}

async function main() {
  // 1. Create the new 2-column unique index (if not exists)
  await run("ALTER TABLE PostReaction ADD UNIQUE INDEX `PostReaction_postId_authorId_key` (postId, authorId)");

  // 2. Find all FKs on PostReaction table
  const fks = await prisma.$queryRaw`
    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'PostReaction'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `;

  // 3. Drop all FKs temporarily
  for (const { CONSTRAINT_NAME } of fks) {
    await run(`ALTER TABLE PostReaction DROP FOREIGN KEY \`${CONSTRAINT_NAME}\``);
  }

  // 4. Drop the old 3-column index
  await run("ALTER TABLE PostReaction DROP INDEX `PostReaction_postId_authorId_emoji_key`");

  // 5. Re-add the FKs
  await run("ALTER TABLE PostReaction ADD CONSTRAINT `PostReaction_postId_fkey` FOREIGN KEY (postId) REFERENCES Post(id) ON DELETE CASCADE ON UPDATE CASCADE");

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

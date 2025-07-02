-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "feedback" TEXT NOT NULL DEFAULT '{}',
    "overall_rating" INTEGER,
    "overall_thumbs" TEXT,
    "overall_feedback" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_conversations" ("created_at", "feedback", "id", "messages", "session_id", "updated_at", "username") SELECT "created_at", "feedback", "id", "messages", "session_id", "updated_at", "username" FROM "conversations";
DROP TABLE "conversations";
ALTER TABLE "new_conversations" RENAME TO "conversations";
CREATE UNIQUE INDEX "conversations_session_id_key" ON "conversations"("session_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

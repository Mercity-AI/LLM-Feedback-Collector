-- CreateTable
CREATE TABLE "conversations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "feedback" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_session_id_key" ON "conversations"("session_id");

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "feedback" TEXT NOT NULL DEFAULT '{}',
    "overall_rating" INTEGER,
    "overall_thumbs" TEXT,
    "overall_feedback" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_session_id_key" ON "conversations"("session_id");

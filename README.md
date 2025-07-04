# LLM Feedback Collector

A comprehensive Next.js application for collecting detailed feedback on LLM responses with real-time streaming chat interface, per-message feedback, and overall conversation evaluation.

## ✨ Features

### Chat Experience
- ✅ **Real-time Streaming Chat** - Live chat with GPT-4o via OpenRouter using Server-Sent Events
- ✅ **OpenRouter Integration** - Full integration with OpenRouter API for multiple LLM providers
- ✅ **Markdown & LaTeX Support** - Complete markdown rendering with GitHub Flavored Markdown (GFM) and KaTeX for mathematical expressions
- ✅ **Smart UI/UX** - Responsive design with proper text wrapping, auto-scroll, and loading states
- ✅ **Message History** - Maintains full conversation context with abort controls

### Feedback System
- ✅ **Per-Message Feedback** - Individual message rating with thumbs up/down, 0-10 scale rating, and comments
- ✅ **Overall Chat Feedback** - End-of-conversation rating (1-5 stars), recommendation, and detailed feedback
- ✅ **Real-time Feedback Storage** - Immediate persistence of all feedback data
- ✅ **Expandable Feedback UI** - Collapsible detailed feedback forms for better UX

### Data & Analytics
- ✅ **Complete Database Integration** - Prisma ORM with SQLite for development
- ✅ **Conversation Persistence** - Full message history and metadata storage
- ✅ **Session Management** - Unique session tracking with completion status
- ✅ **Feedback Analytics Ready** - Structured data storage for future analytics dashboard

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4
- **Database**: Prisma ORM + SQLite (development) / PostgreSQL (production)
- **API Integration**: OpenRouter API with streaming support
- **Form Management**: React Hook Form + Zod validation
- **Markdown Rendering**: React Markdown with GFM and KaTeX
- **Real-time**: Server-Sent Events for streaming responses

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouter API key ([Get yours here](https://openrouter.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd llm-feedback-collector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   DATABASE_URL="file:./dev.db"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations (creates database and tables)
   npx prisma migrate dev --name init
   
   # Optional: View database in Prisma Studio
   npx prisma studio
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main page: http://localhost:3000
   - Chat interface: http://localhost:3000/chat
   - Database studio: http://localhost:5555 (if running prisma studio)

## 📊 Database Structure

The application uses a single `conversations` table with the following schema:

```sql
CREATE TABLE "conversations" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "session_id" TEXT UNIQUE NOT NULL,
    "username" TEXT NOT NULL,
    "messages" TEXT NOT NULL,              -- JSON: [{role, content, timestamp}]
    "feedback" TEXT DEFAULT '{}',          -- JSON: {messageIndex: {thumbs, rating, comment}}
    "overall_rating" INTEGER,              -- 1-5 stars
    "overall_thumbs" TEXT,                 -- "up" or "down"
    "overall_feedback" TEXT,               -- Text comment
    "is_completed" BOOLEAN DEFAULT false,  -- Chat session ended
    "created_at" DATETIME DEFAULT NOW,
    "updated_at" DATETIME
);
```

### Data Types

**Messages Array:**
```typescript
interface MessageData {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

**Per-Message Feedback:**
```typescript
interface FeedbackData {
  [messageIndex: number]: {
    thumbs?: 'up' | 'down';
    rating?: number; // 0-10
    comment?: string;
  };
}
```

**Overall Feedback:**
```typescript
interface OverallFeedbackData {
  rating: number; // 1-5 stars
  thumbs: 'up' | 'down';
  comment: string;
}
```

## 🔌 API Endpoints

### Chat API
```bash
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}

# Returns: Server-Sent Events stream
```

### Conversations API
```bash
# Save conversation
POST /api/conversations
{
  "sessionId": "session_123",
  "username": "user@example.com",
  "messages": [...],
  "feedback": {...}
}

# Get conversation
GET /api/conversations?sessionId=session_123
```

### Feedback API
```bash
# Update per-message feedback
POST /api/feedback
{
  "sessionId": "session_123",
  "feedback": {
    "2": {
      "thumbs": "up",
      "rating": 8,
      "comment": "Great response!"
    }
  }
}
```

### End Chat API
```bash
# Submit overall feedback and end session
POST /api/end-chat
{
  "sessionId": "session_123",
  "overallFeedback": {
    "rating": 4,
    "thumbs": "up",
    "comment": "Overall good experience"
  }
}
```

### Health Check
```bash
GET /api/health    # System status
POST /api/health   # Echo endpoint
```

## ⚙️ Context Size Management

The application includes built-in context size management to control conversation length and message size:

### Environment Variables

```env
# Context message limit
CONTEXT_MSG_LIMIT = -1        # -1 = unlimited, positive integer = max messages
MAX_MSG_SIZE = 1000           # Maximum words per message
```

### Configuration Options

- **`CONTEXT_MSG_LIMIT`**
  - Set to `-1` for unlimited messages
  - Set to any positive integer (e.g., `50`) to limit total messages per conversation
  - When limit is reached, send button is disabled with warning message

- **`MAX_MSG_SIZE`**
  - Controls maximum words per individual message
  - Default: 1000 words
  - Shows real-time word count and warning when exceeded

### User Experience

- **Real-time Feedback**: Word count display shows current usage
- **Visual Warnings**: Red text alerts when limits are exceeded
- **Disabled Send Button**: Prevents sending when limits are reached
- **Context Awareness**: Shows current message count vs. limit

### API Configuration
```bash
GET /api/config
# Returns current limits configuration
{
  "contextMsgLimit": -1,
  "maxMsgSize": 1000,
  "status": "success"
}
```

## 💾 Data Access & Management

### Using Prisma Studio
```bash
npx prisma studio
```
Access at http://localhost:5555 to browse and edit data visually.

### Direct Database Queries
```typescript
import { prisma } from '@/lib/prisma';

// Get all conversations
const conversations = await prisma.conversation.findMany({
  orderBy: { createdAt: 'desc' }
});

// Get conversations with feedback
const withFeedback = await prisma.conversation.findMany({
  where: {
    NOT: {
      feedback: '{}'
    }
  }
});

// Get completed chats only
const completed = await prisma.conversation.findMany({
  where: { isCompleted: true }
});
```

### Exporting Data
```bash
# Export to JSON
npx prisma studio --export

# Or create custom export script
node scripts/export-data.js
```

## 🚀 Deployment

### Database Setup for Production

1. **PostgreSQL (Recommended)**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/llm_feedback?schema=public"
   ```

2. **Run migrations in production**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Configure Vercel**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `OPENROUTER_API_KEY`
   - `DATABASE_URL` (use Vercel Postgres or external provider)

### Deploy to Railway/Render

1. **Connect repository**
2. **Set environment variables**
3. **Add build command**: `npm run build`
4. **Add start command**: `npm start`

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Analytics & Insights

### Feedback Metrics You Can Track

```typescript
// Average ratings per message
const avgMessageRating = await prisma.$queryRaw`
  SELECT AVG(json_extract(feedback, '$.rating')) as avg_rating
  FROM conversations 
  WHERE feedback != '{}'
`;

// Overall satisfaction
const overallStats = await prisma.conversation.aggregate({
  _avg: { overallRating: true },
  _count: { overallThumbs: true },
  where: { isCompleted: true }
});

// Completion rate
const completionRate = await prisma.conversation.groupBy({
  by: ['isCompleted'],
  _count: true
});
```

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── api/                   # API routes
│   │   ├── chat/             # Streaming chat
│   │   ├── conversations/    # CRUD operations
│   │   ├── feedback/         # Per-message feedback
│   │   ├── end-chat/         # Overall feedback
│   │   └── health/           # System health
│   ├── chat/                 # Chat interface
│   └── page.tsx              # Landing page
├── components/
│   ├── FeedbackWidget.tsx    # Per-message feedback UI
│   ├── OverallFeedbackDialog.tsx # End-chat feedback
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── prisma.ts             # Database utilities
│   └── utils.ts              # General utilities
└── prisma/
    ├── schema.prisma         # Database schema
    └── migrations/           # Database migrations
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Database GUI
npx prisma migrate   # Run database migrations
```

### Environment Variables
See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](your-demo-url)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

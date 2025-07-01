# LLM Feedback Collector

A Next.js application for collecting feedback on LLM responses with real-time streaming chat interface.

## Features

- ✅ **Streaming Chat Interface** - Real-time chat with GPT-4o via OpenRouter using Server-Sent Events
- ✅ **OpenRouter Integration** - Full integration with OpenRouter for multiple LLM providers
- ✅ **OpenAI Schema Compliance** - Messages follow `{role: 'user'|'assistant', content: string}` format
- ✅ **Modern UI** - Built with shadcn/ui and Tailwind CSS
- ✅ **TypeScript** - Full type safety throughout the application
- 🚧 **Feedback System** - Rating and comments (Coming Soon)
- 🚧 **Database Integration** - Prisma + SQLite (Coming Soon)

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **API**: Next.js API Routes with streaming
- **Future**: Prisma ORM, SQLite Database

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the project root:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
   Get your API key from [OpenRouter](https://openrouter.ai/)

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Application**
   - Main page: http://localhost:3000
   - Chat interface: http://localhost:3000/chat

## API Endpoints

### Health Check
- `GET /api/health` - System status and information
- `POST /api/health` - Echo endpoint for testing

### Chat (Streaming)
- `POST /api/chat` - Stream chat responses
- Accepts: `{messages: [{role: 'user'|'assistant', content: string}]}`
- Returns: Server-Sent Events stream with incremental content

#### Chat API Usage

```bash
# Test the streaming endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}' \
  --no-buffer
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts    # Health check endpoints
│   │   └── chat/route.ts      # Streaming chat API
│   ├── chat/
│   │   └── page.tsx           # Chat interface
│   ├── page.tsx               # Main landing page
│   └── globals.css            # Global styles
├── components/ui/             # shadcn/ui components
└── lib/
    └── utils.ts               # Utility functions
```

## Chat Features

- **Real-time Streaming** - Messages appear word by word
- **Message History** - Maintains conversation context
- **Auto-scroll** - Automatically scrolls to latest messages
- **Stop Generation** - Ability to stop streaming mid-response
- **Clear Chat** - Reset conversation
- **Responsive Design** - Works on desktop and mobile
- **Loading States** - Visual feedback during streaming
- **Error Handling** - Graceful error recovery

## Development

The application uses:
- **App Router** for modern Next.js routing
- **Server Components** for optimal performance
- **Client Components** for interactive features
- **Streaming APIs** for real-time responses
- **Abort Controllers** for request cancellation

## Future Enhancements

1. **Feedback System**
   - 👍/👎 reactions on messages
   - 0-10 rating scale
   - Text comments on responses

2. **Database Integration**
   - Prisma ORM setup
   - SQLite for development
   - Message persistence
   - Feedback storage

3. **Enhanced Model Support**
   - Multiple model selection UI
   - Custom system message configuration
   - Temperature and parameter controls

4. **Analytics Dashboard**
   - Feedback analytics
   - Response quality metrics
   - Usage statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project as a starting point for your own LLM feedback collection system.

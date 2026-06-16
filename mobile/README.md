# Bible AI Telugu 📖

A mobile app for reading the Bible in Telugu with AI-powered spiritual assistance, offline support, and personalized devotionals.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier available)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   # See ENV_SETUP.md for detailed instructions
   ```

3. **Start the app**
   ```bash
   npm start
   ```
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web

## 📱 Features

- **Bible Reading**: Navigate Telugu Bible translations by book, chapter, verse
- **AI Assistant**: Spiritual questions answered by Telugu-aware AI
- **Devotionals**: Daily devotional readings with reflections
- **Offline Mode**: Download chapters for offline reading
- **Bookmarks**: Save and organize favorite verses
- **Multiple Languages**: Support for Telugu and English interfaces
- **Personalization**: Customize font size, color scheme, language preferences
- **Authentication**: Secure login with Supabase

## 🏗️ Architecture

```
src/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Auth routing (login if not authenticated)
│   ├── login.tsx          # Authentication screen
│   └── (tabs)/            # Main app navigation
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── auth-context.tsx   # Authentication state & provider
│   ├── supabaseClient.ts  # Supabase configuration
│   ├── bibleData.ts       # Bible verse data
│   └── offlineBibleCache.ts # Offline caching
└── constants/
    └── theme.ts           # Theme configuration
```

## 🔐 Authentication

Uses Supabase Auth with email/password:
- Sign up with email and password
- Sign in to existing account
- Session persists across app restarts
- Sign out from profile screen

## 🗄️ Database

TODO: Set up Supabase tables:
- `user_preferences`: User settings (language, theme, font size)
- `user_bookmarks`: Saved verses linked to user
- `devotionals`: Daily devotional content

## 🔌 API Integration

Backend API expected at `EXPO_PUBLIC_API_URL/api/ai`:

### Request
```json
POST /api/ai
{
  "prompt": "What does Psalm 23 mean?",
  "history": [...]
}
```

### Response
```json
{
  "text": "AI response..."
}
```

### Hugging Face configuration
Set a Hugging Face token and model in `.env.local` to use the server proxy with Llama 2 or Mistral:

```text
EXPO_PUBLIC_HF_API_KEY=hf_your_token_here
EXPO_PUBLIC_HF_MODEL=meta-llama/Llama-2-7b-chat-hf
```

Or use:

```text
EXPO_PUBLIC_HF_MODEL=mistralai/Mistral-7B-Instruct
```

The app will call your backend at `EXPO_PUBLIC_API_URL` and keep the mobile app as the UI only.

Falls back to mock theological responses if API unavailable.

## 📚 Development

- **Linting**: `npm run lint`
- **Type checking**: TypeScript 6.0.3
- **Format**: ESLint configured
- **Testing**: Jest (TODO)

## 📋 Implementation Status

### ✅ Completed
- Supabase authentication system
- Login/signup screens
- Auth routing & session management
- Environment variable configuration
- API endpoint externalization

### 🚧 In Progress / TODO
- Database schema and migrations
- User profile synchronization
- Bookmark persistence
- Database-driven devotionals
- Bible search functionality
- Error handling & user feedback
- Unit tests
- Performance optimization

See [CLAUDE.md](CLAUDE.md) for detailed notes.

## 📄 License

[LICENSE](LICENSE)

# 🎯 MCQ Test Platform

A modern, full-stack MCQ (Multiple Choice Questions) testing platform built with Next.js, Supabase, and Redux Toolkit.

## ✨ Features

### 🔐 Authentication & Authorization
- **Email/Password Authentication** with Supabase Auth
- **Role-based Access Control** (Admin, Paid User, Free User)
- **Protected Routes** with automatic redirects
- **Session Management** with persistent login

### 📝 Quiz System
- **Timed Tests** with countdown timer (2 hours)
- **Question Navigation** with sidebar overview
- **Auto-save Answers** with real-time state management
- **Domain Filtering** (Zoology, Botany, Chemistry, Physics, Mathematics)
- **Randomized Questions** for fair testing
- **Pagination** (20 questions per page)
- **Auto-submit** when time expires

### 📊 Results & Analytics
- **Detailed Score Breakdown** by domain
- **Percentage Scoring** with visual feedback
- **Test History** tracking
- **Performance Analytics** for improvement insights

### 🎨 Modern UI/UX
- **Clean, Minimal Design** with Tailwind CSS
- **Responsive Layout** for all devices
- **Loading States** and error handling
- **Smooth Animations** and transitions
- **Accessibility** considerations

### 🤖 AI Study Assistant
- **Interactive Chatbot** powered by multiple AI providers
- **RAG (Retrieval-Augmented Generation)** for context-aware responses
- **Domain-specific Help** with subject matter expertise
- **Study Tips & Strategies** for better test performance
- **Practice Questions** from your database
- **Mobile-responsive Chat Interface** with minimize/maximize
- **Free AI Options** (Cloudflare, Google Gemini, Cohere)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd mcq-test
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Run Database Migration
1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of \`supabase/migrations/001_initial_schema.sql\`
3. Execute the migration

### 4. Configure Environment Variables
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edit \`.env.local\` with your Supabase credentials:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Chatbot Configuration (Optional)
# Choose one: 'cloudflare', 'gemini', 'cohere', or 'fallback'
AI_PROVIDER=fallback

# For Cloudflare Workers AI (10,000 requests/day free)
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# For Google Gemini (60 requests/minute free)
GEMINI_API_KEY=your_gemini_api_key_here

# For Cohere (1,000 requests/month free)
COHERE_API_KEY=your_cohere_api_key_here
\`\`\`

> **Note**: The AI chatbot works without any API configuration using intelligent fallback responses. See [AI_CHATBOT_SETUP.md](AI_CHATBOT_SETUP.md) for detailed setup instructions.

### 5. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit \`http://localhost:3000\` to see the application.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.3.4 with App Router
- **Styling**: Tailwind CSS 4.0
- **State Management**: Redux Toolkit
- **Backend**: Supabase (PostgreSQL + Auth)
- **Type Safety**: JavaScript with JSDoc

### Database Schema

#### Users Table
\`\`\`sql
- id (UUID, PK, references auth.users)
- email (TEXT, unique)
- role (ENUM: admin, paid_user, free_user)
- created_at (TIMESTAMP)
\`\`\`

#### Domains Table
\`\`\`sql
- id (SERIAL, PK)
- name (TEXT, unique)
\`\`\`

#### Questions Table
\`\`\`sql
- id (SERIAL, PK)
- domain_id (FK → domains.id)
- text (TEXT)
- options (JSONB) // Array of 4 options
- correct_answer (CHAR) // A, B, C, or D
- explanation (TEXT, nullable)
\`\`\`

#### Tests Table
\`\`\`sql
- id (UUID, PK)
- user_id (FK → users.id)
- domain_filter (INT[]) // Domain IDs or null for all
- started_at, completed_at (TIMESTAMPS)
- score_total (INT)
- score_by_domain (JSONB)
\`\`\`

#### Attempts Table
\`\`\`sql
- id (UUID, PK)
- test_id (FK → tests.id)
- question_id (FK → questions.id)
- selected_answer (CHAR)
- time_spent (INT seconds)
- is_correct (BOOLEAN)
\`\`\`

### Redux Store Structure
\`\`\`
store/
├── slices/
│   ├── authSlice.js      # User authentication & profile
│   ├── quizSlice.js      # Test state & progress
│   └── questionsSlice.js # Questions & domains data
└── store.js              # Store configuration
\`\`\`

## 📱 Application Flow

### Authentication Flow
1. **Landing Page** → Sign in/Sign up options
2. **Login/Signup** → Authentication with Supabase
3. **Dashboard** → Test selection and user stats
4. **Protected Routes** → Automatic authentication checks

### Quiz Flow
1. **Dashboard** → Select domains (optional) → Start Test
2. **Quiz Initialization** → Create test record → Fetch questions
3. **Question Navigation** → Answer questions → Auto-save progress
4. **Submission** → Manual or auto-submit → Calculate scores
5. **Results** → Display scores → Domain breakdown → Navigation

### Admin Flow (Future Enhancement)
- **Admin Panel** → Manage questions and domains
- **Bulk Import** → JSON format question import
- **User Management** → View user statistics

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own tests and attempts
- Admins have full access to all data
- Public read access for domains and questions

### Authentication Policies
- **JWT-based sessions** with Supabase Auth
- **Email verification** for new accounts
- **Secure password** requirements

## 🎯 Usage Examples

### Starting a Test
\`\`\`javascript
// From dashboard, users can select specific domains
const selectedDomains = [1, 3, 5]; // Math, Chemistry, Physics
dispatch(startTest({ domainFilter: selectedDomains, userId: user.id }));
\`\`\`

### Answering Questions
\`\`\`javascript
// Answers are auto-saved to Redux state
dispatch(setAnswer({ questionId: 1, answer: 'B' }));
\`\`\`

### Submitting Test
\`\`\`javascript
// Manual or automatic submission
dispatch(submitTest({ testId, answers, timeSpent }));
dispatch(calculateScore({ testId }));
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
npm run build
npx vercel --prod
\`\`\`

### Environment Variables for Production
Add the following to your deployment platform:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies.**

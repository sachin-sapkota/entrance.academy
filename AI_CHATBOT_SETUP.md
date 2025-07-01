# AI Chatbot Setup Guide

This guide will help you set up the AI chatbot feature with free AI services.

## Option 1: Cloudflare Workers AI (Recommended)

Cloudflare Workers AI offers a generous free tier with 10,000 requests per day.

### Setup Steps:

1. **Create a Cloudflare Account**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Sign up for a free account

2. **Get Your Account ID**
   - In the Cloudflare dashboard, go to the right sidebar
   - Copy your Account ID

3. **Create an API Token**
   - Go to My Profile → API Tokens
   - Click "Create Token"
   - Use the "Custom token" template
   - Set permissions:
     - Account: Cloudflare Workers AI:Edit
   - Create token and copy it

4. **Add Environment Variables**
   Create a `.env.local` file in your project root:
   ```
   AI_PROVIDER=cloudflare
   CLOUDFLARE_ACCOUNT_ID=27e4e1546d9d6da7c53894d468751c52
   CLOUDFLARE_API_TOKEN=u27U1UkQ0ea7lFWw2V1UK2CRAZqGu7JS57tqxRkH
   ```

## Option 2: Using Google's Gemini API (Alternative)

If you prefer Google's Gemini API (also has a free tier):

1. **Get API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Add Environment Variables**
   Update your `.env.local` file:
   ```
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Option 3: Using Cohere API (Alternative)

Cohere offers 1000 API calls per month for free:

1. **Get API Key**
   - Sign up at [Cohere](https://cohere.ai/)
   - Get your API key from the dashboard

2. **Add Environment Variables**
   Update your `.env.local` file:
   ```
   AI_PROVIDER=cohere
   COHERE_API_KEY=your_cohere_api_key_here
   ```

## Option 4: Using Fallback Mode (No API Required)

If you don't want to set up an AI provider immediately, the chatbot will work with intelligent pre-programmed responses:

1. **No Configuration Needed**
   The chatbot will automatically use fallback mode if no AI provider is configured
   
2. **Features Available in Fallback Mode**
   - Test-taking tips
   - Study strategies
   - Basic concept explanations
   - Practice questions from your database
   - Context-aware responses based on selected domain

## Features of the AI Chatbot

1. **Context-Aware Responses**
   - The chatbot uses RAG (Retrieval-Augmented Generation) to fetch relevant questions and domain information from your database
   - It provides accurate responses based on your actual test content

2. **Domain-Specific Help**
   - Users can select a specific domain (Mathematics, Physics, etc.) for focused assistance
   - The bot will retrieve relevant questions and explanations from that domain

3. **Study Assistance**
   - Test-taking tips and strategies
   - Concept explanations
   - Practice questions from your database
   - Study recommendations

4. **Intelligent Fallback**
   - If the AI service is not configured, the chatbot provides helpful pre-programmed responses
   - Ensures users always get assistance even without AI integration

5. **Mobile-Responsive Design**
   - Fully responsive UI that works perfectly on mobile devices
   - Touch-friendly interface with appropriate sizing
   - Minimize/maximize functionality to save screen space
   - Smooth animations and transitions

6. **User-Friendly Interface**
   - Floating chat button with notification indicator
   - Quick action buttons for common queries
   - Message history with timestamps
   - Loading indicators for AI responses
   - Context selector for domain-specific help
   - Auto-scrolling to latest messages

## Testing the Chatbot

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Look for the chat icon in the bottom-right corner of any page

3. Try these sample queries:
   - "Give me some test-taking tips"
   - "Explain a concept in Mathematics"
   - "Show me a practice question"
   - "What study strategies do you recommend?"

## Customization

You can customize the chatbot by modifying:
- `/src/app/components/AIChatBot.js` - UI and behavior
- `/src/app/api/chat/route.js` - AI integration and response logic

## Usage Limits

- **Cloudflare Workers AI**: 10,000 requests/day (free tier)
- **Google Gemini**: 60 requests/minute (free tier)
- **Cohere**: 1,000 API calls/month (free tier)

Choose the service that best fits your expected usage patterns. 
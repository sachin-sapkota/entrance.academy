import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create Supabase client for API route
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Get basic context from database
    let contextData = '';
    try {
      // Get some domains and questions for general context
      const { data: domains } = await supabase
        .from('domains')
        .select('name, description')
        .eq('is_active', true)
        .limit(5);

      const { data: questions } = await supabase
        .from('questions')
        .select('text, explanation')
        .eq('is_active', true)
        .limit(3);

      if (domains && domains.length > 0) {
        contextData += `Available study domains: ${domains.map(d => d.name).join(', ')}\n`;
      }

      if (questions && questions.length > 0) {
        contextData += `Sample study material available covering various MCQ topics\n`;
      }
    } catch (dbError) {
      console.log('Database context unavailable:', dbError.message);
    }

    // Use Cloudflare Workers AI with streaming
    if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
      try {
        console.log('Using Cloudflare Workers AI with streaming...');
        
        // Prepare messages for Cloudflare AI
        const messages = [
          {
            role: "system",
            content: `You are a helpful AI study assistant for an MCQ test platform. Keep responses concise and under 200 words. Help students with:
- Study strategies and tips
- Concept explanations (use LaTeX for chemistry or any complex words)
- Test-taking techniques
- Practice question guidance
- Learning motivation

Be brief, encouraging, and educational. Use bullet points for lists and make sure to wrap up with less than 200 words (if you are not sure about the answer, say "I'm not sure about that, but I'll try to help you with the best of my knowledge") and if needed shorter answers like mcq questions donot overlengthen the answer. ${contextData ? `Context: ${contextData}` : ''}`
          }
        ];

        // Add conversation history if available
        if (conversationHistory && conversationHistory.length > 0) {
          // Add the conversation history (excluding the current message which is already included)
          const historyMessages = conversationHistory.slice(0, -1); // Remove current message
          messages.push(...historyMessages);
        }

        // Add the current user message
        messages.push({
          role: "user",
          content: message
        });

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              messages,
              stream: true,
              max_tokens: 280
            }),
          }
        );

        if (response.ok) {
          // Return streaming response
          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                  const { done, value } = await reader.read();
                  
                  if (done) {
                    controller.close();
                    break;
                  }

                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n');

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const data = JSON.parse(line.slice(6));
                        if (data.response) {
                          // Send each chunk to the client
                          controller.enqueue(
                            new TextEncoder().encode(`data: ${JSON.stringify({ 
                              response: data.response,
                              done: false 
                            })}\n\n`)
                          );
                        }
                      } catch (parseError) {
                        console.log('Parse error for line:', line);
                      }
                    }
                  }
                }

                // Send completion signal
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ 
                    response: '',
                    done: true 
                  })}\n\n`)
                );

              } catch (error) {
                console.error('Streaming error:', error);
                controller.error(error);
              }
            }
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });

        } else {
          console.error('Cloudflare API error:', response.status, response.statusText);
          const errorData = await response.text();
          console.error('Error details:', errorData);
          
          // Fallback to non-streaming response
          return getFallbackResponse(message, conversationHistory);
        }
      } catch (error) {
        console.error('Cloudflare AI error:', error.message);
        // Fallback to non-streaming response
        return getFallbackResponse(message, conversationHistory);
      }
    } else {
      console.log('Cloudflare credentials not configured');
      // Fallback to non-streaming response
      return getFallbackResponse(message, conversationHistory);
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json({
      error: 'Failed to process chat message',
      details: error.message
    }, { status: 500 });
  }
}

// Fallback function for non-streaming responses
function getFallbackResponse(message, conversationHistory) {
  console.log('Using fallback responses');
  const keywords = message.toLowerCase();
  
  // Check if there's conversation history for more contextual responses
  const hasHistory = conversationHistory && conversationHistory.length > 1;
  const previousContext = hasHistory ? 
    `Based on our previous conversation, ` : '';
  
  let aiResponse = '';
  
  if (keywords.includes('explain')) {
    aiResponse = `${previousContext}I'd be happy to explain concepts! Please specify what topic you'd like me to explain and I'll break it down clearly.`;
  } else if (keywords.includes('practice') || keywords.includes('question')) {
    aiResponse = `${previousContext}Great idea to practice! Quick tips:

• Start with easier questions first
• Focus on understanding reasoning
• Time yourself for exam conditions
• Review incorrect answers

What subject would you like to practice?`;
  } else if (keywords.includes('study') || keywords.includes('tip')) {
    aiResponse = `${previousContext}Effective study strategies:

**Preparation:**
• Create a study schedule
• Focus on understanding concepts
• Use active recall techniques

**Test-Taking:**
• Read questions carefully
• Eliminate wrong answers first
• Manage time effectively

What specific area needs help?`;
  } else if (keywords.includes('help')) {
    aiResponse = `${previousContext}I can help with:

📚 **Explanations** - Break down topics
🎯 **Study Tips** - Learning techniques  
⏰ **Test Strategies** - Improve performance
💡 **Practice** - Effective methods

What would you like help with?`;
  } else {
    if (hasHistory) {
      aiResponse = `I remember our conversation. How can I continue helping with your studies?`;
    } else {
      aiResponse = `Hello! I'm your AI study assistant. I help with study strategies, explanations, test tips, and practice guidance. What can I assist with today?`;
    }
  }

  return Response.json({
    success: true,
    response: aiResponse
  });
} 
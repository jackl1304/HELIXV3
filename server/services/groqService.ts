import { Groq } from 'groq-sdk';

let groq: Groq | null = null;

if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn('[GroqService] GROQ_API_KEY not set, Groq service disabled');
}

export { groq };

/**
 * Call Groq Chat API with streaming support
 */
export async function callGroqChatStreaming(prompt: string, systemPrompt?: string): Promise<string> {
  if (!groq) {
    throw new Error('Groq client not initialized - GROQ_API_KEY not set');
  }

  try {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192', // or another available model
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false, // Set to true for streaming if needed
    });

    return chatCompletion.choices[0]?.message?.content || 'No response from Groq';
  } catch (error: any) {
    console.error('[GroqService] Error calling Groq API:', error);
    throw new Error(`Groq API error: ${error.message}`);
  }
}

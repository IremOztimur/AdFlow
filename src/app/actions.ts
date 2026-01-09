'use server';

import OpenAI from 'openai';

export async function optimizePromptAction(context: string, currentTemplate: string, apiKey: string) {
  
  if (!apiKey) {
    throw new Error('OpenAI API Key is missing. Please add it in Settings.');
  }

  const client = new OpenAI({
    apiKey: apiKey,
  });

  const systemPrompt = `You are an expert Prompt Engineer for generative AI models like DALL-E 3 and Stable Diffusion. 
  Your goal is to take user inputs and a rough prompt template, and transform them into a concise, high-quality image generation prompt.
  Focus on visual descriptions, lighting, style, and composition. Keep it under 50 words if possible.`;

  const userPrompt = `
  Context Variables (from connected inputs):
  ${context}

  Current Draft/Template:
  ${currentTemplate}

  Task: Write an optimized prompt that incorporates the context variables and improves the draft. If there are placeholders like {{Key}}, try to preserve them or intelligently replace them if context is clear.
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Using standard OpenAI model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    return response.choices[0]?.message?.content || currentTemplate;
  } catch (error: any) {
    console.error("OpenAI Optimization Error:", error);
    throw new Error(`Optimization failed: ${error.message}`);
  }
}


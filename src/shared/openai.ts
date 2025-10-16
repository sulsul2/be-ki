import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractTextFromImage(
  base64Image: string,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract and return only the text shown in this image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content?.trim() || '';
  } catch (error: any) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

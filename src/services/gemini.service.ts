import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  }
  
  async describeImage(file: File): Promise<string> {
    const base64Image = await this.convertToBase64(file);
    const imagePart = {
      inlineData: {
        mimeType: file.type,
        data: base64Image,
      },
    };
    const textPart = {
      text: "Describe the product in this image in a concise but descriptive phrase for an AI image generator. Focus only on the main product. For example: 'a red ceramic mug with a white handle', 'a pair of brown leather hiking boots on a rock', 'a sleek silver laptop on a wooden desk'."
    };

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  }

  async generateImagesFromDescription(description: string, aspectRatio: '1:1' | '9:16' | '3:4'): Promise<string[]> {
    const prompt = `Generate 4 photorealistic, professional product photographs featuring: ${description}.

**CRITICAL INSTRUCTIONS:**
1.  **Product Accuracy:** The product in the generated images MUST EXACTLY MATCH the description. DO NOT alter its color, shape, texture, branding, or any other details. The goal is to place the *exact same* product into new, professional settings.
2.  **Focus on Setting:** All creativity must be focused on the background and environment ONLY. Place the product in 4 different clean, stylish, and modern settings suitable for an e-commerce website or Instagram.
3.  **Background Ideas:** Use stylish but non-distracting backgrounds like a marble surface, a rustic wooden table, a solid color backdrop with soft studio lighting, or a lifestyle setting with a soft-focus (bokeh) background.
4.  **Lighting & Angles:** Use professional lighting to make the product look appealing. Show the product from slightly different, flattering angles that clearly display its main features. Avoid extreme or distorted perspectives.
5.  **Realism:** The final images must look like real, high-quality photographs, not CG renders. The product must be the clear focal point.`;
    
    const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 4,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
  }
}
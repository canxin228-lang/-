import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const geminiService = {
  /**
   * Refine a resume based on a job description or general improvement.
   */
  async refineResume(resumeContent: string, jobDescription?: string) {
    const model = "gemini-3.1-pro-preview";
    const prompt = jobDescription 
      ? `You are an expert career coach. Refine the following resume content to better match this job description. 
         Maintain the original language (Chinese). 
         Resume: ${resumeContent}
         Job Description: ${jobDescription}`
      : `You are an expert career coach. Improve the following resume content for clarity, impact, and professional tone. 
         Maintain the original language (Chinese). 
         Resume: ${resumeContent}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  },

  /**
   * Calculate match rate and provide feedback for a job opportunity.
   */
  async calculateMatch(resumeContent: string, jobTitle: string, jobDescription: string) {
    const model = "gemini-3-flash-preview";
    const response = await ai.models.generateContent({
      model,
      contents: `Compare this resume with the job description. 
                 Resume: ${resumeContent}
                 Job Title: ${jobTitle}
                 Job Description: ${jobDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchRate: { type: Type.NUMBER, description: "Percentage from 0 to 100" },
            analysis: { type: Type.STRING, description: "Brief analysis of why it matches or doesn't" },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 improvement suggestions" }
          },
          required: ["matchRate", "analysis", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }
};

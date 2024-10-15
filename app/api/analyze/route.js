import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-exp-0827",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
};

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('video');

  if (!file) {
    return new Response(JSON.stringify({ message: 'Video file is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Upload the file using the File API
    const uploadResponse = await fileManager.uploadFile(await file.arrayBuffer(), {
      mimeType: file.type,
      displayName: file.name,
    });

    // Wait for the file to be processed
    let uploadedFile = await fileManager.getFile(uploadResponse.file.name);
    while (uploadedFile.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
      uploadedFile = await fileManager.getFile(uploadResponse.file.name);
    }

    if (uploadedFile.state !== 'ACTIVE') {
      throw new Error('File processing failed');
    }

    // Start a chat session
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {text: "You are a world-class video ads and creative analyzer. Analyze the video I'm about to show you."},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "Certainly! I'm ready to analyze the video ad you're about to show me. As a world-class video ads and creative analyzer, I'll provide a comprehensive analysis covering aspects such as audience engagement, messaging and storytelling, visual and audio elements, brand consistency, and platform optimization. Please provide me with the video, and I'll get started with the analysis."},
          ],
        },
      ],
    });

    // Send the video for analysis
    const result = await chatSession.sendMessage([
      {
        fileData: {
          mimeType: uploadedFile.mimeType,
          fileUri: uploadedFile.uri
        }
      },
      { text: "Analyze this video ad. Provide insights on its content, key messages, audience engagement, visual and audio elements, brand consistency, and overall effectiveness. Also, suggest improvements and potential performance predictions." },
    ]);

    const analysis = result.response.text();

    // Clean up: delete the uploaded file
    await fileManager.deleteFile(uploadedFile.name);

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing video:', error);
    return new Response(JSON.stringify({ message: 'Error analyzing video', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
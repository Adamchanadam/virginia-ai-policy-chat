
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";
import { UploadedFile, Message, TokenUsage } from "../types";
// 我們只導入型別，不再在前端實例化 GoogleGenAI
import type { Part, Content } from "@google/genai";

interface GenerateResponseResult {
  text: string;
  usage?: TokenUsage;
  citations?: string[];
}

export const generateResponse = async (
  currentPrompt: string,
  history: Message[],
  files: UploadedFile[]
): Promise<GenerateResponseResult> => {
  try {
    // 0. Strict Knowledge Base Check
    if (files.length === 0) {
        return {
            text: "⚠️ **請先上傳知識庫文件**\n\n為了確保回答的準確性並避免虛構內容，我必須在有參考文件的情況下才能為您服務。\n\n請在左側側邊欄上傳 AXA 保險條款 (PDF/MD/TXT)，然後再次提問。",
            usage: { promptTokens: 0, responseTokens: 0, totalTokens: 0 },
            citations: []
        };
    }

    // 1. Prepare Content Parts for the CURRENT User Turn
    const currentTurnParts: Part[] = [];

    for (const file of files) {
        if (file.mimeType === 'application/pdf') {
            // Send PDF as inline binary data
            currentTurnParts.push({
                inlineData: {
                    mimeType: 'application/pdf',
                    data: file.base64,
                },
            });
        } else {
            // Handle Text and Markdown files
            try {
                const binaryString = atob(file.base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const textContent = new TextDecoder().decode(bytes);
                
                currentTurnParts.push({
                    text: `\n--- START OF DOCUMENT: ${file.name} ---\n${textContent}\n--- END OF DOCUMENT ---\n`
                });
            } catch (e) {
                console.warn(`Failed to decode text file ${file.name}`, e);
            }
        }
    }

    // Add the user's text prompt to the parts
    currentTurnParts.push({ text: currentPrompt });

    // 2. Prepare History
    const historyContents: Content[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Combine history with the current turn
    const contents: Content[] = [
        ...historyContents,
        {
            role: 'user',
            parts: currentTurnParts
        }
    ];

    // 3. Call the Backend API (Proxy)
    // We send the structured data to our own server, which then calls Google.
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GEMINI_MODEL,
            contents: contents,
            config: {
                temperature: 0.1,
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const fullText = data.text || "I couldn't generate a response based on those documents.";
    
    // 4. Parse Citations
    const separator = "---SOURCES---";
    let finalText = fullText;
    let citations: string[] = [];

    if (fullText.includes(separator)) {
        const parts = fullText.split(separator);
        finalText = parts[0].trim();
        
        if (files.length > 0) {
            const sourcesBlock = parts[1];
            if (sourcesBlock) {
                citations = sourcesBlock
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(line => line.replace(/^[\-\*]\s*/, '')); 
            }
        }
    }

    // Extract usage metadata from backend response
    let usage: TokenUsage | undefined;
    if (data.usageMetadata) {
      usage = {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        responseTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0
      };
    }

    return { text: finalText, usage, citations };

  } catch (error) {
    console.error("Error calling Backend API:", error);
    if (error instanceof Error) {
        return { text: `系統連線錯誤: ${error.message}。\n\n如果您在本地開發，請確認已啟動 server.js (node server.js)。` };
    }
    return { text: "An unexpected error occurred while communicating with the AI." };
  }
};

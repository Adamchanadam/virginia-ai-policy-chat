import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 8080;

// 設置較大的 Payload 限制以支援 PDF 文件上傳 
// CRITICAL FIX: 前端限制 100MB，Base64 編碼後約需 135MB，設定 200MB 以策安全
app.use(express.json({ limit: '200mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API 代理路徑
app.post('/api/chat', async (req, res) => {
  try {
    const { model, contents, config } = req.body;

    // 嚴格 BFF 模式：API Key 僅在伺服器端讀取
    const apiKey = process.env.API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.error("Error: API_KEY is missing or invalid.");
      return res.status(500).json({ error: "Server configuration error: API Key is missing. Please check your .env file." });
    }

    // 每次請求時初始化實例，確保使用最新的配置與連線
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 在伺服器端呼叫 Gemini
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    // 將結果回傳給前端
    res.json({
      text: response.text,
      usageMetadata: response.usageMetadata,
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: errorMessage });
  }
});

// 生產環境：提供 React 建置後的靜態檔案
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 路由支援：任何未知的請求都回傳 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Backend Proxy active for Gemini requests. Max payload: 200MB`);
});
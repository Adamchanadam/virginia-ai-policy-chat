# 1. 使用 Node.js 官方環境 (輕量版)
FROM node:18-slim

# 2. 設定工作目錄
WORKDIR /app

# 3. 複製 package.json 設定檔
COPY package*.json ./

# 4. 安裝所有依賴 (包含 devDependencies，因為需要執行 build)
RUN npm install

# 5. 複製所有程式碼到容器內
COPY . .

# 6. 執行前端編譯 (這會產生 dist 資料夾)
RUN npm run build

# 7. 定義環境變數 (Cloud Run 預設 Port 為 8080)
ENV PORT=8080

# 8. 啟動指令 (這一步最關鍵，強制啟動我們的後端代理)
CMD ["node", "server.js"]
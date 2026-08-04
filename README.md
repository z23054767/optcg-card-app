# optcg-card-app

前端：**Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS**

## 啟動

```bash
npm install
npm run dev
```

預設位址：

- App: `http://localhost:3001`

## 主要腳本

```bash
npm run build
npm run preview
npm run lint
npm run format
```

## 開發注意事項

- API 透過 `VITE_API_BASE_URL` 指向後端。
- 開發環境會透過 Vite proxy 將 `/api` 轉發到後端。
- 登入頁支援帳密登入，以及 Google / Microsoft / LINE 第三方登入。
- 聊天室頁面使用 WebSocket、Pinia store 與多個 API 請求協作，改動時請注意狀態同步。

## 架構文件

- [資料流與架構圖](docs/architecture.md)

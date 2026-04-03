# Google Apps Script 設定說明

## 需要的資訊

您需要提供以下資訊：

1. **Google Sheet ID**：這是您的 Google 試算表的唯一識別碼
   - 可以在 Google Sheet 的網址中找到
   - 網址格式：`https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - 例如：如果網址是 `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`
   - 那麼 Sheet ID 就是：`1a2b3c4d5e6f7g8h9i0j`
   - **您的 Sheet ID**：`14zx2aM0U9FsfbAJ-3ISWNVfeqnJ2YXzk_L6cx8uZLro`

2. **工作表名稱**：您的資料所在的工作表名稱（通常是 "store" 或 "Sheet1"）
   - **您的工作表名稱**：`store`

## Google Apps Script 程式碼

請按照以下步驟設定：

### 步驟 1：建立 Google Apps Script

1. 開啟您的 Google Sheet
2. 點選「擴充功能」→「Apps Script」
3. 刪除預設的程式碼，貼上以下程式碼：

```javascript
/**
 * 將 Google Sheet 資料轉換為 JSON 格式供前端使用
 */
function doGet(e) {
  try {
    // 設定 CORS 標頭
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // 取得試算表
    // 方法1：如果 Apps Script 是從同一個 Google Sheet 建立的，可以直接使用
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 方法2：如果要從其他 Sheet 讀取，請取消註解下面這行，並填入 Sheet ID
    // const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // 從網址中複製 Sheet ID
    // const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    // 工作表名稱（請確認您的資料在哪個工作表）
    const SHEET_NAME = 'store'; // 如果工作表名稱不同，請修改這裡（例如：'Sheet1'）
    
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return output.setContent(JSON.stringify({
        error: '找不到指定的工作表'
      }));
    }
    
    // 取得所有資料
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return output.setContent(JSON.stringify([]));
    }
    
    // 第一行是標題
    const headers = data[0];
    
    // 將資料轉換為物件陣列
    const stores = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const store = {};
      
      headers.forEach((header, index) => {
        store[header] = row[index] || '';
      });
      
      stores.push(store);
    }
    
    // 回傳 JSON 資料
    return output.setContent(JSON.stringify(stores));
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 步驟 2：設定部署

1. 在 Apps Script 編輯器中，點選「部署」→「新增部署作業」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - **說明**：可以填寫 "Store Data API"
   - **執行身份**：選擇「我」
   - **具有存取權的使用者**：選擇「所有人」（這樣前端才能存取）
4. 點選「部署」
5. **重要**：複製產生的「網頁應用程式網址」，格式類似：
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### 步驟 3：更新前端程式碼

將複製的網址貼到 `js/data.js` 檔案中：

```javascript
async function fetchStores() {
  const url = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
  // 將上面的 YOUR_SCRIPT_ID 替換為您從步驟 2 複製的完整網址
  ...
}
```

## 資料格式對應

您的 CSV 欄位會自動對應到應用程式使用的格式：

| CSV 欄位 | 應用程式欄位 | 說明 |
|---------|------------|------|
| store_id | id | 門市 ID |
| name | name | 門市名稱 |
| featured | featured | 是否為精選門市 |
| country | country | 國家 |
| city | city | 城市 |
| address | address | 地址 |
| latitude, longitude | coords | 座標 |
| hero_image_url | hero_image_url | 主圖 |
| description | description | 描述 |
| opening_time_mon ~ sun | hours | 營業時間 |
| phone_number | phone | 電話 |

## 注意事項

1. **權限設定**：首次部署時，Google 會要求授權，請允許存取您的 Google Sheet
2. **更新資料**：當您更新 Google Sheet 的資料後，前端會自動取得最新資料
3. **快取機制**：應用程式會將資料儲存在 localStorage 中，如需強制更新，請清除瀏覽器快取
4. **定期刷新**：應用程式會每 10 分鐘自動從 Google Sheet 刷新門市資料，確保顯示最新資訊

## 測試

部署完成後，您可以直接在瀏覽器開啟部署的網址，應該會看到 JSON 格式的門市資料。


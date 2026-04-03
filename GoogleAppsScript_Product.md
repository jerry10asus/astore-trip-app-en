# Google Apps Script 設定說明 - 產品資料

## 需要的資訊

您需要提供以下資訊：

1. **Google Sheet ID**：這是您的產品資料 Google 試算表的唯一識別碼
   - 可以在 Google Sheet 的網址中找到
   - 網址格式：`https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - 例如：如果網址是 `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit`
   - 那麼 Sheet ID 就是：`1a2b3c4d5e6f7g8h9i0j`
   - **請提供您的產品 Sheet ID**：`_________________`

2. **工作表名稱**：您的產品資料所在的工作表名稱（通常是 "product" 或 "Sheet1"）
   - **請提供您的工作表名稱**：`_________________`

3. **網頁應用程式網址**：部署完成後，請提供產生的網址
   - **請提供您的網頁應用程式網址**：`_________________`

## Google Apps Script 程式碼

請按照以下步驟設定：

### 步驟 1：建立 Google Apps Script

1. 開啟您的產品資料 Google Sheet
2. 點選「擴充功能」→「Apps Script」
3. 刪除預設的程式碼，貼上以下程式碼：

```javascript
/**
 * 將 Google Sheet 產品資料轉換為 JSON 格式供前端使用
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
    // const SHEET_ID = 'YOUR_PRODUCT_SHEET_ID_HERE'; // 從網址中複製 Sheet ID
    // const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    // 工作表名稱（請確認您的產品資料在哪個工作表）
    const SHEET_NAME = 'product'; // 如果工作表名稱不同，請修改這裡（例如：'Sheet1'）
    
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
    const products = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const product = {};
      
      headers.forEach((header, index) => {
        product[header] = row[index] || '';
      });
      
      products.push(product);
    }
    
    // 回傳 JSON 資料
    return output.setContent(JSON.stringify(products));
    
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
   - **說明**：可以填寫 "Product Data API"
   - **執行身份**：選擇「我」
   - **具有存取權的使用者**：選擇「所有人」（這樣前端才能存取）
4. 點選「部署」
5. **重要**：複製產生的「網頁應用程式網址」，格式類似：
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### 步驟 3：更新前端程式碼

將複製的網址貼到 `js/data.js` 檔案中的 `fetchProducts` 函數：

```javascript
async function fetchProducts() {
  const url = "https://script.google.com/macros/s/YOUR_PRODUCT_SCRIPT_URL/exec";
  // 將上面的 YOUR_PRODUCT_SCRIPT_URL 替換為您從步驟 2 複製的完整網址
  ...
}
```

## 資料格式對應

您的 Google Sheet 欄位會自動對應到應用程式使用的格式：

| Google Sheet 欄位 | 應用程式欄位 | 說明 | 必填 |
|-----------------|------------|------|------|
| product_id | id | 產品 ID | 否 |
| product_name | name | 產品名稱 | **是** |
| product_year | year | 產品年份 | **是** |
| product_image | image_url | 產品圖片網址 | **是** |

### 範例資料格式

您的 Google Sheet 應該類似這樣：

| product_id | product_name | product_year | product_image |
|-----------|-------------|-------------|--------------|
| 1 | iMac | 1998 | https://example.com/imac-1998.jpg |
| 2 | iPod | 2001 | https://example.com/ipod-2001.jpg |
| 3 | iPhone | 2007 | https://example.com/iphone-2007.jpg |

## 功能說明

1. **隨機顯示**：每次進入首頁時，會從所有產品中隨機選擇一筆顯示
2. **資料快取**：產品資料會儲存在瀏覽器的 localStorage 中，提升載入速度
3. **自動更新**：如果 localStorage 中沒有產品資料，會自動從 Google Sheet 獲取

## 注意事項

1. **權限設定**：首次部署時，Google 會要求授權，請允許存取您的 Google Sheet
2. **欄位名稱**：請確保 Google Sheet 的第一行（標題行）包含以下欄位：
   - `product_id`（可選）
   - `product_name`（必填）
   - `product_year`（必填）
   - `product_image`（必填）
3. **圖片網址**：`product_image` 欄位應該包含完整的圖片網址（例如：`https://example.com/image.jpg`）
4. **資料更新**：當您更新 Google Sheet 的資料後，使用者清除瀏覽器快取或重新載入頁面時會取得最新資料

## 測試

部署完成後，您可以直接在瀏覽器開啟部署的網址，應該會看到 JSON 格式的產品資料，例如：

```json
[
  {
    "product_id": "1",
    "product_name": "iMac",
    "product_year": "1998",
    "product_image": "https://example.com/imac-1998.jpg"
  },
  {
    "product_id": "2",
    "product_name": "iPod",
    "product_year": "2001",
    "product_image": "https://example.com/ipod-2001.jpg"
  }
]
```

## 提供資訊給開發者

設定完成後，請提供以下資訊：

1. **Google Sheet ID**：`_________________`
2. **工作表名稱**：`_________________`
3. **網頁應用程式網址**：`_________________`

開發者會將這些資訊更新到程式碼中。


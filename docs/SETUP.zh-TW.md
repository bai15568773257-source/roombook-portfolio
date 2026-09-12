# Meeting Room Booking System / 會議室預約系統

使用 Python FastAPI、MariaDB 和原生 JavaScript 製作的會議室預約系統，以 Docker Compose 部署。

這份儲存庫由既有部署的程式碼整理而成，管理員預設信箱已改成虛構範例，設定檔中的真實值已移除。儲存庫不包含員工名單、密碼雜湊、預約資料、報表、資料庫備份或正式環境的 `.env`。

## 直接預覽

[開啟免登入的一般使用者預覽](https://bai15568773257-source.github.io/roombook-portfolio/)

可以查看儀表板、會議室、預約時間軸與日曆。所有人物與預約都是虛構資料，畫面不提供管理員權限，也不執行預約保存、修改、刪除或寄信。這個預覽只載入靜態頁面，在瀏覽器內產生展示資料；不會連接公司系統或員工資料庫。

`docs/` 的展示頁由 `python3 demo/build_preview.py` 產生，GitHub Pages 從 `main` 分支的 `/docs` 發布。實際系統的完整功能仍由下方的 Docker 部署提供。

## 功能

- 帳號登入、密碼變更與管理員使用者管理。
- 會議室預約、時間衝突檢查、每週重複預約與審批流程。
- 儀表板、時間軸、日曆及個人預約檢視。
- 日文、中文、英文介面與外觀切換。
- 審計紀錄與報表匯出。
- 可選的 Microsoft Graph / SMTP 郵件通知及預約提醒。

以上是程式碼中已有的功能；本次整理未重新驗證全部業務流程。

## 技術與檔案

| 路徑 | 用途 |
| --- | --- |
| `app/main.py` | FastAPI API、SQLAlchemy 資料表定義、登入與預約邏輯 |
| `app/requirements.txt` | Python 套件版本 |
| `app/Dockerfile` | Python 3.12 API 映像檔 |
| `site/` | HTML、CSS、原生 JavaScript、多語言文字與圖示 |
| `site/nginx.conf` | 靜態網頁與 `/api/` 反向代理 |
| `compose.yaml` | Nginx、API、MariaDB 容器與資料卷設定 |
| `.env.example` | 不含真實帳密的設定範例 |

瀏覽器 → Nginx（8080）→ FastAPI（8000，容器內部）→ MariaDB（3306，容器內部）。

## 在獨立環境啟動

需要 Docker Engine / Docker Desktop 與 Docker Compose。使用獨立電腦或測試環境及全新資料卷；既有公司 NAS 的系統仍使用原本的部署，不需為了備份原始碼而更動。

1. 將儲存庫下載或 clone 到本機，進入專案資料夾。
2. 複製設定範例：

   ```sh
   cp .env.example .env
   ```

3. 在本機執行以下指令，產生四組不同的隨機值，再分別填入 `.env` 的 `DB_PASSWORD`、`MARIADB_ROOT_PASSWORD`、`JWT_SECRET`、`ADMIN_PASSWORD`：

   ```sh
   python3 -c 'import secrets; print("\n".join(secrets.token_hex(32) for _ in range(4)))'
   ```

   這些值只保存在本機 `.env`。目前資料庫連線字串直接插入密碼，使用上述十六進位字元可避免 URL 保留字元造成解析問題。`JWT_SECRET` 至少需要 32 個字元。

4. 視需要修改 `ADMIN_EMAIL`、`ADMIN_NAME` 和 `APP_BASE_URL`；HTTPS 環境請將 `COOKIE_SECURE` 設為 `true`。範例 `admin@example.com` 僅供測試。
5. 啟動：

   ```sh
   docker compose -p meeting-room-demo up -d --build
   ```

6. 開啟 `http://localhost:8080`，使用 `.env` 中設定的管理員帳號密碼登入。

空白資料庫會在啟動時建立資料表、六間會議室及第一個管理員。無需匯入正式員工資料。程式也包含舊版資料表調整與管理員同步邏輯，因此不要將測試環境連到既有公司資料庫。

`compose.yaml` 保留原部署的固定容器名稱；若同一台主機已有同名容器，請另用獨立環境測試。MariaDB 資料存於 Docker named volume，報表執行時寫入本機 `reports/`。兩者都不屬於 GitHub 的程式碼內容。

## 郵件功能

設定範例預設不啟用審批通知及提醒，且不填入任何郵件服務憑證。需要寄信時，可自行設定 Microsoft Graph 或 SMTP。未設定郵件服務時，寄送驗證碼、密碼找回及相關通知無法正常完成。

## 檢查與限制

本次整理已進行 Python 語法解析、JavaScript 語法檢查、Compose YAML 結構檢查，以及針對檔案內容的帳密與個人資料檢查。未啟動 Docker、未連接正式資料庫、未測試實際寄信或完整預約流程。

- 假日清單目前寫在程式中，包含 2026、2027 年，後續年份需維護。
- 管理員同步與資料表調整會在啟動時執行，變更部署前請先於獨立資料庫驗證。
- 原有套件版本與可選的 MRBS profile 保留，尚未進行套件升級或完整安全審查。
- `.gitignore` 排除 `.env`、報表、備份、資料庫檔與執行快取。新增檔案前仍需檢查實際內容。

這份程式碼是經過去識別化的公開作品集版本，並未宣告開源授權。

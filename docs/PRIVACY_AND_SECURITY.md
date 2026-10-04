# Privacy & Security Notice — AchieveX 360

## Data Storage & Privacy

1. **Client-Side Mode (GitHub Pages / Static)**:
   - All Excel file parsing, calculations, and data persistence take place **locally within the user's web browser**.
   - Data is stored in browser `LocalStorage` or `IndexedDB`.
   - No data is transmitted to external third-party servers or telemetry services.

2. **PHP + MySQL Mode**:
   - When hosted on a PHP server (e.g., XAMPP or Linux Apache/MySQL server), uploaded datasets are stored securely in your local database `achievex_360`.
   - Ensure your MySQL database server is protected by appropriate access credentials in production.

3. **Public Repository Warning**:
   - Do not commit confidential corporate spreadsheets containing personal identifiable information (PII) to public GitHub repositories.
   - Use mock or sanitized sample workbooks for public demos.

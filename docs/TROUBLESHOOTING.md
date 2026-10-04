# Troubleshooting & FAQ — AchieveX 360

## 1. Common Issues & Solutions

### Issue: "No active dataset found" on page load
- **Cause**: The browser storage or MySQL database has no active dataset stored.
- **Solution**: The application automatically auto-loads `Sample 1 (H1 2026)` on first run. If blocked, click **Switch Sample Dataset** or upload an Excel file via **Upload Excel / Map**.

### Issue: Column headers not mapped automatically
- **Cause**: The uploaded Excel file uses non-standard column headers (e.g. `Cust_ID` instead of `Retailer Code`).
- **Solution**: Open the **Upload Excel / Map** modal and manually select the appropriate column from the dropdown mapping table.

### Issue: Category shows `N/A` instead of a value
- **Cause**: That category was not present or tracked in the selected reporting month.
- **Explanation**: This is intended behavior. The dashboard never assumes missing category metrics are zero.

### Issue: MySQL connection error on local server
- **Cause**: XAMPP MySQL service is stopped or port `3306` is blocked.
- **Solution**: Start MySQL in XAMPP Control Panel. If MySQL is unavailable, AchieveX 360 automatically falls back to client-side LocalStorage.

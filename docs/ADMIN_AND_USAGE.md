# Admin & Usage Guide — AchieveX 360

## 1. Dynamic Excel Import Workflow

1. Click the **Upload Excel / Map** button in the top navigation bar.
2. Drag and drop your `.xlsx`, `.xls`, `.xlsb`, or `.csv` file into the dropzone.
3. The system automatically inspects the workbook layout and detects:
   - Worksheet title and reporting years
   - Half-year labels (`H1`, `H2`, `FY 2026-27`)
   - Quarter mappings (`Q1`, `Q2`, `Q3`, `Q4`)
   - Reporting months
   - Category names associated with each month
   - Identifier columns (Distributor, Retailer, SSE, DSR, Activity, Slab)
4. Review the auto-detected mapping table in the modal. Override any column selectors if needed.
5. Click **Confirm & Replace Dashboard Data**. All dashboard titles, filters, cards, charts, and table columns will instantly update.

---

## 2. Dynamic Filtering & Category Management

- **Period Filters**: Year, Half-Year, Quarter, and Month filters update dynamically based on the uploaded workbook.
- **Month-by-Month Categories**: Categories can differ between months.
  - **Union Mode**: Displays all categories present across any of the selected months.
  - **Intersection Mode**: Displays only categories present in *all* of the selected months.
  - **`N/A` Handling**: If an outlet or month lacks a specific category, `N/A` is rendered instead of treating missing data as zero.
- **Retailer Live Search**: Type any partial name or code in the search bar to filter instantly.

---

## 3. Switching Sample Datasets for Testing

Use the **Switch Sample Dataset** dropdown in the navbar:
- **Sample 1 (H1 2026)**: January – June 2026, Q1–Q2, Categories A through F.
- **Sample 2 (FY 2026-27 H2)**: October 2026 – March 2027, Q3–Q4, Premium, Standard, Digital Promo, VIP Gold, Festive Pack, Super Saver categories.

This demonstrates zero hardcoding by instantly transforming all reporting options and visual elements.

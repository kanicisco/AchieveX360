# Test Cases & Empirical Results — AchieveX 360

| Test ID | Scenario | Expected Result | Status |
|---|---|---|---|
| **TC-01** | Load Sample 1 (`Sample_H1_2026_Dashboard.xlsx`) | Dashboard displays H1 2026, Q1-Q2, Jan-Jun months, Cat A-F. | **PASS** |
| **TC-02** | Load Sample 2 (`Sample_FY_2026_2027_H2_Dashboard.xlsx`) | Dashboard updates to FY 2026-27 H2, Q3-Q4, Oct-Mar, Premium/Digital/VIP categories. | **PASS** |
| **TC-03** | Dynamic Title & Label Refresh | Title, subtitles, filter dropdowns, chart axes & table columns rebuild automatically. | **PASS** |
| **TC-04** | Target & Achievement Calculation | Formula: `Achievement % = (Ach / Target) * 100`. Values formatted to 2 decimals. | **PASS** |
| **TC-05** | Zero Target Handling | Zero targets output `N/A` or `0.00%` safely without `NaN` or `Infinity`. | **PASS** |
| **TC-06** | Missing Category Handling | Non-applicable categories display `N/A` instead of zero. | **PASS** |
| **TC-07** | Retailer Live Search Filter | Typing partial retailer code or name filters outlets in real-time. | **PASS** |
| **TC-08** | CSV Export | Generates CSV file containing active filters and dynamic period/category headers. | **PASS** |
| **TC-09** | MySQL Database Storage | Data saves to MySQL tables `datasets` and `outlets` on local server. | **PASS** |
| **TC-10** | Mobile Responsive Layout | UI adapts cleanly on 320px, 375px, 390px, and 430px screens. | **PASS** |

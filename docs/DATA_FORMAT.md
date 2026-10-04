# Data Format & Excel Structure Specification — AchieveX 360

AchieveX 360 uses an adaptive Excel parser. It can process workbooks with single-row or multi-row headers and variable period structures.

---

## 1. Column Naming Conventions

The engine automatically matches headers using regular expressions:

| Target Field | Recommended Column Headers |
|---|---|
| **Distributor Code** | `Distributor Code`, `Dist Code` |
| **Distributor Name** | `Distributor Name`, `Distributor` |
| **SSE** | `SSE`, `SSE Name` |
| **DSR** | `DSR`, `DSR Name` |
| **Retailer Code** | `Retailer Code`, `Outlet Code`, `Store Code` |
| **Retailer Name** | `Retailer Name`, `Outlet Name`, `Store Name` |
| **URC** | `URC`, `URC Code` |
| **Activity** | `Activity`, `Activity Name`, `Campaign` |
| **Slab** | `Slab`, `Tier`, `Segment` |

---

## 2. Monthly Target & Achievement Column Formatting

Monthly metric columns should follow one of these patterns:
- `<Month> Target` (e.g. `Jan Target`, `October 2026 Target`)
- `<Month> Achievement` or `<Month> Ach` (e.g. `Jan Achievement`, `Oct 2026 Ach`)
- `<Month> - <Category Name>` (e.g. `Jan - Cat A`, `Oct - Premium Tier`)

---

## 3. Period Metadata Detection

The engine scans the top 4 rows of the sheet for metadata text matching:
- `Year <YYYY>` or `FY <YYYY-YY>`
- `H1`, `H2`, `HY1`, `HY2`, `1st Half`, `2nd Half`
- `Q1`, `Q2`, `Q3`, `Q4`

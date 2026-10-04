# Antigravity AI Development Prompt — Excel-Driven Dynamic Activity Outlet Achievement Dashboard

## Project objective

Act as a senior full-stack developer, UI/UX designer, data analyst, and software architect.

Build a complete, professional, interactive web application named **Activity Outlet Achievement Dashboard**. The application must adapt to the actual structure of the supplied Excel workbook and be deployable through GitHub Pages.

This must be a functional application, not a static mockup. Implement working filters, calculations, charts, tables, Excel import and validation, data persistence, and exports.

## 1. Core principle: the Excel workbook is the source of truth

**Do not hardcode reporting years, half-years, months, quarters, or category names.**

Before implementation, inspect the supplied workbook, including:
- Worksheet names
- Column headers and multi-row headers
- Merged cells, where relevant
- Reporting years and period labels
- Month and quarter labels
- Category names
- Target and achievement fields
- Distributor and outlet identifiers
- Existing totals and formulas, where available

Preserve the workbook's actual labels and reporting structure. If a label or mapping cannot be identified confidently, expose it for administrator mapping rather than guessing.

## 2. Technology and deployment

Use a maintainable client-side stack suitable for static hosting:
- HTML5, CSS3, and modern JavaScript
- Bootstrap 5 or well-structured responsive custom CSS
- Chart.js for charts
- SheetJS for Excel parsing, including XLSX and XLSB where supported
- LocalStorage or IndexedDB for browser-side persistence
- GitHub Pages for hosting

Use relative asset paths so the app works from a repository subpath, for example:
`https://USERNAME.github.io/activity-outlet-dashboard/`

Do not require a backend or paid hosting service for core dashboard functionality. Document any feature that cannot be secured or synchronized without a backend.

## 3. Dynamic reporting year and half-year

Detect reporting years and half-year labels from the workbook.

Requirements:
- Support multiple years if present.
- Support H1, H2, or other half-year labels actually present in the workbook.
- Do not assume H1 is January–June or H2 is July–December.
- Support financial years that cross calendar years.
- Preserve source labels and show them in the dashboard title, filters, charts, and exports.
- When a replacement workbook is uploaded, refresh the available years and half-years from the new workbook.
- If half-year periods are not explicit, derive them only from a reliably identified reporting calendar or administrator-provided mapping.

## 4. Dynamic month detection

Identify the months available in the workbook and their relationship to the selected year and half-year.

Requirements:
- Do not assume all 12 months are present.
- Preserve source month labels and order.
- Support different month sequences and financial-year calendars.
- Allow selection of one or more available months, where meaningful.
- Update monthly target, achievement, percentage, charts, filters, and table columns when the selected period changes.
- Do not show months that are not present in the selected reporting period unless the user explicitly chooses to show all available periods.

## 5. Dynamic quarter detection

Detect quarter labels and their month mappings from the workbook.

Requirements:
- Support Q1, Q2, Q3, and Q4 when present, as well as other source-defined labels.
- Do not assume calendar-quarter boundaries.
- Preserve the workbook's quarter labels and ordering.
- If quarter mappings are absent, derive them only when the reporting calendar is unambiguous; otherwise request administrator mapping.
- Update quarter filters, KPI cards, charts, tables, and exports dynamically.
- Avoid double-counting when the workbook already contains quarter totals.

## 6. Dynamic month-by-month category management

Categories may change from month to month. Detect and associate categories with the correct year, month, outlet, activity, and other applicable keys.

Requirements:
- Read category names from the workbook rather than hardcoding a fixed list or count.
- Support categories being added, removed, renamed, or appearing only in selected months.
- Show categories applicable to the selected month or period.
- Allow multiple category selections.
- When multiple months are selected, offer:
  1. Categories available in every selected month (intersection).
  2. All categories available in any selected month (union).
- If a category is not applicable or absent for a period, show `N/A` rather than treating it as zero.
- Provide an administrator mapping facility for categories whose names change between workbooks or months.
- Ensure category columns, charts, KPIs, and exports respond to period and filter changes.

Do not infer that two differently named categories are equivalent unless the administrator maps them or the workbook clearly establishes equivalence.

## 7. Dynamic dashboard labels and navigation

Generate all period-related labels from the imported workbook or configured mappings, including:
- Dashboard title and subtitle
- Year and half-year
- Month and quarter
- Monthly, quarterly, half-year, and annual headings
- Category names
- Export/report headings

Do not leave stale labels from a previously uploaded workbook. After a successful replacement, refresh the entire application state and visible controls.

## 8. Data model and import mapping

Use a flexible internal data model that represents the reporting period explicitly. A normalized conceptual record may include:

```json
{
  "year": 2026,
  "periodLabel": "source-defined period",
  "halfYear": "source-defined half-year",
  "quarter": "source-defined quarter",
  "month": "source-defined month",
  "distributorCode": "DIST001",
  "distributor": "Distributor name",
  "retailerCode": "RET001",
  "retailerName": "Retailer name",
  "activity": "Activity name",
  "category": "Source category",
  "target": 100,
  "achievement": 85
}
```

This is illustrative only. Adapt the data model to the actual workbook and preserve all relevant source fields.

Import requirements:
- Support XLSX and XLSB when the selected parsing library supports the workbook's features.
- Inspect sheets and headers before importing.
- Avoid relying on fixed column positions when header names can be used.
- Support configurable column and category mappings.
- Provide a preview before committing imported data.
- Validate the file and required fields before replacing current data.
- If validation fails, preserve the existing dataset.
- Display clear errors and warnings, including the sheet and field involved where possible.
- Do not silently discard records or transform source values.

## 9. Performance calculations

Calculate monthly, quarterly, half-year, and annual performance using the workbook's actual periods and source values.

Use:

`Achievement Percentage = (Achievement / Target) * 100`

Requirements:
- Format achievement and target values to two decimal places.
- Format percentages to two decimal places.
- Handle zero targets safely (display `N/A` or another explicit indicator).
- Do not display `NaN` or `Infinity`.
- Distinguish missing values from explicit zero values.
- Prefer source-provided totals when their definitions are clear.
- Do not add source totals to underlying detail records.
- Reconcile period totals where the workbook provides sufficient information.
- Document any assumptions used in aggregation.

## 10. Dashboard overview and analytics

Create a professional business dashboard with:
- Total distributors
- Total outlets
- Total activities
- Selected record count
- Target, achievement, and achievement percentage for the selected reporting period
- Data last-updated timestamp

Include interactive charts such as:
- Monthly target vs. achievement
- Quarter performance
- Half-year or annual performance, when available
- Distributor performance
- Activity performance
- Category performance

Charts must update when filters or reporting periods change. Use readable labels and tooltips. Avoid overcrowding mobile screens.

## 11. Filters

Provide filters for all fields supported by the workbook, including where available:
- Year
- Half-year
- Quarter
- Month
- Distributor Code
- Distributor
- SSE
- DSR
- Retailer Code
- Retailer Name
- URC
- Activity
- Slab
- Category

Requirements:
- Filters must work together.
- Dependent options should update based on available data and current selections.
- Support partial text search for retailer code and name.
- Provide a reset action.
- Show the number of matching records.
- Do not allow incompatible periods to be combined accidentally.
- Keep controls usable on desktop, tablet, and mobile.

## 12. Outlet data table

Create a searchable, sortable, paginated table containing the outlet and performance fields available in the workbook.

Requirements:
- Include relevant distributor, SSE, DSR, retailer, URC, activity, and slab fields when present.
- Display monthly and period-level target, achievement, and percentage columns based on the selected reporting period.
- Display selected category achievement columns immediately after the period achievement columns where practical.
- Support multiple selected categories.
- Use horizontal scrolling or a mobile card view rather than shrinking text to unreadable sizes.
- Include page-size controls, clear empty states, and a matching-record count.
- Ensure table values match the active filters and calculations.

## 13. Administrator panel

Provide an administrator interface for:
- Uploading a replacement workbook
- Previewing detected sheets, periods, months, quarters, and categories
- Mapping unknown columns and categories
- Reviewing validation results
- Confirming data replacement
- Restoring the original embedded dataset, if included
- Clearing locally stored data with confirmation
- Viewing the last successful import
- Exporting a backup where practical

**Security:** GitHub Pages is static hosting. A password embedded in client-side JavaScript is not secure and must not be described as secure authentication. Do not put real credentials or confidential data in a public repository. Document that genuine access control requires a backend or suitable authentication service.

## 14. Browser-side persistence and offline behavior

Use IndexedDB for larger datasets, or LocalStorage if the dataset is demonstrably small.

Requirements:
- Preserve imported data after page refresh.
- Handle storage quota errors.
- Provide backup/export and restore options where practical.
- Explain that browser storage is local to that browser/device and does not synchronize across users.
- If offline support is implemented, use a service worker and document caching limitations.
- Do not claim cross-device synchronization without a backend.

## 15. Export and print

Provide:
- CSV export of filtered records
- CSV export of all records
- Inclusion of selected period and category columns
- Clear, consistent number formatting
- Print-friendly dashboard view
- Optional PDF export if it can be implemented reliably

Exports must reflect the same active filters and reporting-period definitions as the dashboard.

## 16. Mobile-first responsive design

Make mobile optimization a core requirement.

Support desktop, tablet, Android, and iPhone screens. Test at widths including 320px, 375px, 390px, and 430px.

Requirements:
- Responsive or collapsible navigation
- Collapsible filter panel
- Touch-friendly controls
- Readable typography and spacing
- KPI cards in a compact grid
- Horizontally scrollable category controls
- Responsive charts
- Usable table with horizontal scrolling or a card alternative
- No unintended page-level horizontal overflow
- No tiny controls or unreadable text

## 17. GitHub project structure

Create a complete maintainable project. A suggested structure is:

```text
activity-outlet-dashboard/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
├── .nojekyll
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── dashboard.js
│   │   ├── filters.js
│   │   ├── charts.js
│   │   ├── data-manager.js
│   │   ├── excel-import.js
│   │   ├── validation.js
│   │   └── export.js
│   └── images/
│       └── logo-placeholder.svg
├── data/
│   └── README.md
├── docs/
│   ├── GITHUB_PAGES_SETUP.md
│   ├── ADMIN_AND_USAGE.md
│   ├── PRIVACY_AND_SECURITY.md
│   ├── DATA_FORMAT.md
│   └── TROUBLESHOOTING.md
└── tests/
    └── test-cases.md
```

Adjust the structure if needed, but keep it simple and maintainable. Do not include confidential source data unless explicitly approved.

## 18. Documentation

Create:
- `README.md`: project overview, features, setup, local testing, deployment, and updates.
- `GITHUB_PAGES_SETUP.md`: step-by-step publishing instructions.
- `ADMIN_AND_USAGE.md`: filters, categories, charts, imports, and exports.
- `PRIVACY_AND_SECURITY.md`: public repository risks, client-side limitations, and browser storage.
- `DATA_FORMAT.md`: supported workbook structure, fields, mappings, and validation rules.
- `TROUBLESHOOTING.md`: import, parsing, storage, chart, filter, mobile, and deployment issues.
- `test-cases.md`: test scenarios and expected results.

## 19. Testing and acceptance criteria

Inspect and test the actual supplied workbook before claiming compatibility.

Test that:
1. The application loads without JavaScript errors.
2. Workbook labels are detected rather than hardcoded.
3. Different years and half-year labels can be displayed.
4. Available months and their order come from the workbook.
5. Quarter labels and mappings follow the workbook.
6. Categories can differ by month.
7. Newly added or renamed categories are handled through detection or mapping.
8. All filters work independently and together.
9. Charts, KPIs, tables, and exports stay synchronized.
10. Calculations handle zero and missing values correctly.
11. Invalid uploads do not replace valid existing data.
12. Imported data persists after refresh.
13. The application works at the required mobile widths.
14. Assets load when deployed under a GitHub Pages repository subpath.

Record actual test results. Do not claim a test passed unless it was executed. Clearly list any limitations.

## 20. Development workflow

Work in the project workspace.

1. Inspect the supplied Excel workbook and identify its actual structure.
2. Document the detected sheets, headers, periods, and categories.
3. Design the internal data model and import mappings.
4. Build the responsive application shell.
5. Implement dynamic period and category detection.
6. Implement filters and calculations.
7. Implement charts and the outlet table.
8. Implement import validation and safe replacement.
9. Implement persistence and exports.
10. Write deployment and user documentation.
11. Run tests, fix defects, and report results.

If the workbook is unavailable, build a configurable importer and clearly state that workbook-specific compatibility remains unverified.

## Final instruction

Build an **Excel-driven, period-independent dashboard**. The same application must adapt to each new workbook without code changes whenever its structure can be mapped reliably. Never assume fixed years, H1/H2 month boundaries, quarter mappings, or category lists. When the source is ambiguous, request an explicit mapping instead of guessing.

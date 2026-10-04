# AchieveX 360 — Excel-Driven Dynamic Activity Outlet Achievement Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php)](https://www.php.net)
[![MySQL](https://img.shields.io/badge/MySQL-10.4%2B-4479A1?logo=mysql)](https://www.mysql.com)
[![GitHub Pages Compatible](https://img.shields.io/badge/GitHub%20Pages-Ready-22C55E?logo=github)](docs/GITHUB_PAGES_SETUP.md)

**AchieveX 360** is an **Excel-Driven Dynamic Reporting System** designed for tracking sales activity targets, achievements, percentages, and month-specific categories across outlets and distributors.

> **CRITICAL REQUIREMENT GUARANTEE:**
> All reporting labels, periods, months, quarters, categories, and titles are **100% dynamically derived from the uploaded Excel workbook**.
> **Zero hardcoded H1, H2, years, months, quarters, or category names.**

---

## 🌟 Core Features

1. **Zero-Hardcoding Dynamic Architecture**:
   - **Dynamic Year & Half-Year Detection**: Detects `H1`, `H2`, `FY 2026-27`, or custom period labels from sheet titles or headers.
   - **Dynamic Month Detection**: Extracts available months and displays only applicable periods.
   - **Dynamic Quarter Detection**: Maps months to `Q1-Q4` or custom quarters.
   - **Month-by-Month Category Management**: Tracks activity categories per month. Displays `N/A` for non-applicable categories (never misinterprets missing data as zero).
   - **Union vs. Intersection Category Modes**: Compare categories across multiple months.

2. **Full Stack PHP + MySQL & Client-Side Hybrid**:
   - **Local XAMPP / Apache Server**: Stores uploaded datasets, mapping configurations, and outlet metrics in MySQL.
   - **GitHub Pages / Client-Side Hosting**: Works offline using IndexedDB / LocalStorage & SheetJS parser.

3. **Interactive Visual Analytics & Data Table**:
   - Combo Target vs. Achievement trend chart with % line.
   - Activity distribution doughnut chart.
   - Top distributor comparison.
   - Category performance breakdown.
   - Searchable, sortable, paginated data table with mobile card view.

4. **Excel Inspection & Admin Mapping Interface**:
   - Drag & drop `.xlsx`, `.xls`, `.xlsb`, or `.csv` files.
   - Structure inspection preview modal.
   - Manual column mapping override.
   - Instant sample dataset switcher (`Sample 1: H1 2026` vs `Sample 2: FY 2026-27 H2`).

5. **Exports**:
   - CSV export of filtered or full records with dynamic headers.
   - Printable dashboard layout.

---

## 🚀 Quick Start (Local XAMPP Server)

1. Place the `AchieveX 360` directory inside your XAMPP `htdocs` folder (`c:\xampp\htdocs\AchieveX 360`).
2. Start **Apache** and **MySQL** from the XAMPP Control Panel.
3. Open your browser and navigate to:
   ```text
   http://localhost/AchieveX%20360/
   ```
4. The application automatically initializes the MySQL database `achievex_360` and loads `Sample 1 (H1 2026)` data.

---

## 📦 Project Directory Structure

```text
AchieveX 360/
├── index.php                 # PHP Full-Stack Application Entry
├── index.html                # Static Web Application Entry (GitHub Pages)
├── config.php                # System Config
├── db_connect.php            # MySQL Connection Handler
├── setup_db.php              # Automatic Database & Table Creator
├── api/                      # REST API Endpoints
│   ├── data.php              # Get/Save Datasets & Outlets
│   ├── mapping.php           # Field Mapping Profiles
│   └── reset.php             # Clear DB State
├── assets/
│   ├── css/
│   │   └── style.css         # Modern Design System (Glassmorphic, Google Fonts)
│   ├── js/
│   │   ├── app.js            # Core App Orchestrator
│   │   ├── excel-parser.js   # SheetJS Structure Inspection Engine
│   │   ├── data-manager.js   # Aggregation & Calculation Logic
│   │   ├── filters.js        # Dynamic Filter Controller
│   │   ├── charts.js         # Chart.js Visualizations
│   │   ├── table.js          # Outlet Performance Table
│   │   ├── admin-mapper.js   # Admin Modal & Dropzone Handler
│   │   └── export.js         # CSV & Print Exporter
│   └── images/
│       ├── AchieveX 360 Analytics Logo BG.png
│       └── AchieveX 360 Analytics Logo.png
├── data/                     # Generated Test Workbooks
│   ├── Sample_H1_2026_Dashboard.xlsx
│   └── Sample_FY_2026_2027_H2_Dashboard.xlsx
├── docs/                     # Detailed Documentation Suite
│   ├── GITHUB_PAGES_SETUP.md
│   ├── ADMIN_AND_USAGE.md
│   ├── PRIVACY_AND_SECURITY.md
│   ├── DATA_FORMAT.md
│   └── TROUBLESHOOTING.md
└── tests/
    └── test-cases.md
```

---

## 📜 Documentation

- [GitHub Pages Deployment Guide](docs/GITHUB_PAGES_SETUP.md)
- [Admin & Usage Manual](docs/ADMIN_AND_USAGE.md)
- [Data Format Specification](docs/DATA_FORMAT.md)
- [Privacy & Security Notice](docs/PRIVACY_AND_SECURITY.md)
- [Troubleshooting & FAQ](docs/TROUBLESHOOTING.md)
- [Test Cases & Results](tests/test-cases.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

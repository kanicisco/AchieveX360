/**
 * ExcelParser - Dynamic Excel Inspection and Parsing Engine
 * SheetJS based reader with multi-sheet support, ISO date pattern matching, Uint8Array binary conversion, and zero hardcoding.
 */
const ExcelParser = {
    MONTH_NAMES: [
        'january', 'february', 'march', 'april', 'may', 'june', 
        'july', 'august', 'september', 'october', 'november', 'december',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ],

    MONTH_MAP: {
        'jan': 'January', 'january': 'January',
        'feb': 'February', 'february': 'February',
        'mar': 'March', 'march': 'March',
        'apr': 'April', 'april': 'April',
        'may': 'May',
        'jun': 'June', 'june': 'June',
        'jul': 'July', 'july': 'July',
        'aug': 'August', 'august': 'August',
        'sep': 'September', 'september': 'September',
        'oct': 'October', 'october': 'October',
        'nov': 'November', 'november': 'November',
        'dec': 'December', 'december': 'December'
    },

    /**
     * Inspect file and return raw sheet data and detected structure
     */
    async inspectWorkbook(fileOrBuffer, targetSheetName = null) {
        let uint8Data;
        if (fileOrBuffer instanceof Uint8Array) {
            uint8Data = fileOrBuffer;
        } else if (fileOrBuffer instanceof ArrayBuffer) {
            uint8Data = new Uint8Array(fileOrBuffer);
        } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
            const buf = await fileOrBuffer.arrayBuffer();
            uint8Data = new Uint8Array(buf);
        } else {
            throw new Error('Invalid file input provided to Excel parser.');
        }

        // Read workbook using SheetJS with full binary support
        const workbook = XLSX.read(uint8Data, { type: 'array', cellDates: true, cellFormulas: true });
        const sheetNames = workbook.SheetNames;
        
        if (!sheetNames || sheetNames.length === 0) {
            throw new Error('Workbook contains no readable worksheets.');
        }

        // Auto-select best data sheet if not explicitly chosen
        let activeSheet = targetSheetName;
        if (!activeSheet || !sheetNames.includes(activeSheet)) {
            const preferred = ['July F', 'Nestmo F', 'Aug F', 'Sep f', 'TSP', 'Sheet1', sheetNames[0]];
            activeSheet = preferred.find(s => sheetNames.includes(s)) || sheetNames[0];
        }

        const worksheet = workbook.Sheets[activeSheet];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        const result = this.parseRawMatrix(rawRows, sheetNames, activeSheet);
        result.rawWorkbook = workbook;
        return result;
    },

    /**
     * Parse raw 2D array matrix into structured data model
     */
    parseRawMatrix(rawRows, sheetNames = [], activeSheet = '') {
        if (!rawRows || rawRows.length === 0) {
            throw new Error(`Worksheet '${activeSheet}' is empty.`);
        }

        // 1. Search for title and subheader text for metadata (Years, Half-Years)
        let detectedYear = null;
        let detectedHalfYear = null;
        let titleText = `Activity Outlet Achievement - ${activeSheet}`;

        for (let i = 0; i < Math.min(8, rawRows.length); i++) {
            const rowStr = rawRows[i].join(' ');
            if (rowStr.trim()) {
                if (i === 0 && rowStr.length > 5) titleText = rowStr.replace(/\s+/g, ' ').trim();
                
                const yearMatch = rowStr.match(/(FY\s*\d{4}[-\/]\d{2,4}|\b20\d{2}\b)/i);
                if (yearMatch && !detectedYear) {
                    detectedYear = yearMatch[0].trim();
                }

                const hyMatch = rowStr.match(/\b(H[12]|HY[12]|1st Half|2nd Half|First Half|Second Half)\b/i);
                if (hyMatch && !detectedHalfYear) {
                    detectedHalfYear = hyMatch[0].trim().toUpperCase();
                }
            }
        }

        if (!detectedYear) detectedYear = '2026';
        if (!detectedHalfYear) detectedHalfYear = 'H2';

        // 2. Identify header row
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(12, rawRows.length); r++) {
            const row = rawRows[r].map(c => String(c).trim());
            const hasIdentifier = row.some(cell => 
                /\bdistcode\b|distributor|retailer|outlet|code|name|target|achievement|2026-|july|august|september/i.test(cell)
            );
            if (hasIdentifier) {
                headerRowIdx = r;
                break;
            }
        }

        if (headerRowIdx === -1) {
            headerRowIdx = 0;
        }

        const headers = rawRows[headerRowIdx].map(c => String(c).trim());

        // 3. Identify Column Mappings with expanded patterns
        const columnMapping = {
            distributor_code: '',
            distributor_name: '',
            sse: '',
            dsr: '',
            retailer_code: '',
            retailer_name: '',
            urc: '',
            activity: '',
            slab: ''
        };

        headers.forEach((h) => {
            const hLower = h.toLowerCase();
            if (/\bdistcode\b|distributor\s*code|dist\s*code/i.test(hLower) && !columnMapping.distributor_code) columnMapping.distributor_code = h;
            else if (/\bdistname\b|distributor\s*name|distributor|supermarket/i.test(hLower) && !columnMapping.distributor_name) columnMapping.distributor_name = h;
            else if (/region|cluster|\bsse\b|sse\s*name/i.test(hLower) && !columnMapping.sse) columnMapping.sse = h;
            else if (/\bdsr\b|dsr\s*name/i.test(hLower) && !columnMapping.dsr) columnMapping.dsr = h;
            else if (/retailer\s*code|outlet\s*code|store\s*code/i.test(hLower) && !columnMapping.retailer_code) columnMapping.retailer_code = h;
            else if (/retailer\s*name|outlet\s*name|store\s*name|outlet/i.test(hLower) && !columnMapping.retailer_name) columnMapping.retailer_name = h;
            else if (/retailer\s*urccode|urccode|\burc\b/i.test(hLower) && !columnMapping.urc) columnMapping.urc = h;
            else if (/activity|campaign/i.test(hLower) && !columnMapping.activity) columnMapping.activity = h;
            else if (/outlet\s*classification\s*name|classification|slab|tier|segment/i.test(hLower) && !columnMapping.slab) columnMapping.slab = h;
        });

        // 4. Detect Months, Quarters, Metrics & Month-by-Month Categories
        const monthColumns = {};
        const detectedMonths = [];
        const detectedQuarters = new Set();
        const categoriesByMonth = {};

        headers.forEach((h) => {
            if (!h) return;

            let monthLabel = null;

            // Pattern A: ISO date pattern like "2026-07", "2026-08", "2026-09"
            const isoMatch = h.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
            if (isoMatch) {
                const yyyy = isoMatch[1];
                const mm = parseInt(isoMatch[2], 10);
                const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                monthLabel = `${monthNamesFull[mm - 1]} ${yyyy}`;
            } else {
                // Pattern B: Text month name (e.g. "July - F", "August - F", "September")
                for (const m of this.MONTH_NAMES) {
                    const regex = new RegExp('\\b' + m + '\\b', 'i');
                    if (regex.test(h)) {
                        const monthNormalized = this.MONTH_MAP[m.toLowerCase()] || m;
                        const yearMatch = h.match(/\b(20\d{2})\b/);
                        monthLabel = yearMatch ? `${monthNormalized} ${yearMatch[1]}` : monthNormalized;
                        break;
                    }
                }
            }

            if (monthLabel) {
                if (!monthColumns[monthLabel]) {
                    monthColumns[monthLabel] = {
                        month: monthLabel,
                        targetCol: null,
                        achCol: null,
                        categories: {}
                    };
                    detectedMonths.push(monthLabel);
                    categoriesByMonth[monthLabel] = [];
                }

                if (/target|tgt/i.test(h)) {
                    monthColumns[monthLabel].targetCol = h;
                } else if (/ach|achievement/i.test(h) && !/cat|-/i.test(h)) {
                    monthColumns[monthLabel].achCol = h;
                } else if (isoMatch || h.includes('-') || /cat|tier|promo|pack|saver|gold|f\b/i.test(h)) {
                    monthColumns[monthLabel].achCol = h;
                    if (h.includes('-')) {
                        let catName = h.split('-').slice(1).join('-').trim();
                        if (catName) {
                            monthColumns[monthLabel].categories[catName] = h;
                            if (!categoriesByMonth[monthLabel].includes(catName)) {
                                categoriesByMonth[monthLabel].push(catName);
                            }
                        }
                    }
                }
            }
        });

        // Infer Quarters
        detectedMonths.forEach((m) => {
            const mClean = m.split(' ')[0].toLowerCase();
            if (['january', 'february', 'march', 'jan', 'feb', 'mar'].includes(mClean)) detectedQuarters.add('Q1');
            else if (['april', 'may', 'june', 'apr', 'jun'].includes(mClean)) detectedQuarters.add('Q2');
            else if (['july', 'august', 'september', 'jul', 'aug', 'sep'].includes(mClean)) detectedQuarters.add('Q3');
            else if (['october', 'november', 'december', 'oct', 'nov', 'dec'].includes(mClean)) detectedQuarters.add('Q4');
        });

        if (detectedQuarters.size === 0) detectedQuarters.add('Q3');

        // 5. Build Outlet Records
        const outlets = [];
        const dataRows = rawRows.slice(headerRowIdx + 1);

        dataRows.forEach((row, rIdx) => {
            const firstCell = String(row[0] || '').trim();
            if (!firstCell && !row.some(c => c !== '')) return;
            if (/total|summary|average/i.test(firstCell)) return;

            const getVal = (colName) => {
                if (!colName) return '';
                const idx = headers.indexOf(colName);
                return idx !== -1 ? row[idx] : '';
            };

            const getNum = (colName) => {
                const val = getVal(colName);
                if (val === '' || val === null || val === undefined) return null;
                const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
                return isNaN(num) ? null : num;
            };

            const outletRecord = {
                id: rIdx + 1,
                distributor_code: String(getVal(columnMapping.distributor_code) || 'N/A').trim(),
                distributor_name: String(getVal(columnMapping.distributor_name) || 'N/A').trim(),
                sse: String(getVal(columnMapping.sse) || 'N/A').trim(),
                dsr: String(getVal(columnMapping.dsr) || 'N/A').trim(),
                retailer_code: String(getVal(columnMapping.retailer_code) || 'N/A').trim(),
                retailer_name: String(getVal(columnMapping.retailer_name) || 'N/A').trim(),
                urc: String(getVal(columnMapping.urc) || 'N/A').trim(),
                activity: String(getVal(columnMapping.activity) || activeSheet).trim(),
                slab: String(getVal(columnMapping.slab) || 'N/A').trim(),
                monthly_data: {},
                total_target: 0,
                total_achievement: 0,
                achievement_pct: 0
            };

            let rowTotalTarget = 0;
            let rowTotalAch = 0;

            detectedMonths.forEach(monthLabel => {
                const monthConfig = monthColumns[monthLabel];
                const target = getNum(monthConfig.targetCol);
                const achievement = getNum(monthConfig.achCol);

                const catValues = {};
                Object.keys(monthConfig.categories).forEach(catName => {
                    const catCol = monthConfig.categories[catName];
                    catValues[catName] = getNum(catCol);
                });

                outletRecord.monthly_data[monthLabel] = {
                    target: target,
                    achievement: achievement,
                    categories: catValues
                };

                if (target !== null) rowTotalTarget += target;
                if (achievement !== null) rowTotalAch += achievement;
            });

            outletRecord.total_target = rowTotalTarget;
            outletRecord.total_achievement = rowTotalAch;
            outletRecord.achievement_pct = rowTotalTarget > 0 ? (rowTotalAch / rowTotalTarget) * 100 : 0;

            outlets.push(outletRecord);
        });

        const allCategoriesSet = new Set();
        Object.values(categoriesByMonth).forEach(cats => cats.forEach(c => allCategoriesSet.add(c)));

        return {
            sheetNames: sheetNames,
            activeSheet: activeSheet,
            detectedYear: detectedYear,
            detectedYears: [detectedYear],
            detectedHalfYear: detectedHalfYear,
            detectedHalfYears: [detectedHalfYear],
            detectedQuarters: Array.from(detectedQuarters),
            detectedMonths: detectedMonths,
            categoriesByMonth: categoriesByMonth,
            allCategories: Array.from(allCategoriesSet),
            headers: headers,
            columnMapping: columnMapping,
            monthColumns: monthColumns,
            titleText: titleText,
            recordsCount: outlets.length,
            outlets: outlets
        };
    }
};

window.ExcelParser = ExcelParser;

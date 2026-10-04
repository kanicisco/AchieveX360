/**
 * DataManager - Central Data Model, Calculation & Persistence Engine
 * Zero hardcoding. Handles dynamic aggregation, category union/intersection, filters & DB sync.
 */
const DataManager = {
    activeDataset: null,
    outlets: [],
    
    // Active UI Filter State
    filters: {
        year: 'ALL',
        halfYear: 'ALL',
        quarter: 'ALL',
        months: [], // Array of selected month strings
        categoryMode: 'UNION', // 'UNION' or 'INTERSECTION'
        categories: [], // Selected categories
        distributorCode: 'ALL',
        distributorName: 'ALL',
        sse: 'ALL',
        dsr: 'ALL',
        retailerSearch: '',
        urc: 'ALL',
        activity: 'ALL',
        slab: 'ALL'
    },

    /**
     * Initialize DataManager & load stored/active dataset
     */
    async init() {
        // Try fetching active dataset from PHP MySQL API first if available
        try {
            const resp = await fetch('api/data.php?action=get_active');
            const data = await resp.json();
            if (data.success && data.dataset && data.outlets && data.outlets.length > 0) {
                this.activeDataset = data.dataset;
                this.outlets = data.outlets;
                this.syncFiltersWithDataset();
                console.log('Loaded dataset from MySQL DB:', this.activeDataset.title);
                return true;
            }
        } catch (e) {
            console.log('PHP/MySQL API not available or empty. Checking LocalStorage...');
        }

        // Fallback to LocalStorage
        const localData = localStorage.getItem('achievex_360_dataset');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                this.activeDataset = parsed.dataset;
                this.outlets = parsed.outlets;
                this.syncFiltersWithDataset();
                console.log('Loaded dataset from LocalStorage:', this.activeDataset.title);
                return true;
            } catch (err) {
                console.error('Error parsing LocalStorage dataset', err);
            }
        }

        return false; // No dataset loaded yet
    },

    /**
     * Set new dataset and persist across LocalStorage & MySQL
     */
    async setDataset(parsedData, filename = 'Workbook.xlsx') {
        this.activeDataset = {
            id: Date.now(),
            filename: filename,
            title: parsedData.titleText || `${parsedData.detectedHalfYear} ${parsedData.detectedYear} Activity Outlet Achievement`,
            years: parsedData.detectedYears || [parsedData.detectedYear],
            half_years: parsedData.detectedHalfYears || [parsedData.detectedHalfYear],
            quarters: parsedData.detectedQuarters || [],
            months: parsedData.detectedMonths || [],
            categories_by_month: parsedData.categoriesByMonth || {},
            all_categories: parsedData.allCategories || [],
            column_mapping: parsedData.columnMapping || {},
            month_columns: parsedData.monthColumns || {},
            records_count: parsedData.outlets.length,
            created_at: new Date().toISOString()
        };

        this.outlets = parsedData.outlets;
        this.syncFiltersWithDataset();

        // 1. Save to LocalStorage for offline/static compatibility
        try {
            localStorage.setItem('achievex_360_dataset', JSON.stringify({
                dataset: this.activeDataset,
                outlets: this.outlets
            }));
        } catch (e) {
            console.warn('LocalStorage quota exceeded or blocked.', e);
        }

        // 2. Save to PHP MySQL API background
        try {
            await fetch('api/data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_dataset',
                    dataset: this.activeDataset,
                    outlets: this.outlets
                })
            });
        } catch (e) {
            console.log('MySQL Sync optional/offline mode.');
        }

        return this.activeDataset;
    },

    /**
     * Align filters with active dataset options
     */
    syncFiltersWithDataset() {
        if (!this.activeDataset) return;
        this.filters.year = 'ALL';
        this.filters.halfYear = 'ALL';
        this.filters.quarter = 'ALL';
        this.filters.months = [...(this.activeDataset.months || [])]; // Select all months by default
        this.filters.categoryMode = 'UNION';
        this.filters.categories = [...(this.activeDataset.all_categories || [])];
        this.filters.distributorCode = 'ALL';
        this.filters.distributorName = 'ALL';
        this.filters.sse = 'ALL';
        this.filters.dsr = 'ALL';
        this.filters.retailerSearch = '';
        this.filters.urc = 'ALL';
        this.filters.activity = 'ALL';
        this.filters.slab = 'ALL';
    },

    /**
     * Get list of categories available for current selected months based on UNION or INTERSECTION mode
     */
    getAvailableCategoriesForSelectedMonths() {
        if (!this.activeDataset) return [];
        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset.months || []);
        const catByMonth = this.activeDataset.categories_by_month || {};

        if (selectedMonths.length === 0) return this.activeDataset.all_categories || [];

        if (this.filters.categoryMode === 'INTERSECTION') {
            let intersection = null;
            selectedMonths.forEach(m => {
                const catsInM = catByMonth[m] || [];
                if (intersection === null) {
                    intersection = new Set(catsInM);
                } else {
                    intersection = new Set([...intersection].filter(x => catsInM.includes(x)));
                }
            });
            return Array.from(intersection || []);
        } else {
            // UNION mode
            const unionSet = new Set();
            selectedMonths.forEach(m => {
                const catsInM = catByMonth[m] || [];
                catsInM.forEach(c => unionSet.add(c));
            });
            return Array.from(unionSet);
        }
    },

    /**
     * Return outlets filtered by active UI filter criteria
     */
    getFilteredOutlets() {
        if (!this.outlets || this.outlets.length === 0) return [];

        return this.outlets.filter(outlet => {
            if (this.filters.distributorCode !== 'ALL' && outlet.distributor_code !== this.filters.distributorCode) return false;
            if (this.filters.distributorName !== 'ALL' && outlet.distributor_name !== this.filters.distributorName) return false;
            if (this.filters.sse !== 'ALL' && outlet.sse !== this.filters.sse) return false;
            if (this.filters.dsr !== 'ALL' && outlet.dsr !== this.filters.dsr) return false;
            if (this.filters.urc !== 'ALL' && outlet.urc !== this.filters.urc) return false;
            if (this.filters.activity !== 'ALL' && outlet.activity !== this.filters.activity) return false;
            if (this.filters.slab !== 'ALL' && outlet.slab !== this.filters.slab) return false;

            if (this.filters.retailerSearch && this.filters.retailerSearch.trim() !== '') {
                const term = this.filters.retailerSearch.toLowerCase().trim();
                const matchCode = outlet.retailer_code.toLowerCase().includes(term);
                const matchName = outlet.retailer_name.toLowerCase().includes(term);
                if (!matchCode && !matchName) return false;
            }

            return true;
        });
    },

    /**
     * Compute aggregated KPI statistics for filtered outlets and active reporting period
     */
    getCalculatedKPIs() {
        const filtered = this.getFilteredOutlets();
        if (!this.activeDataset || filtered.length === 0) {
            return {
                totalTarget: 0,
                totalAchievement: 0,
                achievementPct: '0.00%',
                recordCount: 0,
                totalOutlets: 0,
                totalDistributors: 0,
                totalActivities: 0,
                periodLabel: 'No Data'
            };
        }

        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset.months || []);

        let totalTarget = 0;
        let totalAchievement = 0;
        const distributorsSet = new Set();
        const activitiesSet = new Set();

        filtered.forEach(o => {
            if (o.distributor_name && o.distributor_name !== 'N/A') distributorsSet.add(o.distributor_name);
            if (o.activity && o.activity !== 'N/A') activitiesSet.add(o.activity);

            selectedMonths.forEach(m => {
                const mData = o.monthly_data ? o.monthly_data[m] : null;
                if (mData) {
                    if (mData.target !== null && mData.target !== undefined) totalTarget += mData.target;
                    if (mData.achievement !== null && mData.achievement !== undefined) totalAchievement += mData.achievement;
                }
            });
        });

        let pctStr = 'N/A';
        if (totalTarget > 0) {
            pctStr = ((totalAchievement / totalTarget) * 100).toFixed(2) + '%';
        } else if (totalAchievement > 0) {
            pctStr = '100.00%';
        }

        let periodLabel = this.activeDataset.title;
        if (selectedMonths.length < (this.activeDataset.months || []).length) {
            periodLabel += ` (${selectedMonths.length} Months Selected)`;
        }

        return {
            totalTarget: totalTarget,
            totalAchievement: totalAchievement,
            achievementPct: pctStr,
            numericPct: totalTarget > 0 ? (totalAchievement / totalTarget) * 100 : 0,
            recordCount: filtered.length,
            totalOutlets: filtered.length,
            totalDistributors: distributorsSet.size,
            totalActivities: activitiesSet.size,
            periodLabel: periodLabel
        };
    },

    /**
     * Compute monthly trend targets and achievements for charts
     */
    getMonthlyTrendData() {
        if (!this.activeDataset) return { labels: [], targets: [], achievements: [], pcts: [] };

        const filtered = this.getFilteredOutlets();
        const months = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset.months || []);

        const targets = [];
        const achievements = [];
        const pcts = [];

        months.forEach(m => {
            let tSum = 0;
            let aSum = 0;
            filtered.forEach(o => {
                const mData = o.monthly_data ? o.monthly_data[m] : null;
                if (mData) {
                    if (mData.target !== null) tSum += mData.target;
                    if (mData.achievement !== null) aSum += mData.achievement;
                }
            });

            targets.push(tSum);
            achievements.push(aSum);
            pcts.push(tSum > 0 ? parseFloat(((aSum / tSum) * 100).toFixed(2)) : 0);
        });

        return {
            labels: months,
            targets: targets,
            achievements: achievements,
            pcts: pcts
        };
    },

    /**
     * Compute distributor wise performance summary
     */
    getDistributorPerformanceData() {
        const filtered = this.getFilteredOutlets();
        const selectedMonths = this.filters.months.length > 0 ? this.filters.months : (this.activeDataset?.months || []);
        
        const distMap = {};
        filtered.forEach(o => {
            const name = o.distributor_name || 'Unknown';
            if (!distMap[name]) distMap[name] = { target: 0, achievement: 0 };

            selectedMonths.forEach(m => {
                const mData = o.monthly_data ? o.monthly_data[m] : null;
                if (mData) {
                    if (mData.target !== null) distMap[name].target += mData.target;
                    if (mData.achievement !== null) distMap[name].achievement += mData.achievement;
                }
            });
        });

        const labels = Object.keys(distMap);
        const targets = labels.map(l => distMap[l].target);
        const achievements = labels.map(l => distMap[l].achievement);
        const pcts = labels.map(l => distMap[l].target > 0 ? parseFloat(((distMap[l].achievement / distMap[l].target) * 100).toFixed(2)) : 0);

        return { labels, targets, achievements, pcts };
    },

    /**
     * Clear all stored dataset state
     */
    async clearAllData() {
        this.activeDataset = null;
        this.outlets = [];
        localStorage.removeItem('achievex_360_dataset');
        try {
            await fetch('api/reset.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_all' })
            });
        } catch (e) {
            console.log('Reset PHP endpoint ignored/offline');
        }
    }
};

window.DataManager = DataManager;

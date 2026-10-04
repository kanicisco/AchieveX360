/**
 * ExportController - CSV & Printable Report Generator
 * Exports filtered or full outlet data with dynamic headers matching current workbook structure.
 */
const ExportController = {
    init() {
        document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV(true));
        document.getElementById('btn-export-all-csv')?.addEventListener('click', () => this.exportCSV(false));
        document.getElementById('btn-print-dashboard')?.addEventListener('click', () => window.print());
    },

    exportCSV(filteredOnly = true) {
        if (!DataManager.activeDataset) {
            alert('No active dataset to export.');
            return;
        }

        const dataset = DataManager.activeDataset;
        const records = filteredOnly ? DataManager.getFilteredOutlets() : DataManager.outlets;
        const selectedMonths = DataManager.filters.months.length > 0 ? DataManager.filters.months : (dataset.months || []);
        const selectedCats = DataManager.filters.categories.length > 0 ? DataManager.filters.categories : DataManager.getAvailableCategoriesForSelectedMonths();

        // 1. Build Header Row
        const headers = [
            'Distributor Code', 'Distributor Name', 'SSE', 'DSR',
            'Retailer Code', 'Retailer Name', 'URC', 'Activity', 'Slab',
            'Selected Target', 'Selected Achievement', 'Achievement %'
        ];

        selectedCats.forEach(c => headers.push(`Cat - ${c}`));

        const rows = [headers];

        // 2. Populate Data Rows
        records.forEach(o => {
            const tgt = TableController.calculateOutletTarget(o, selectedMonths);
            const ach = TableController.calculateOutletAch(o, selectedMonths);
            const pct = tgt > 0 ? ((ach / tgt) * 100).toFixed(2) + '%' : 'N/A';

            const row = [
                this.escapeCSV(o.distributor_code),
                this.escapeCSV(o.distributor_name),
                this.escapeCSV(o.sse),
                this.escapeCSV(o.dsr),
                this.escapeCSV(o.retailer_code),
                this.escapeCSV(o.retailer_name),
                this.escapeCSV(o.urc),
                this.escapeCSV(o.activity),
                this.escapeCSV(o.slab),
                tgt,
                ach,
                pct
            ];

            selectedCats.forEach(c => {
                const catVal = TableController.getOutletCategoryAchievement(o, selectedMonths, c);
                row.push(catVal === null || catVal === undefined ? 'N/A' : catVal);
            });

            rows.push(row);
        });

        // 3. Convert to CSV String & Download
        const csvContent = rows.map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `${dataset.title.replace(/[^a-z0-9]/gi, '_')}_Export.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    escapeCSV(str) {
        if (str === null || str === undefined) return '""';
        const stringified = String(str).replace(/"/g, '""');
        return `"${stringified}"`;
    }
};

window.ExportController = ExportController;

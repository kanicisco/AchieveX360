/**
 * TableController - Dynamic Outlet Achievement Performance Data Table
 * Searchable, sortable, paginated data table with zero hardcoded columns.
 */
const TableController = {
    currentPage: 1,
    pageSize: 10,
    sortColumn: 'distributor_name',
    sortAsc: true,

    init() {
        this.bindEvents();
        window.addEventListener('achievex_filter_changed', () => {
            this.currentPage = 1;
            this.renderTable();
        });
    },

    bindEvents() {
        // Page size selector
        document.getElementById('table-page-size')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value, 10);
            this.currentPage = 1;
            this.renderTable();
        });

        // Search input
        document.getElementById('table-search-input')?.addEventListener('input', (e) => {
            DataManager.filters.retailerSearch = e.target.value;
            FilterController.onFilterChange();
        });
    },

    renderTable() {
        const thead = document.getElementById('table-head');
        const tbody = document.getElementById('table-body');
        if (!thead || !tbody || !DataManager.activeDataset) return;

        const dataset = DataManager.activeDataset;
        let filtered = DataManager.getFilteredOutlets();
        const selectedMonths = DataManager.filters.months.length > 0 ? DataManager.filters.months : (dataset.months || []);
        const selectedCats = DataManager.filters.categories.length > 0 ? DataManager.filters.categories : DataManager.getAvailableCategoriesForSelectedMonths();

        // Sort data
        filtered.sort((a, b) => {
            let valA, valB;

            if (this.sortColumn === 'distributor_name') { valA = a.distributor_name; valB = b.distributor_name; }
            else if (this.sortColumn === 'retailer_name') { valA = a.retailer_name; valB = b.retailer_name; }
            else if (this.sortColumn === 'activity') { valA = a.activity; valB = b.activity; }
            else if (this.sortColumn === 'total_target') {
                valA = this.calculateOutletTarget(a, selectedMonths);
                valB = this.calculateOutletTarget(b, selectedMonths);
            }
            else if (this.sortColumn === 'total_achievement') {
                valA = this.calculateOutletAch(a, selectedMonths);
                valB = this.calculateOutletAch(b, selectedMonths);
            }
            else if (this.sortColumn === 'achievement_pct') {
                const tA = this.calculateOutletTarget(a, selectedMonths);
                const aA = this.calculateOutletAch(a, selectedMonths);
                valA = tA > 0 ? (aA / tA) * 100 : 0;

                const tB = this.calculateOutletTarget(b, selectedMonths);
                const aB = this.calculateOutletAch(b, selectedMonths);
                valB = tB > 0 ? (aB / tB) * 100 : 0;
            }
            else {
                valA = a[this.sortColumn] || '';
                valB = b[this.sortColumn] || '';
            }

            if (valA < valB) return this.sortAsc ? -1 : 1;
            if (valA > valB) return this.sortAsc ? 1 : -1;
            return 0;
        });

        // Dynamic Table Headers
        let headHTML = `
            <tr>
                <th onclick="TableController.sort('distributor_name')" class="sortable">Distributor ${this.getSortIcon('distributor_name')}</th>
                <th onclick="TableController.sort('retailer_name')" class="sortable">Retailer Outlet ${this.getSortIcon('retailer_name')}</th>
                <th>SSE / DSR</th>
                <th onclick="TableController.sort('activity')" class="sortable">Activity ${this.getSortIcon('activity')}</th>
                <th>Slab</th>
                <th onclick="TableController.sort('total_target')" class="sortable text-end">Target ${this.getSortIcon('total_target')}</th>
                <th onclick="TableController.sort('total_achievement')" class="sortable text-end">Achievement ${this.getSortIcon('total_achievement')}</th>
                <th onclick="TableController.sort('achievement_pct')" class="sortable text-end">% Ach ${this.getSortIcon('achievement_pct')}</th>
        `;

        // Dynamic Category Headers
        selectedCats.forEach(catName => {
            headHTML += `<th class="text-end bg-cat-header">${catName}</th>`;
        });
        headHTML += `</tr>`;
        thead.innerHTML = headHTML;

        // Pagination calculations
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

        if (pageItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${8 + selectedCats.length}" class="text-center py-4 text-muted"><i class="bi bi-inbox fs-2"></i><br>No matching outlets found for active filters.</td></tr>`;
            this.renderPaginationUI(totalItems, totalPages);
            return;
        }

        // Render Rows
        let bodyHTML = '';
        pageItems.forEach(outlet => {
            const tgt = this.calculateOutletTarget(outlet, selectedMonths);
            const ach = this.calculateOutletAch(outlet, selectedMonths);
            const pct = tgt > 0 ? (ach / tgt) * 100 : 0;
            const pctBadgeClass = pct >= 100 ? 'bg-success' : (pct >= 80 ? 'bg-primary' : (pct >= 50 ? 'bg-warning text-dark' : 'bg-danger'));

            bodyHTML += `
                <tr>
                    <td>
                        <div class="fw-semibold">${outlet.distributor_name}</div>
                        <div class="text-muted small">${outlet.distributor_code}</div>
                    </td>
                    <td>
                        <div class="fw-semibold">${outlet.retailer_name}</div>
                        <div class="text-muted small">${outlet.retailer_code} | URC: ${outlet.urc}</div>
                    </td>
                    <td class="small">
                        <div><strong>SSE:</strong> ${outlet.sse}</div>
                        <div class="text-muted"><strong>DSR:</strong> ${outlet.dsr}</div>
                    </td>
                    <td><span class="badge bg-light text-dark border">${outlet.activity}</span></td>
                    <td><span class="badge bg-info text-dark">${outlet.slab}</span></td>
                    <td class="text-end fw-semibold">Rs. ${tgt.toLocaleString()}</td>
                    <td class="text-end fw-semibold text-success">Rs. ${ach.toLocaleString()}</td>
                    <td class="text-end">
                        <span class="badge ${pctBadgeClass} px-2 py-1">${tgt > 0 ? pct.toFixed(2) + '%' : 'N/A'}</span>
                    </td>
            `;

            // Category Achievements for row
            selectedCats.forEach(catName => {
                const catVal = this.getOutletCategoryAchievement(outlet, selectedMonths, catName);
                if (catVal === null || catVal === undefined) {
                    bodyHTML += `<td class="text-end text-muted fst-italic">N/A</td>`;
                } else {
                    bodyHTML += `<td class="text-end fw-semibold text-purple">Rs. ${catVal.toLocaleString()}</td>`;
                }
            });

            bodyHTML += `</tr>`;
        });

        tbody.innerHTML = bodyHTML;
        this.renderPaginationUI(totalItems, totalPages);
    },

    calculateOutletTarget(outlet, months) {
        let sum = 0;
        months.forEach(m => {
            const mData = outlet.monthly_data ? outlet.monthly_data[m] : null;
            if (mData && mData.target !== null && mData.target !== undefined) sum += mData.target;
        });
        return sum;
    },

    calculateOutletAch(outlet, months) {
        let sum = 0;
        months.forEach(m => {
            const mData = outlet.monthly_data ? outlet.monthly_data[m] : null;
            if (mData && mData.achievement !== null && mData.achievement !== undefined) sum += mData.achievement;
        });
        return sum;
    },

    getOutletCategoryAchievement(outlet, months, categoryName) {
        let sum = null;
        months.forEach(m => {
            const mData = outlet.monthly_data ? outlet.monthly_data[m] : null;
            if (mData && mData.categories && mData.categories[categoryName] !== undefined && mData.categories[categoryName] !== null) {
                if (sum === null) sum = 0;
                sum += mData.categories[categoryName];
            }
        });
        return sum;
    },

    sort(column) {
        if (this.sortColumn === column) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortColumn = column;
            this.sortAsc = true;
        }
        this.renderTable();
    },

    getSortIcon(column) {
        if (this.sortColumn !== column) return '<i class="bi bi-arrow-down-up text-muted opacity-50 small"></i>';
        return this.sortAsc ? '<i class="bi bi-sort-up text-primary"></i>' : '<i class="bi bi-sort-down text-primary"></i>';
    },

    renderPaginationUI(totalItems, totalPages) {
        const infoEl = document.getElementById('table-pagination-info');
        const pagesContainer = document.getElementById('table-pagination-pages');
        if (!infoEl || !pagesContainer) return;

        const startIdx = totalItems > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
        const endIdx = Math.min(this.currentPage * this.pageSize, totalItems);

        infoEl.innerHTML = `Showing <strong>${startIdx}</strong> to <strong>${endIdx}</strong> of <strong>${totalItems}</strong> Outlets`;

        let pagesHTML = '';
        pagesHTML += `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="TableController.changePage(${this.currentPage - 1}); return false;">Prev</a></li>`;

        for (let p = 1; p <= totalPages; p++) {
            if (p === 1 || p === totalPages || (p >= this.currentPage - 1 && p <= this.currentPage + 1)) {
                pagesHTML += `<li class="page-item ${p === this.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="TableController.changePage(${p}); return false;">${p}</a></li>`;
            } else if (p === this.currentPage - 2 || p === this.currentPage + 2) {
                pagesHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        pagesHTML += `<li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="TableController.changePage(${this.currentPage + 1}); return false;">Next</a></li>`;

        pagesContainer.innerHTML = pagesHTML;
    },

    changePage(p) {
        this.currentPage = p;
        this.renderTable();
    }
};

window.TableController = TableController;

/**
 * FilterController - Dynamic Filter UI Renderer & Event Handler
 * Zero hardcoding. All choices populated dynamically from active Excel dataset.
 */
const FilterController = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Year filter
        document.getElementById('filter-year')?.addEventListener('change', (e) => {
            DataManager.filters.year = e.target.value;
            this.onFilterChange();
        });

        // Half-Year filter
        document.getElementById('filter-halfyear')?.addEventListener('change', (e) => {
            DataManager.filters.halfYear = e.target.value;
            this.onFilterChange();
        });

        // Quarter filter
        document.getElementById('filter-quarter')?.addEventListener('change', (e) => {
            DataManager.filters.quarter = e.target.value;
            this.onFilterChange();
        });

        // Category Mode Toggle (Union vs Intersection)
        document.querySelectorAll('input[name="cat-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                DataManager.filters.categoryMode = e.target.value;
                this.updateCategoryFilterUI();
                this.onFilterChange();
            });
        });

        // Distributor Name filter
        document.getElementById('filter-distributor')?.addEventListener('change', (e) => {
            DataManager.filters.distributorName = e.target.value;
            this.onFilterChange();
        });

        // SSE filter
        document.getElementById('filter-sse')?.addEventListener('change', (e) => {
            DataManager.filters.sse = e.target.value;
            this.onFilterChange();
        });

        // DSR filter
        document.getElementById('filter-dsr')?.addEventListener('change', (e) => {
            DataManager.filters.dsr = e.target.value;
            this.onFilterChange();
        });

        // Activity filter
        document.getElementById('filter-activity')?.addEventListener('change', (e) => {
            DataManager.filters.activity = e.target.value;
            this.onFilterChange();
        });

        // Slab filter
        document.getElementById('filter-slab')?.addEventListener('change', (e) => {
            DataManager.filters.slab = e.target.value;
            this.onFilterChange();
        });

        // Retailer Search input
        document.getElementById('filter-retailer-search')?.addEventListener('input', (e) => {
            DataManager.filters.retailerSearch = e.target.value;
            this.onFilterChange();
        });

        // Reset Filters Button
        document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
            DataManager.syncFiltersWithDataset();
            this.renderAllFilterOptions();
            this.onFilterChange();
        });
    },

    /**
     * Re-render all filter controls based on current DataManager state
     */
    renderAllFilterOptions() {
        if (!DataManager.activeDataset) return;
        const dataset = DataManager.activeDataset;
        const outlets = DataManager.outlets;

        // 1. Year
        const yearSelect = document.getElementById('filter-year');
        if (yearSelect) {
            yearSelect.innerHTML = `<option value="ALL">All Years (${dataset.years.join(', ')})</option>` +
                dataset.years.map(y => `<option value="${y}" ${DataManager.filters.year === y ? 'selected' : ''}>${y}</option>`).join('');
        }

        // 2. Half-Year
        const hySelect = document.getElementById('filter-halfyear');
        if (hySelect) {
            hySelect.innerHTML = `<option value="ALL">All Half-Years (${dataset.half_years.join(', ')})</option>` +
                dataset.half_years.map(hy => `<option value="${hy}" ${DataManager.filters.halfYear === hy ? 'selected' : ''}>${hy}</option>`).join('');
        }

        // 3. Quarters
        const qSelect = document.getElementById('filter-quarter');
        if (qSelect) {
            qSelect.innerHTML = `<option value="ALL">All Quarters (${dataset.quarters.join(', ')})</option>` +
                dataset.quarters.map(q => `<option value="${q}" ${DataManager.filters.quarter === q ? 'selected' : ''}>${q}</option>`).join('');
        }

        // 4. Months Checkbox Container / Pills
        this.renderMonthPillsUI();

        // 5. Category Checkbox Container
        this.updateCategoryFilterUI();

        // 6. Entity Dropdowns (Distributors, SSE, DSR, Activity, Slab)
        const dists = Array.from(new Set(outlets.map(o => o.distributor_name).filter(Boolean)));
        const sses = Array.from(new Set(outlets.map(o => o.sse).filter(Boolean)));
        const dsrs = Array.from(new Set(outlets.map(o => o.dsr).filter(Boolean)));
        const activities = Array.from(new Set(outlets.map(o => o.activity).filter(Boolean)));
        const slabs = Array.from(new Set(outlets.map(o => o.slab).filter(Boolean)));

        this.populateSelect('filter-distributor', dists, 'All Distributors', DataManager.filters.distributorName);
        this.populateSelect('filter-sse', sses, 'All SSEs', DataManager.filters.sse);
        this.populateSelect('filter-dsr', dsrs, 'All DSRs', DataManager.filters.dsr);
        this.populateSelect('filter-activity', activities, 'All Activities', DataManager.filters.activity);
        this.populateSelect('filter-slab', slabs, 'All Slabs', DataManager.filters.slab);

        this.updateMatchCounter();
    },

    renderMonthPillsUI() {
        const container = document.getElementById('month-pills-container');
        if (!container || !DataManager.activeDataset) return;
        const months = DataManager.activeDataset.months || [];

        container.innerHTML = months.map(m => {
            const isChecked = DataManager.filters.months.includes(m);
            return `
                <label class="month-pill ${isChecked ? 'active' : ''}">
                    <input type="checkbox" value="${m}" ${isChecked ? 'checked' : ''} class="month-checkbox hidden">
                    <span>${m}</span>
                </label>
            `;
        }).join('');

        // Month pill click listener
        container.querySelectorAll('.month-checkbox').forEach(chk => {
            chk.addEventListener('change', () => {
                const checkedMonths = Array.from(container.querySelectorAll('.month-checkbox:checked')).map(c => c.value);
                DataManager.filters.months = checkedMonths;
                this.updateCategoryFilterUI();
                this.onFilterChange();
            });
        });
    },

    updateCategoryFilterUI() {
        const container = document.getElementById('category-pills-container');
        if (!container || !DataManager.activeDataset) return;

        const availCats = DataManager.getAvailableCategoriesForSelectedMonths();
        
        container.innerHTML = availCats.length > 0 ? availCats.map(c => {
            const isChecked = DataManager.filters.categories.includes(c);
            return `
                <label class="category-pill ${isChecked ? 'active' : ''}">
                    <input type="checkbox" value="${c}" ${isChecked ? 'checked' : ''} class="cat-checkbox hidden">
                    <span>${c}</span>
                </label>
            `;
        }).join('') : `<span class="text-muted small">No categories for selected month combination.</span>`;

        container.querySelectorAll('.cat-checkbox').forEach(chk => {
            chk.addEventListener('change', () => {
                const checkedCats = Array.from(container.querySelectorAll('.cat-checkbox:checked')).map(c => c.value);
                DataManager.filters.categories = checkedCats;
                this.onFilterChange();
            });
        });
    },

    populateSelect(elementId, items, defaultLabel, currentVal) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = `<option value="ALL">${defaultLabel}</option>` +
            items.map(item => `<option value="${item}" ${currentVal === item ? 'selected' : ''}>${item}</option>`).join('');
    },

    updateMatchCounter() {
        const counterEl = document.getElementById('filter-match-count');
        if (!counterEl) return;
        const total = DataManager.outlets.length;
        const filtered = DataManager.getFilteredOutlets().length;
        counterEl.innerHTML = `<i class="bi bi-funnel-fill"></i> Showing <strong>${filtered}</strong> of <strong>${total}</strong> Outlets`;
    },

    onFilterChange() {
        this.updateMatchCounter();
        // Dispatch global event for dashboard UI update
        window.dispatchEvent(new CustomEvent('achievex_filter_changed'));
    }
};

window.FilterController = FilterController;

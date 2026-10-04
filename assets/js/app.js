/**
 * App - Core Application Entry Point
 * Handles initialization, theme switching, UI updates and event coordination.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Modules
    FilterController.init();
    ChartController.init();
    TableController.init();
    AdminMapper.init();
    ExportController.init();

    // 2. Initialize DataManager & Load Active Dataset
    const loaded = await DataManager.init();

    if (!loaded) {
        console.log('No existing dataset found. Auto-bootstrapping Sample 1 (H1 2026)...');
        await AdminMapper.loadSampleFile('data/Sample_H1_2026_Dashboard.xlsx');
    } else {
        refreshDashboardUI();
    }

    // 3. Listen for Global Events
    window.addEventListener('achievex_dataset_updated', () => {
        FilterController.renderAllFilterOptions();
        refreshDashboardUI();
    });

    window.addEventListener('achievex_filter_changed', () => {
        refreshDashboardUI();
    });

    // 4. Dark / Light Theme Toggle
    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            themeToggleBtn.innerHTML = newTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i>' : '<i class="bi bi-moon-stars-fill text-dark"></i>';
            ChartController.renderAllCharts();
        });
    }
});

/**
 * Global Dashboard UI Refresh Function
 * Dynamically updates Title, KPI Cards, Filters, Charts & Data Table
 */
function refreshDashboardUI() {
    if (!DataManager.activeDataset) return;
    const dataset = DataManager.activeDataset;

    // 1. Update Dynamic Dashboard Title & Metadata Badges
    const titleEl = document.getElementById('dashboard-title');
    const badgePeriodEl = document.getElementById('badge-active-period');
    const badgeFileEl = document.getElementById('badge-active-file');
    const badgeTimestampEl = document.getElementById('badge-last-updated');

    if (titleEl) {
        titleEl.innerText = dataset.title;
    }

    if (badgePeriodEl) {
        badgePeriodEl.innerHTML = `<i class="bi bi-calendar3 me-1"></i> Year: <strong>${dataset.years.join(', ')}</strong> | Half-Year: <strong>${dataset.half_years.join(', ')}</strong> | Quarters: <strong>${dataset.quarters.join(', ')}</strong>`;
    }

    if (badgeFileEl) {
        badgeFileEl.innerHTML = `<i class="bi bi-file-earmark-excel me-1"></i> Source: <strong>${dataset.filename}</strong>`;
    }

    if (badgeTimestampEl) {
        const dt = new Date(dataset.created_at);
        badgeTimestampEl.innerHTML = `<i class="bi bi-clock-history me-1"></i> Updated: <strong>${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>`;
    }

    // 2. Update Dynamic KPI Cards
    const kpis = DataManager.getCalculatedKPIs();

    document.getElementById('kpi-total-target').innerText = `Rs. ${kpis.totalTarget.toLocaleString()}`;
    document.getElementById('kpi-total-ach').innerText = `Rs. ${kpis.totalAchievement.toLocaleString()}`;
    
    const pctEl = document.getElementById('kpi-ach-pct');
    const pctBar = document.getElementById('kpi-pct-bar');
    if (pctEl) {
        pctEl.innerText = kpis.achievementPct;
        pctEl.className = kpis.numericPct >= 100 ? 'text-success' : (kpis.numericPct >= 80 ? 'text-primary' : 'text-danger');
    }
    if (pctBar) {
        pctBar.style.width = `${Math.min(kpis.numericPct, 100)}%`;
        pctBar.className = `progress-bar ${kpis.numericPct >= 100 ? 'bg-success' : (kpis.numericPct >= 80 ? 'bg-primary' : 'bg-danger')}`;
    }

    document.getElementById('kpi-total-outlets').innerText = kpis.totalOutlets.toLocaleString();
    document.getElementById('kpi-total-distributors').innerText = kpis.totalDistributors.toLocaleString();
    document.getElementById('kpi-total-activities').innerText = kpis.totalActivities.toLocaleString();

    // 3. Render Visual Analytics & Data Table
    ChartController.renderAllCharts();
    TableController.renderTable();
}

/**
 * ChartController - Interactive Visual Analytics Engine
 * Chart.js powered charts with dynamic theme and filter integration.
 */
const ChartController = {
    instances: {},

    init() {
        window.addEventListener('achievex_filter_changed', () => this.renderAllCharts());
    },

    renderAllCharts() {
        if (!DataManager.activeDataset) return;
        this.renderMonthlyTrendChart();
        this.renderDistributorChart();
        this.renderActivityChart();
        this.renderCategoryChart();
    },

    destroyChart(chartId) {
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
            delete this.instances[chartId];
        }
    },

    /**
     * 1. Monthly Target vs Achievement Combo Chart
     */
    renderMonthlyTrendChart() {
        this.destroyChart('monthlyTrendChart');
        const ctx = document.getElementById('monthlyTrendChart')?.getContext('2d');
        if (!ctx) return;

        const data = DataManager.getMonthlyTrendData();

        this.instances['monthlyTrendChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Target',
                        data: data.targets,
                        backgroundColor: 'rgba(59, 130, 246, 0.65)',
                        borderColor: '#3B82F6',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        order: 2
                    },
                    {
                        label: 'Achievement',
                        data: data.achievements,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: '#10B981',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        order: 3
                    },
                    {
                        label: 'Achievement %',
                        data: data.pcts,
                        type: 'line',
                        borderColor: '#F59E0B',
                        backgroundColor: '#F59E0B',
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        yAxisID: 'y1',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                if (ctx.dataset.yAxisID === 'y1') return ` Achievement %: ${ctx.parsed.y}%`;
                                return ` ${ctx.dataset.label}: Rs. ${ctx.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Amount (Rs)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Achievement %' },
                        grid: { drawOnChartArea: false },
                        min: 0
                    }
                }
            }
        });
    },

    /**
     * 2. Distributor Performance Horizontal Bar Chart
     */
    renderDistributorChart() {
        this.destroyChart('distributorChart');
        const ctx = document.getElementById('distributorChart')?.getContext('2d');
        if (!ctx) return;

        const data = DataManager.getDistributorPerformanceData();

        this.instances['distributorChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Target',
                        data: data.targets,
                        backgroundColor: 'rgba(99, 102, 241, 0.6)'
                    },
                    {
                        label: 'Achievement',
                        data: data.achievements,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)'
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    },

    /**
     * 3. Activity Distribution Doughnut Chart
     */
    renderActivityChart() {
        this.destroyChart('activityChart');
        const ctx = document.getElementById('activityChart')?.getContext('2d');
        if (!ctx) return;

        const filtered = DataManager.getFilteredOutlets();
        const actCounts = {};
        filtered.forEach(o => {
            const act = o.activity || 'Other';
            actCounts[act] = (actCounts[act] || 0) + 1;
        });

        const labels = Object.keys(actCounts);
        const values = Object.values(actCounts);

        this.instances['activityChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },

    /**
     * 4. Category Performance Bar Chart
     */
    renderCategoryChart() {
        this.destroyChart('categoryChart');
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;

        const filtered = DataManager.getFilteredOutlets();
        const selectedMonths = DataManager.filters.months.length > 0 ? DataManager.filters.months : (DataManager.activeDataset?.months || []);
        const selectedCats = DataManager.filters.categories.length > 0 ? DataManager.filters.categories : DataManager.getAvailableCategoriesForSelectedMonths();

        const catAchMap = {};
        selectedCats.forEach(c => catAchMap[c] = 0);

        filtered.forEach(o => {
            selectedMonths.forEach(m => {
                const mData = o.monthly_data ? o.monthly_data[m] : null;
                if (mData && mData.categories) {
                    Object.keys(mData.categories).forEach(catName => {
                        if (selectedCats.includes(catName)) {
                            const val = mData.categories[catName];
                            if (val !== null && val !== undefined) {
                                catAchMap[catName] = (catAchMap[catName] || 0) + val;
                            }
                        }
                    });
                }
            });
        });

        const labels = Object.keys(catAchMap);
        const values = Object.values(catAchMap);

        this.instances['categoryChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Category Achievement',
                    data: values,
                    backgroundColor: 'rgba(139, 92, 246, 0.75)',
                    borderColor: '#8B5CF6',
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
};

window.ChartController = ChartController;

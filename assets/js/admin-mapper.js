/**
 * AdminMapper - Excel Structure Inspection, Multi-Sheet Mapper & Admin Management
 * Handles file dropzone, native file dialogs, live Excel structure preview & field mapping modal.
 */
const AdminMapper = {
    stagedWorkbookData: null,

    init() {
        this.bindDropzone();
        this.bindSampleButtons();
    },

    bindDropzone() {
        const fileInput = document.getElementById('excel-file-input');
        if (!fileInput) return;

        // Native file input change listener
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const selectedFile = e.target.files[0];
                this.handleFileUpload(selectedFile);
                e.target.value = ''; // Reset so selecting same file again fires change event
            }
        });

        // Drag & drop handlers
        const dropzone = document.getElementById('excel-dropzone');
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-primary', 'bg-light');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('border-primary', 'bg-light');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-primary', 'bg-light');
                if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                    this.handleFileUpload(e.dataTransfer.files[0]);
                }
            });
        }
    },

    bindSampleButtons() {
        document.getElementById('btn-load-sample-1')?.addEventListener('click', () => this.loadSampleFile('data/Sample_H1_2026_Dashboard.xlsx'));
        document.getElementById('btn-load-sample-2')?.addEventListener('click', () => this.loadSampleFile('data/Sample_FY_2026_2027_H2_Dashboard.xlsx'));
        document.getElementById('btn-clear-dataset')?.addEventListener('click', () => this.clearDataset());
    },

    async handleFileUpload(file) {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        const validExts = ['xlsx', 'xls', 'xlsb', 'csv'];
        if (!validExts.includes(ext)) {
            this.showNotification(`Unsupported file format .${ext}. Please upload .xlsx, .xls, .xlsb, or .csv`, 'danger');
            return;
        }

        try {
            this.showNotification(`Parsing workbook ${file.name}...`, 'info');

            // 1. Send file to PHP server background if running
            const formData = new FormData();
            formData.append('excel_file', file);
            try {
                fetch('api/upload.php', { method: 'POST', body: formData });
            } catch (e) {
                console.log('PHP upload endpoint offline/static mode');
            }

            // 2. Parse workbook client-side via SheetJS
            const parsed = await ExcelParser.inspectWorkbook(file);
            this.stagedWorkbookData = parsed;
            this.showInspectionModal(parsed, file.name);
            this.showNotification(`Successfully parsed ${file.name}! Active sheet: '${parsed.activeSheet}'`, 'success');
        } catch (err) {
            console.error('Error parsing uploaded file', err);
            this.showNotification(`Upload Error: ${err.message || 'Could not parse workbook'}`, 'danger');
            
            const modalBody = document.getElementById('mapping-modal-body');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <h6><i class="bi bi-exclamation-triangle-fill me-2"></i> Failed to parse Excel file</h6>
                        <p class="mb-1"><strong>Reason:</strong> ${err.message || 'Workbook unreadable'}</p>
                        <small class="text-muted">Ensure the file is not password protected and contains readable sheet headers.</small>
                    </div>
                `;
            }
        }
    },

    async loadSampleFile(samplePath) {
        try {
            this.showNotification(`Loading sample dataset...`, 'info');
            const resp = await fetch(samplePath);
            if (!resp.ok) throw new Error('Could not fetch sample file.');
            const buffer = await resp.arrayBuffer();
            const filename = samplePath.split('/').pop();
            const parsed = await ExcelParser.inspectWorkbook(buffer);
            
            await DataManager.setDataset(parsed, filename);
            this.showNotification(`Successfully loaded: ${parsed.titleText}`, 'success');
            
            const modalEl = document.getElementById('admin-mapping-modal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const bsModal = bootstrap.Modal.getInstance(modalEl);
                if (bsModal) bsModal.hide();
            }

            window.dispatchEvent(new CustomEvent('achievex_dataset_updated'));
        } catch (err) {
            console.error('Error loading sample file', err);
            this.showNotification(`Failed to load sample: ${err.message}`, 'danger');
        }
    },

    showInspectionModal(parsed, filename) {
        const modalEl = document.getElementById('admin-mapping-modal');
        if (!modalEl) return;

        const modalTitle = document.getElementById('mapping-modal-title');
        const modalBody = document.getElementById('mapping-modal-body');

        if (modalTitle) modalTitle.innerText = `Inspect & Map Workbook: ${filename}`;

        let sheetSelectHTML = '';
        if (parsed.sheetNames && parsed.sheetNames.length > 1) {
            sheetSelectHTML = `
                <div class="col-md-12">
                    <div class="card p-3 bg-primary-subtle border-primary-subtle mb-2">
                        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div>
                                <h6 class="fw-bold text-primary m-0"><i class="bi bi-layers me-2"></i> Multiple Worksheets Detected (${parsed.sheetNames.length} Sheets)</h6>
                                <span class="small text-muted">Select the worksheet containing outlet activity achievements to import:</span>
                            </div>
                            <div style="min-width: 220px;">
                                <select id="inspect-sheet-dropdown" class="form-select form-select-sm fw-bold text-primary">
                                    ${parsed.sheetNames.map(s => `<option value="${s}" ${s === parsed.activeSheet ? 'selected' : ''}>Worksheet: ${s}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        let catSummary = '';
        Object.keys(parsed.categoriesByMonth).forEach(m => {
            catSummary += `<li><strong>${m}:</strong> ${parsed.categoriesByMonth[m].join(', ') || 'No specific categories'}</li>`;
        });

        modalBody.innerHTML = `
            <div class="row g-3">
                ${sheetSelectHTML}

                <div class="col-md-6">
                    <div class="card p-3 bg-light">
                        <h6 class="fw-bold text-primary"><i class="bi bi-calendar-event me-2"></i> Detected Periods</h6>
                        <ul class="list-unstyled mb-0 small">
                            <li><strong>Active Sheet:</strong> <span class="badge bg-primary">${parsed.activeSheet}</span></li>
                            <li><strong>Reporting Year:</strong> ${parsed.detectedYear}</li>
                            <li><strong>Half-Year:</strong> ${parsed.detectedHalfYear}</li>
                            <li><strong>Quarters:</strong> ${parsed.detectedQuarters.join(', ')}</li>
                            <li><strong>Months Detected:</strong> ${parsed.detectedMonths.join(', ') || 'Auto-mapping month columns'}</li>
                        </ul>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card p-3 bg-light">
                        <h6 class="fw-bold text-purple"><i class="bi bi-tags me-2"></i> Month & Category Highlights</h6>
                        <ul class="mb-0 small ps-3">
                            ${catSummary || '<li>Standard Outlet Metrics Sheet</li>'}
                            <li><strong>Total Outlets in Sheet:</strong> ${parsed.outlets.length}</li>
                        </ul>
                    </div>
                </div>

                <div class="col-md-12">
                    <h6 class="fw-bold mt-2"><i class="bi bi-table me-2"></i> Column Field Mapping Preview</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered bg-white small align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>Field Name</th>
                                    <th>Mapped Excel Column Header</th>
                                    <th>Sample Outlet Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderMappingRow('Distributor Code', 'distributor_code', parsed)}
                                ${this.renderMappingRow('Distributor Name', 'distributor_name', parsed)}
                                ${this.renderMappingRow('SSE / Region', 'sse', parsed)}
                                ${this.renderMappingRow('DSR', 'dsr', parsed)}
                                ${this.renderMappingRow('Retailer Code', 'retailer_code', parsed)}
                                ${this.renderMappingRow('Retailer Name', 'retailer_name', parsed)}
                                ${this.renderMappingRow('URC', 'urc', parsed)}
                                ${this.renderMappingRow('Activity', 'activity', parsed)}
                                ${this.renderMappingRow('Slab / Classification', 'slab', parsed)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        if (typeof bootstrap !== 'undefined') {
            let bsModal = bootstrap.Modal.getInstance(modalEl);
            if (!bsModal) {
                bsModal = new bootstrap.Modal(modalEl);
            }
            bsModal.show();
        }

        // Bind Sheet Switcher Dropdown Listener
        const sheetDropdown = document.getElementById('inspect-sheet-dropdown');
        if (sheetDropdown && parsed.rawWorkbook) {
            sheetDropdown.addEventListener('change', async (e) => {
                const selectedSheet = e.target.value;
                this.showNotification(`Switching to sheet '${selectedSheet}'...`, 'info');
                
                const worksheet = parsed.rawWorkbook.Sheets[selectedSheet];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                const reParsed = ExcelParser.parseRawMatrix(rawRows, parsed.sheetNames, selectedSheet);
                reParsed.rawWorkbook = parsed.rawWorkbook;
                this.stagedWorkbookData = reParsed;
                
                this.showInspectionModal(reParsed, filename);
            });
        }

        // Bind Confirm Import Button
        const confirmBtn = document.getElementById('btn-confirm-import');
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                await DataManager.setDataset(parsed, filename);
                if (typeof bootstrap !== 'undefined') {
                    const bsModal = bootstrap.Modal.getInstance(modalEl);
                    if (bsModal) bsModal.hide();
                }
                this.showNotification(`Import confirmed! Dashboard loaded ${parsed.outlets.length} outlets from sheet '${parsed.activeSheet}'.`, 'success');
                window.dispatchEvent(new CustomEvent('achievex_dataset_updated'));
            };
        }
    },

    renderMappingRow(label, key, parsed) {
        const mappedCol = parsed.columnMapping[key] || '';
        const sampleVal = parsed.outlets.length > 0 ? (parsed.outlets[0][key] || 'N/A') : 'N/A';
        const optionsHTML = parsed.headers.map(h => `<option value="${h}" ${h === mappedCol ? 'selected' : ''}>${h}</option>`).join('');

        return `
            <tr>
                <td><strong>${label}</strong></td>
                <td>
                    <select class="form-select form-select-sm" onchange="AdminMapper.updateFieldMap('${key}', this.value)">
                        <option value="">-- Unmapped --</option>
                        ${optionsHTML}
                    </select>
                </td>
                <td class="text-muted">${sampleVal}</td>
            </tr>
        `;
    },

    updateFieldMap(key, newCol) {
        if (this.stagedWorkbookData) {
            this.stagedWorkbookData.columnMapping[key] = newCol;
        }
    },

    async clearDataset() {
        if (confirm('Are you sure you want to clear the active dataset and storage?')) {
            await DataManager.clearAllData();
            this.showNotification('All dataset data cleared.', 'warning');
            location.reload();
        }
    },

    showNotification(msg, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show shadow mb-2`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

window.AdminMapper = AdminMapper;

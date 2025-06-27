// Main Application Logic - Remimazolam PK/PD Simulator

// Global state
let appState = {
    currentTab: 'patient',
    patient: null,
    doseEvents: [],
    simulationResult: null,
    isCalculating: false,
    chart: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize default patient
    initializeDefaultPatient();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI
    updatePatientDisplay();
    updateDoseEventsDisplay();
    
    // Show disclaimer modal
    showDisclaimer();
}

function initializeDefaultPatient() {
    const now = new Date();
    now.setHours(8, 0, 0, 0); // Default to 8:00 AM
    
    appState.patient = new Patient(
        `患者-${new Date().toISOString().split('T')[0]}`,
        50,
        70.0,
        170.0,
        SexType.MALE,
        AsapsType.CLASS_1_2,
        now
    );
    
    // Add default dose event
    appState.doseEvents = [
        new DoseEvent(0, 12.0, 1.0)
    ];
}

function setupEventListeners() {
    // Disclaimer
    document.getElementById('acceptDisclaimer').addEventListener('click', hideDisclaimer);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.closest('.tab-btn').dataset.tab);
        });
    });
    
    // Patient tab
    document.getElementById('editPatientBtn').addEventListener('click', showPatientEditor);
    document.getElementById('toDoseScheduleBtn').addEventListener('click', () => switchTab('dose'));
    
    // Dose tab
    document.getElementById('addDoseEventBtn').addEventListener('click', showDoseEventEditor);
    document.getElementById('runSimulationBtn').addEventListener('click', runSimulation);
    document.getElementById('toDoseTabBtn').addEventListener('click', () => switchTab('dose'));
    
    // Patient editor modal
    document.getElementById('closePatientModal').addEventListener('click', hidePatientEditor);
    document.getElementById('cancelPatientEdit').addEventListener('click', hidePatientEditor);
    document.getElementById('patientForm').addEventListener('submit', savePatientData);
    
    // Dose editor modal
    document.getElementById('closeDoseModal').addEventListener('click', hideDoseEventEditor);
    document.getElementById('cancelDoseAdd').addEventListener('click', hideDoseEventEditor);
    document.getElementById('doseForm').addEventListener('submit', addDoseEvent);
    
    // Patient form sliders
    setupPatientFormSliders();
    
    // Dose form sliders
    setupDoseFormSliders();
    
    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function setupPatientFormSliders() {
    const ageSlider = document.getElementById('editAge');
    const weightSlider = document.getElementById('editWeight');
    const heightSlider = document.getElementById('editHeight');
    
    ageSlider.addEventListener('input', (e) => {
        document.getElementById('ageValue').textContent = e.target.value;
        updateBMICalculation();
    });
    
    weightSlider.addEventListener('input', (e) => {
        document.getElementById('weightValue').textContent = parseFloat(e.target.value).toFixed(1);
        updateBMICalculation();
    });
    
    heightSlider.addEventListener('input', (e) => {
        document.getElementById('heightValue').textContent = e.target.value;
        updateBMICalculation();
    });
}

function setupDoseFormSliders() {
    const bolusSlider = document.getElementById('bolusAmount');
    const continuousSlider = document.getElementById('continuousRate');
    
    bolusSlider.addEventListener('input', (e) => {
        document.getElementById('bolusValue').textContent = parseFloat(e.target.value).toFixed(1);
    });
    
    continuousSlider.addEventListener('input', (e) => {
        document.getElementById('continuousValue').textContent = parseFloat(e.target.value).toFixed(2);
    });
}

function updateBMICalculation() {
    const weight = parseFloat(document.getElementById('editWeight').value);
    const height = parseFloat(document.getElementById('editHeight').value);
    const bmi = weight / Math.pow(height / 100, 2);
    document.getElementById('bmiCalculated').textContent = bmi.toFixed(1);
}

// Modal functions
function showDisclaimer() {
    document.getElementById('disclaimerModal').classList.add('active');
}

function hideDisclaimer() {
    document.getElementById('disclaimerModal').classList.remove('active');
    document.getElementById('mainApp').classList.remove('hidden');
}

function showPatientEditor() {
    const modal = document.getElementById('patientModal');
    
    // Populate form with current patient data
    document.getElementById('editPatientId').value = appState.patient.id;
    document.getElementById('editAge').value = appState.patient.age;
    document.getElementById('editWeight').value = appState.patient.weight;
    document.getElementById('editHeight').value = appState.patient.height;
    document.querySelector(`input[name="sex"][value="${appState.patient.sex === SexType.MALE ? 'male' : 'female'}"]`).checked = true;
    document.querySelector(`input[name="asa"][value="${appState.patient.asaPS === AsapsType.CLASS_1_2 ? '1-2' : '3-4'}"]`).checked = true;
    document.getElementById('editAnesthesiaStart').value = appState.patient.anesthesiaStartTime.toTimeString().substring(0, 5);
    
    // Update display values
    document.getElementById('ageValue').textContent = appState.patient.age;
    document.getElementById('weightValue').textContent = appState.patient.weight.toFixed(1);
    document.getElementById('heightValue').textContent = appState.patient.height;
    updateBMICalculation();
    
    modal.classList.add('active');
}

function hidePatientEditor() {
    document.getElementById('patientModal').classList.remove('active');
}

function showDoseEventEditor() {
    const modal = document.getElementById('doseModal');
    
    // Reset form
    document.getElementById('doseTime').value = appState.patient.formattedStartTime;
    document.getElementById('bolusAmount').value = 0;
    document.getElementById('continuousRate').value = 0;
    document.getElementById('bolusValue').textContent = '0.0';
    document.getElementById('continuousValue').textContent = '0.00';
    document.getElementById('anesthesiaStartTime').textContent = appState.patient.formattedStartTime;
    
    modal.classList.add('active');
}

function hideDoseEventEditor() {
    document.getElementById('doseModal').classList.remove('active');
}

// Tab switching
function switchTab(tabName) {
    // Update state
    appState.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Update run simulation button state
    updateSimulationButtonState();
}

// Patient data management
function savePatientData(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Parse time
    const timeValue = document.getElementById('editAnesthesiaStart').value;
    const anesthesiaStart = new Date(appState.patient.anesthesiaStartTime);
    const [hours, minutes] = timeValue.split(':').map(Number);
    anesthesiaStart.setHours(hours, minutes, 0, 0);
    
    // Update patient
    appState.patient.id = document.getElementById('editPatientId').value;
    appState.patient.age = parseInt(document.getElementById('editAge').value);
    appState.patient.weight = parseFloat(document.getElementById('editWeight').value);
    appState.patient.height = parseFloat(document.getElementById('editHeight').value);
    appState.patient.sex = formData.get('sex') === 'male' ? SexType.MALE : SexType.FEMALE;
    appState.patient.asaPS = formData.get('asa') === '1-2' ? AsapsType.CLASS_1_2 : AsapsType.CLASS_3_4;
    appState.patient.anesthesiaStartTime = anesthesiaStart;
    
    // Validate patient data
    const validation = appState.patient.validate();
    if (!validation.isValid) {
        alert('入力エラー:\n' + validation.errors.join('\n'));
        return;
    }
    
    updatePatientDisplay();
    updateDoseEventsDisplay(); // Need to update clock times
    hidePatientEditor();
}

function updatePatientDisplay() {
    document.getElementById('patientId').textContent = appState.patient.id;
    document.getElementById('patientAge').textContent = `${appState.patient.age}歳`;
    document.getElementById('patientWeight').textContent = `${appState.patient.weight.toFixed(1)} kg`;
    document.getElementById('patientHeight').textContent = `${appState.patient.height.toFixed(0)} cm`;
    document.getElementById('patientBMI').textContent = appState.patient.bmi.toFixed(1);
    document.getElementById('patientSex').textContent = SexType.displayName(appState.patient.sex);
    document.getElementById('patientASA').textContent = AsapsType.displayName(appState.patient.asaPS);
    document.getElementById('anesthesiaStart').textContent = appState.patient.formattedStartTime;
}

// Dose event management
function addDoseEvent(e) {
    e.preventDefault();
    
    const timeValue = document.getElementById('doseTime').value;
    const bolusAmount = parseFloat(document.getElementById('bolusAmount').value);
    const continuousRate = parseFloat(document.getElementById('continuousRate').value);
    
    // Calculate minutes from anesthesia start
    const doseTime = new Date(appState.patient.anesthesiaStartTime);
    const [hours, minutes] = timeValue.split(':').map(Number);
    doseTime.setHours(hours, minutes, 0, 0);
    
    // Handle day crossing for dose times
    let minutesFromStart = appState.patient.clockTimeToMinutes(doseTime);
    
    // If the dose time appears to be before anesthesia start (negative), 
    // it's likely the next day (e.g., anesthesia starts at 23:00, dose at 00:05)
    if (minutesFromStart < 0) {
        // Add 24 hours (1440 minutes) to get the correct next-day time
        minutesFromStart += 1440;
    }
    
    minutesFromStart = Math.round(minutesFromStart);
    
    // Ensure minimum time is 0 (no negative times allowed)
    minutesFromStart = Math.max(0, minutesFromStart);
    
    const doseEvent = new DoseEvent(minutesFromStart, bolusAmount, continuousRate);
    
    // Validate dose event
    const validation = doseEvent.validate();
    if (!validation.isValid) {
        alert('入力エラー:\n' + validation.errors.join('\n'));
        return;
    }
    
    appState.doseEvents.push(doseEvent);
    appState.doseEvents.sort((a, b) => a.timeInMinutes - b.timeInMinutes);
    
    updateDoseEventsDisplay();
    updateSimulationButtonState();
    hideDoseEventEditor();
}

function removeDoseEvent(index) {
    if (index >= 0 && index < appState.doseEvents.length) {
        appState.doseEvents.splice(index, 1);
        updateDoseEventsDisplay();
        updateSimulationButtonState();
    }
}

function updateDoseEventsDisplay() {
    const container = document.getElementById('doseEventsList');
    container.innerHTML = '';
    
    appState.doseEvents.forEach((event, index) => {
        const eventElement = createDoseEventElement(event, index);
        container.appendChild(eventElement);
    });
}

function createDoseEventElement(event, index) {
    const div = document.createElement('div');
    div.className = 'dose-event';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'dose-info';
    
    const title = document.createElement('h4');
    title.textContent = `${event.timeInMinutes}分 (${event.formattedClockTime(appState.patient)})`;
    
    const details = document.createElement('div');
    details.className = 'dose-details';
    
    if (event.bolusMg > 0 || event.continuousMgKgHr > 0) {
        if (event.bolusMg > 0) {
            const bolusSpan = document.createElement('span');
            bolusSpan.textContent = `ボーラス: ${event.bolusMg.toFixed(1)}mg`;
            details.appendChild(bolusSpan);
        }
        
        if (event.continuousMgKgHr > 0) {
            const continuousSpan = document.createElement('span');
            continuousSpan.textContent = `持続: ${event.continuousMgKgHr.toFixed(2)}mg/kg/hr`;
            details.appendChild(continuousSpan);
        }
    } else {
        const stopSpan = document.createElement('span');
        stopSpan.textContent = '投与中止';
        stopSpan.className = 'dose-stop';
        details.appendChild(stopSpan);
    }
    
    infoDiv.appendChild(title);
    infoDiv.appendChild(details);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-dose';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', () => removeDoseEvent(index));
    
    div.appendChild(infoDiv);
    div.appendChild(deleteBtn);
    
    return div;
}

function updateSimulationButtonState() {
    const button = document.getElementById('runSimulationBtn');
    button.disabled = appState.doseEvents.length === 0 || appState.isCalculating;
    
    if (appState.isCalculating) {
        button.innerHTML = '<span class="loading"><span class="spinner"></span>計算中...</span>';
    } else {
        button.innerHTML = '▶️ シミュレーション実行';
    }
}

// Simulation
async function runSimulation() {
    if (appState.isCalculating || appState.doseEvents.length === 0) {
        return;
    }
    
    appState.isCalculating = true;
    updateSimulationButtonState();
    
    try {
        // Use setTimeout to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const engine = new PKCalculationEngine();
        
        // Determine simulation duration (120 minutes after last dose event)
        const lastEventTime = Math.max(...appState.doseEvents.map(event => event.timeInMinutes));
        const simulationDuration = lastEventTime + 120.0;
        
        const result = engine.performSimulationV3Hybrid(
            appState.patient,
            appState.doseEvents,
            simulationDuration
        );
        
        appState.simulationResult = result;
        updateResultsDisplay();
        switchTab('results');
        
    } catch (error) {
        console.error('Simulation error:', error);
        alert('シミュレーション計算中にエラーが発生しました:\n' + error.message);
    } finally {
        appState.isCalculating = false;
        updateSimulationButtonState();
    }
}

function updateResultsDisplay() {
    if (!appState.simulationResult) {
        document.getElementById('noResults').classList.remove('hidden');
        document.getElementById('resultsContent').classList.add('hidden');
        return;
    }
    
    document.getElementById('noResults').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');
    
    const result = appState.simulationResult;
    
    // Update summary
    document.getElementById('calculationMethod').textContent = result.calculationMethod;
    document.getElementById('maxPlasma').textContent = result.maxPlasmaConcentration.toFixed(3);
    document.getElementById('maxEffect').textContent = result.maxEffectSiteConcentration.toFixed(3);
    
    // Update chart
    updateChart();
    
    // Update table
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';
    
    result.timePoints.forEach(timePoint => {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        timeCell.textContent = timePoint.formattedClockTime(appState.patient);
        
        const plasmaCell = document.createElement('td');
        plasmaCell.textContent = timePoint.plasmaConcentrationString;
        
        const effectCell = document.createElement('td');
        effectCell.textContent = timePoint.effectSiteConcentrationString;
        
        row.appendChild(timeCell);
        row.appendChild(plasmaCell);
        row.appendChild(effectCell);
        
        tbody.appendChild(row);
    });
}

// Chart functions
function updateChart() {
    if (!appState.simulationResult) return;
    
    const ctx = document.getElementById('concentrationChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (appState.chart) {
        appState.chart.destroy();
    }
    
    const result = appState.simulationResult;
    
    // Prepare data - filter for 1-minute intervals
    const chartData = result.timePoints.filter((timePoint) => {
        // Filter to include only points at whole minute intervals
        const minutes = timePoint.timeInMinutes;
        return Math.abs(minutes - Math.round(minutes)) < 0.01; // Include points very close to whole minutes
    });
    
    const labels = chartData.map(timePoint => {
        // Show actual clock time instead of relative time
        return timePoint.formattedClockTime(appState.patient);
    });
    
    const plasmaData = chartData.map(timePoint => timePoint.plasmaConcentration);
    const effectData = chartData.map(timePoint => timePoint.effectSiteConcentration);
    
    appState.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '血漿濃度',
                    data: plasmaData,
                    borderColor: 'rgba(0, 122, 255, 1)',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 1,
                    pointHoverRadius: 5
                },
                {
                    label: '効果部位濃度',
                    data: effectData,
                    borderColor: 'rgba(52, 199, 89, 1)',
                    backgroundColor: 'rgba(52, 199, 89, 0.1)',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 1,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'レミマゾラム濃度推移',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(3) + ' µg/mL';
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時刻'
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '濃度 (µg/mL)'
                    },
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// CSV Export
function exportToCsv() {
    if (!appState.simulationResult) {
        alert('エクスポートするシミュレーション結果がありません。');
        return;
    }
    
    const csvContent = appState.simulationResult.toCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5).replace(':', '-');
    const patientId = appState.patient.id.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${patientId}_${dateStr}_${timeStr}.csv`;
    
    // Create download link
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        alert('お使いのブラウザではCSVダウンロードがサポートされていません。');
    }
}
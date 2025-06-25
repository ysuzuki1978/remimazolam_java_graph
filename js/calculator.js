// PK Calculation Engine - Remimazolam PK/PD Simulator

// V3 Hybrid Effect-Site Calculation Methods

/**
 * Alternative effect-site concentration calculation using discrete time steps
 */
function calculateEffectSiteDiscrete(plasmaConcentrations, timePoints, ke0, dt = 0.1) {
    if (plasmaConcentrations.length !== timePoints.length) {
        throw new Error("Plasma concentrations and time points must have the same length");
    }
    
    if (ke0 <= 0) {
        throw new Error("ke0 must be positive");
    }
    
    const ceValues = new Array(timePoints.length).fill(0);
    ceValues[0] = 0.0; // Start with zero effect-site concentration
    
    for (let i = 1; i < timePoints.length; i++) {
        const timeDiff = timePoints[i] - timePoints[i-1];
        const cpStart = plasmaConcentrations[i-1];
        const cpEnd = plasmaConcentrations[i];
        const cePrev = ceValues[i-1];
        
        const numSubsteps = Math.max(1, Math.ceil(timeDiff / dt));
        const substepDt = timeDiff / numSubsteps;
        
        let ceCurrent = cePrev;
        
        for (let step = 1; step <= numSubsteps; step++) {
            const progress = (step - 0.5) / numSubsteps;
            const cpSubstep = cpStart + progress * (cpEnd - cpStart);
            
            const dce_dt = ke0 * (cpSubstep - ceCurrent);
            ceCurrent = ceCurrent + substepDt * dce_dt;
        }
        
        ceValues[i] = ceCurrent;
    }
    
    return ceValues;
}

/**
 * Alternative effect-site calculation using exponential decay approach
 */
function calculateEffectSiteExponential(plasmaConcentrations, timePoints, ke0) {
    const ceValues = new Array(timePoints.length).fill(0);
    ceValues[0] = 0;
    
    for (let i = 1; i < timePoints.length; i++) {
        const currentTime = timePoints[i];
        let ceSum = 0.0;
        
        for (let j = 0; j < i; j++) {
            const elapsedTime = currentTime - timePoints[j];
            
            const cpChange = j === 0 ? plasmaConcentrations[j] : plasmaConcentrations[j] - plasmaConcentrations[j-1];
            
            if (elapsedTime > 0) {
                const contribution = cpChange * (1 - Math.exp(-ke0 * elapsedTime));
                ceSum += contribution;
            }
        }
        
        ceValues[i] = ceSum;
    }
    
    return ceValues;
}

/**
 * VHAC (Variable-step Hybrid Algorithm for Ce): 
 * Hybrid effect-site calculation combining analytical and numerical approaches
 */
function calculateEffectSiteHybrid(plasmaConcentrations, timePoints, ke0) {
    const ceValues = new Array(timePoints.length).fill(0);
    ceValues[0] = 0.0;
    
    for (let i = 1; i < timePoints.length; i++) {
        const dt = timePoints[i] - timePoints[i-1];
        const cpCurrent = plasmaConcentrations[i];
        const cpPrev = plasmaConcentrations[i-1];
        const cePrev = ceValues[i-1];
        
        // If plasma concentration is constant, use analytical solution
        if (Math.abs(cpCurrent - cpPrev) < 1e-6) {
            // Analytical solution for constant plasma concentration
            ceValues[i] = cpCurrent + (cePrev - cpCurrent) * Math.exp(-ke0 * dt);
        } else {
            // For changing plasma concentration, use linear interpolation + analytical solution
            const slope = (cpCurrent - cpPrev) / dt;
            
            // Analytical solution for linearly changing plasma concentration
            if (Math.abs(ke0 * dt) < 0.001) {
                // For very small time steps, use Taylor expansion
                ceValues[i] = cePrev + dt * ke0 * (cpPrev - cePrev) + 
                             dt * dt * ke0 * slope / 2;
            } else {
                // General analytical solution for linear plasma concentration change
                const expTerm = Math.exp(-ke0 * dt);
                ceValues[i] = cpCurrent + 
                             (cePrev - cpPrev + slope/ke0) * expTerm - 
                             slope/ke0;
            }
        }
    }
    
    return ceValues;
}

// Enhanced PKCalculationEngine with VHAC Support
class PKCalculationEngine {
    
    calculatePKParameters(patient) {
        const constants = MasuiModelConstants;
        
        const age = patient.age;
        const weight = patient.weight;
        const height = patient.height;
        const sex = patient.sex; // 0 = male, 1 = female
        const asaPS = patient.asaPS; // 0 = ASA I-II, 1 = ASA III-IV
        
        // Body composition calculations from Masui 2022
        // Ideal Body Weight (IBW) - Devine formula modified for Japanese population
        const ibw = constants.ibwConstant + constants.ibwHeightCoefficient * (height - constants.ibwHeightOffset) + constants.ibwGenderCoefficient * (1 - sex);
        
        // Adjusted Body Weight (ABW) - lean body weight approximation
        const abw = ibw + constants.abwCoefficient * (weight - ibw);
        
        // Volume of distribution and clearance calculations
        const v1 = constants.theta1 * (abw / constants.standardWeight);
        const v2 = constants.theta2 * (abw / constants.standardWeight);
        const v3 = (constants.theta3 + constants.theta8 * (age - constants.standardAge)) * (abw / constants.standardWeight);
        const cl = (constants.theta4 + constants.theta9 * sex + constants.theta10 * asaPS) * Math.pow(abw / constants.standardWeight, 0.75);
        const q2 = constants.theta5 * Math.pow(abw / constants.standardWeight, 0.75);
        const q3 = constants.theta6 * Math.pow(abw / constants.standardWeight, 0.75);
        
        const ke0 = this.calculateKe0(patient);
        
        return new PKParameters(v1, v2, v3, cl, q2, q3, ke0);
    }
    
    calculateKe0(patient) {
        // 指示通りの正確なMasui ke0計算法を使用
        try {
            // PKパラメータを計算（既存のメソッドを再利用）
            const age = patient.age;
            const weight = patient.weight;
            const height = patient.height;
            const sex = patient.sex; // 0 = male, 1 = female
            const asaPS = patient.asaPS; // 0 = ASA I-II, 1 = ASA III-IV
            
            // MasuiKe0Calculatorが利用可能な場合は正確な計算を使用
            if (typeof MasuiKe0Calculator !== 'undefined') {
                const result = MasuiKe0Calculator.calculateKe0Complete(age, weight, height, sex, asaPS);
                
                if (result.success) {
                    // 数値解析による厳密解を優先使用
                    if (result.ke0_numerical !== null && result.ke0_numerical > 0) {
                        console.log(`Using numerical ke0: ${result.ke0_numerical.toFixed(5)}`);
                        return result.ke0_numerical;
                    }
                    
                    // フォールバックとして重回帰モデルを使用
                    if (result.ke0_regression > 0) {
                        console.log(`Using regression ke0: ${result.ke0_regression.toFixed(5)}`);
                        return result.ke0_regression;
                    }
                }
            }
            
            // フォールバック: 従来の簡略化計算
            console.warn('Using fallback ke0 calculation');
            return this.calculateKe0Fallback(patient);
            
        } catch (error) {
            console.error('Ke0 calculation error:', error);
            return this.calculateKe0Fallback(patient);
        }
    }
    
    calculateKe0Fallback(patient) {
        // フォールバック用の簡略化計算（従来の実装）
        const age = patient.age;
        const weight = patient.weight;
        const height = patient.height;
        const sex = patient.sex;
        const asaPS = patient.asaPS;
        
        // Center the demographic variables around population means
        const ageCentered = age - 54.0;
        const weightCentered = weight - 67.3;
        const heightCentered = height - 159.0;
        
        // Linear regression equation
        let linearPredictor = -2.847 +
                             0.0234 * ageCentered +
                             0.0145 * weightCentered +
                             0.0123 * heightCentered +
                             0.0842 * sex +
                             0.0578 * asaPS;
        
        // Add interaction terms
        linearPredictor += -0.0001 * ageCentered * weightCentered +
                          -0.00008 * ageCentered * heightCentered +
                          -0.00006 * weightCentered * heightCentered;
        
        // Apply bounds
        linearPredictor = Math.max(Math.min(linearPredictor, 0), -10);
        
        // Calculate ke0
        let ke0 = Math.exp(linearPredictor);
        
        // Apply clinical bounds
        ke0 = Math.max(Math.min(ke0, 0.3), 0.05);
        
        return ke0;
    }
    
    /**
     * Perform VHAC pharmacokinetic simulation with 0.01-minute precision
     */
    performSimulationV3Hybrid(patient, doseEvents, simulationDurationMin = null) {
        if (!doseEvents || doseEvents.length === 0) {
            throw new Error("At least one dose event is required");
        }
        
        const pkParams = this.calculatePKParameters(patient);
        
        // Determine simulation duration
        const maxEventTime = Math.max(...doseEvents.map(event => event.timeInMinutes));
        const finalDuration = simulationDurationMin || (maxEventTime + 120.0);
        
        // Create high-precision time sequence (0.01-minute intervals)
        const timeStep = 0.01;
        const times = [];
        for (let t = 0; t <= finalDuration; t += timeStep) {
            times.push(t);
        }
        
        // Calculate plasma concentrations using LSODA method (with RK4 fallback)
        const plasmaResult = this.calculatePlasmaConcentrationsLSODA(
            patient,
            doseEvents,
            times,
            pkParams
        );
        
        // Calculate effect-site concentrations using VHAC method
        const effectSiteConcentrations = calculateEffectSiteHybrid(
            plasmaResult.concentrations,
            times,
            pkParams.ke0
        );
        
        // Create time points (sample every 1 minute for display)
        const timePoints = [];
        const sampleInterval = Math.round(1.0 / timeStep);
        
        for (let i = 0; i < times.length; i += sampleInterval) {
            if (i >= times.length) break;
            
            const currentTime = times[i];
            const plasma = plasmaResult.concentrations[i];
            const effectSite = effectSiteConcentrations[i];
            
            // Find corresponding dose event
            const doseEvent = doseEvents.find(event => Math.abs(event.timeInMinutes - currentTime) < 0.5);
            
            const timePoint = new TimePoint(
                Math.round(currentTime),
                doseEvent || null,
                plasma,
                effectSite
            );
            timePoints.push(timePoint);
        }
        
        return new SimulationResultV3(
            timePoints,
            patient,
            doseEvents,
            "VHAC + LSODA Engine (Web v1.0)",
            new Date(),
            plasmaResult.concentrations,
            effectSiteConcentrations,
            times
        );
    }
    
    /**
     * Calculate plasma concentrations using 3-compartment model with high precision
     */
    calculatePlasmaConcentrations(patient, doseEvents, times, pkParams) {
        const timeStep = times.length > 1 ? times[1] - times[0] : 0.01;
        
        let state = new SystemState();
        const plasmaConcentrations = [];
        
        // Process events into bolus and infusion schedules
        const bolusEvents = [];
        const infusionEvents = [];
        
        for (const event of doseEvents) {
            const eventTime = event.timeInMinutes;
            
            if (event.bolusMg > 0) {
                bolusEvents.push({ time: eventTime, amount: event.bolusMg });
            }
            
            // Add infusion rate changes (including rate = 0 for stopping infusion)
            const newRate = event.continuousMgKgHr;
            if (infusionEvents.length === 0 || newRate !== infusionEvents[infusionEvents.length - 1].rate) {
                infusionEvents.push({ time: eventTime, rate: newRate });
            }
        }
        
        // Sort events
        bolusEvents.sort((a, b) => a.time - b.time);
        infusionEvents.sort((a, b) => a.time - b.time);
        
        // Add initial zero infusion if needed
        if (infusionEvents.length === 0 || infusionEvents[0].time > 0) {
            infusionEvents.unshift({ time: 0.0, rate: 0.0 });
        }
        
        let bolusIndex = 0;
        let infusionIndex = 0;
        let currentInfusionRate = 0.0;
        
        for (let index = 0; index < times.length; index++) {
            const currentTime = times[index];
            
            // Apply bolus doses
            while (bolusIndex < bolusEvents.length && Math.abs(bolusEvents[bolusIndex].time - currentTime) < timeStep / 2) {
                state.a1 += bolusEvents[bolusIndex].amount;
                bolusIndex++;
            }
            
            // Update infusion rate
            while (infusionIndex < infusionEvents.length && currentTime >= infusionEvents[infusionIndex].time) {
                currentInfusionRate = infusionEvents[infusionIndex].rate;
                infusionIndex++;
            }
            
            // Calculate plasma concentration
            const plasmaConc = Math.max(0.0, state.a1 / pkParams.v1);
            plasmaConcentrations.push(plasmaConc);
            
            // Update system state for next iteration
            if (index < times.length - 1) {
                state = this.updateSystemStateHighPrecision(
                    state,
                    pkParams,
                    patient,
                    currentInfusionRate,
                    timeStep
                );
            }
        }
        
        return new PlasmaCalculationResult(
            plasmaConcentrations,
            infusionEvents.map(event => ({ time: event.time, rate: event.rate }))
        );
    }
    
    /**
     * High-precision system state update using LSODA method
     */
    updateSystemStateHighPrecision(state, pkParams, patient, infusionRate, dt) {
        // For single step updates, use simplified RK4 for backwards compatibility
        // Full LSODA integration is used in calculatePlasmaConcentrationsLSODA
        return this.updateSystemStateRK4(state, pkParams, patient, infusionRate, dt);
    }
    
    /**
     * Fallback RK4 method for single step updates
     */
    updateSystemStateRK4(state, pkParams, patient, infusionRate, dt) {
        const k10 = pkParams.k10;
        const k12 = pkParams.k12;
        const k21 = pkParams.k21;
        const k13 = pkParams.k13;
        const k31 = pkParams.k31;
        
        const inputRate = (infusionRate * patient.weight) / 60.0; // mg/min
        
        // 4th order Runge-Kutta integration
        const derivatives = (a1, a2, a3) => {
            const da1_dt = inputRate - k10 * a1 - k12 * a1 + k21 * a2 - k13 * a1 + k31 * a3;
            const da2_dt = k12 * a1 - k21 * a2;
            const da3_dt = k13 * a1 - k31 * a3;
            return { da1: da1_dt, da2: da2_dt, da3: da3_dt };
        };
        
        const k1 = derivatives(state.a1, state.a2, state.a3);
        const k2 = derivatives(state.a1 + dt * k1.da1 / 2, state.a2 + dt * k1.da2 / 2, state.a3 + dt * k1.da3 / 2);
        const k3 = derivatives(state.a1 + dt * k2.da1 / 2, state.a2 + dt * k2.da2 / 2, state.a3 + dt * k2.da3 / 2);
        const k4 = derivatives(state.a1 + dt * k3.da1, state.a2 + dt * k3.da2, state.a3 + dt * k3.da3);
        
        const newState = new SystemState();
        newState.a1 = state.a1 + dt * (k1.da1 + 2 * k2.da1 + 2 * k3.da1 + k4.da1) / 6;
        newState.a2 = state.a2 + dt * (k1.da2 + 2 * k2.da2 + 2 * k3.da2 + k4.da2) / 6;
        newState.a3 = state.a3 + dt * (k1.da3 + 2 * k2.da3 + 2 * k3.da3 + k4.da3) / 6;
        
        // Ensure non-negative values
        newState.a1 = Math.max(0.0, newState.a1);
        newState.a2 = Math.max(0.0, newState.a2);
        newState.a3 = Math.max(0.0, newState.a3);
        
        return newState;
    }
    
    /**
     * LSODA-based plasma concentration calculation (high-precision alternative)
     */
    calculatePlasmaConcentrationsLSODA(patient, doseEvents, times, pkParams) {
        if (typeof PKLSODASolver === 'undefined') {
            console.warn('LSODA solver not available, falling back to RK4');
            return this.calculatePlasmaConcentrations(patient, doseEvents, times, pkParams);
        }
        
        const solver = new PKLSODASolver();
        
        // Process events into bolus and infusion schedules
        const bolusEvents = [];
        const infusionEvents = [];
        
        for (const event of doseEvents) {
            const eventTime = event.timeInMinutes;
            
            if (event.bolusMg > 0) {
                bolusEvents.push({ time: eventTime, amount: event.bolusMg });
            }
            
            const newRate = (event.continuousMgKgHr * patient.weight) / 60.0; // mg/min
            if (infusionEvents.length === 0 || newRate !== infusionEvents[infusionEvents.length - 1].rate) {
                infusionEvents.push({ time: eventTime, rate: newRate });
            }
        }
        
        // Sort events
        bolusEvents.sort((a, b) => a.time - b.time);
        infusionEvents.sort((a, b) => a.time - b.time);
        
        // Add initial zero infusion if needed
        if (infusionEvents.length === 0 || infusionEvents[0].time > 0) {
            infusionEvents.unshift({ time: 0.0, rate: 0.0 });
        }
        
        // Create infusion rate array for LSODA
        const infusionRates = times.map(t => {
            let currentRate = 0.0;
            for (const event of infusionEvents) {
                if (t >= event.time) {
                    currentRate = event.rate;
                } else {
                    break;
                }
            }
            return currentRate;
        });
        
        try {
            // Solve using LSODA
            const solution = solver.solve3Compartment(
                pkParams,
                times,
                infusionRates,
                bolusEvents,
                [0, 0, 0] // Initial conditions
            );
            
            // Extract concentrations
            const concentrations = solution.y.map(state => Math.max(0.0, state[0] / pkParams.v1));
            
            return new PlasmaCalculationResult(
                concentrations,
                infusionEvents.map(event => ({ time: event.time, rate: event.rate * 60.0 / patient.weight })) // Convert back to mg/kg/hr
            );
            
        } catch (error) {
            console.warn('LSODA integration failed, falling back to RK4:', error.message);
            return this.calculatePlasmaConcentrations(patient, doseEvents, times, pkParams);
        }
    }
}
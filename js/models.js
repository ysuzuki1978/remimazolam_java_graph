// Data Models and Constants for Remimazolam PK/PD Simulator

// Enums
const SexType = {
    MALE: 0,
    FEMALE: 1,
    
    displayName(value) {
        return value === this.MALE ? "男性" : "女性";
    }
};

const AsapsType = {
    CLASS_1_2: 0,
    CLASS_3_4: 1,
    
    displayName(value) {
        return value === this.CLASS_1_2 ? "ASA I-II" : "ASA III-IV";
    }
};

// Constants from Masui 2022 Model
const MasuiModelConstants = {
    theta1: 3.57,
    theta2: 11.3,
    theta3: 27.2,
    theta4: 1.03,
    theta5: 1.10,
    theta6: 0.401,
    theta8: 0.308,
    theta9: 0.146,
    theta10: -0.184,
    
    standardWeight: 67.3,
    standardAge: 54.0,
    
    ibwConstant: 45.4,
    ibwHeightCoefficient: 0.89,
    ibwHeightOffset: 152.4,
    ibwGenderCoefficient: 4.5,
    abwCoefficient: 0.4
};

// Validation Limits
const ValidationLimits = {
    Patient: {
        minimumAge: 18,
        maximumAge: 100,
        minimumWeight: 30.0,
        maximumWeight: 200.0,
        minimumHeight: 120.0,
        maximumHeight: 220.0,
        minimumBMI: 12.0,
        maximumBMI: 50.0
    },
    
    Dosing: {
        minimumTime: 0,
        maximumTime: 1440,
        minimumBolus: 0.0,
        maximumBolus: 100.0,
        minimumContinuous: 0.0,
        maximumContinuous: 20.0
    }
};

// Patient Class
class Patient {
    constructor(id, age, weight, height, sex, asaPS, anesthesiaStartTime = null) {
        this.id = id;
        this.age = age;
        this.weight = weight;
        this.height = height;
        this.sex = sex;
        this.asaPS = asaPS;
        this.anesthesiaStartTime = anesthesiaStartTime || new Date();
    }
    
    get bmi() {
        return this.weight / Math.pow(this.height / 100, 2);
    }
    
    get idealBodyWeight() {
        return 70.0; // Simplified for now
    }
    
    get adjustedBodyWeight() {
        return this.weight;
    }
    
    minutesToClockTime(minutesFromStart) {
        return new Date(this.anesthesiaStartTime.getTime() + minutesFromStart * 60000);
    }
    
    clockTimeToMinutes(clockTime) {
        return (clockTime.getTime() - this.anesthesiaStartTime.getTime()) / 60000;
    }
    
    get formattedStartTime() {
        return this.anesthesiaStartTime.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    validate() {
        const errors = [];
        
        if (!this.id || this.id.trim().length === 0) {
            errors.push("患者IDが入力されていません");
        }
        
        if (this.age < ValidationLimits.Patient.minimumAge || this.age > ValidationLimits.Patient.maximumAge) {
            errors.push("年齢は18歳から100歳の範囲で入力してください");
        }
        
        if (this.weight < ValidationLimits.Patient.minimumWeight || this.weight > ValidationLimits.Patient.maximumWeight) {
            errors.push("体重は30kgから200kgの範囲で入力してください");
        }
        
        if (this.height < ValidationLimits.Patient.minimumHeight || this.height > ValidationLimits.Patient.maximumHeight) {
            errors.push("身長は120cmから220cmの範囲で入力してください");
        }
        
        if (this.bmi < ValidationLimits.Patient.minimumBMI || this.bmi > ValidationLimits.Patient.maximumBMI) {
            errors.push(`BMIが極端な値です（計算値: ${this.bmi.toFixed(1)}）`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Dose Event Class
class DoseEvent {
    constructor(timeInMinutes, bolusMg, continuousMgKgHr) {
        this.timeInMinutes = timeInMinutes;
        this.bolusMg = bolusMg;
        this.continuousMgKgHr = continuousMgKgHr;
    }
    
    continuousRateMgMin(patient) {
        return (this.continuousMgKgHr * patient.weight) / 60.0;
    }
    
    formattedClockTime(patient) {
        const clockTime = patient.minutesToClockTime(this.timeInMinutes);
        return clockTime.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    validate() {
        const errors = [];
        
        if (this.bolusMg < ValidationLimits.Dosing.minimumBolus || this.bolusMg > ValidationLimits.Dosing.maximumBolus) {
            errors.push("ボーラス投与量は0mgから100mgの範囲で入力してください");
        }
        
        if (this.continuousMgKgHr < ValidationLimits.Dosing.minimumContinuous || this.continuousMgKgHr > ValidationLimits.Dosing.maximumContinuous) {
            errors.push("持続投与量は0mg/kg/hrから20mg/kg/hrの範囲で入力してください");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// PK Parameters Class
class PKParameters {
    constructor(v1, v2, v3, cl, q2, q3, ke0) {
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
        this.cl = cl;
        this.q2 = q2;
        this.q3 = q3;
        this.ke0 = ke0;
    }
    
    get k10() {
        return this.cl / this.v1;
    }
    
    get k12() {
        return this.q2 / this.v1;
    }
    
    get k21() {
        return this.q2 / this.v2;
    }
    
    get k13() {
        return this.q3 / this.v1;
    }
    
    get k31() {
        return this.q3 / this.v3;
    }
}

// System State Class
class SystemState {
    constructor(a1 = 0.0, a2 = 0.0, a3 = 0.0, ce = 0.0) {
        this.a1 = a1;
        this.a2 = a2;
        this.a3 = a3;
        this.ce = ce;
    }
    
    toVector() {
        return [this.a1, this.a2, this.a3, this.ce];
    }
    
    static fromVector(vector) {
        return new SystemState(vector[0], vector[1], vector[2], vector[3]);
    }
}

// Time Point Class
class TimePoint {
    constructor(timeInMinutes, doseEvent, plasmaConcentration, effectSiteConcentration) {
        this.timeInMinutes = timeInMinutes;
        this.doseEvent = doseEvent;
        this.plasmaConcentration = plasmaConcentration;
        this.effectSiteConcentration = effectSiteConcentration;
    }
    
    get plasmaConcentrationString() {
        return this.plasmaConcentration.toFixed(3);
    }
    
    get effectSiteConcentrationString() {
        return this.effectSiteConcentration.toFixed(3);
    }
    
    formattedClockTime(patient) {
        const clockTime = patient.minutesToClockTime(this.timeInMinutes);
        return clockTime.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
}

// Simulation Result Class
class SimulationResultV3 {
    constructor(timePoints, patient = null, doseEvents = null, calculationMethod = "V3 Hybrid Engine", 
                calculatedAt = null, plasmaConcentrations = [], effectSiteConcentrations = [], timeVector = []) {
        this.timePoints = timePoints;
        this.patient = patient;
        this.doseEvents = doseEvents;
        this.calculationMethod = calculationMethod;
        this.calculatedAt = calculatedAt || new Date();
        this.plasmaConcentrations = plasmaConcentrations;
        this.effectSiteConcentrations = effectSiteConcentrations;
        this.timeVector = timeVector;
    }
    
    get maxPlasmaConcentration() {
        if (this.plasmaConcentrations.length > 0) {
            return Math.max(...this.plasmaConcentrations);
        }
        return Math.max(...this.timePoints.map(tp => tp.plasmaConcentration));
    }
    
    get maxEffectSiteConcentration() {
        if (this.effectSiteConcentrations.length > 0) {
            return Math.max(...this.effectSiteConcentrations);
        }
        return Math.max(...this.timePoints.map(tp => tp.effectSiteConcentration));
    }
    
    get simulationDurationMinutes() {
        return this.timePoints.length > 0 ? this.timePoints[this.timePoints.length - 1].timeInMinutes : 0;
    }
    
    toCSV() {
        if (!this.patient) {
            const csvLines = ["Time(min),Cp(ug/mL),Ce(ug/mL)"];
            
            for (const tp of this.timePoints) {
                const line = `${tp.timeInMinutes},${tp.plasmaConcentration.toFixed(3)},${tp.effectSiteConcentration.toFixed(3)}`;
                csvLines.push(line);
            }
            
            return csvLines.join("\n");
        }
        
        const csvLines = ["ClockTime,Time(min),Cp(ug/mL),Ce(ug/mL)"];
        
        for (const tp of this.timePoints) {
            const clockTime = tp.formattedClockTime(this.patient);
            const line = `${clockTime},${tp.timeInMinutes},${tp.plasmaConcentration.toFixed(3)},${tp.effectSiteConcentration.toFixed(3)}`;
            csvLines.push(line);
        }
        
        return csvLines.join("\n");
    }
}

// Plasma Calculation Result Class
class PlasmaCalculationResult {
    constructor(concentrations, infusionPlan) {
        this.concentrations = concentrations;
        this.infusionPlan = infusionPlan;
    }
}
export interface ResonanceAlert {
  type: "resonance";
  frequencyHz: number;
  message: string;
}

export class FeedbackDetector {
  private continuousFrames: number = 0;
  private peakBinIndex: number = -1;
  private readonly thresholdValue: number = 220; 
  private readonly framesThreshold: number = 6; 
  private readonly targetFreqMin: number = 1000;
  private readonly targetFreqMax: number = 5000;

  public analyze(dataArray: Uint8Array, sampleRate: number): ResonanceAlert | null {
    const nyquist = sampleRate / 2;
    const binCount = dataArray.length; 
    
    const minBin = Math.floor((this.targetFreqMin / nyquist) * binCount);
    const maxBin = Math.ceil((this.targetFreqMax / nyquist) * binCount);

    let foundHighEnergy = false;
    let localPeakBin = -1;
    let localPeakValue = 0;

    for (let i = minBin; i <= maxBin; i++) {
      if (dataArray[i] > this.thresholdValue) {
        foundHighEnergy = true;
        if (dataArray[i] > localPeakValue) {
          localPeakValue = dataArray[i];
          localPeakBin = i;
        }
      }
    }

    if (foundHighEnergy) {
      this.continuousFrames++;
      this.peakBinIndex = localPeakBin;
    } else {
      this.continuousFrames = 0;
      this.peakBinIndex = -1;
    }

    if (this.continuousFrames >= this.framesThreshold) {
      const freqHz = Math.round((this.peakBinIndex * nyquist) / binCount);
      this.continuousFrames = 0; 
      
      return {
        type: "resonance",
        frequencyHz: freqHz,
        message: `Pico continuo detectado cerca de los ${freqHz} Hz.`
      };
    }

    return null;
  }
}

// Matemática para Módulo de Dinámicas
export function calculateRMS(timeDomainData: Float32Array): number {
  let sumOfSquares = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sumOfSquares += timeDomainData[i] * timeDomainData[i];
  }
  const rms = Math.sqrt(sumOfSquares / timeDomainData.length);
  if (rms <= 0) return -96; // Piso de ruido digital
  const db = 20 * Math.log10(rms);
  return Math.max(-96, Math.min(0, db));
}

// ============================================
// FASE 2: MOTOR IA DE ENMASCARAMIENTO (MASKING)
// ============================================
export interface MaskingAlert {
  type: "masking";
  title: string;
  description: string;
  actionText: string;
  targetFreq?: number;
}

export class MaskingDetector {
  private continuousFrames: number = 0;
  private readonly thresholdValue: number = 200;
  private readonly targetFreqMin: number = 60;
  private readonly targetFreqMax: number = 250;
  private framesThreshold: number;

  constructor(fps: number = 60, secondsToTrigger: number = 2) {
    this.framesThreshold = fps * secondsToTrigger;
  }

  public analyze(freqData1: Uint8Array, freqData2: Uint8Array, sampleRate: number): MaskingAlert | null {
    if (freqData1.length !== freqData2.length) return null;
    
    const nyquist = sampleRate / 2;
    const binCount = freqData1.length;
    
    const minBin = Math.floor((this.targetFreqMin / nyquist) * binCount);
    const maxBin = Math.ceil((this.targetFreqMax / nyquist) * binCount);

    let maskingDetected = false;
    let collisionBin = -1;

    for (let i = minBin; i <= maxBin; i++) {
      if (freqData1[i] > this.thresholdValue && freqData2[i] > this.thresholdValue) {
        maskingDetected = true;
        collisionBin = i;
        break;
      }
    }

    if (maskingDetected) {
      this.continuousFrames++;
    } else {
      this.continuousFrames = 0;
    }

    if (this.continuousFrames >= this.framesThreshold) {
      const freqHz = Math.round((collisionBin * nyquist) / binCount);
      this.continuousFrames = 0; // reset prevent spam
      
      return {
        type: "masking",
        title: "Enmascaramiento Grave",
        description: `Choque de frecuencias detectado en ${freqHz}Hz entre canales. Sugerencia: HPF o corte paramétrico.`,
        actionText: "Aplicar Corte HPF",
        targetFreq: freqHz
      };
    }

    return null;
  }
}

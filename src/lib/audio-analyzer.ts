export interface ResonanceAlert {
  type: "resonance";
  frequencyHz: number;
  message: string;
}

export class FeedbackDetector {
  private continuousFrames: number = 0;
  private peakBinIndex: number = -1;
  // Umbral de amplitud. 220 es ~86% de 255.
  private readonly thresholdValue: number = 220; 
  // Nuestro throttler corre cada 15 frames (4 veces por segundo).
  // 1.5 segundos de continuidad = 6 ciclos consecutivos.
  private readonly framesThreshold: number = 6; 
  // Rango de frecuencias a observar (1kHz a 5kHz)
  private readonly targetFreqMin: number = 1000;
  private readonly targetFreqMax: number = 5000;

  /**
   * Analiza el buffer de frecuencias en búsqueda de feedback/resonancia.
   * Optimizado con iteraciones acotadas al rango de interés.
   */
  public analyze(dataArray: Uint8Array, sampleRate: number): ResonanceAlert | null {
    const nyquist = sampleRate / 2;
    const binCount = dataArray.length; 
    
    // Calcular los límites del array para no iterar los graves (ahorro CPU)
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
      // Si la energía cae, se reinicia el contador
      this.continuousFrames = 0;
      this.peakBinIndex = -1;
    }

    if (this.continuousFrames >= this.framesThreshold) {
      // Disparamos la alerta y reseteamos el contador para evitar spam excesivo
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

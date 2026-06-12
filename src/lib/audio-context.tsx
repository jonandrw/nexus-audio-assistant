import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface AudioEngineState {
  isListening: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  toggleListening: () => void;
  getFrequencyData: (dataArray: Uint8Array) => void;
  getTimeDomainData: (dataArray: Uint8Array) => void;
  getFloatTimeDomainData: (dataArray: Float32Array) => void;
  getSampleRate: () => number;
}

const AudioEngineContext = createContext<AudioEngineState | null>(null);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0 && selectedDeviceId === "default") {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("No se pudo acceder a los dispositivos de audio.", err);
      }
    }
    getDevices();
  }, [selectedDeviceId]);

  const toggleListening = async () => {
    if (isListening) {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioCtxRef.current) await audioCtxRef.current.close();
      sourceRef.current = null;
      audioCtxRef.current = null;
      analyserRef.current = null;
      setIsListening(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: selectedDeviceId !== "default" ? { exact: selectedDeviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        });

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        setIsListening(true);
      } catch (err) {
        console.error("Error al iniciar el motor de audio:", err);
      }
    }
  };

  const getFrequencyData = useCallback((dataArray: Uint8Array) => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArray as any);
    }
  }, []);

  const getTimeDomainData = useCallback((dataArray: Uint8Array) => {
    if (analyserRef.current) {
      analyserRef.current.getByteTimeDomainData(dataArray as any);
    }
  }, []);

  const getFloatTimeDomainData = useCallback((dataArray: Float32Array) => {
    if (analyserRef.current) {
      analyserRef.current.getFloatTimeDomainData(dataArray as any);
    }
  }, []);

  const getSampleRate = useCallback(() => {
    return audioCtxRef.current ? audioCtxRef.current.sampleRate : 48000;
  }, []);

  // Limpieza general
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <AudioEngineContext.Provider value={{
      isListening, devices, selectedDeviceId, setSelectedDeviceId, toggleListening, 
      getFrequencyData, getTimeDomainData, getFloatTimeDomainData, getSampleRate
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine() {
  const context = useContext(AudioEngineContext);
  if (!context) throw new Error("useAudioEngine must be used within an AudioEngineProvider");
  return context;
}

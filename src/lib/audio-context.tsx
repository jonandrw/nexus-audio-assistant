"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { FeedbackDetector, ResonanceAlert } from "./audio-analyzer";
import { toast } from "sonner";

interface AudioEngineState {
  isListening: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  toggleListening: () => void;
  getFrequencyData: (array: Uint8Array) => void;
  getTimeDomainData: (array: Uint8Array) => void;
  sampleRate: number;
}

const AudioEngineContext = createContext<AudioEngineState | null>(null);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const detectorRef = useRef<FeedbackDetector>(new FeedbackDetector());
  const aiIntervalRef = useRef<number | null>(null);

  const cleanAudioEngine = async () => {
    if (aiIntervalRef.current) window.clearInterval(aiIntervalRef.current);
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      await audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const getAudioDevices = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(t => t.stop());
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const inputs = deviceList.filter(d => d.kind === 'audioinput');
      setDevices(inputs);
      if (inputs.length > 0 && selectedDeviceId === "default") {
        setSelectedDeviceId(inputs[0].deviceId);
      }
    } catch (e) {
      toast.error("Error accessing audio devices. Please check permissions.");
    }
  };

  useEffect(() => {
    getAudioDevices();
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
  }, []);

  useEffect(() => {
    if (isListening) restartAudioEngine(selectedDeviceId);
  }, [selectedDeviceId]);

  const restartAudioEngine = async (deviceId: string) => {
    await cleanAudioEngine();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      // AI Analysis Loop independent of React UI
      aiIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current || !audioCtxRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const alert = detectorRef.current.analyze(data, audioCtxRef.current.sampleRate);
        if (alert) {
           window.dispatchEvent(new CustomEvent("nexus-ai-alert", { detail: alert }));
        }
      }, 250) as unknown as number;

    } catch (err) {
      toast.error("Hardware disconnected or in use.");
      setIsListening(false);
      await cleanAudioEngine();
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      await cleanAudioEngine();
      setIsListening(false);
    } else {
      setIsListening(true);
      await restartAudioEngine(selectedDeviceId);
    }
  };

  const getFrequencyData = (array: Uint8Array) => {
    if (analyserRef.current && isListening) analyserRef.current.getByteFrequencyData(array);
  };
  
  const getTimeDomainData = (array: Uint8Array) => {
    if (analyserRef.current && isListening) analyserRef.current.getByteTimeDomainData(array);
  };

  return (
    <AudioEngineContext.Provider value={{
      isListening, devices, selectedDeviceId, setSelectedDeviceId,
      toggleListening, getFrequencyData, getTimeDomainData,
      sampleRate: audioCtxRef.current?.sampleRate || 48000
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine() {
  const ctx = useContext(AudioEngineContext);
  if (!ctx) throw new Error("useAudioEngine must be used within AudioEngineProvider");
  return ctx;
}

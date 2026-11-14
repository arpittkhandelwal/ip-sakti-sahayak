// ============================================================
// IP-SAKTI Sahayak – VoiceRecorder (STT Loop)
// Connects browser MediaRecorder to /api/voice (Sarvam Saarika)
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import type { Language } from '../types';

interface Props {
  onTranscript: (text: string) => void;
  language: Language;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, language, disabled = false }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micSupported, setMicSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setMicSupported(false);
    }
    return () => {
      clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (disabled || isProcessing || !micSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await processAudio(audioBlob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Mic access error:', err);
      alert('Could not access microphone. Please grant browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string)?.split(',')[1];
        if (!base64Data) {
          setIsProcessing(false);
          return;
        }

        const res = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Data,
            language,
            action: 'stt',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.transcript && data.transcript.trim()) {
            onTranscript(data.transcript.trim());
          }
        }
        setIsProcessing(false);
      };
    } catch (err) {
      console.error('[VoiceRecorder] STT processing error:', err);
      setIsProcessing(false);
    }
  };

  if (!micSupported) return null;

  return (
    <div className="relative flex items-center">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="h-12 w-11 flex flex-col items-center justify-center rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md animate-pulse"
          title="Stop Recording"
        >
          <Square size={14} className="fill-white" />
          <span className="text-[9px] font-mono mt-0.5">{recordSeconds}s</span>
        </button>
      ) : isProcessing ? (
        <button
          type="button"
          disabled
          className="h-12 w-11 flex items-center justify-center rounded-xl bg-amber-500 text-white shadow-md cursor-wait"
          title="Transcribing voice..."
        >
          <Loader2 size={16} className="animate-spin" />
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="btn-secondary h-12 w-11 flex items-center justify-center p-0 text-slate-600 dark:text-slate-300 hover:text-ayush-800 dark:hover:text-emerald-400"
          title="Voice Inquiry (Sarvam Saarika STT)"
        >
          <Mic size={16} />
        </button>
      )}
    </div>
  );
}

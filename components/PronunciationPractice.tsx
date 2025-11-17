
import React, { useState, useCallback, useEffect } from 'react';
import { textToSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import Card from './common/Card';
import Button from './common/Button';

const PronunciationPractice: React.FC = () => {
  const [text, setText] = useState('Hello, world! How are you doing today?');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction to comply with browser policies
    const initAudio = () => {
      if (!audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(context);
      }
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      audioContext?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!text.trim()) {
      setError('Please enter some text to speak.');
      return;
    }
    if (!audioContext) {
        setError('Audio context not ready. Please click anywhere on the page first.');
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const base64Audio = await textToSpeech(text);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (err) {
      setError('Failed to generate audio. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [text, audioContext]);

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Pronunciation Practice</h2>
        <p className="text-slate-600 mb-4">Type a word or phrase and listen to its pronunciation.</p>
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text here..."
            className="w-full h-32 px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
          <div className="self-end">
            <Button onClick={handleSpeak} isLoading={isLoading} disabled={!text.trim() || !audioContext}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.18c-2.35 0-4.59 1.71-6.75 3.04a14.98 14.98 0 005.47 12.12" />
              </svg>
              Speak
            </Button>
          </div>
        </div>
      </div>
       {error && <div className="p-6 pt-0 text-red-600">{error}</div>}
    </Card>
  );
};

export default PronunciationPractice;

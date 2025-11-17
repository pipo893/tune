import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed `LiveSession` as it's not an exported member of the module.
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import Card from './common/Card';
import Button from './common/Button';

// Audio settings
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

const ConversationSimulator: React.FC = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<{ user: string[], model: string[] }>({ user: [], model: [] });

    // FIX: Replaced `LiveSession` with `any` for the ref's type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        
        setIsSessionActive(false);
        setIsConnecting(false);
    }, []);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        // Handle transcription
        if (message.serverContent?.inputTranscription) {
            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
        }
        if (message.serverContent?.outputTranscription) {
            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
        }

        if (message.serverContent?.turnComplete) {
            const finalUserInput = currentInputTranscriptionRef.current;
            const finalModelOutput = currentOutputTranscriptionRef.current;
            
            setTranscription(prev => ({
                user: [...prev.user, finalUserInput],
                model: [...prev.model, finalModelOutput]
            }));

            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }

        // Handle audio playback
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            
            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, OUTPUT_SAMPLE_RATE, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
            }
            audioSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
        }
    }, []);
    
    const startSession = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        setTranscription({ user: [], model: [] });
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        const processor = inputAudioContextRef.current!.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
                        scriptProcessorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: GenaiBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };

                            sessionPromiseRef.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        source.connect(processor);
                        processor.connect(inputAudioContextRef.current!.destination);

                        setIsConnecting(false);
                        setIsSessionActive(true);
                    },
                    onmessage: handleMessage,
                    onerror: (e: ErrorEvent) => {
                        console.error('Session Error:', e);
                        setError('An error occurred during the session.');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Session Closed:', e);
                        stopSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: "You are a friendly and patient English tutor. Have a natural conversation with the user to help them practice their English speaking skills. Keep your responses concise."
                },
            });

        } catch (err) {
            console.error('Failed to start session:', err);
            setError('Could not access microphone or start session. Please check permissions.');
            setIsConnecting(false);
        }
    }, [handleMessage, stopSession]);

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);
    
    return (
        <Card className="max-w-3xl mx-auto">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Conversation Simulator</h2>
                <p className="text-slate-600 mb-4">Practice your English speaking skills in a real-time conversation with an AI tutor.</p>
                <div className="flex justify-center my-4">
                    {!isSessionActive ? (
                        <Button onClick={startSession} isLoading={isConnecting}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            Start Conversation
                        </Button>
                    ) : (
                        <Button onClick={stopSession} variant="danger">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            Stop Conversation
                        </Button>
                    )}
                </div>
                 {error && <div className="mt-4 text-center text-red-600">{error}</div>}
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 min-h-[200px]">
                <h3 className="font-semibold text-slate-700 mb-2">Live Transcription</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto p-2 rounded-md bg-white">
                    {transcription.user.map((u, i) => (
                        <React.Fragment key={i}>
                            {u && <div className="text-right"><span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg inline-block">{u}</span></div>}
                            {transcription.model[i] && <div className="text-left"><span className="bg-slate-200 text-slate-800 p-2 rounded-lg inline-block">{transcription.model[i]}</span></div>}
                        </React.Fragment>
                    ))}
                    {!isSessionActive && transcription.user.length === 0 && (
                        <p className="text-slate-500 text-center py-8">Start the conversation to see the live transcription.</p>
                    )}
                     {isConnecting && (
                        <p className="text-slate-500 text-center py-8">Connecting...</p>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ConversationSimulator;
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';

export default function Tuner({ showToast }) {
    const [isListening, setIsListening] = useState(false);
    const [note, setNote] = useState('-');
    const [cents, setCents] = useState(0);
    const [frequency, setFrequency] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);

    const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    const getNote = (freq) => {
        const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
        const midi = Math.round(noteNum) + 69;
        return NOTE_STRINGS[midi % 12];
    };

    const getCents = (freq, note) => {
        if (note === '-') return 0;
        const noteIndex = NOTE_STRINGS.indexOf(note);
        if (noteIndex === -1) return 0;

        // Find octave
        // Rough estimate is enough for visual deviation
        // We calculate deviation from the nearest exact semitone
        const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
        const nearestNoteNum = Math.round(noteNum);
        const deviation = noteNum - nearestNoteNum;
        return Math.floor(deviation * 100);
    };

    const autoCorrelate = (buf, sampleRate) => {
        let SIZE = buf.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) {
            let val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return -1; // Not enough signal

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++)
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++)
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++)
            for (let j = 0; j < SIZE - i; j++)
                c[i] = c[i] + buf[j] * buf[j + i];

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    };

    const updatePitch = () => {
        if (!analyserRef.current) return;

        const buf = new Float32Array(2048);
        analyserRef.current.getFloatTimeDomainData(buf);
        const ac = autoCorrelate(buf, audioContextRef.current.sampleRate);

        if (ac !== -1) {
            const pitch = ac;
            const noteName = getNote(pitch);
            const deviation = getCents(pitch, noteName);

            setFrequency(Math.round(pitch));
            setNote(noteName);
            setCents(deviation);
        }

        requestRef.current = requestAnimationFrame(updatePitch);
    };

    const startListening = async () => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            setIsListening(true);
            updatePitch();
            if (showToast) showToast('Mikrofon aktif. Tınlat!', 'success');
        } catch (err) {
            console.error(err);
            if (showToast) showToast('Mikrofon izni gerekli!', 'error');
        }
    };

    const stopListening = () => {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        setIsListening(false);
        setNote('-');
        setFrequency(0);
        setCents(0);
    };

    useEffect(() => {
        return () => stopListening();
    }, []);

    // Visual Helpers
    const getNeedleRotation = () => {
        // Map cents -50 to +50 -> -45deg to +45deg
        // Clamp between -50 and 50
        const clampedCents = Math.max(-50, Math.min(50, cents));
        return (clampedCents / 50) * 45;
    };

    const getColor = () => {
        if (Math.abs(cents) < 5) return 'text-green-500';
        if (Math.abs(cents) < 20) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getBgColor = () => {
        if (Math.abs(cents) < 5) return 'bg-green-500';
        if (Math.abs(cents) < 20) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade-in">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Akort Aleti</h1>
            </div>

            {/* Meter Display */}
            <div className="relative w-72 h-40 bg-white rounded-t-full shadow-lg border-2 border-b-0 border-gray-100 flex items-end justify-center overflow-hidden mb-12">
                {/* Ticks */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-300 text-xs font-bold">0</div>
                <div className="absolute top-12 left-10 text-gray-300 text-xs font-bold transform -rotate-45">-50</div>
                <div className="absolute top-12 right-10 text-gray-300 text-xs font-bold transform rotate-45">+50</div>

                {/* Needle */}
                <div
                    className="absolute bottom-0 w-1 h-36 bg-gray-800 origin-bottom transition-transform duration-200 ease-out rounded-full z-10"
                    style={{ transform: `rotate(${isListening ? getNeedleRotation() : 0}deg)` }}
                >
                    <div className={`w-4 h-4 rounded-full absolute top-0 left-1/2 -translate-x-1/2 ${isListening ? getBgColor() : 'bg-gray-800'} shadow-sm`}></div>
                </div>

                {/* Center Pivot */}
                <div className="w-4 h-4 bg-gray-900 rounded-full absolute bottom-[-8px] z-20"></div>
            </div>

            {/* Note Display */}
            <div className="flex flex-col items-center justify-center w-40 h-40 rounded-full bg-white shadow-xl border-4 border-gray-50 mb-12 relative">
                {isListening ? (
                    <>
                        <div className={`text-6xl font-black ${getColor()} transition-colors`}>{note}</div>
                        <div className="text-gray-400 font-mono mt-2 text-lg">{frequency > 0 ? `${frequency} Hz` : '...'}</div>
                        <div className={`absolute -bottom-8 px-4 py-1 rounded-full text-white text-sm font-bold shadow-md ${getBgColor()}`}>
                            {cents > 0 ? `+${cents}` : cents} sent
                        </div>
                    </>
                ) : (
                    <div className="text-gray-300 text-sm font-medium">Hazır</div>
                )}
            </div>

            {/* Controls */}
            <button
                onClick={isListening ? stopListening : startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none ring-4 ring-offset-2 ${isListening
                    ? 'bg-red-50 text-red-500 ring-red-100'
                    : 'bg-ios-blue text-white ring-blue-100'
                    }`}
            >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <p className="mt-4 text-sm text-gray-400">
                {isListening ? 'Durdurmak için bas' : 'Başlamak için bas'}
            </p>
        </div>
    );
}

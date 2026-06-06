import React, { useRef, useState } from 'react';

interface DraggableValueProps {
    value: number;
    onChange: (val: number) => void;
    onComplete?: (val: number) => void;
    min: number;
    max: number;
    step?: number;
    format?: (val: number) => string;
    className?: string;
}

export function DraggableValue({ value, onChange, onComplete, min, max, step = 1, format, className }: DraggableValueProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startVal = useRef(value);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startVal.current = value;
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const deltaY = startY.current - e.clientY;
        // Sensitivity: 1 pixel = 1 step
        let newVal = startVal.current + (deltaY * step);
        newVal = Math.max(min, Math.min(max, newVal));
        onChange(newVal);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            (e.target as Element).releasePointerCapture(e.pointerId);
            if (onComplete) {
                onComplete(value);
            }
        }
    };

    return (
        <div 
            className={`cursor-ns-resize select-none ${isDragging ? 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : ''} ${className || ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Drag Up/Down to adjust"
        >
            {format ? format(value) : value.toFixed(1)}
        </div>
    );
}

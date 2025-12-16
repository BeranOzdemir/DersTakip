import React, { useState, useRef, useEffect } from 'react';

export default function PhotoCropper({ imageSrc, onCropComplete, onCancel }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Canvas Refs
    // Canvas Refs
    const imageRef = useRef(null);
    const canvasRef = useRef(null);

    // Initial Center
    useEffect(() => {
        // Reset when image changes
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [imageSrc]);

    // Manual Event Listener for non-passive touchmove
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scroll
            const clientX = e.touches[0].clientX;
            const clientY = e.touches[0].clientY;
            setPosition({
                x: clientX - dragStart.x,
                y: clientY - dragStart.y
            });
        };

        // Attach with passive: false
        container.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isDragging, dragStart]); // Re-attach when dependency changes to keep closure fresh

    // Mouse/Touch Handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        // Mouse move default doesn't need preventDefault usually for local drag unless it selects text
        e.preventDefault();
        const clientX = e.clientX;
        const clientY = e.clientY;
        setPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCrop = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        // Output size (200x200 for good quality avatar)
        canvas.width = 200;
        canvas.height = 200;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context for clipping
        ctx.save();

        // Circular mask
        ctx.beginPath();
        ctx.arc(100, 100, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Draw Image
        // We need to map the visual position to the canvas drawing
        // Visual Viewport is 200px (mask)
        // Image is scaled and translated relative to center

        // Calculate draw params
        // The logic below approximates the CSS visual transform to Canvas draw
        // CSS Transform center is by default center of element.
        // We rendered image centered in the 200px box.

        const size = 200; // Viewport size

        // Draw image relative to 100,100 center
        // Translate to center
        ctx.translate(100, 100);
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        // Draw image centered on origin
        // Need natural aspect ratio
        const aspect = img.naturalWidth / img.naturalHeight;
        let drawW, drawH;
        if (aspect > 1) {
            drawH = size;
            drawW = size * aspect;
        } else {
            drawW = size;
            drawH = size / aspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();

        // Export
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        onCropComplete(base64);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 animate-fade-in touch-none">
            <h3 className="text-white text-lg font-bold mb-6">Fotoğrafı Ayarla</h3>

            {/* Crop Area */}
            <div
                ref={containerRef}
                className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-white shadow-2xl bg-black cursor-move mb-6 touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown} // Keep React listener for start
                // onTouchMove removed here, handled by effect
                onTouchEnd={handleMouseUp}
            >
                {/* Image Container that gets moved */}
                <div
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <img
                        ref={imageRef}
                        src={imageSrc}
                        alt="Crop target"
                        className="max-w-none min-w-[200px] min-h-[200px] object-cover pointer-events-none select-none"
                        style={{
                            // We force the image to cover at least the circle by logic in JS or simple CSS?
                            // Let's rely on basic object-cover like behavior via flex center and size
                            height: '200px',
                            width: 'auto',
                            // Actually, for arbitrary aspect ratios, we want it large enough.
                            // Basic logic: fit height 200, width auto. Or max(w,h) = 200?
                            // Let's set height 200px and let width flow (or vice versa for portraits).
                            // Better: Set min-width/min-height to 100%??
                            // Let's stick to height 200px base for simplicity.
                        }}
                        // Fix for portrait images?
                        onLoad={(e) => {
                            const img = e.target;
                            if (img.naturalWidth < img.naturalHeight) {
                                img.style.width = '200px';
                                img.style.height = 'auto';
                            } else {
                                img.style.height = '200px';
                                img.style.width = 'auto';
                            }
                        }}
                    />
                </div>
            </div>

            {/* Scale Control */}
            <div className="w-full max-w-[240px] mb-8 px-4">
                <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-ios-blue h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Küçük</span>
                    <span>Büyük</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full max-w-[300px]">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                    Vazgeç
                </button>
                <button
                    onClick={handleCrop}
                    className="flex-1 bg-ios-blue text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform shadow-lg shadow-blue-500/30"
                >
                    Kaydet
                </button>
            </div>

            {/* Hidden Canvas for Processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

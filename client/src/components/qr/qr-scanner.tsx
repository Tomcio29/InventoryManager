import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
      }
    } catch (error) {
      onError("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  // Simulate QR code scanning for demo purposes
  // In a real app, you would use a QR code scanning library
  const simulateScan = () => {
    const mockQRCodes = [
      "E123456-2024",
      "T789012-2024", 
      "F345678-2024",
      "S901234-2024"
    ];
    const randomCode = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    onScan(randomCode);
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden h-64">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg">
                <div className="w-full h-full relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <CameraOff className="w-12 h-12 mx-auto mb-2" />
              <p>Camera not active</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        {isScanning ? (
          <>
            <Button onClick={simulateScan} className="flex-1 bg-green-600 hover:bg-green-700">
              Simulate Scan
            </Button>
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              <CameraOff className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </>
        ) : (
          <Button onClick={startCamera} className="w-full">
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Point the camera at a QR code to scan it automatically
      </div>
    </div>
  );
}

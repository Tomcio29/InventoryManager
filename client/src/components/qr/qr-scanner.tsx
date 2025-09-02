import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, CheckCircle } from "lucide-react";
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [lastScan, setLastScan] = useState<string>("");
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (qrScanner) {
        qrScanner.destroy();
      }
    };
  }, [qrScanner]);

  const startCamera = async () => {
    try {
      if (!videoRef.current) {
        onError("Video element not available");
        return;
      }

      // Check if QR scanner is supported
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        onError("No camera found on this device");
        return;
      }

      // Create QR scanner instance
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (result && result !== lastScan) {
            setLastScan(result);
            setScanSuccess(true);
            onScan(result);
            
            // Stop scanning after successful scan
            setTimeout(() => {
              setScanSuccess(false);
              scanner.stop();
              setIsScanning(false);
            }, 1500);
          }
        }
      );

      // Configure scanner options
      scanner.setGrayscaleWeights(77, 150, 29, false); // Optional: improve performance
      scanner.setInversionMode('both'); // Scan both normal and inverted QR codes

      // Set preferred camera to environment (back camera)
      try {
        const cameras = await QrScanner.listCameras(true);
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          await scanner.setCamera(backCamera.id);
        }
      } catch (e) {
        // Fallback to default camera if no back camera found
        console.log('Using default camera');
      }

      setQrScanner(scanner);
      await scanner.start();
      setIsScanning(true);
      
    } catch (error) {
      console.error('Camera start error:', error);
      onError("Failed to start camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (qrScanner) {
      qrScanner.stop();
      setIsScanning(false);
    }
  };

  // Simulate QR code scanning for demo/testing purposes
  const simulateScan = () => {
    const mockQRCodes = [
      "E123456-2024",
      "T789012-2024", 
      "F345678-2024",
      "S901234-2024"
    ];
    const randomCode = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    setLastScan(randomCode);
    setScanSuccess(true);
    onScan(randomCode);
    
    setTimeout(() => {
      setScanSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden h-64">
        {scanSuccess && (
          <div className="absolute inset-0 z-10 bg-green-500 bg-opacity-20 flex items-center justify-center">
            <div className="bg-white rounded-full p-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
        />
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <CameraOff className="w-12 h-12 mx-auto mb-2" />
              <p>Camera not active</p>
            </div>
          </div>
        )}

        {/* Scanning frame overlay */}
        {isScanning && !scanSuccess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg">
              <div className="w-full h-full relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
              </div>
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
        {isScanning 
          ? "Point the camera at a QR code to scan it automatically"
          : "Click 'Start Camera' to begin scanning QR codes"
        }
      </div>
      
      {lastScan && (
        <div className="text-xs text-green-600 text-center">
          Last scan: {lastScan}
        </div>
      )}
    </div>
  );
}

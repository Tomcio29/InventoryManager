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
  const debugIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (qrScanner) {
        qrScanner.destroy();
      }
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
      }
    };
  }, [qrScanner]);

  const startCamera = async () => {
    console.log('🎥 Starting camera...');
    
    try {
      if (!videoRef.current) {
        console.error('❌ Video element not found');
        onError("Video element not available");
        return;
      }

      // Check if QR scanner is supported
      const hasCamera = await QrScanner.hasCamera();
      console.log('📹 Camera available:', hasCamera);
      
      if (!hasCamera) {
        onError("No camera found on this device");
        return;
      }

      // Create QR scanner instance
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('🔍 QR Scanner callback triggered!');
          console.log('📱 Scanned result:', result);
          console.log('� Result type:', typeof result);
          console.log('�📋 Last scan was:', lastScan);
          
          // Extract text from result (handle both string and object types)
          const resultText = typeof result === 'string' ? result : result.data;
          console.log('📝 Extracted text:', resultText);
          
          if (resultText && resultText !== lastScan) {
            console.log('✅ New QR code detected:', resultText);
            
            setLastScan(resultText);
            setScanSuccess(true);
            onScan(resultText);
            
            // Stop scanning after successful scan
            setTimeout(() => {
              setScanSuccess(false);
              scanner.stop();
              setIsScanning(false);
            }, 1500);
          } else {
            console.log('❌ QR code ignored (empty or duplicate)');
          }
        },
        {
          maxScansPerSecond: 2,
          highlightScanRegion: false,
          highlightCodeOutline: false,
        }
      );

      // Configure scanner options (minimal for better compatibility)
      console.log('🔧 Scanner configured with minimal options');
      
      // Test if scanner is working by adding periodic scanning check
      const debugInterval = setInterval(() => {
        if (scanner && videoRef.current) {
          console.log('📊 Scanner status check - video dimensions:', 
            videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          console.log('📊 Scanner hasFlash:', scanner.hasFlash());
          console.log('📊 Video ready state:', videoRef.current.readyState);
          console.log('📊 Video src:', videoRef.current.src || 'no src');
        }
      }, 5000);
      
      debugIntervalRef.current = debugInterval;

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
      console.log('▶️ Starting QR scanner...');
      await scanner.start();
      console.log('✅ QR scanner started successfully!');
      setIsScanning(true);
      
    } catch (error) {
      console.error('❌ Camera start error:', error);
      onError("Failed to start camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (qrScanner) {
      qrScanner.stop();
      setIsScanning(false);
    }
  };

  // Test function to manually trigger a scan result
  const testScan = () => {
    console.log('🧪 Manual test scan triggered');
    const testResult = "I543860-2024";
    setLastScan(testResult);
    setScanSuccess(true);
    onScan(testResult);
    
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
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </Button>
            <Button onClick={testScan} variant="outline" className="flex-1 bg-yellow-100">
              🧪 Test Scan
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
          ? "Naceluj kamerę na kod QR. Możesz skanować kod QR z ekranu telefonu lub z wydruku."
          : "Kliknij 'Start Camera' aby rozpocząć skanowanie kodów QR"
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

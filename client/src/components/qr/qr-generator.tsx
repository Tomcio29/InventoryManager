import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { generateQRCode } from "@/lib/qr-utils";

interface QRGeneratorProps {
  value: string;
  assetName: string;
  assetId: string;
}

export function QRGenerator({ value, assetName, assetId }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      generateQRCode(value, canvasRef.current);
    }
  }, [value]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `qr-${assetId}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${assetId}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px;
                }
                .qr-container {
                  max-width: 400px;
                  margin: 0 auto;
                  border: 1px solid #ddd;
                  padding: 20px;
                  border-radius: 8px;
                }
                .qr-info {
                  margin-bottom: 20px;
                }
                canvas {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="qr-info">
                  <h2>${assetName}</h2>
                  <p><strong>Asset ID:</strong> ${assetId}</p>
                  <p><strong>QR Code:</strong> ${value}</p>
                </div>
                <img src="${canvasRef.current.toDataURL()}" alt="QR Code" />
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <canvas ref={canvasRef} className="mx-auto" />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{assetName}</h3>
        <p className="text-sm text-gray-600">Asset ID: {assetId}</p>
        <p className="text-xs text-gray-500">QR Content: {value}</p>
      </div>

      <div className="flex space-x-2">
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>
    </div>
  );
}

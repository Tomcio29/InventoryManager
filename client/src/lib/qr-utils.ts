// QR Code generation utility using a simple approach
// In a production app, you might want to use a library like qrcode

export function generateQRCode(text: string, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Set canvas size
  canvas.width = 200;
  canvas.height = 200;

  // Clear canvas
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 200, 200);

  // Generate a simple pattern based on the text
  // This is a simplified version - in production use a proper QR library
  const gridSize = 20;
  const cellSize = 200 / gridSize;
  
  // Create a hash-based pattern from the text
  const hash = simpleHash(text);
  
  ctx.fillStyle = "black";
  
  // Draw position markers (corners)
  drawPositionMarker(ctx, 0, 0, cellSize);
  drawPositionMarker(ctx, 13 * cellSize, 0, cellSize);
  drawPositionMarker(ctx, 0, 13 * cellSize, cellSize);
  
  // Fill pattern based on hash
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Skip position marker areas
      if (isPositionMarker(i, j)) continue;
      
      const index = i * gridSize + j;
      if ((hash >> (index % 32)) & 1) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function drawPositionMarker(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) {
  // Outer square
  ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
  
  // Inner white square
  ctx.fillStyle = "white";
  ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
  
  // Inner black square
  ctx.fillStyle = "black";
  ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
}

function isPositionMarker(i: number, j: number): boolean {
  return (
    (i < 9 && j < 9) ||
    (i < 9 && j > 10) ||
    (i > 10 && j < 9)
  );
}

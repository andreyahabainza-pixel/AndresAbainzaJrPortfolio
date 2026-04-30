import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Mode = "front" | "back"; // front = product name (AI), back = barcode (zxing)

interface ProductCameraCaptureProps {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onResult: (value: string) => void;
  onError?: (message: string) => void;
  /** Async function that takes a data URL (jpeg) and returns the recognized product name */
  identifyFromImage?: (dataUrl: string) => Promise<string>;
}

export const ProductCameraCapture = ({
  open,
  mode,
  onClose,
  onResult,
  onError,
  identifyFromImage,
}: ProductCameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError("");

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not available. Open this app in Chrome/Safari over HTTPS.");
        }
        if (!window.isSecureContext) {
          throw new Error("Camera requires HTTPS. Open this app in a direct https:// tab.");
        }
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to access camera.";
        setError(msg);
        onError?.(msg);
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, onError]);

  const capture = async () => {
    if (busy) return;
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError("Camera is still warming up. Try again.");
      return;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cropWidth = w * 0.8;
    const cropHeight = h * 0.3;
    const cropX = (w - cropWidth) / 2;
    const cropY = (h - cropHeight) / 2;
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    ctx.drawImage(
  video,
  cropX, cropY, cropWidth, cropHeight, // source (cropped)
  0, 0, cropWidth, cropHeight         // destination
);

    setBusy(true);
    try {
      if (mode === "front") {
        if (!identifyFromImage) {
          throw new Error("AI recognition unavailable.");
        }
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const name = await identifyFromImage(dataUrl);
        if (!name) throw new Error("Could not recognize the product. Try a clearer photo.");
        onResult(name);
        onClose();
      } else {
        // Decode barcode from captured frame using zxing
        const reader = new BrowserMultiFormatReader();
        try {
          const result = await reader.decodeFromCanvas(canvas);
          const code = result.getText();
          if (!code) throw new Error("No barcode detected.");
          onResult(code);
          onClose();
        } catch {
          throw new Error("No barcode detected. Hold steady, fill the frame, and try again.");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Capture failed.";
      setError(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "front" ? "Capture Product Front" : "Capture Product Barcode";
  const desc =
    mode === "front"
      ? "Center the product packaging in the frame, then tap the capture button. AI will read the product name."
      : "Center the barcode inside the box, fill most of the frame, then tap the capture button.";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> {title}
          </DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-md border border-border bg-black aspect-video">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {/* Guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {mode === "back" ? (
                <div className="flex h-1/3 w-4/5 items-center justify-center rounded-md border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <span className="rounded bg-background/80 px-2 py-1 text-xs font-medium text-foreground">
                    Align barcode inside the box
                  </span>
                </div>
              ) : (
                <div className="flex h-3/4 w-4/5 items-center justify-center rounded-md border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                  <span className="rounded bg-background/80 px-2 py-1 text-xs font-medium text-foreground">
                    Center the product packaging
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Capture (round) button */}
          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={capture}
              disabled={busy}
              aria-label="Capture"
              className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary bg-background transition-transform active:scale-95 disabled:opacity-50"
            >
              <span className="h-14 w-14 rounded-full bg-primary transition-colors group-hover:bg-primary/90" />
              {busy && (
                <Loader2 className="absolute h-8 w-8 animate-spin text-primary-foreground" />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {busy ? "Processing…" : "Tap the circle to capture"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCameraCapture;

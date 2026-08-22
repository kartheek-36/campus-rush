import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Square } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { adminBookingService } from '../../services/adminBookingService';

interface AdminQrScannerProps {
  onScan?: (token: string) => void;
}

const cameraErrorMessage = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  if (import.meta.env.DEV) console.debug('Camera initialization error name:', name || 'Unknown');
  switch (name) {
    case 'NotSupportedError': return 'Camera access is not supported by this browser.';
    case 'NotAllowedError': return 'Camera permission was denied. Please allow camera access in your browser settings.';
    case 'NotFoundError': return 'No camera was found on this device.';
    case 'NotReadableError': return 'The camera is currently being used by another application.';
    case 'SecurityError': return 'Camera access is blocked by the browser security settings.';
    default: return 'Unable to start the camera. Please try again.';
  }
};

export const AdminQrScanner: React.FC<AdminQrScannerProps> = ({ onScan }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedMessage, setVerifiedMessage] = useState<string | null>(null);

  const cleanup = async () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const scanner = scannerRef.current;
    if (scanner) {
      if (scanner.isScanning) await scanner.stop().catch(() => undefined);
      scanner.clear();
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => () => { void cleanup(); }, []);

  const verifyToken = async (qrToken: string) => {
    const result = onScan ? await onScan(qrToken) : await adminBookingService.verifyScannedToken(qrToken);
    setVerifiedMessage(typeof result === 'object' && result ? `Check-in successful: ${result.facility}` : 'Check-in successful');
  };

  const startScanner = async () => {
    setError(null); setVerifiedMessage(null); await cleanup();
    if (import.meta.env.DEV) console.debug('camera API available:', Boolean(navigator.mediaDevices), 'secure context:', window.isSecureContext);
    if (!window.isSecureContext) { setError('Camera access requires a secure connection.'); return; }
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) { setError('Camera access is not supported in this browser.'); return; }
    try {
      let permissionStream: MediaStream;
      try {
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch (environmentError) {
        const name = environmentError instanceof DOMException ? environmentError.name : '';
        if (!['NotFoundError', 'OverconstrainedError'].includes(name)) throw environmentError;
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = permissionStream;
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
      const cameraSource: string | MediaTrackConstraints = devices.find((device) => /back|rear|environment/i.test(device.label))?.deviceId || devices[0]?.deviceId || { facingMode: { ideal: 'environment' } };
      permissionStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const scanner = new Html5Qrcode('admin-qr-reader');
      scannerRef.current = scanner;
      setIsScanning(true);
      await scanner.start(cameraSource, { fps: 10, qrbox: { width: 180, height: 180 } }, (decodedText) => {
        void verifyToken(decodedText).catch((scanError) => setError(scanError instanceof Error ? scanError.message : 'Unable to verify scanned QR.')).finally(() => { void cleanup(); });
      }, () => undefined);
    } catch (scanError) {
      await cleanup();
      setError(cameraErrorMessage(scanError));
    }
  };

  return <div className="space-y-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void (isScanning ? cleanup() : startScanner())} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{isScanning ? <Square className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}{isScanning ? 'Close Scanner' : 'Open Camera'}</button>{error && <button type="button" onClick={() => void startScanner()} className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Try Again</button>}</div>{!isScanning && !error && <p className="text-xs text-slate-500">Ready to scan</p>}{isScanning && <p className="text-xs text-slate-500">Point the camera at the student&apos;s QR code.</p>}<div id="admin-qr-reader" className={isScanning ? 'w-full max-w-sm overflow-hidden rounded-xl' : 'hidden'} />{error && <p className="text-xs text-amber-700" role="alert">{error}</p>}{verifiedMessage && <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />{verifiedMessage}</p>}</div>;
};
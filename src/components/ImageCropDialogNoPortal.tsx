import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { DialogNoPortal as Dialog, DialogNoPortalContent as DialogContent, DialogNoPortalHeader as DialogHeader, DialogNoPortalTitle as DialogTitle, DialogNoPortalFooter as DialogFooter } from '@/components/ui/dialog-no-portal';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomOut, RotateCw, Sun, Sliders, Palette, FlipHorizontal, FlipVertical, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageCropDialogNoPortalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CroppedAreaPixels = Area;

export default function ImageCropDialogNoPortal({ open, onClose, imageSrc, onCropComplete }: ImageCropDialogNoPortalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CroppedAreaPixels,
    rotation = 0,
    brightness = 100,
    contrast = 100,
    saturation = 100,
    flipH = false,
    flipV = false
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply flips
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const imageData = ctx.getImageData(0, 0, safeArea, safeArea);
    const data = imageData.data;

    // Apply brightness, contrast, and saturation filters
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply brightness
      r = (r * brightness) / 100;
      g = (g * brightness) / 100;
      b = (b * brightness) / 100;

      // Apply contrast
      r = ((r - 128) * contrast / 100) + 128;
      g = ((g - 128) * contrast / 100) + 128;
      b = ((b - 128) * contrast / 100) + 128;

      // Apply saturation
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = Math.round(gray + (r - gray) * saturation / 100);
      g = Math.round(gray + (g - gray) * saturation / 100);
      b = Math.round(gray + (b - gray) * saturation / 100);

      // Clamp values
      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) throw new Error('No 2d context');

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg');
    });
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        brightness,
        contrast,
        saturation,
        flipH,
        flipV
      );
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFlipH(false);
    setFlipV(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle>Edit Image</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="ml-auto"
            disabled={processing}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </DialogHeader>
        
        <div className="relative h-[350px] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center" style={{
          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <Tabs defaultValue="crop" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crop">Crop & Rotate</TabsTrigger>
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="flip">Transform</TabsTrigger>
          </TabsList>

          {/* Crop & Rotate Tab */}
          <TabsContent value="crop" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4" />
                  Zoom
                </Label>
                <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation
                </Label>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          {/* Adjust Tab */}
          <TabsContent value="adjust" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brightness
                </Label>
                <span className="text-sm text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={(value) => setBrightness(value[0])}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Contrast
                </Label>
                <span className="text-sm text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={(value) => setContrast(value[0])}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Saturation
                </Label>
                <span className="text-sm text-muted-foreground">{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={(value) => setSaturation(value[0])}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          {/* Transform Tab */}
          <TabsContent value="flip" className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={flipH ? 'default' : 'outline'}
                onClick={() => setFlipH(!flipH)}
                disabled={processing}
                className="flex-1"
              >
                <FlipHorizontal className="h-4 w-4 mr-2" />
                Flip Horizontal
              </Button>
              <Button
                variant={flipV ? 'default' : 'outline'}
                onClick={() => setFlipV(!flipV)}
                disabled={processing}
                className="flex-1"
              >
                <FlipVertical className="h-4 w-4 mr-2" />
                Flip Vertical
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={processing} className="bg-gradient-to-r from-orange-500 to-amber-500">
            {processing ? 'Processing...' : 'Apply & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

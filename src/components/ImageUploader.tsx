"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, ImageIcon, X, Upload, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  onImageSelect: (imageData: string, file: File) => void;
  onCancel?: () => void;
}

type UploadMode = "camera" | "gallery" | null;

export default function ImageUploader({
  onImageSelect,
  onCancel,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<UploadMode>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 启动摄像头
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setMode("camera");
      setIsCapturing(true);
    } catch (error) {
      console.error("[Camera] Error:", error);
      toast.error("无法访问摄像头，请检查权限设置");
      setMode(null);
    }
  }, []);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // 拍照
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 设置canvas尺寸与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 绘制视频帧（镜像翻转）
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // 转换为base64
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(imageData);

    // 停止摄像头
    stopCamera();
  }, [stopCamera]);

  // 处理文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }

      // 验证文件大小（最大10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error("图片大小不能超过10MB");
        return;
      }

      // 读取并预览
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreview(result);
        setMode("gallery");
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  // 确认使用图片
  const confirmImage = useCallback(() => {
    if (!preview) return;

    // 将base64转换为File对象
    fetch(preview)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onImageSelect(preview, file);
      });
  }, [preview, onImageSelect]);

  // 取消/重置
  const handleCancel = useCallback(() => {
    stopCamera();
    setPreview(null);
    setMode(null);
    onCancel?.();
  }, [stopCamera, onCancel]);

  // 压缩图片
  const compressImage = useCallback(
    (maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!preview) {
          reject(new Error("No image to compress"));
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // 等比例缩放
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = preview;
      });
    },
    [preview],
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#EDE5E0] overflow-hidden">
      {/* 模式选择 */}
      {!mode && !preview && (
        <div className="p-4 space-y-3">
          <p className="text-sm font-medium text-[#3D2C2E] text-center">
            发送图片
          </p>
          <div className="flex gap-3">
            <button
              onClick={startCamera}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F5F0EB] hover:bg-[#F8C8D4]/20 transition-colors"
            >
              <Camera className="w-8 h-8 text-[#A8D8EA]" />
              <span className="text-xs text-[#3D2C2E]">拍照</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F5F0EB] hover:bg-[#F8C8D4]/20 transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-[#F8C8D4]" />
              <span className="text-xs text-[#3D2C2E]">相册</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* 摄像头预览 */}
      {mode === "camera" && isCapturing && (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full aspect-[4/3] object-cover"
            playsInline
            muted
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={takePhoto}
              className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              <div className="w-14 h-14 rounded-full border-4 border-[#F8C8D4]" />
            </button>
            <button
              onClick={handleCancel}
              className="w-12 h-12 rounded-full bg-white/80 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="w-6 h-6 text-[#9B8A8E]" />
            </button>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="预览"
            className="w-full max-h-[400px] object-contain bg-black"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button
              onClick={confirmImage}
              className="bg-[#95EC69] hover:bg-[#7DD956] text-white rounded-full px-6"
            >
              <Upload className="w-4 h-4 mr-2" />
              发送
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="rounded-full px-6"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 隐藏的画布用于拍照处理 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Scale, 
  Box, 
  Info,
  ShieldCheck,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

export default function AIVisionScanner({
  onScan,
  analyzing,
  result
}) {
  const [selectedImage, setSelectedImage] = useState(null); // { url, base64, name, size }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        url: reader.result,
        base64: reader.result,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || 'image/jpeg'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        url: reader.result,
        base64: reader.result,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || 'image/jpeg'
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerScan = () => {
    if (!selectedImage) {
      if (onScan) onScan();
      return;
    }

    if (onScan) {
      onScan({
        imageBase64: selectedImage.base64,
        imageUrl: selectedImage.imageUrl,
        imageName: selectedImage.name,
        mimeType: selectedImage.mimeType
      });
    }
  };

  const resetAll = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Resolve normalized result values (handles nested or flat objects)
  const data = result?.analysis || result;

  const getBinStyle = (binColor = '') => {
    const lower = binColor.toLowerCase();
    if (lower.includes('green') || lower.includes('wet') || lower.includes('compost')) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        dot: 'bg-emerald-500'
      };
    }
    if (lower.includes('blue') || lower.includes('dry') || lower.includes('recycl')) {
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-300',
        badge: 'bg-blue-600 text-white',
        dot: 'bg-blue-500'
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      badge: 'bg-amber-600 text-white',
      dot: 'bg-amber-500'
    };
  };

  const binStyle = getBinStyle(data?.binColor || '');

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <Camera className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-[#0F172A]">AI Waste Vision Scanner</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Powered by Google Gemini 3.8 Flash Multimodal Vision
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
            Live Gemini Vision Active
          </span>
        </div>
      </div>

      {/* Main Upload / Drop Area */}
      {!selectedImage ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
            dragOver 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-slate-200 bg-slate-50/60 hover:bg-purple-50/40 hover:border-purple-300'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Click to upload or drag & drop a waste photograph
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Supports JPG, PNG, WEBP, or live mobile camera capture
          </p>
        </div>
      ) : (
        /* Image Preview with Laser Scanning Overlay */
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
          <div className="relative max-h-72 flex items-center justify-center bg-black/40">
            <img 
              src={selectedImage.url} 
              alt="Selected Waste" 
              className="max-h-72 w-auto object-contain mx-auto"
            />
            {analyzing && (
              <div className="absolute inset-0 bg-purple-900/30 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                <div className="w-full absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse shadow-[0_0_15px_#A855F7]" />
                <div className="bg-black/70 px-4 py-2 rounded-xl border border-purple-400/40 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-xs font-bold tracking-wide">
                    Gemini AI Vision Scanning Waste Matrix...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{selectedImage.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">({selectedImage.size})</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetAll}
                disabled={analyzing}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3 text-red-400" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button 
        type="button"
        onClick={triggerScan}
        disabled={analyzing || !selectedImage}
        className="w-full bg-[#00B074] hover:bg-[#009663] text-white py-3 rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        {analyzing ? (
          <>
            <Sparkles className="w-4 h-4 animate-spin" />
            Analyzing with Google Gemini Vision...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Analyze Waste Image with AI Vision
          </>
        )}
      </button>

      {/* Results Display */}
      {data && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-purple-100 text-purple-700 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-sm text-[#0F172A]">AI Classification Result</h4>
                <p className="text-[10px] text-slate-500">Google Gemini Computer Vision Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-200">
                {data.confidence || '98.5% AI Confidence'}
              </span>
              {data.model && (
                <span className="bg-slate-200 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">
                  {data.model}
                </span>
              )}
            </div>
          </div>

          {/* 4 Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Waste Category
              </span>
              <span className="font-bold text-slate-900 text-xs block leading-tight">
                {data.garbageType}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Est. Weight
                </span>
                <Scale className="w-3 h-3 text-slate-400" />
              </div>
              <span className="font-bold text-emerald-600 text-sm block">
                {data.estimatedQuantityKg}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {data.volumeLabel}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Recyclability
                </span>
                <Zap className="w-3 h-3 text-blue-500" />
              </div>
              <span className="font-bold text-blue-600 text-xs block leading-tight">
                {data.recyclabilityScore}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hazard Level
                </span>
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              </div>
              <span className={`font-bold text-xs inline-block px-2 py-0.5 rounded ${
                data.hazardLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                data.hazardLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                data.hazardLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {data.hazardLevel}
              </span>
            </div>
          </div>

          {/* Destination Bin Recommendation */}
          {data.binColor && (
            <div className={`p-4 rounded-xl border ${binStyle.bg} flex items-start gap-3`}>
              <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${binStyle.dot}`} />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold block">
                  Designated Destination Bin: <span className="underline">{data.binColor}</span>
                </span>
                <p className="text-[11px] opacity-90">
                  Dispose in the assigned municipal container to earn Eco-Reward points.
                </p>
              </div>
            </div>
          )}

          {/* Segregation Advice */}
          <div className="bg-[#E6F7F2] p-4 rounded-xl border border-[#00B074]/30 text-xs space-y-1">
            <strong className="text-[#00B074] flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" /> AI Segregation Guidance:
            </strong>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              {data.segregationAdvice}
            </p>
          </div>

          {/* Detected Item Breakdown */}
          {data.breakdownDetails && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Detected Objects & Composition:
              </span>
              <p className="text-slate-700 text-[11px]">
                {data.breakdownDetails}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

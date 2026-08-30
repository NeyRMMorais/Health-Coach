import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, Paperclip, Image as ImageIcon, Trash2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackData: { type: 'bug' | 'improvement'; text: string; imageBase64?: string }) => Promise<void>;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'improvement'>('bug');
  const [text, setText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress image to reasonable resolution/size for Firestore
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setSelectedImage(compressedDataUrl);
          setError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (text.length > 2000) {
      setError('Description cannot exceed 2000 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload: { type: 'bug' | 'improvement'; text: string; imageBase64?: string } = {
        type,
        text: text.trim(),
      };
      if (selectedImage) {
        payload.imageBase64 = selectedImage;
      }
      await onSubmit(payload);
      setSuccess(true);
      setText('');
      setSelectedImage(null);
      // Auto close after 2.5s
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      let message = err?.message || 'Failed to submit feedback. Please try again.';
      try {
        const parsed = JSON.parse(message);
        if (parsed.error) {
          message = parsed.error;
        }
      } catch {
        // use message as is
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setSuccess(false);
    setSelectedImage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10 my-6"
          >
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <MessageSquare className="h-5 w-5 text-emerald-600 animate-pulse" />
                <span>Submit Feedback</span>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center space-y-4"
                >
                  <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-800">Thank You!</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Your feedback has been successfully submitted. We appreciate your help in improving Health Coach!
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error banner */}
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Feedback Type Toggle */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Feedback Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setType('bug')}
                        className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                          type === 'bug'
                            ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        🐛 Bug Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('improvement')}
                        className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                          type === 'improvement'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        💡 Improvement
                      </button>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Description
                      </label>
                      <span className={`text-[10px] font-bold ${text.length > 2000 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {text.length}/2000
                      </span>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={
                        type === 'bug'
                          ? 'Describe the issue, what happened, and how to reproduce it...'
                          : 'Describe your feature request or suggestion for improvement...'
                      }
                      rows={4}
                      required
                      maxLength={2050}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Image Attachment Section */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Screenshot / Image (Optional)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {selectedImage ? (
                      <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
                        <img
                          src={selectedImage}
                          alt="Feedback Attachment"
                          className="w-full max-h-48 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-600 text-white rounded-lg transition-colors shadow"
                          title="Remove attached image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl text-xs font-semibold text-slate-500 hover:text-emerald-700 transition flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                        <span>Click to attach screenshot or photo</span>
                      </button>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-medium transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !text.trim()}
                      className="px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

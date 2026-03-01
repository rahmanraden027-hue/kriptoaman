import React, { useState } from 'react';
import { Star, X, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

const FEEDBACK_REASONS = {
  positive: [
    { id: 'fast', label: 'Transaksi Cepat' },
    { id: 'smooth', label: 'Proses Lancar' },
    { id: 'clear', label: 'Interface Jelas' },
  ],
  negative: [
    { id: 'slow', label: 'Transaksi Lambat' },
    { id: 'confusing', label: 'Interface Membingungkan' },
    { id: 'error', label: 'Terjadi Error' },
    { id: 'fee', label: 'Biaya Terlalu Tinggi' },
  ],
};

export default function TransactionFeedback({ transactionId, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [sentiment, setSentiment] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRating = (stars) => {
    setRating(stars);
    setSentiment(stars >= 4 ? 'positive' : stars <= 2 ? 'negative' : null);
  };

  const toggleReason = (reasonId) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId) ? prev.filter(r => r !== reasonId) : [...prev, reasonId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Pilih rating terlebih dahulu');
      return;
    }

    setSubmitting(true);
    const feedback = {
      transactionId,
      rating,
      sentiment,
      reasons: selectedReasons,
      comment: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    // Store in localStorage
    const stored = JSON.parse(localStorage.getItem('transaction_feedbacks') || '[]');
    stored.push(feedback);
    localStorage.setItem('transaction_feedbacks', JSON.stringify(stored));

    if (onSubmit) {
      await onSubmit(feedback);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose?.();
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
              <ThumbsUp className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Terima Kasih!</h2>
            <p className="text-slate-400 text-sm mt-2">Feedback Anda sangat membantu kami</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold">Beri Rating</h2>
            <p className="text-slate-400 text-xs mt-1">Transaksi #{transactionId?.slice(-4)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Star Rating */}
        <div className="space-y-3">
          <p className="text-white text-sm font-semibold">Berapa rating untuk transaksi ini?</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    rating >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-slate-400 text-xs">
              {rating === 1 && 'Sangat Buruk'}
              {rating === 2 && 'Buruk'}
              {rating === 3 && 'Biasa Saja'}
              {rating === 4 && 'Bagus'}
              {rating === 5 && 'Sangat Bagus'}
            </p>
          )}
        </div>

        {/* Sentiment Buttons */}
        {rating > 0 && (
          <div className="space-y-3">
            <p className="text-white text-sm font-semibold">Apa yang Anda pikirkan?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSentiment('positive')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                  sentiment === 'positive'
                    ? 'bg-green-600/20 border-green-500 text-green-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-semibold">Suka</span>
              </button>
              <button
                onClick={() => setSentiment('negative')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all ${
                  sentiment === 'negative'
                    ? 'bg-red-600/20 border-red-500 text-red-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-xs font-semibold">Kurang</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Reasons */}
        {sentiment && (
          <div className="space-y-3">
            <p className="text-white text-sm font-semibold">Alasan (pilih yang relevan):</p>
            <div className="space-y-2">
              {FEEDBACK_REASONS[sentiment]?.map(reason => (
                <button
                  key={reason.id}
                  onClick={() => toggleReason(reason.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selectedReasons.includes(reason.id)
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border transition-all ${
                      selectedReasons.includes(reason.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {selectedReasons.includes(reason.id) && (
                      <span className="text-white text-[10px] flex items-center justify-center h-full">✓</span>
                    )}
                  </div>
                  <span className="text-white text-sm">{reason.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {sentiment && (
          <div className="space-y-2">
            <p className="text-white text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Komentar tambahan (opsional)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagikan pengalaman Anda..."
              maxLength={200}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
              rows="3"
            />
            <p className="text-slate-500 text-[10px] text-right">{comment.length}/200</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg px-4 py-2.5 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Feedback'
          )}
        </button>
      </div>
    </div>
  );
}
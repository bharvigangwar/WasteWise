'use client';

/**
 * Waste Contribution Upload Page
 * Allows citizens to select a waste category, choose or capture an image,
 * preview it, and submit it for automatic AI classification and Green Coin rewards.
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';

const CATEGORIES = [
  {
    id: 'wet',
    name: 'Wet Waste',
    icon: '🍎',
    examples: 'Food scraps, fruit & vegetable peels, tea bags, leftover food',
  },
  {
    id: 'dry',
    name: 'Dry Waste',
    icon: '📦',
    examples: 'Cardboard, clean paper, dry non-recyclable packing materials',
  },
  {
    id: 'recyclable',
    name: 'Recyclable',
    icon: '♻️',
    examples: 'Plastic bottles, aluminium cans, beverage tins, clean glass',
  },
  {
    id: 'ewaste',
    name: 'E-Waste',
    icon: '🔋',
    examples: 'Old cables, batteries, broken headphones, discarded chargers',
  },
  {
    id: 'hazardous',
    name: 'Hazardous',
    icon: '⚠️',
    examples: 'Medicines, chemical bottles, paint, syringes, sanitizers',
  },
];

export default function UploadPage() {
  const fileInputRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState('wet');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  /**
   * Handles image selection from file input.
   * Validates size (max 5 MB) and sets preview URL.
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setErrorMessage('');
    setResult(null);

    if (!file) return;

    // Validate 5 MB max size
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be smaller than 5 MB.');
      return;
    }

    // Validate image format
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMessage('Please upload a valid JPG, PNG, or WebP image.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /**
   * Clears the current selection so the user can pick a different photo.
   */
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Submits the multipart/form-data payload to POST /api/contributions.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResult(null);

    if (!selectedFile) {
      setErrorMessage('Please choose a photo of your segregated waste first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('declaredCategory', selectedCategory);

      const res = await api.post('/contributions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success && res.data?.data?.contribution) {
        setResult(res.data.data.contribution);
      } else {
        setErrorMessage('Unexpected response format received from server.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to upload waste photo. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 uppercase tracking-wider inline-flex items-center gap-1 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Upload Segregated Waste
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Choose your declared waste category, snap or upload a clear photo, and earn Green Coins.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Submission Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* AI Result Card */}
        {result && (
          <div className="mb-8 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🤖</span> AI Verification Verdict
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : result.status === 'pending_review'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.status === 'approved' && '✓ Approved'}
                {result.status === 'pending_review' && '⏳ Under Review'}
                {result.status === 'rejected' && '✕ Rejected'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 text-center">
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-xs uppercase text-gray-500 font-semibold block">Declared</span>
                <span className="text-lg font-bold text-gray-900 capitalize">
                  {result.declaredCategory}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-xs uppercase text-gray-500 font-semibold block">AI Detected</span>
                <span className="text-lg font-bold text-gray-900 capitalize">
                  {result.aiCategory}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-xs uppercase text-gray-500 font-semibold block">AI Confidence</span>
                <span className="text-lg font-bold text-emerald-600">
                  {Math.round((result.confidence || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* AI Reasoning */}
            {result.aiReason && (
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 mb-6">
                <span className="font-semibold block text-slate-900 mb-1">AI Observation:</span>
                {result.aiReason}
              </div>
            )}

            {/* Coins Earned */}
            {result.status === 'approved' ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <span className="text-xs text-emerald-800 uppercase font-bold tracking-wide">Coins Awarded</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                  +{result.coinsAwarded} Green Coins 🪙
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  Deposited into your account ledger!
                </p>
              </div>
            ) : result.status === 'pending_review' ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center text-xs text-amber-800">
                Confidence is borderline or requires human verification. An administrator will review your contribution shortly.
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center text-xs text-red-800">
                The image could not be verified as segregated {result.declaredCategory} waste. No coins awarded.
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleReset}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Upload Another Photo
              </button>
              <Link
                href="/dashboard"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
            {/* Step 1: Waste Category Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                1. Select Declared Waste Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl text-left border transition flex flex-col justify-between ${
                      selectedCategory === cat.id
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="font-bold text-sm text-gray-900">{cat.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed">{cat.examples}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Image Selection and Preview */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                2. Choose or Capture Waste Photo (Max 5 MB)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="waste-image-input"
              />

              {!previewUrl ? (
                <label
                  htmlFor="waste-image-input"
                  className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50/50 hover:bg-emerald-50/30"
                >
                  <div className="text-4xl mb-3">📷</div>
                  <p className="font-semibold text-sm text-gray-800">
                    Click to select photo or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports JPG, PNG, and WebP (Max: 5 MB)
                  </p>
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black/5 flex flex-col items-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected waste preview"
                    className="max-h-72 rounded-xl object-contain shadow-xs"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-semibold bg-red-50 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Submission Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Photos are analyzed in real time with Google Gemini Vision.
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm disabled:opacity-50 transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Classifying with AI...</span>
                  </>
                ) : (
                  <span>Submit for Verification →</span>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </ProtectedRoute>
  );
}

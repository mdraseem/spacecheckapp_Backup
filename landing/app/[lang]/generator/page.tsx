'use client';

import React, { useState, useRef } from 'react'; // Removed useEffect since not used, and Head moved to layout
import QRCode from 'qrcode.js';
import Link from 'next/link';

// Placeholder for dictionary type
type GeneratorDictionary = {
  headerTitle: string;
  headerSubtitle: string;
  formTitle: string;
  formDesc: string;
  productNameLabel: string;
  productNamePlaceholder: string;
  modelPathLabel: string;
  modelPathPlaceholder: string;
  modelPathSmallText: string;
  widthLabel: string;
  heightLabel: string;
  depthLabel: string;
  generateBtn: string;
  resultTitle: string;
  marketingTitle: string;
  marketingSubtitle: string;
  marketingArVis: string;
  downloadBtn: string;
  copyLinkBtn: string;
  printBtn: string;
  generatedData: string;
  resetBtn: string;
  footerText: string;
  footerSubtext: string;
  toastCopied: string;
  toastFailed: string;
  toastModelPathRequired: string;
  toastModelPathFormat: string;
};

interface GeneratorPageProps {
  dict: GeneratorDictionary;
  lang: string; // Lang will be passed from the server layout
}

export default function GeneratorPage({ dict, lang }: GeneratorPageProps) {
  const [productName, setProductName] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [depth, setDepth] = useState(100);
  const [viewerUrl, setViewerUrl] = useState('');
  const [showResult, setShowResult] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Helper to show toast messages
  const showToast = (message: string) => {
    // In a real app, you'd use a proper toast component.
    // For now, let's just log and maybe do a simple alert or console.log.
    alert(message);
    console.log('Toast:', message);
  };

  const generateQR = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!modelPath) {
      showToast(dict.toastModelPathRequired);
      return;
    }

    if (!modelPath.toLowerCase().endsWith('.glb')) {
      showToast(dict.toastModelPathFormat);
      return;
    }

    // Construct the viewer URL
    const path = window.location.origin; // Using origin for base path
    const encodedName = encodeURIComponent(productName);
    const encodedModel = encodeURIComponent(modelPath);
    const generatedViewerUrl = `${path}/viewer.html?model=${encodedModel}&name=${encodedName}`;
    setViewerUrl(generatedViewerUrl);

    // Clear previous QR and generate new one
    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = '';
      new QRCode(qrCodeRef.current, {
        text: generatedViewerUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });
      qrCodeRef.current.dataset.link = generatedViewerUrl; // Store link for copy
    }

    setShowResult(true);
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    setProductName('');
    setModelPath('');
    setWidth(100);
    setHeight(100);
    setDepth(100);
    setViewerUrl('');
    setShowResult(false);
    if (qrCodeRef.current) {
      qrCodeRef.current.innerHTML = '';
    }
    window.scrollTo(0, 0);
  };

  const downloadMarketingCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showToast(dict.toastFailed); // Or a specific error message for canvas context
      return;
    }
    const imgElement = qrCodeRef.current?.querySelector('img');

    const cardWidth = 600;
    const cardHeight = 800;

    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Draw header color strip
    const gradient = ctx.createLinearGradient(0, 0, cardWidth, 0);
    gradient.addColorStop(0, '#1a3a52');
    gradient.addColorStop(1, '#208a93');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardWidth, 20);

    // Text configuration
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a3a52'; // Primary color

    // Draw title (split into two lines if it contains ":")
    const titleParts = dict.marketingTitle.split(':');
    if (titleParts.length > 1) {
      ctx.font = 'bold 38px -apple-system, sans-serif';
      ctx.fillText(titleParts[0] + ':', cardWidth / 2, 100);
      ctx.fillText(titleParts[1].trim(), cardWidth / 2, 140);
    } else {
      ctx.font = 'bold 42px -apple-system, sans-serif';
      ctx.fillText(dict.marketingTitle, cardWidth / 2, 120);
    }

    // Draw subtitle
    ctx.font = '22px -apple-system, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(dict.marketingSubtitle, cardWidth / 2, 180);

    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(cardWidth / 2, 210);
    ctx.lineTo(cardWidth / 2, 250);
    ctx.lineTo(cardWidth / 2 - 15, 235);
    ctx.moveTo(cardWidth / 2, 250);
    ctx.lineTo(cardWidth / 2 + 15, 235);
    ctx.strokeStyle = '#208a93'; // Secondary color
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw QR Code
    if (imgElement) {
      const qrSize = 350;
      ctx.drawImage(imgElement, (cardWidth - qrSize) / 2, 280, qrSize, qrSize);
    }

    // Draw footer info
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 32px -apple-system, sans-serif';
    ctx.fillText(productName || 'Product', cardWidth / 2, 680);

    ctx.fillStyle = '#888888';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText(dict.marketingArVis, cardWidth / 2, 720);

    ctx.font = 'italic 16px -apple-system, sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(dict.footerText, cardWidth / 2, 760); // Using the generator's footer text for this

    // Trigger download
    const link = document.createElement('a');
    link.download = `ar-poster-${productName.replace(/\s+/g, '-').toLowerCase()}-${lang}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyLink = () => {
    if (qrCodeRef.current?.dataset.link) {
      navigator.clipboard.writeText(qrCodeRef.current.dataset.link).then(() => {
        showToast(dict.toastCopied);
      }).catch((err) => {
        showToast(dict.toastFailed);
        console.error('Copy failed:', err);
      });
    }
  };

  return (
    <>
      {/* Moved <title> to layout.tsx */}
      <header className="bg-primary text-white py-6 text-center shadow-lg">
        <h1 className="text-3xl font-bold">{dict.headerTitle}</h1>
        <p className="text-sm opacity-80 mt-1">{dict.headerSubtitle}</p>
        <Link href={`/${lang}`} className="absolute top-4 left-4 text-white text-sm hover:underline">
            ← Back to Home
        </Link>
      </header>

      <main className="max-w-4xl mx-auto p-4 my-8">
        {/* Form Section */}
        {!showResult && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b pb-2">{dict.formTitle}</h2>
            <p className="text-gray-600 mb-6">{dict.formDesc}</p>

            <form onSubmit={generateQR} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group col-span-full">
                <label htmlFor="productName" className="block text-primary text-sm font-semibold mb-2">
                  {dict.productNameLabel}
                </label>
                <input
                  type="text"
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder={dict.productNamePlaceholder}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div className="form-group col-span-full">
                <label htmlFor="modelPath" className="block text-primary text-sm font-semibold mb-2">
                  {dict.modelPathLabel}
                </label>
                <input
                  type="text"
                  id="modelPath"
                  value={modelPath}
                  onChange={(e) => setModelPath(e.target.value)}
                  placeholder={dict.modelPathPlaceholder}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
                <small className="text-gray-500 text-xs mt-1 block">{dict.modelPathSmallText}</small>
              </div>

              <div className="form-group">
                <label htmlFor="width" className="block text-primary text-sm font-semibold mb-2">
                  {dict.widthLabel}
                </label>
                <input
                  type="number"
                  id="width"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div className="form-group">
                <label htmlFor="height" className="block text-primary text-sm font-semibold mb-2">
                  {dict.heightLabel}
                </label>
                <input
                  type="number"
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div className="form-group">
                <label htmlFor="depth" className="block text-primary text-sm font-semibold mb-2">
                  {dict.depthLabel}
                </label>
                <input
                  type="number"
                  id="depth"
                  value={depth}
                  onChange={(e) => setDepth(parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="col-span-full bg-secondary text-white py-3 px-6 rounded-md font-semibold hover:bg-secondary/90 transition-colors shadow-md"
              >
                <span>🎯</span> {dict.generateBtn}
              </button>
            </form>
          </section>
        )}

        {/* Result Section */}
        {showResult && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-primary mb-4 border-b pb-2">{dict.resultTitle}</h2>

            <div className="flex flex-col items-center text-center gap-6">
              <div className="marketing-card bg-white rounded-xl shadow-lg p-6 max-w-sm w-full relative">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-secondary rounded-t-lg"></div>
                
                <div className="mb-6 mt-4">
                  <div className="text-xl font-bold text-primary mb-1">{dict.marketingTitle}</div>
                  <div className="text-gray-600 text-sm">{dict.marketingSubtitle}</div>
                  <div className="text-secondary text-2xl mt-2 animate-bounce">⬇</div>
                </div>

                <div ref={qrCodeRef} className="mx-auto p-2 bg-white border border-gray-200 rounded-md"></div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="font-bold text-primary text-lg">{productName || 'Product'}</div>
                  <div className="text-gray-500 text-sm">{dict.marketingArVis}</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <button
                  className="bg-secondary text-white py-2 px-4 rounded-md font-semibold hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  onClick={downloadMarketingCard}
                >
                  <span>⬇️</span> {dict.downloadBtn}
                </button>
                <button
                  className="bg-gray-200 text-primary py-2 px-4 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                  onClick={copyLink}
                >
                  <span>📋</span> {dict.copyLinkBtn}
                </button>
                <button
                  className="bg-gray-200 text-primary py-2 px-4 rounded-md font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                  onClick={() => window.print()}
                >
                  <span>🖨️</span> {dict.printBtn}
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-md text-left w-full mt-6">
                <strong className="text-primary">{dict.generatedData}</strong>
                <ul className="list-disc list-inside text-gray-700 mt-2">
                  <li><strong>{dict.productNameLabel}:</strong> {productName}</li>
                  <li><strong>{dict.modelPathLabel}:</strong> {modelPath}</li>
                  <li><strong>{dict.widthLabel}:</strong> {width}cm</li>
                  <li><strong>{dict.heightLabel}:</strong> {height}cm</li>
                  <li><strong>{dict.depthLabel}:</strong> {depth}cm</li>
                  <li><strong>View URL:</strong> <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Open</a></li>
                </ul>
              </div>

              <button
                className="bg-primary text-white py-3 px-6 rounded-md font-semibold hover:bg-primary/90 transition-colors shadow-md mt-6"
                onClick={resetForm}
              >
                <span>🔄</span> {dict.resetBtn}
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-50 text-gray-600 py-6 text-center mt-auto">
        <p>&copy; {new Date().getFullYear()} {dict.footerText}</p>
        <p className="text-sm">{dict.footerSubtext}</p>
      </footer>
    </>
  );
}
import { useState } from 'react';
import { getEmailResults } from '../api';

export default function EmailResults() {
  const [showModal, setShowModal] = useState(false);
  const [emails, setEmails] = useState('');
  const [preview, setPreview] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleEmail() {
    const { mailtoUrl, results } = await getEmailResults(emails);
    setPreview(results);
    window.open(mailtoUrl, '_blank');
  }

  async function handlePreview() {
    const { results } = await getEmailResults();
    setPreview(results);
    setShowModal(true);
  }

  async function handleCopy() {
    const { results } = await getEmailResults();
    await navigator.clipboard.writeText(results);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
        >
          Email Results
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Results'}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-3">Draft Results</h3>

            <div className="mb-3">
              <label className="block text-sm text-slate-400 mb-1">Send to (comma-separated emails)</label>
              <input
                type="text"
                value={emails}
                onChange={e => setEmails(e.target.value)}
                placeholder="friend1@email.com, friend2@email.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <pre className="flex-1 overflow-y-auto bg-slate-900 rounded p-3 text-sm text-slate-300 whitespace-pre-wrap mb-3">
              {preview}
            </pre>

            <div className="flex gap-2">
              <button
                onClick={handleEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Open in Email App
              </button>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(preview);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

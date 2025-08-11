'use client';
import { useState } from 'react';
export default function ReceiptUpload(){
  const [msg, setMsg] = useState('');
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 text-sm font-medium">Receipt upload (placeholder)</div>
      <input type="file" onChange={() => setMsg('File selected. OCR coming soon…')} />
      {msg && <p className="mt-2 text-sm text-gray-500">{msg}</p>}
    </div>
  );
}

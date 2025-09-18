import React, { useRef, useState } from "react";

const UploadPDF = () => {
  const [pdfUrl, setPdfUrl] = useState("");
  const fileRef = useRef(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisText, setAnalysisText] = useState("");

  const openFilePicker = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      // extract text asynchronously
      extractTextFromPdf(file).then((text) => {
        // store extracted text somewhere for analysis
        setExtractedText(text);
        // eslint-disable-next-line no-console
        console.log("extracted text length:", text.length);
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error("PDF text extraction failed", err);
      });
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const [extractedText, setExtractedText] = useState("");

  async function extractTextFromPdf(file) {
    // dynamically load pdfjs from CDN if not available
    if (!window.pdfjsLib) {
      // import legacy build as ESM from unpkg
      // eslint-disable-next-line no-console
      console.log('Loading pdfjs from CDN...');
      const pdfjs = await import('https://unpkg.com/pdfjs-dist@3.11.172/legacy/build/pdf.js');
      window.pdfjsLib = pdfjs;
      // set worker to CDN hosted worker
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.172/build/pdf.worker.min.js';
    }
    const pdfjsLocal = window.pdfjsLib;
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLocal.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const strings = content.items.map((it) => it.str || "");
      fullText += strings.join(" ") + "\n\n";
      // small throttle
      await new Promise((r) => setTimeout(r, 0));
    }
    return fullText;
  }

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ marginBottom: 16 }}>
          <button onClick={openFilePicker} style={{ padding: "0.8rem 1.6rem", fontSize: "1rem", cursor: "pointer", marginRight: 12 }}>Upload PDF</button>
          <button onClick={() => { if (!pdfUrl) { alert('Please upload a PDF first'); return; } setShowAnalysis(true); setAnalysisText('Analysis will appear here when AI is integrated.'); }} style={{ padding: "0.8rem 1.6rem", fontSize: "1rem", cursor: "pointer" }}>Analyse PDF</button>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {pdfUrl ? (
          <div style={{ display: 'flex', gap: 16, padding: 8 }}>
            <div style={{ flex: 1, minHeight: '70vh', border: '1px solid #e5e7eb' }}>
              <iframe src={pdfUrl} title="PDF Viewer" width="100%" height="100%" style={{ border: 0 }} />
            </div>

            {showAnalysis && (
              <aside style={{ width: 360, minHeight: '70vh', border: '1px solid #e5e7eb', padding: 12, boxSizing: 'border-box', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Analysis</strong>
                  <button onClick={() => setShowAnalysis(false)} style={{ cursor: 'pointer' }}>Close</button>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                  This panel will show AI-generated explanations of the PDF content. For now it contains a placeholder.
                </div>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 8, maxHeight: 140, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  <strong>Extracted text preview:</strong>
                  <div>{extractedText ? (extractedText.slice(0, 2000) + (extractedText.length > 2000 ? '...':'') ) : ' (No text extracted yet) '}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <textarea value={analysisText} onChange={(e) => setAnalysisText(e.target.value)} style={{ width: '100%', height: '40%', resize: 'vertical', padding: 8 }} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <button style={{ padding: '0.5rem 1rem', marginRight: 8 }}>Save Note</button>
                  <button onClick={() => { setAnalysisText(''); }} style={{ padding: '0.5rem 1rem' }}>Clear</button>
                </div>
              </aside>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 24, color: '#6b7280' }}>No PDF uploaded yet. Click Upload PDF to choose a file.</div>
        )}
      </div>
    </div>
  );
};

export default UploadPDF;

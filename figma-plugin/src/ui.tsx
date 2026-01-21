import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Loader2, Play, AlertCircle, RefreshCw } from 'lucide-react';

const styles = `
:root {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --bg: #ffffff;
  --text: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --card-bg: #f9fafb;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text);
  margin: 0;
  padding: 16px;
  background: var(--bg);
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:hover {
  background: var(--primary-hover);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  margin-top: 12px;
}
.btn-secondary:hover {
  background: var(--card-bg);
  color: var(--text);
}

.card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  transition: transform 0.1s, box-shadow 0.1s;
  cursor: default;
}

.card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-right: 6px;
}
.badge-High { background: #fee2e2; color: #b91c1c; }
.badge-Medium { background: #fef3c7; color: #b45309; }
.badge-Low { background: #dbeafe; color: #1d4ed8; }

.error-box {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
  word-break: break-all;
}

.score-box {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin-bottom: 20px;
}
.score-val { font-size: 32px; font-weight: 800; color: var(--primary); }
.score-desc { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
`;

const App = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Context State
    const [serviceType, setServiceType] = useState('ecommerce');
    const [platform, setPlatform] = useState('mobile');

    useEffect(() => {
        // Inject Styles
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Message Listener
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (msg?.type === 'image-data') {
                performAnalysis(msg.base64, msg.width, msg.height, msg.nodeId);
            }
            if (msg?.type === 'error') {
                setError(msg.message);
                setLoading(false);
            }
        };
    }, []);

    const requestAnalysis = () => {
        setLoading(true);
        setError(null);
        parent.postMessage({ pluginMessage: { type: 'analyze-selection' } }, '*');
    };

    const performAnalysis = async (base64: string, width: number, height: number, nodeId: string) => {
        try {
            const API_URL = 'https://aiqc-black.vercel.app/api/audit';

            console.log(`[AIQC] Sending request to ${API_URL} with context:`, { serviceType, platform });

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: `data:image/png;base64,${base64}`,
                    context: {
                        serviceType,
                        platform,
                        targetUser: 'General'
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);

            // Draw Annotations
            if (data.feedback_list) {
                parent.postMessage({
                    pluginMessage: {
                        type: 'draw-rects',
                        issues: data.feedback_list,
                        nodeId: nodeId
                    }
                }, '*');
            }

        } catch (err: any) {
            console.error('[AIQC Error]', err);
            setError(err.message || 'Network request failed. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="header">
                <span className="text-2xl">🤖</span>
                <h1 className="title">AIQC Audit</h1>
                {result && (
                    <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <RefreshCw size={16} color="var(--text-muted)" />
                    </button>
                )}
            </div>

            {!result && !loading && (
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>서비스 도메인 (Domain)</label>
                        <select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'white' }}
                        >
                            <option value="ecommerce">🛍️ E-Commerce</option>
                            <option value="finance">💰 Finance</option>
                            <option value="entertainment">🎬 Entertainment</option>
                            <option value="general">📱 General Service</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>타겟 플랫폼 (Platform)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setPlatform('mobile')}
                                className={`btn ${platform === 'mobile' ? '' : 'btn-secondary'}`}
                                style={{ flex: 1, marginTop: 0, justifyContent: 'center', height: '36px' }}
                            >
                                Mobile
                            </button>
                            <button
                                onClick={() => setPlatform('desktop')}
                                className={`btn ${platform === 'desktop' ? '' : 'btn-secondary'}`}
                                style={{ flex: 1, marginTop: 0, justifyContent: 'center', height: '36px' }}
                            >
                                Desktop
                            </button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <button onClick={requestAnalysis} className="btn">
                            <Play size={16} /> 검사 시작 (Start Audit)
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
                    <Loader2 className="animate-spin" size={32} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
                    <p>AI가 화면을 분석 중입니다...</p>
                    <p style={{ fontSize: '11px', marginTop: '8px' }}>최대 30초 정도 소요됩니다.</p>
                </div>
            )}

            {error && (
                <div>
                    <div className="error-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 'bold' }}>
                            <AlertCircle size={16} /> 오류 발생
                        </div>
                        {error}
                        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
                            CORS 에러인 경우 서버 배포 완료를 기다려주세요.
                        </div>
                    </div>
                    <button onClick={requestAnalysis} className="btn btn-secondary">
                        <RefreshCw size={14} /> 다시 시도
                    </button>
                </div>
            )}

            {result && (
                <div>
                    <div className="score-box">
                        <div className="score-val">{result.score || 'B+'}</div>
                        <div className="score-desc">{result.summary || '분석 완료'}</div>
                    </div>

                    <div style={{ paddingBottom: '20px' }}>
                        {result.feedback_list?.map((item: any, idx: number) => (
                            <div key={idx} className="card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                                    <span className={`badge badge-${item.severity}`}>{item.severity}</span>
                                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{item.title}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.4', margin: 0 }}>
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setResult(null)} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
                        새로운 검사 하기
                    </button>
                </div>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

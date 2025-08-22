import React, { useState, useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Papa from 'papaparse';
import { generateBlogPost } from './services/geminiService';
import type { BlogPostResult } from './types';
import FileUpload from './components/FileUpload';
import Button from './components/Button';
import Spinner from './components/Spinner';
import Icon from './components/Icon';

// Helper component for displaying code with a copy button
const CopyCodeBox: React.FC<{ htmlContent: string; title: string }> = ({ htmlContent, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700">
        <h3 className="font-mono text-sm text-gray-400">{title}</h3>
        <button
          onClick={handleCopy}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md transition-colors flex items-center"
          aria-label={`Copy ${title} HTML`}
        >
          <Icon name={copied ? 'check' : 'copy'} className="w-4 h-4 mr-2" />
          {copied ? '복사 완료!' : 'HTML 복사'}
        </button>
      </div>
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto" tabIndex={0}>
        <code>{htmlContent}</code>
      </pre>
    </div>
  );
};

// Component to display a single result
const ResultItem: React.FC<{ result: BlogPostResult }> = ({ result }) => {
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">주제: {result.topic}</h2>
            <CopyCodeBox 
                htmlContent={result.blogPost}
                title="블로그 글 전체 HTML"
            />
        </div>
    );
};


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<BlogPostResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [wasCancelled, setWasCancelled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('CSV 파일만 업로드할 수 있습니다.');
        setFile(null);
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResults([]);
    }
  };

  const handleGenerate = useCallback(() => {
    if (!file) {
      setError('먼저 CSV 파일을 선택해주세요.');
      return;
    }
    
    isCancelledRef.current = false;
    setWasCancelled(false);
    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: 0 });
    
    const reader = new FileReader();

    reader.onload = (event) => {
        const csvData = event.target?.result as string;

        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          transformHeader: header => header.trim(),
          complete: async (parsedResult: any) => {
            try {
              if (!parsedResult.data || parsedResult.data.length === 0) {
                setError("CSV 파일이 비어있거나 데이터를 읽을 수 없습니다.");
                setIsLoading(false);
                return;
              }

              const headers = (parsedResult.meta.fields || []) as string[];
              const possibleTopicHeaders = ['topic', 'Topic', '주제', '제목'];
              
              const topicHeader = headers.find(h => possibleTopicHeaders.includes(h));

              if (!topicHeader) {
                const detectedHeaders = headers.join(', ');
                setError(`'topic' 또는 '주제' 열을 찾을 수 없습니다. 파일에서 감지된 열: [${detectedHeaders}]`);
                setIsLoading(false);
                return;
              }

              const topics = parsedResult.data
                .map((row: any) => row[topicHeader]?.trim())
                .filter(Boolean);

              if (topics.length === 0) {
                setError(`'${topicHeader}' 열에 내용이 없습니다. CSV 파일을 확인해주세요.`);
                setIsLoading(false);
                return;
              }
              
              setProgress({ current: 0, total: topics.length });

              const generatedResults: BlogPostResult[] = [];
              for (let i = 0; i < topics.length; i++) {
                if (isCancelledRef.current) {
                  setWasCancelled(true);
                  break;
                }
                const topic = topics[i];
                try {
                  const blogPost = await generateBlogPost(topic);
                  generatedResults.push({ topic, blogPost });
                  setProgress({ current: i + 1, total: topics.length });
                } catch (apiError) {
                  console.error(`Error generating post for topic "${topic}":`, apiError);
                  generatedResults.push({ topic, blogPost: `오류: ${(apiError as Error).message}` });
                }
              }
              setResults(generatedResults);
            } catch (e) {
              setError(`데이터 처리 중 오류가 발생했습니다: ${(e as Error).message}`);
            }
            finally {
              setIsLoading(false);
            }
          },
          error: (err: any) => {
              setError(`CSV 파싱 오류: ${err.message}`);
              setIsLoading(false);
          }
        });
    };
    
    reader.onerror = () => {
        setError('파일을 읽는 중 오류가 발생했습니다.');
        setIsLoading(false);
    };

    reader.readAsText(file, 'EUC-KR');

  }, [file]);
  
  const handleCancel = () => {
    isCancelledRef.current = true;
  };

  const handleDownload = () => {
    if (results.length === 0) return;

    const csvHeader = '"topic","blogPost"\n';
    const csvRows = results.map(r => {
        const escapedPost = `"${r.blogPost.replace(/"/g, '""')}"`;
        return `"${r.topic}",${escapedPost}`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const originalFileName = file?.name.replace('.csv', '') || 'results';
    link.setAttribute('download', `${originalFileName}_generated.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const resetState = () => {
    setFile(null);
    setResults([]);
    setIsLoading(false);
    setError(null);
    setProgress({ current: 0, total: 0 });
    setWasCancelled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
            <div className="inline-block p-4 bg-purple-500 bg-opacity-20 rounded-full mb-4">
              <Icon name="sparkles" className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                AI 블로그 포스트 생성기
            </h1>
            <p className="text-gray-400 mt-4 text-lg">
                CSV 파일을 업로드하여 여러 블로그 주제에 대한 글을 한번에 생성하세요.
            </p>
        </header>

        <main className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 transition-all duration-300">
            {results.length > 0 && !isLoading ? (
                <div className="w-full">
                  <div className="text-center mb-8">
                      <Icon name={wasCancelled ? "stop" : "check"} className={`w-16 h-16 mx-auto mb-4 ${wasCancelled ? 'text-yellow-400' : 'text-green-400'}`} />
                      <h2 className="text-2xl font-semibold mb-2 text-white">
                         {wasCancelled ? "생성 중지됨" : "생성 완료!"}
                      </h2>
                      <p className="text-gray-400 mb-6">
                        {wasCancelled
                          ? `${results.length}개의 글이 생성된 후 중지되었습니다.`
                          : `${results.length}개의 블로그 글이 성공적으로 생성되었습니다.`
                        }
                      </p>
                      <div className="flex justify-center gap-4">
                          <Button onClick={handleDownload} variant="primary">
                              <Icon name="download" className="w-5 h-5 mr-2" />
                              결과 다운로드 (CSV)
                          </Button>
                          <Button onClick={resetState} variant="secondary">
                              <Icon name="refresh" className="w-5 h-5 mr-2" />
                              새로 시작
                          </Button>
                      </div>
                  </div>

                  <div className="space-y-8 mt-8">
                    {results.map((result, index) => (
                      <ResultItem key={index} result={result} />
                    ))}
                  </div>
                </div>
            ) : isLoading ? (
                <div className="text-center">
                    <Spinner />
                    <p className="text-lg font-medium text-purple-300 mt-4">AI가 블로그 글을 작성 중입니다...</p>
                    <p className="text-gray-400 mt-2">({progress.current} / {progress.total})</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                        <div 
                            className="bg-purple-500 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}>
                        </div>
                    </div>
                     <div className="mt-8">
                        <Button onClick={handleCancel} variant="danger">
                            <Icon name="stop" className="w-5 h-5 mr-2" />
                            생성 중지
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <FileUpload file={file} onFileChange={handleFileChange} fileInputRef={fileInputRef} />
                    {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    <div className="mt-8 text-center">
                        <Button onClick={handleGenerate} disabled={!file || isLoading} variant="primary">
                            <Icon name="generate" className="w-5 h-5 mr-2" />
                            {isLoading ? '생성 중...' : '블로그 글 생성'}
                        </Button>
                    </div>
                </>
            )}
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService } from '@/services/notes';
import {
  FileUp, CheckCircle2, AlertCircle, Loader2,
  Globe, Mic, Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type UploadMode = 'file' | 'url' | 'voice';
type ApiError = { response?: { data?: { detail?: string } } };

const FILE_ACCEPT = '.pdf,.txt,.docx,.png,.jpg,.jpeg,.webp,.bmp';
const VOICE_ACCEPT = '.mp3,.wav,.m4a,.flac,.ogg,.webm';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<UploadMode>('file');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const queryClient = useQueryClient();
  const router = useRouter();

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (mode === 'url') return notesService.uploadUrl(url, subject || undefined, topic || undefined);
      if (mode === 'voice') return notesService.uploadVoice(file!, subject || undefined, topic || undefined);
      return notesService.uploadFile(file!, subject || undefined, topic || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setTimeout(() => router.push('/'), 2000);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && url) uploadMutation.mutate();
    else if (file) uploadMutation.mutate();
  };

  const canSubmit = mode === 'url' ? !!url : !!file;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
        }}
      >
        <h2 className="text-3xl font-bold text-white">Upload Study Material</h2>
        <p className="text-indigo-100 mt-2">PDF, DOCX, TXT, images (OCR), voice notes, or YouTube links.</p>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
      </div>

      {/* Mode Switcher */}
      <div
        className="flex p-1.5 rounded-2xl border gap-1"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        {([
          { key: 'file' as const, icon: FileUp, label: 'Document / Image' },
          { key: 'url' as const, icon: Globe, label: 'YouTube / URL' },
          { key: 'voice' as const, icon: Mic, label: 'Voice Note' },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setMode(key); setFile(null); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
            style={
              mode === key
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Upload Form */}
      <div
        className="rounded-2xl border p-8"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Subject</label>
              <input
                type="text"
                placeholder="e.g. Operating Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Topic</label>
              <input
                type="text"
                placeholder="e.g. Deadlocks"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {mode === 'url' ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>YouTube or Web URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                required
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>YouTube transcripts or web page text are extracted automatically.</p>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer"
              style={{
                borderColor: file ? 'var(--primary)' : 'var(--border)',
                background: file ? 'var(--primary-lighter)' : 'var(--surface-secondary)',
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={mode === 'voice' ? VOICE_ACCEPT : FILE_ACCEPT}
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: file ? 'var(--primary)' : 'var(--border)',
                    boxShadow: file ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  {mode === 'voice'
                    ? <Mic className="w-8 h-8" style={{ color: file ? '#fff' : 'var(--text-muted)' }} />
                    : mode === 'file'
                    ? <FileUp className="w-8 h-8" style={{ color: file ? '#fff' : 'var(--text-muted)' }} />
                    : <ImageIcon className="w-8 h-8" style={{ color: file ? '#fff' : 'var(--text-muted)' }} />
                  }
                </div>
                {file ? (
                  <div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>{file.name}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Click to upload</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {mode === 'voice' ? 'MP3, WAV, M4A, FLAC' : 'PDF, DOCX, TXT, PNG, JPG'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || uploadMutation.isPending}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Uploading & Processing...</>
            ) : 'Upload & Process'}
          </button>
        </form>

        {uploadMutation.isSuccess && (
          <div className="mt-6 p-4 rounded-xl flex items-center gap-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#059669' }}>
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Uploaded! AI processing started. Redirecting...</p>
          </div>
        )}
        {uploadMutation.isError && (
          <div className="mt-6 p-4 rounded-xl flex items-center gap-3" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}>
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{(uploadMutation.error as ApiError)?.response?.data?.detail || 'Upload failed'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

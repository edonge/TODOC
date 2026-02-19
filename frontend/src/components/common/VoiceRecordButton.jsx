import { useState, useRef, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api/base';
import './VoiceRecordButton.css';

const MAX_DURATION = 60; // seconds

function VoiceRecordButton({ kidId, onResult, inline = false, className = '' }) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const supported = typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setElapsed(0);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => handleRecordingComplete();

      mediaRecorder.start();
      setStatus('recording');
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('마이크 접근 실패:', err);
      alert('마이크 권한을 허용해주세요.');
      cleanup();
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleRecordingComplete = async () => {
    setStatus('processing');

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];

    if (blob.size === 0) {
      alert('녹음된 오디오가 없습니다.');
      setStatus('idle');
      return;
    }

    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    try {
      const token = localStorage.getItem('access_token');
      const response = await apiFetch(`/api/speech/transcribe/${kidId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || '음성 처리에 실패했습니다.');
      }

      const result = await response.json();
      onResult(result);
    } catch (err) {
      console.error('Speech-to-record failed:', err);
      alert(err.message || '음성 처리 중 오류가 발생했습니다.');
    } finally {
      setStatus('idle');
    }
  };

  const handleClick = () => {
    if (!kidId) {
      alert('먼저 아이를 등록해주세요.');
      return;
    }
    if (status === 'idle') {
      startRecording();
    } else if (status === 'recording') {
      stopRecording();
    }
  };

  if (!supported) return null;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const wrapperClassName = [
    'voice-record-wrapper',
    inline ? 'voice-record-wrapper--inline' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClassName}>
      {status === 'recording' && (
        <span className="voice-record-timer">{formatTime(elapsed)}</span>
      )}
      {status === 'processing' && (
        <span className="voice-record-label">분석 중...</span>
      )}
      <button
        className={`voice-record-btn voice-record-btn--${status}`}
        onClick={handleClick}
        disabled={status === 'processing'}
        aria-label={
          status === 'idle' ? '음성 기록 시작' :
          status === 'recording' ? '녹음 중지' :
          '분석 중'
        }
      >
        {status === 'idle' && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M6.5 10.5V11.2C6.5 14.24 8.96 16.7 12 16.7C15.04 16.7 17.5 14.24 17.5 11.2V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9.5 21H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {status === 'recording' && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="2" fill="currentColor"/>
          </svg>
        )}
        {status === 'processing' && (
          <div className="voice-record-spinner" />
        )}
      </button>
    </div>
  );
}

export default VoiceRecordButton;

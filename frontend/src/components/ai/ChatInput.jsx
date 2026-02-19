import { useState, useRef, useCallback } from 'react';
import { apiFetch } from '../../api/base';
import sendIcon from '../../assets/WJ/send.png';
import './ChatInput.css';

function ChatInput({ placeholder, buttonColor, onSend, disabled = false, kidId = null, onVoiceInput = null }) {
  const [text, setText] = useState('');
  const [micStatus, setMicStatus] = useState('idle'); // idle | recording | processing

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleMicClick = async () => {
    if (!kidId || !onVoiceInput) return;

    if (micStatus === 'recording') {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopStream();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setMicStatus('processing');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        if (blob.size === 0) { setMicStatus('idle'); return; }

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        try {
          const token = localStorage.getItem('access_token');
          const res = await apiFetch(`/api/speech/transcribe/${kidId}?transcript_only=true`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || '음성 처리에 실패했습니다.');
          }
          const result = await res.json();
          if (result.transcript) onVoiceInput(result.transcript);
        } catch (e) {
          console.error('Voice transcription failed:', e);
          alert(e.message || '음성 처리 중 오류가 발생했습니다.');
        } finally {
          setMicStatus('idle');
        }
      };

      recorder.start();
      setMicStatus('recording');
    } catch {
      alert('마이크 권한을 허용해주세요.');
      setMicStatus('idle');
    }
  };

  const handleSend = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend?.(value);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const showMic = kidId && onVoiceInput && typeof navigator !== 'undefined' && navigator.mediaDevices;

  return (
    <div className="chat-input-bar">
      <div className="chat-input-field-wrap">
        <input
          className={`chat-input-field${showMic ? ' chat-input-field--with-mic' : ''}`}
          type="text"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || micStatus !== 'idle'}
        />
        {showMic && (
          <button
            className={`chat-input-mic chat-input-mic--${micStatus}`}
            onClick={handleMicClick}
            disabled={disabled}
            aria-label={micStatus === 'idle' ? '음성 입력' : micStatus === 'recording' ? '녹음 중지' : '처리 중'}
          >
            {micStatus === 'idle' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M6.5 10.5V11.2C6.5 14.24 8.96 16.7 12 16.7C15.04 16.7 17.5 14.24 17.5 11.2V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9.5 21H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {micStatus === 'recording' && (
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="14" height="14" rx="2" fill="currentColor" />
              </svg>
            )}
            {micStatus === 'processing' && <div className="chat-input-mic-spinner" />}
          </button>
        )}
      </div>
      <button
        className="chat-input-send"
        style={{ backgroundColor: buttonColor, opacity: disabled ? 0.6 : 1 }}
        aria-label="메시지 전송"
        onClick={handleSend}
        disabled={disabled}
      >
        <img src={sendIcon} alt="전송" className="chat-input-icon" />
      </button>
    </div>
  );
}

export default ChatInput;

import { useState, useCallback } from 'react';
import { useMoodStore } from './useMoodStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useSSEStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [ragContext, setRagContext] = useState(null);
  const [crisisTriggered, setCrisisTriggered] = useState(false);
  const [sentimentScore, setSentimentScore] = useState(null);
  const [stressSeverity, setStressSeverity] = useState(null);
  const [traumaRisk, setTraumaRisk] = useState(null);

  const sendMessage = useCallback(async (message) => {
    const { accessToken, addLocalMessage } = useMoodStore.getState();
    
    setIsStreaming(true);
    setStreamedText('');
    setCurrentEmotion(null);
    setRagContext(null);
    setCrisisTriggered(false);
    setSentimentScore(null);
    setStressSeverity(null);
    setTraumaRisk(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Server returned error response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let collectedText = '';
      let detectedEmotion = '🌿 Grounding';
      let detectedSentiment = 0.0;
      let detectedStress = 'Low';
      let detectedTrauma = 'Minimal';

      // Store user message immediately (mocking local values based on client text until SSE updates)
      addLocalMessage('user', message);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // SSE messages are separated by double newlines
        const parts = buffer.split('\n\n');
        // Save the last incomplete block back in the buffer
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          
          // Remove "data: " prefix
          const line = part.startsWith('data: ') ? part.slice(6) : part;
          try {
            const data = JSON.parse(line.trim());
            
            if (data.crisis) {
              setCrisisTriggered(true);
            }
            if (data.emotion) {
              detectedEmotion = data.emotion;
              setCurrentEmotion(data.emotion);
            }
            if (data.sentiment_score !== undefined) {
              detectedSentiment = data.sentiment_score;
              setSentimentScore(data.sentiment_score);
            }
            if (data.stress_severity !== undefined) {
              detectedStress = data.stress_severity;
              setStressSeverity(data.stress_severity);
            }
            if (data.trauma_risk !== undefined) {
              detectedTrauma = data.trauma_risk;
              setTraumaRisk(data.trauma_risk);
            }
            if (data.rag_context) {
              setRagContext(data.rag_context);
            }
            if (data.error) {
              console.warn('LLM streaming error detected by backend');
            }
            if (data.text) {
              collectedText += data.text;
              setStreamedText(collectedText);
            }
          } catch (e) {
            console.warn('Failed to parse SSE JSON chunk:', part, e);
          }
        }
      }

      // If there's any remaining buffer contents
      if (buffer.trim()) {
        const line = buffer.startsWith('data: ') ? buffer.slice(6) : buffer;
        try {
          const data = JSON.parse(line.trim());
          if (data.text) {
            collectedText += data.text;
            setStreamedText(collectedText);
          }
        } catch (e) {}
      }

      // Finally, append assistant message in the store with parsed diagnostics
      addLocalMessage('assistant', collectedText, detectedEmotion, detectedSentiment, detectedStress, detectedTrauma);
      setIsStreaming(false);
      return { 
        success: true, 
        text: collectedText, 
        emotion: detectedEmotion,
        sentiment: detectedSentiment,
        stress: detectedStress,
        trauma: detectedTrauma
      };

    } catch (error) {
      console.error('SSE Stream error:', error);
      setIsStreaming(false);
      
      const errorMsg = 'I apologize, but I\'m having trouble connecting to my cognitive systems right now. Let\'s take a deep breath together. Inhale for 4 seconds... and exhale.';
      addLocalMessage('assistant', errorMsg, '🌿 Grounding', 0.0, 'Low', 'Minimal');
      setStreamedText(errorMsg);
      return { success: false, error };
    }
  }, []);

  return {
    isStreaming,
    streamedText,
    currentEmotion,
    ragContext,
    crisisTriggered,
    sentimentScore,
    stressSeverity,
    traumaRisk,
    sendMessage,
    setCrisisTriggered
  };
};

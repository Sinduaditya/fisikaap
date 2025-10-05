import { useCallback, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { WebViewMessage, SubmissionData } from '@/types/simulation';
import { SimulationQuestion } from '@/services/api';

export const useWebViewMessaging = (
  onSubmitAnswer: (data: SubmissionData) => void,
  onWebViewReady: () => void
) => {
  const webViewRef = useRef<WebView>(null);

  // ✅ Handle messages from WebView
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('📨 Received from WebView:', message.type);
      
      switch (message.type) {
        case 'SUBMIT_ANSWER':
          onSubmitAnswer(message.data as SubmissionData);
          break;
          
        case 'WEBVIEW_READY':
          onWebViewReady();
          break;
          
        case 'QUESTION_LOADED':
          console.log('✅ Question loaded in WebView:', message.data);
          break;
          
        case 'ERROR':
          console.error('❌ WebView error:', message.data);
          break;
          
        default:
          console.warn('⚠️ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebView message:', error);
    }
  }, [onSubmitAnswer, onWebViewReady]);

  // ✅ Send message to WebView
  const sendMessageToWebView = useCallback((type: string, data: any) => {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    webViewRef.current?.postMessage(message);
    console.log('📤 Sent to WebView:', type);
  }, []);

  // ✅ Load question in WebView
  const loadQuestionInWebView = useCallback((question: SimulationQuestion) => {
    sendMessageToWebView('LOAD_QUESTION', { question });
  }, [sendMessageToWebView]);

  // ✅ Reset simulation in WebView
  const resetSimulationInWebView = useCallback(() => {
    sendMessageToWebView('RESET_SIMULATION', {});
  }, [sendMessageToWebView]);

  return {
    webViewRef,
    handleWebViewMessage,
    loadQuestionInWebView,
    resetSimulationInWebView,
    sendMessageToWebView,
  };
};
import { useCallback, useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { ChatMessage, Chunk, ConfidenceLevel } from '../types';

type LoadingStage = 'prepare' | 'answer' | 'localize' | null;

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat() {
  const {
    messages,
    addMessage,
    updateMessage,
    language,
    jurisdiction,
    classificationState,
    setClassificationState,
    sessionId,
    setSessionId,
    setIsSampleCorpus,
    setLastRetrievedChunks,
  } = useAppStore();

  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim() || loadingStage !== null) return;

      setError(null);

      // Add user message
      const userMsgId = generateId();
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: userInput,
        language,
        timestamp: new Date(),
      };
      addMessage(userMsg);

      // Add loading placeholder for assistant
      const assistantMsgId = generateId();
      const loadingMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        language,
        timestamp: new Date(),
        isLoading: true,
        loadingStage: 'prepare',
      };
      addMessage(loadingMsg);

      try {
        // ── Stage 1: Prepare ────────────────────────────────
        setLoadingStage('prepare');
        updateMessage(assistantMsgId, { loadingStage: 'prepare' });

        const conversationHistory = messages
          .filter((m) => !m.isLoading)
          .slice(-10)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        const prepareRes = await fetch('/api/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userInput,
            conversationHistory,
            currentState: classificationState,
            sessionId,
          }),
        });

        if (!prepareRes.ok) {
          const errData = await prepareRes.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errData.error ?? `HTTP ${prepareRes.status}`);
        }

        const prepareData = await prepareRes.json() as {
          sessionId: string;
          detectedLanguage: string;
          translatedQuery: string;
          classification: typeof classificationState;
          retrievedChunks: Chunk[];
          pendingQuestion?: string;
          needsClarification: boolean;
          sampleOnly: boolean;
          topScore: number;
        };

        setSessionId(prepareData.sessionId);
        setClassificationState(prepareData.classification);
        setIsSampleCorpus(prepareData.sampleOnly);
        setLastRetrievedChunks(prepareData.retrievedChunks);

        // If clarification needed, ask and exit
        if (prepareData.needsClarification && prepareData.pendingQuestion) {
          updateMessage(assistantMsgId, {
            isLoading: false,
            content: `I need a bit more information to help you better:\n\n**${prepareData.pendingQuestion}**`,
            language: 'en',
          });
          setLoadingStage(null);
          return;
        }

        // ── Stage 2: Answer ─────────────────────────────────
        setLoadingStage('answer');
        updateMessage(assistantMsgId, { loadingStage: 'answer' });

        const answerRes = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: prepareData.sessionId,
            translatedQuery: prepareData.translatedQuery,
            originalQuery: userInput,
            retrievedChunks: prepareData.retrievedChunks,
            classification: prepareData.classification,
            topScore: prepareData.topScore,
            enableLLMRerank: false,
          }),
        });

        if (!answerRes.ok) {
          const errData = await answerRes.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errData.error ?? `HTTP ${answerRes.status}`);
        }

        const answerData = await answerRes.json() as {
          sessionId: string;
          rawAnswer: string;
          verifiedAnswer: string;
          citedChunkIds: string[];
          confidence: ConfidenceLevel;
          confidenceScore: number;
          strippedClaims: string[];
          absChecklistItems?: string[];
          tkdlPointers?: string[];
          isAbstention: boolean;
        };

        // ── Stage 3: Localize ───────────────────────────────
        setLoadingStage('localize');
        updateMessage(assistantMsgId, { loadingStage: 'localize' });

        let finalAnswer = answerData.verifiedAnswer;

        if (language !== 'en') {
          const localizeRes = await fetch('/api/localize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: prepareData.sessionId,
              answer: answerData.verifiedAnswer,
              targetLanguage: language,
            }),
          });

          if (localizeRes.ok) {
            const localizeData = await localizeRes.json() as { localizedAnswer: string };
            finalAnswer = localizeData.localizedAnswer;
          }
        }

        // Get citation chunks
        const citedChunks = prepareData.retrievedChunks.filter((c) =>
          answerData.citedChunkIds.includes(c.id),
        );

        // Final update
        updateMessage(assistantMsgId, {
          isLoading: false,
          loadingStage: undefined,
          content: finalAnswer,
          language,
          citations: citedChunks,
          confidence: answerData.confidence,
          confidenceScore: answerData.confidenceScore,
          absChecklist: answerData.absChecklistItems,
          tkdlPointers: answerData.tkdlPointers,
          isAbstention: answerData.isAbstention,
        });
      } catch (err) {
        const errMsg = (err as Error).message;
        setError(errMsg);
        updateMessage(assistantMsgId, {
          isLoading: false,
          error: errMsg,
          content: `⚠️ An error occurred: ${errMsg}. Please try again.`,
        });
      } finally {
        setLoadingStage(null);
      }
    },
    [
      loadingStage,
      language,
      jurisdiction,
      classificationState,
      sessionId,
      messages,
      addMessage,
      updateMessage,
      setSessionId,
      setClassificationState,
      setIsSampleCorpus,
      setLastRetrievedChunks,
    ],
  );

  return { sendMessage, loadingStage, error };
}

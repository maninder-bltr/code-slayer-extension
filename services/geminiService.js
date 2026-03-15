/**
 * services/geminiService.js - Fixed API URL
 */
import { storage } from '../utils/storage.js';

export const geminiService = {
    QUOTES_PROMPT: "Generate a short motivational quote for programmers learning algorithms. Theme: ninja training, discipline, daily improvement. Return only the quote text.",
    STORY_PROMPT: "Write a 3 sentence story encouraging a programmer to defeat today's coding challenges. Theme: ninja warrior training.",

    FALLBACK_QUOTES: [
        "A ninja sharpens the blade daily. A developer sharpens the mind.",
        "Mastering algorithms is the path to the legendary developer rank.",
        "Each bug defeated is a demon slain in your journey.",
        "Consistency is the ultimate weapon of a shadow ninja."
    ],

    FALLBACK_STORIES: [
        "The gate to the Algorithm Temple opens. Two demons guard the entrance. Defeat them to unlock the next level of mastery.",
        "Your blade is ready, but your mind must be sharper. Today's challenges are but stepping stones to greatness.",
        "Dark clouds gather over the codebase. Only your logic can bring back the light."
    ],

    getGeminiKey: async () => {
        const settings = await storage.get('settings');
        return settings?.geminiKey || null;
    },

    fetchFromGemini: async (prompt) => {
        const apiKey = await geminiService.getGeminiKey();
        if (!apiKey) {
            console.log('No Gemini API key found, using fallback');
            return null;
        }

        try {
            // ✅ FIXED: Removed extra spaces in URL
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': 'AIzaSyBRM2j4O2mzoFMH9hB2n45p0VcF3OHyaoI' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (error) {
            console.error('Gemini API Error:', error);
            return null;
        }
    },

    getMotivation: async () => {
        const quote = await geminiService.fetchFromGemini(geminiService.QUOTES_PROMPT);
        return quote || geminiService.FALLBACK_QUOTES[Math.floor(Math.random() * geminiService.FALLBACK_QUOTES.length)];
    },

    getDailyStory: async () => {
        const story = await geminiService.fetchFromGemini(geminiService.STORY_PROMPT);
        return story || geminiService.FALLBACK_STORIES[Math.floor(Math.random() * geminiService.FALLBACK_STORIES.length)];
    }
};
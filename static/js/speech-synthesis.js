// Speech synthesis utility functions
const speechSynthesis = window.speechSynthesis;

// Initialize speech synthesis
export function initSpeechSynthesis() {
    if (!speechSynthesis) {
        console.error('Speech synthesis not supported');
        return false;
    }
    return true;
}

// Speak text using speech synthesis
export function speakText(text) {
    if (!speechSynthesis) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure the utterance for a more feminine voice
    utterance.rate = 0.95;      // Slightly slower for clarity
    utterance.pitch = 1.5;      // Higher pitch for more feminine sound
    utterance.volume = 0.95;    // Clear volume
    utterance.lang = 'en-GB';   // Prefer British English

    // Get available voices
    function setVoiceAndSpeak() {
        const voices = speechSynthesis.getVoices();
        // Try to find a female English voice, prefer en-GB
        const femaleVoice = voices.find(voice => 
            voice.lang.includes('en-GB') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('girl') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('amy') || voice.name.toLowerCase().includes('emma') || voice.name.toLowerCase().includes('susan'))
        ) || voices.find(voice => 
            voice.lang.includes('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('girl') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('amy') || voice.name.toLowerCase().includes('emma') || voice.name.toLowerCase().includes('susan'))
        ) || voices.find(voice => 
            voice.lang.includes('en-GB')
        ) || voices.find(voice => 
            voice.lang.includes('en')
        ) || voices[0];

        if (femaleVoice) {
            utterance.voice = femaleVoice;
            utterance.lang = femaleVoice.lang;
        }
        speechSynthesis.speak(utterance);
    }

    // If voices are not loaded yet, wait for them
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    } else {
        setVoiceAndSpeak();
    }
}

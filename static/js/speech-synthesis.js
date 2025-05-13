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
    
    // Configure the utterance
    utterance.lang = 'en-GB'; // British English voice
    utterance.rate = 1.0;     // Normal speed
    utterance.pitch = 1.0;    // Normal pitch
    
    // Get available voices
    const voices = speechSynthesis.getVoices();
    
    // Try to find a British English voice
    const britishVoice = voices.find(voice => 
        voice.lang.includes('en-GB') && voice.name.includes('Female')
    ) || voices.find(voice => 
        voice.lang.includes('en-GB')
    ) || voices[0];
    
    if (britishVoice) {
        utterance.voice = britishVoice;
    }
    
    // Speak the text
    speechSynthesis.speak(utterance);
}

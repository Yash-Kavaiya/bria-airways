document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Chat UI
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeChat = document.getElementById('close-chat');
    const minimizeChat = document.getElementById('minimize-chat');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatContainer = document.getElementById('chat-container');
    
    // DOM Elements - Voice UI
    const voiceButton = document.getElementById('voice-button');
    const voicePopup = document.getElementById('voice-popup');
    const voicePopupOverlay = document.getElementById('voice-popup-overlay');
    const closeVoicePopup = document.getElementById('close-voice-popup');
    const startRecording = document.getElementById('start-recording');
    const pauseRecording = document.getElementById('pause-recording');
    const resumeRecording = document.getElementById('resume-recording');
    const resetRecording = document.getElementById('reset-recording');
    const sendVoice = document.getElementById('send-voice');
    const transcriptionResult = document.getElementById('transcription-result');
    const recordingIndicator = document.getElementById('recording-indicator');
    const waveformPath = document.getElementById('waveform-svg-path');
    const recordingStatus = document.getElementById('recording-status');
    
    // DOM Elements - Attachment UI
    const attachmentButton = document.getElementById('attachment-button');
    const fileInput = document.getElementById('file-input');
    const attachmentPreview = document.getElementById('attachment-preview');
    const attachmentName = document.getElementById('attachment-name');
    const removeAttachment = document.getElementById('remove-attachment');
    
    // DOM Elements - Booking UI
    const bookingTabs = document.querySelectorAll('.booking-tabs button');
    const destinationTabs = document.querySelectorAll('.destination-tabs button');
    
    // Speech Recognition Setup
    let recognition = null;
    let isRecording = false;
    let isPaused = false;
    let currentFile = null;
    
    // Initialize Speech Recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Default language
        
        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            // Display transcription with highlighting
            transcriptionResult.innerHTML = `
                <span class="text-dark font-weight-medium">${finalTranscript}</span>
                <span class="text-muted font-italic">${interimTranscript}</span>
            `;
            
            // Enable send button if we have text
            if (finalTranscript.trim() !== '' || interimTranscript.trim() !== '') {
                sendVoice.disabled = false;
                // Update status text
                recordingStatus.innerHTML = 'Speech detected! <span style="color: var(--ba-navy);">✓</span>';
            } else {
                sendVoice.disabled = true;
            }
        };
        
        recognition.onend = function() {
            if (isRecording && !isPaused) {
                // If it stopped on its own but we're still recording, restart it
                recognition.start();
            } else {
                isRecording = false;
                recordingIndicator.classList.add('hidden');
                startRecording.querySelector('i').className = 'fas fa-microphone';
                updateVoiceControls();
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            isRecording = false;
            recordingIndicator.classList.add('hidden');
            startRecording.querySelector('i').className = 'fas fa-microphone';
            updateVoiceControls();
            
            // Show error in transcription area
            transcriptionResult.innerHTML = `<span style="color: var(--ba-red);">Error: ${event.error}. Please try again.</span>`;
        };
    }
    
    // Toggle chat window visibility
    chatbotIcon.addEventListener('click', function() {
        chatbotWindow.classList.remove('hidden');
        chatbotIcon.classList.add('hidden');
        chatInput.focus();
        scrollToBottom();
    });
    
    // Close chat window
    closeChat.addEventListener('click', function() {
        chatbotWindow.classList.add('hidden');
        chatbotIcon.classList.remove('hidden');
        // Also close voice popup if open
        voicePopup.classList.add('hidden');
        voicePopupOverlay.classList.add('hidden');
    });
    
    // Minimize chat window
    minimizeChat.addEventListener('click', function() {
        chatbotWindow.classList.add('hidden');
        chatbotIcon.classList.remove('hidden');
        // Also close voice popup if open
        voicePopup.classList.add('hidden');
        voicePopupOverlay.classList.add('hidden');
    });
    
    // Open voice popup
    voiceButton.addEventListener('click', function() {
        voicePopup.classList.remove('hidden');
        voicePopupOverlay.classList.remove('hidden');
        chatInput.blur(); // Remove focus from text input
        
        // Reset the voice UI when opening
        resetVoiceUI();
        
        // Focus on start recording button for better accessibility
        setTimeout(() => {
            startRecording.focus();
        }, 100);
    });
    
    // Close voice popup by clicking the close button
    closeVoicePopup.addEventListener('click', function() {
        closeVoicePopupFunc();
    });
    
    // Close voice popup by clicking the overlay
    voicePopupOverlay.addEventListener('click', function() {
        closeVoicePopupFunc();
    });
    
    // Close voice popup with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !voicePopup.classList.contains('hidden')) {
            closeVoicePopupFunc();
        }
    });
    
    // Function to close voice popup and handle cleanup
    function closeVoicePopupFunc() {
        voicePopup.classList.add('hidden');
        voicePopupOverlay.classList.add('hidden');
        stopRecording();
        // Return focus to chat input
        setTimeout(() => {
            chatInput.focus();
        }, 100);
    }
    
    // Handle file attachment
    attachmentButton.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            currentFile = e.target.files[0];
            attachmentName.textContent = currentFile.name;
            attachmentPreview.classList.remove('hidden');
        }
    });
    
    // Remove attachment
    removeAttachment.addEventListener('click', function() {
        currentFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
    });
    
    // Voice Recording Controls
    startRecording.addEventListener('click', function() {
        if (!isRecording) {
            // Start recording
            if (recognition) {
                try {
                    recognition.start();
                    isRecording = true;
                    isPaused = false;
                    recordingIndicator.classList.remove('hidden');
                    startRecording.querySelector('i').className = 'fas fa-stop';
                    transcriptionResult.innerHTML = '';
                    sendVoice.disabled = true;
                    
                    // Update recording status
                    if (recordingStatus) {
                        recordingStatus.innerHTML = '<span style="color: var(--ba-red); animation: blink 1s infinite;">●</span> Recording... speak now';
                    }
                    
                    animateWaveform(true);
                    updateVoiceControls();
                } catch (e) {
                    console.error('Error starting recognition', e);
                    if (recordingStatus) {
                        recordingStatus.innerHTML = '<span style="color: var(--ba-red);">Error starting speech recognition. Please try again.</span>';
                        setTimeout(() => {
                            recordingStatus.textContent = 'Click the microphone to start recording';
                        }, 3000);
                    }
                }
            } else {
                if (recordingStatus) {
                    recordingStatus.innerHTML = '<span style="color: var(--ba-red);">Speech recognition is not supported in your browser.</span>';
                }
            }
        } else {
            // Stop recording
            stopRecording();
        }
    });
    
    pauseRecording.addEventListener('click', function() {
        if (isRecording && !isPaused && recognition) {
            recognition.stop();
            isPaused = true;
            animateWaveform(false);
            updateVoiceControls();
            // Update status
            if (recordingStatus) {
                recordingStatus.innerHTML = '<span style="color: #e6c418;">⏸</span> Recording paused';
            }
        }
    });
    
    resumeRecording.addEventListener('click', function() {
        if (isRecording && isPaused && recognition) {
            try {
                recognition.start();
                isPaused = false;
                animateWaveform(true);
                updateVoiceControls();
                // Update status
                if (recordingStatus) {
                    recordingStatus.innerHTML = '<span style="color: var(--ba-red); animation: blink 1s infinite;">●</span> Recording resumed... speak now';
                }
            } catch (e) {
                console.error('Error resuming recognition', e);
                if (recordingStatus) {
                    recordingStatus.innerHTML = '<span style="color: var(--ba-red);">Error resuming recording. Please try again.</span>';
                }
            }
        }
    });
    
    resetRecording.addEventListener('click', function() {
        resetVoiceUI();
    });
    
    sendVoice.addEventListener('click', function() {
        const text = transcriptionResult.textContent.trim();
        if (text) {
            // Show sending feedback
            sendVoice.disabled = true;
            if (recordingStatus) {
                recordingStatus.innerHTML = '<span style="color: var(--ba-navy);">↑</span> Sending message...';
            }
            
            // Briefly show sending animation before closing
            setTimeout(() => {
                // Add user message to chat
                addMessage('user', text);
                
                // Clear input and close popup
                transcriptionResult.innerHTML = '';
                voicePopup.classList.add('hidden');
                voicePopupOverlay.classList.add('hidden');
                stopRecording();
                resetVoiceUI();
                
                // Process the message (simulate response)
                processMessage(text);
                
                // Return focus to chat input
                chatInput.focus();
            }, 800);
        }
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Function to send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '' && !currentFile) {
            return;
        }
        
        // Add user message to chat
        if (message) {
            addMessage('user', message);
        }
        
        // Clear input
        chatInput.value = '';
        
        // Handle the file if any
        let fileData = null;
        if (currentFile) {
            fileData = {
                name: currentFile.name,
                type: currentFile.type,
                size: currentFile.size
            };
            // Clear the file input
            currentFile = null;
            fileInput.value = '';
            attachmentPreview.classList.add('hidden');
        }
        
        // Process the message
        processMessage(message, fileData);
    }
    
    // Process the message and get a response
    function processMessage(message, fileData = null, isVoiceInput = false) {
        // Show typing indicator
        showTypingIndicator();
        
        // Prepare the data to send
        const data = {
            message: message || ''
        };
        
        if (fileData) {
            data.file = fileData;
        }

        // Send to server and get response
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add the response to the chat
            if (data.response) {
                addMessage('assistant', data.response);
            } else if (data.error) {
                addMessage('assistant', 'Sorry, there was an error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator();
            addMessage('assistant', 'Sorry, there was an error processing your message.');
        });
    }
    
    // Function to add message to chat
    function addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
        }
        
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-indicator-container';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p><span class="typing-dots">Typing</span></p>
            </div>
        `;
        chatContainer.appendChild(typingDiv);
        scrollToBottom();
        
        // Add typing animation
        const typingDots = typingDiv.querySelector('.typing-dots');
        let dots = 1;
        const typingAnimation = setInterval(() => {
            dots = (dots % 3) + 1;
            typingDots.textContent = 'Typing' + '.'.repeat(dots);
        }, 500);
        
        // Store the interval ID in the element for later cleanup
        typingDiv.dataset.typingInterval = typingAnimation;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator-container');
        if (typingIndicator) {
            // Clear the interval
            clearInterval(typingIndicator.dataset.typingInterval);
            typingIndicator.remove();
        }
    }
    
    // Scroll to bottom of chat container
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Update voice control buttons based on current state
    function updateVoiceControls() {
        if (isRecording) {
            pauseRecording.disabled = isPaused;
            resumeRecording.disabled = !isPaused;
            resetRecording.disabled = false;
        } else {
            pauseRecording.disabled = true;
            resumeRecording.disabled = true;
            resetRecording.disabled = true;
            sendVoice.disabled = !transcriptionResult.textContent.trim();
        }
    }
    
    // Stop recording
    function stopRecording() {
        if (recognition && isRecording) {
            recognition.stop();
            isRecording = false;
            isPaused = false;
            recordingIndicator.classList.add('hidden');
            startRecording.querySelector('i').className = 'fas fa-microphone';
            animateWaveform(false);
            
            // Update status based on whether we have transcription
            if (recordingStatus) {
                if (transcriptionResult.textContent.trim() !== '') {
                    recordingStatus.innerHTML = '<span style="color: var(--ba-navy);">✓</span> Recording complete. You can send or reset.';
                } else {
                    recordingStatus.textContent = 'Recording stopped. Click microphone to try again.';
                }
            }
            
            updateVoiceControls();
        }
    }
    
    // Reset voice UI
    function resetVoiceUI() {
        stopRecording();
        transcriptionResult.innerHTML = '';
        sendVoice.disabled = true;
        pauseRecording.disabled = true;
        resumeRecording.disabled = true;
        resetRecording.disabled = true;
        startRecording.querySelector('i').className = 'fas fa-microphone';
        
        // Reset the status message
        if (recordingStatus) {
            recordingStatus.textContent = 'Click the microphone to start recording';
        }
        
        // Reset waveform
        waveformPath.setAttribute('d', 'M0,30 Q25,30 50,30 T100,30 T150,30 T200,30 T250,30 T300,30');
    }
    
    // Animate the waveform with improved visualization
    function animateWaveform(active) {
        if (active) {
            // Audio visualization simulation
            let lastValues = Array(20).fill(30); // Start with flat line
            
            function updateWaveform() {
                if (!isRecording || isPaused) return;
                
                const points = [];
                const totalPoints = 20;
                
                // Create a more natural-looking waveform that responds to "speech"
                for (let i = 0; i <= totalPoints; i++) {
                    const x = (i / totalPoints) * 300;
                    
                    // Edge points stay at baseline
                    if (i === 0 || i === totalPoints) {
                        points.push([x, 30]);
                        continue;
                    }
                    
                    // For inner points, create more natural movement
                    let prevVal = lastValues[i];
                    
                    // Add randomness but with some inertia from previous frame
                    let amplitude = Math.random() * 18 + 2;
                    
                    // Simulate "loud" bursts occasionally
                    if (Math.random() < 0.05) {
                        amplitude += 15;
                    }
                    
                    // Move toward the random target, but not all the way (smoother)
                    let targetY = 30 - amplitude + Math.random() * (amplitude/3);
                    let y = prevVal + (targetY - prevVal) * 0.3;
                    
                    // Store for next frame
                    lastValues[i] = y;
                    
                    points.push([x, y]);
                }
                
                // Convert points to SVG path with smoother curves
                let pathData = `M${points[0][0]},${points[0][1]}`;
                
                // Use cubic Bezier curves for smoother transitions
                for (let i = 1; i < points.length; i++) {
                    const [x, y] = points[i];
                    const [prevX, prevY] = points[i-1];
                    
                    // Control points for the cubic curve
                    const cp1x = prevX + (x - prevX) * 0.4;
                    const cp1y = prevY;
                    const cp2x = prevX + (x - prevX) * 0.6;
                    const cp2y = y;
                    
                    pathData += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
                }
                
                // Apply the new path
                waveformPath.setAttribute('d', pathData);
                
                // Continue animation if still recording
                if (isRecording && !isPaused) {
                    requestAnimationFrame(updateWaveform);
                }
            }
            
            // Start the animation
            requestAnimationFrame(updateWaveform);
        } else {
            // Smoothly animate back to flat line when inactive
            const flatPath = 'M0,30 Q25,30 50,30 T100,30 T150,30 T200,30 T250,30 T300,30';
            
            // Simple transition using CSS
            waveformPath.style.transition = 'd 0.5s ease-out';
            waveformPath.setAttribute('d', flatPath);
            
            // Reset transition after it completes
            setTimeout(() => {
                waveformPath.style.transition = '';
            }, 500);
        }
    }
    
    // Handle booking and destination tabs
    bookingTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            bookingTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
        });
    });
    
    destinationTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            destinationTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // In a real application, you would update the destination content here
            // based on which tab was clicked
            // updateDestinationContent(this.textContent.trim());
        });
    });
    
    // Function to update destination content (simplified demo version)
    function updateDestinationContent(destination) {
        const contentDiv = document.querySelector('.destination-content');
        let heading, description, image;
        
        switch(destination) {
            case 'London':
                heading = 'London - The heart of Britain';
                description = 'Experience world-class museums, historic landmarks, and vibrant cultural scenes in the British capital.';
                image = 'static/images/london-destination.jpg';
                break;
            case 'New York':
                heading = 'New York - The city that never sleeps';
                description = 'Discover the iconic skyline, Broadway shows, and diverse neighborhoods of the Big Apple.';
                image = 'static/images/newyork-destination.jpg';
                break;
            case 'Dubai':
                heading = 'Dubai - A luxury desert oasis';
                description = 'Experience the perfect blend of modern architecture, luxury shopping, and traditional Arabian culture.';
                image = 'static/images/dubai-destination.jpg';
                break;
            case 'Singapore':
                heading = 'Singapore - Where tradition meets innovation';
                description = 'Explore the Garden City with its stunning architecture, diverse cuisine, and rich cultural heritage.';
                image = 'static/images/singapore-destination.jpg';
                break;
            case 'Sydney':
                heading = 'Sydney - Australia\'s shining harbor city';
                description = 'Visit the iconic Opera House, beautiful beaches, and enjoy the laid-back Australian lifestyle.';
                image = 'static/images/sydney-destination.jpg';
                break;
            default:
                heading = 'London - The heart of Britain';
                description = 'Experience world-class museums, historic landmarks, and vibrant cultural scenes in the British capital.';
                image = 'static/images/london-destination.jpg';
        }
        
        // In a real app, you would update the actual content in the DOM
        console.log(`Updated destination to: ${destination}`);
    }
});
/**
 * Eclipse Challenge Detail Page
 * Loads and displays details for challenges with navigation between them
 */

// Global variables to track current challenge and total challenges
let currentChallengeIndex = 0;
let challengesData = [];

// Load Excel data and initialize the page
async function loadExcelData() {
    try {
        console.log("Loading Excel data...");
        
        // Load XLSB file from local directory
        const response = await fetch('./MISC/MainData.xlsb');
        const arrayBuffer = await response.arrayBuffer();
        
        console.log("File loaded, processing XLSB...");
        
        // Process Excel file with SheetJS
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {
            type: 'array',
            cellStyles: true,
            cellDates: true,
            cellNF: true
        });
        
        // Get first worksheet (challenges list)
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            raw: true,
            header: ['Placing', 'Challenge', 'Creator', 'Verifier', 'ID', 'Video', 'Punkte', 'Tags'],
            range: 1  // Skip header row
        });
        
        console.log("Excel data processed:", jsonData);
        
        // Get second worksheet (leaderboard/records)
        const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
        
        // Convert to array format (preserving rows and columns)
        const recordsData = XLSX.utils.sheet_to_json(secondSheet, { 
            header: 1,  // Use array format
            raw: true
        });
        
        console.log("Records data processed:", recordsData);
        
        // Store player records globally
        window.recordsData = recordsData;
        
        // Store challenges data globally
        challengesData = jsonData;
        
        // Get challenge ID from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const challengeId = urlParams.get('id');
        
        // If challenge ID is in URL, find its index
        if (challengeId) {
            const index = challengesData.findIndex(challenge => 
                String(challenge.ID) === String(challengeId));
            console.log("Suche Challenge mit ID", challengeId, "gefunden bei Index:", index);
            currentChallengeIndex = index >= 0 ? index : 0;
        }
        
        // Display the current challenge
        displayCurrentChallenge();
    } catch (error) {
        console.error('Error loading Excel file:', error);
        // Use fallback data if Excel loading fails
        console.log("Using fallback data...");
        useFallbackData();
    }
}

// Fallback data in case Excel loading fails
function useFallbackData() {
    challengesData = [{
        Placing: 1,
        Challenge: "Fenchelhonig",
        Creator: "MentosTeeGD",
        Verifier: "SFApfel",
        ID: "117571746",
        Video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
        Punkte: 100,
        Tags: "EXTREME;Ship;Modern"
    }];
    
    // Fallback records data
    window.recordsData = [
        ["PLAYER", "MentosTeeGD", "SFApfel", "yJulien", "komqetenter", "xenok1", "peul"],
        ["POINTS", "175", "100", "131", "30", "58", "43"],
        ["Fenchelhonig", "", "https://www.youtube.com/watch?v=dQw4w9WgXcQ;01.01.2025", "", "", "", ""],
        ["Fledermaus", "https://www.youtube.com/watch?v=dQw4w9WgXcQ;15.01.2025", "", "", "", "", ""]
    ];
    
    displayCurrentChallenge();
}

// Extract records for a specific challenge from recordsData
function getRecordsForChallenge(challengeName) {
    if (!window.recordsData || !challengeName) {
        console.warn("No records data available or invalid challenge name");
        return [];
    }
    
    console.log("Suche Einträge für Challenge:", challengeName);
    
    // Find the row index for this challenge
    const challengeRowIndex = window.recordsData.findIndex(row => 
        row[0] && String(row[0]) === String(challengeName));
    
    if (challengeRowIndex === -1) {
        console.warn(`Challenge "${challengeName}" not found in records data`);
        return [];
    }
    
    console.log("Challenge gefunden bei Index:", challengeRowIndex);
    
    const challengeRow = window.recordsData[challengeRowIndex];
    const records = [];
    
    // First row contains player names
    const playerNames = window.recordsData[0];
    
    console.log("Challenge Row:", challengeRow);
    console.log("Player Names:", playerNames);
    
    // Find all players who completed this challenge (ANY non-empty entry counts as completion)
    for (let i = 1; i < challengeRow.length; i++) {
        const cellContent = challengeRow[i];
        
        // Debug ausgabe für jede Zelle
        console.log(`Zelle [${i}] für Spieler ${playerNames[i]}:`, cellContent);
        
        // Prüfen ob die Zelle einen Wert hat (egal welchen)
        if (cellContent !== undefined && cellContent !== null && cellContent !== "") {
            console.log(`Spieler ${playerNames[i]} hat die Challenge abgeschlossen`);
            
            // Initialize variables for video link and completion date
            let videoLink = null;
            let completionDate = "Unknown Date";
            
            // Convert cell content to string for processing
            const cellStr = String(cellContent);
            
            if (cellStr.includes(';')) {
                const parts = cellStr.split(';');
                
                // Check if first part contains "youtube" as a video link
                if (parts[0] && (parts[0].includes('youtube') || parts[0].includes('youtu.be'))) {
                    videoLink = parts[0].trim();
                }
                
                // Second part should be the date
                if (parts.length > 1 && parts[1].trim()) {
                    completionDate = parts[1].trim();
                }
            } else {
                // If there's no semicolon, assume it might be a date
                if (cellStr.match(/\d{2}\.\d{2}\.\d{4}/)) {
                    completionDate = cellStr.trim();
                }
            }
            
            console.log(`Eintrag für ${playerNames[i]}: Video=${videoLink}, Datum=${completionDate}`);
            
            records.push({
                player: playerNames[i],
                videoLink: videoLink,
                date: completionDate
            });
        }
    }
    
    console.log(`Insgesamt ${records.length} Einträge gefunden für ${challengeName}`);
    
    return records;
}

// Helper function to parse German date format (DD.MM.YYYY)
function parseGermanDate(dateStr) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        // Format: day.month.year
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS Date
        const year = parseInt(parts[2], 10);
        
        return new Date(year, month, day);
    }
    return new Date(0); // Return epoch if parsing fails
}

// Display the current challenge based on currentChallengeIndex
function displayCurrentChallenge() {
    if (challengesData.length === 0) {
        console.error("No challenge data available!");
        return;
    }
    
    const challenge = challengesData[currentChallengeIndex];
    console.log("Displaying challenge:", challenge);
    
    // Get real records for this challenge
    let challengeRecords = getRecordsForChallenge(challenge.Challenge);
    console.log("Records found before filtering:", challengeRecords);
    
    // Remove the verifier from the records list to avoid duplication
    const verifier = challenge.Verifier;
    if (verifier) {
        console.log("Filtering out verifier:", verifier);
        challengeRecords = challengeRecords.filter(record => record.player !== verifier);
        console.log("Records after filtering:", challengeRecords);
    }
    
    // Extract data from challenge
    const challengeData = {
        name: challenge.Challenge || "Unknown",
        creator: challenge.Creator || "Unknown",
        verifier: challenge.Verifier || "Unknown",
        videoId: getYoutubeVideoId(challenge.Video) || "dQw4w9WgXcQ", // Fallback video ID
        levelId: challenge.ID || "0",
        points: challenge.Punkte || 0,
        placing: challenge.Placing || 0,
        records: challengeRecords
    };
    
    // Render challenge details and records
    renderChallengeDetail(challengeData);
    renderRecordsSection(challengeData);
    
    // Update URL with challenge ID for direct linking
    updateURL(challenge.ID);
}

// Extract YouTube video ID from URL
function getYoutubeVideoId(url) {
    if (!url) return null;
    
    // Match YouTube video ID from various URL formats
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    return match && match[1] ? match[1] : null;
}

// Navigate to previous challenge
function navigatePrevious() {
    if (challengesData.length === 0) return;
    
    // Go to the last challenge if currently on the first one
    if (currentChallengeIndex === 0) {
        currentChallengeIndex = challengesData.length - 1;
    } else {
        currentChallengeIndex--;
    }
    
    displayCurrentChallenge();
}

// Navigate to next challenge
function navigateNext() {
    if (challengesData.length === 0) return;
    
    // Go to the first challenge if currently on the last one
    if (currentChallengeIndex === challengesData.length - 1) {
        currentChallengeIndex = 0;
    } else {
        currentChallengeIndex++;
    }
    
    displayCurrentChallenge();
}

// Update URL with challenge ID for direct linking
function updateURL(challengeId) {
    if (!challengeId) return;
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('id', challengeId);
    window.history.replaceState({}, '', newUrl);
}

// Generate challenge detail HTML
function renderChallengeDetail(challengeData) {
    const detailContainer = document.querySelector('.challenge-detail');
    
    if (!detailContainer) {
        console.error("Challenge-detail container not found!");
        return;
    }
    
    // Create HTML for challenge details
    const detailHtml = `
        <div class="challenge-detail-container roblox-ui">
            <div class="challenge-title-container">
                <span class="nav-arrow" onclick="navigatePrevious()">&lt;</span>
                <div class="challenge-title-main">#${challengeData.placing} - ${challengeData.name}</div>
                <span class="nav-arrow" onclick="navigateNext()">&gt;</span>
            </div>
            
            <div class="challenge-creator">by ${challengeData.creator}</div>
            
            <div class="video-container" style="overflow: hidden; line-height: 0; font-size: 0; padding: 0; margin: 0 auto 25px auto;">
                <img src="https://i.ytimg.com/vi/${challengeData.videoId}/maxresdefault.jpg" 
                     onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${challengeData.videoId}/hqdefault.jpg';"
                     alt="${challengeData.name}" class="challenge-video" style="width: 100%; height: auto; display: block; margin: 0; padding: 0;">
                <div class="play-button-large" onclick="playVideo('${challengeData.videoId}')"></div>
            </div>
            
            <div class="challenge-info-grid">
                <div class="info-block">
                    <div class="info-label">Level ID:</div>
                    <div class="info-value">${challengeData.levelId}</div>
                </div>
                
                <div class="info-block">
                    <div class="info-label">Points Awarded</div>
                    <div class="info-value">
                        <span class="points-badge-large">${Math.floor(challengeData.points)}</span>
                    </div>
                </div>
                
                <div class="info-block">
                    <div class="info-label">Verifier:</div>
                    <div class="info-value">${challengeData.verifier}</div>
                </div>
            </div>
        </div>
    `;
    
    detailContainer.innerHTML = detailHtml;
}

// Generate records section HTML
function renderRecordsSection(challengeData) {
    const recordsContainer = document.querySelector('.records-section');
    
    if (!recordsContainer) {
        console.error("Records container not found!");
        return;
    }
    
    console.log("Rendering records section with data:", challengeData.records);
    
    // Create HTML for records rows
    let recordRows = '';
    challengeData.records.forEach(record => {
        // Check if there's a valid YouTube link
        const hasValidYoutubeLink = record.videoLink && 
            (record.videoLink.includes('youtube') || record.videoLink.includes('youtu.be'));
            
        recordRows += `
            <div class="record-row">
                <div class="record-cell">${record.player}</div>
                <div class="record-cell">
                    ${hasValidYoutubeLink ? 
                        `<a href="${record.videoLink}" target="_blank" class="video-link">
                            YouTube
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                        </a>` 
                        : ''
                    }
                    <span class="record-date">${record.date !== "Unknown Date" ? record.date : ""}</span>
                </div>
            </div>
        `;
    });
    
    // Create HTML for records section with CSS for date display
    const recordsHtml = `
        <style>
            .record-date {
                margin-left: 10px;
                font-size: 12px;
                color: var(--text-secondary);
                opacity: 0.8;
            }
        </style>
        <div class="records-container roblox-ui">
            <h2 class="records-title">Records</h2>
            
            <p class="records-subtitle">100% or better required to qualify</p>
            <p class="records-count">${challengeData.records.length} completions overall registered.</p>
            
            <div class="records-header">
                <div class="records-header-cell">Record Holder</div>
                <div class="records-header-cell">Video Proof</div>
            </div>
            
            ${recordRows.length > 0 ? recordRows : '<div class="record-row"><div class="record-cell" style="grid-column: span 2; text-align: center;">No completions registered yet</div></div>'}
        </div>
    `;
    
    recordsContainer.innerHTML = recordsHtml;
}

// Play video function
function playVideo(videoId) {
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) return;
    
    // Create and insert YouTube iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.className = "challenge-video";
    
    // Replace thumbnail with iframe
    videoContainer.innerHTML = '';
    videoContainer.appendChild(iframe);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing challenge details...");
    loadExcelData();
    
    // Expose navigation functions to global scope
    window.navigatePrevious = navigatePrevious;
    window.navigateNext = navigateNext;
    window.playVideo = playVideo;
});

// If DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        console.log("Page already loaded, initializing challenge details...");
        loadExcelData();
        
        // Expose navigation functions to global scope
        window.navigatePrevious = navigatePrevious;
        window.navigateNext = navigateNext;
        window.playVideo = playVideo;
    }, 1);
}
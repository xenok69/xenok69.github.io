// Funktion zum Laden und Verarbeiten der Excel-Datei
async function loadExcelData() {
    try {
        console.log("Starte Laden der Excel-Datei...");
        
        // XLSB-Datei aus dem lokalen Verzeichnis laden
        const response = await fetch('./MISC/MainData.xlsb');
        const arrayBuffer = await response.arrayBuffer();
        
        console.log("Datei geladen, verarbeite XLSB...");
        
        // Excel-Datei mit SheetJS verarbeiten
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, {
            type: 'array',
            cellStyles: true,
            cellDates: true,
            cellNF: true
        });
        
        // Sheet-Namen anzeigen
        console.log("Verfügbare Arbeitsblätter:", workbook.SheetNames);
        
        // Erstes Arbeitsblatt auslesen
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // In JSON konvertieren (ohne Zeilen zu überspringen)
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            raw: true,
            header: ['Placing', 'Challenge', 'Creator', 'Verifier', 'ID', 'Video', 'Punkte', 'Tags'],
            range: 1  // Überspringt nur die Header-Zeile
        });
        console.log("Daten aus Excel:", jsonData);
        
        // Challenges generieren
        generateChallenges(jsonData);
    } catch (error) {
        console.error('Fehler beim Laden der Excel-Datei:', error);
        console.log("Verwende Fallback-Daten...");
        useFixedData();
    }
}

// Fallback zu fest codierten Daten, wenn Excel nicht geladen werden kann
function useFixedData() {
    const fixedData = [
        { 
            Placing: 0, 
            Challenge: "UNBEKANNT", 
            Creator: "UNBEKANNT", 
            Verifier: "UNBEKANNT", 
            ID: "UNBEKANNT", 
            Video: "", 
            Punkte: 0,
            Tags: "UNBEKANNT;UNBEKANNT;UNBEKANNT"
        }
    ];
    
    generateChallenges(fixedData);
}

// Funktion zum Generieren der HTML-Struktur für jede Challenge im neuen Roblox-Stil
function generateChallenges(data) {
    const challengeListElement = document.querySelector('.challenge-list');
    
    if (!challengeListElement) {
        console.error("Challenge-List Container nicht gefunden!");
        return;
    }
    
    // Vorhandene Scripts identifizieren
    const scripts = Array.from(challengeListElement.querySelectorAll('script'));
    
    // Container leeren
    challengeListElement.innerHTML = '';
    
    // Scripts wieder einfügen
    scripts.forEach(script => {
        challengeListElement.appendChild(script);
    });
    
    console.log(`Erstelle ${data.length} Challenges...`);
    
    // Für jede Zeile in den Excel-Daten eine Challenge erstellen
    data.forEach((row, index) => {
        console.log(`Erstelle Challenge für:`, row);
        
        // Challenge-Daten sicherstellen (mit Fallback-Werten)
        const challengeData = {
            Placing: row.Placing || index + 1,
            Name: row.Challenge || "Unbenannt",
            Creator: row.Creator || "Unbekannt",
            Verifier: row.Verifier || "Unbekannt",
            ID: row.ID || "0",
            Video: row.Video || "",
            Punkte: row.Punkte || 0,
            Tags: row.Tags || ""
        };
        
        // Tags verarbeiten, wenn vorhanden
        const tags = challengeData.Tags ? challengeData.Tags.split(';') : [];
        
        // Prüfen, ob ein YouTube-Link vorhanden ist und daraus Thumbnail und Embed generieren
        let videoEmbed = '';
        let videoInfo = getYoutubeInfo(challengeData.Video);
        
        if (videoInfo) {
            // Verwende ein qualitativ hochwertiges Thumbnail mit maxresdefault oder hqdefault
            videoEmbed = `
                <div class="youtube-container" data-video-id="${videoInfo.videoId}">
                    <div class="thumbnail-container">
                        <img src="https://i.ytimg.com/vi/${videoInfo.videoId}/maxresdefault.jpg" 
                             onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${videoInfo.videoId}/hqdefault.jpg';" 
                             alt="${challengeData.Name}" class="youtube-thumbnail">
                        <div class="play-button" onclick="playVideo('${videoInfo.videoId}', this)"></div>
                    </div>
                </div>`;
        } else {
            // Fallback ohne Video
            videoEmbed = `
                <div class="thumbnail-container">
                    <img src="https://github.com/xenok69/xenok69.github.io/blob/main/ECL/ICONS/NoVideo.png?raw=true" alt="${challengeData.Name}" class="youtube-thumbnail">
                    <div class="play-button"></div>
                </div>`;
        }
        
        // Challenge-Div erstellen
        const challengeDiv = document.createElement('div');
        challengeDiv.className = 'challenge';
        
        // HTML für die Challenge im neuen Roblox-Stil generieren
        challengeDiv.innerHTML = `
            <div class="youtube-embed">
                ${videoEmbed}
            </div>
            <div class="challenge-info">
                <div class="challenge-title">#${challengeData.Placing} - ${challengeData.Name}</div>
                <div class="info-grid">
                    <div class="info-label">Creator:</div>
                    <div class="info-value">${challengeData.Creator}</div>
                    
                    <div class="info-label">Verifier:</div>
                    <div class="info-value">${challengeData.Verifier}</div>
                    
                    <div class="info-label">ID:</div>
                    <div class="info-value">${challengeData.ID}</div>
                    
                    <div class="info-label">Points:</div>
                    <div class="points-value">
                        <span class="points-badge">${Math.round(challengeData.Punkte)}</span>
                    </div>
                </div>
                <div class="challenge-tags">
                    ${getTagHtml(tags)}
                </div>
            </div>
        `;
        
        // Challenge zum Container hinzufügen
        challengeListElement.appendChild(challengeDiv);
    });
    
    console.log("Challenges erstellt");
    
    // Script zur Steuerung der YouTube-Einbettung hinzufügen
    addYoutubeControlScript();
}

// Funktion zum Hinzufügen des YouTube-Steuerungsskripts
function addYoutubeControlScript() {
    // Prüfen, ob das Script bereits existiert
    if (document.getElementById('youtube-control-script')) {
        return;
    }
    
    const script = document.createElement('script');
    script.id = 'youtube-control-script';
    script.textContent = `
        function playVideo(videoId, playButtonElement) {
            // Eltern-Container finden
            const container = playButtonElement.closest('.youtube-container');
            if (!container) return;
            
            // Thumbnail-Container entfernen
            const thumbnailContainer = container.querySelector('.thumbnail-container');
            if (thumbnailContainer) {
                thumbnailContainer.remove();
            }
            
            // YouTube iFrame einfügen
            const iframe = document.createElement('iframe');
            iframe.src = \`https://www.youtube.com/embed/\${videoId}?autoplay=1&rel=0\`;
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            
            container.appendChild(iframe);
        }
    `;
    
    document.body.appendChild(script);
}

// Hilfsfunktion zum Extrahieren der YouTube-Video-Informationen
function getYoutubeInfo(url) {
    if (!url) return null;
    
    // Für Standard-YouTube-Links
    let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    if (match && match[1]) {
        return {
            videoId: match[1],
            type: 'youtube'
        };
    }
    
    return null;
}

// Hilfsfunktion zum Generieren des HTML-Codes für Tags mit den richtigen CSS-Klassen
function getTagHtml(tags) {
    if (!tags || tags.length === 0) {
        return '';
    }
    
    let tagHtml = '';
    
    // Ersten Tag als Schwierigkeitsgrad behandeln
    if (tags[0]) {
        tagHtml += `<span class="tag difficulty">${tags[0]}</span>`;
    }
    
    // Zweiten Tag als Spielstil behandeln
    if (tags[1]) {
        tagHtml += `<span class="tag style">${tags[1]}</span>`;
    }
    
    // Dritten Tag als Gameplay behandeln
    if (tags[2]) {
        tagHtml += `<span class="tag gameplay">${tags[2]}</span>`;
    }
    
    // Alle weiteren Tags als normale Tags
    for (let i = 3; i < tags.length; i++) {
        if (tags[i] && tags[i].trim() !== '') {
            tagHtml += `<span class="tag">${tags[i]}</span>`;
        }
    }
    
    return tagHtml;
}

// Funktion beim Laden der Seite ausführen
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM geladen, starte Excel-Verarbeitung...");
    loadExcelData();
});

// Falls DOMContentLoaded bereits gefeuert wurde
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Seite bereits geladen, starte Excel-Verarbeitung...");
    setTimeout(loadExcelData, 1);
}
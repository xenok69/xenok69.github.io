// Funktion zum Laden und Verarbeiten der Excel-Datei
async function loadExcelData() {
    try {
        console.log("Starte Laden der Excel-Datei...");
        
        // XLSB-Datei aus dem lokalen Verzeichnis laden
        const response = await fetch('./MainData.xlsb');
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
            Name: "UNBEKANNT", 
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

// Funktion zum Generieren der HTML-Struktur für jede Challenge
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
        
        // Challenge-Div erstellen
        const challengeDiv = document.createElement('div');
        challengeDiv.className = 'challenge';
        
        // HTML für die Challenge generieren
        challengeDiv.innerHTML = `
            <div class="youtube-embed">
                ${challengeData.Video ? `<iframe src="${challengeData.Video}" frameborder="0" allowfullscreen></iframe>` : ''}
            </div>
            <div class="challenge-info">
                <div class="challenge-title">#${challengeData.Placing} - ${challengeData.Name}</div>
                <div class="description">Creator: ${challengeData.Creator}</div>
                <div class="description">Verifier: ${challengeData.Verifier}</div>
                <div class="description">ID: ${challengeData.ID}</div>
                <div class="description">Points: ${Math.floor(challengeData.Punkte)}</div>
                <div class="challenge-tags">
                    ${tags[0] ? `<span class="tag difficulty">${tags[0]}</span>` : ''}
                    ${tags[1] ? `<span class="tag gameplay">${tags[1]}</span>` : ''}
                    ${tags[2] ? `<span class="tag style">${tags[2]}</span>` : ''}
                    ${tags.slice(3).map(tag => tag ? `<span class="tag">${tag}</span>` : '').join('')}
                </div>
            </div>
        `;
        
        // Challenge zum Container hinzufügen
        challengeListElement.appendChild(challengeDiv);
    });
    
    console.log("Challenges erstellt");
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
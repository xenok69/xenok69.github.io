/**
 * Leaderboard Processor für Geometry Dash Challenge Leaderboard
 * Verarbeitet Spielerdaten, zählt abgeschlossene Challenges und sortiert die Spieler nach Punkten
 * Integriert GDBrowser API für Spieler-Icons
 */

// GDBrowser API für Spieler-Profildaten und Icons
async function fetchGDUserData(username) {
    try {
        const response = await fetch(`https://gdbrowser.com/api/profile/${encodeURIComponent(username)}`);
        
        if (!response.ok) {
            console.warn(`Konnte keine GD-Daten für ${username} laden, Status: ${response.status}`);
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Fehler beim Abrufen der GD-Daten für ${username}:`, error);
        return null;
    }
}

// GD Icon URLs basierend auf Spieler-Daten generieren
function getGDIconUrls(userData) {
   if (!userData) return null;
   
   // RGB-Werte extrahieren
   const primaryColor = userData.col1RGB ? 
       `${userData.col1RGB.r},${userData.col1RGB.g},${userData.col1RGB.b}` : 
       userData.col1 || "3";
       
   const secondaryColor = userData.col2RGB ? 
       `${userData.col2RGB.r},${userData.col2RGB.g},${userData.col2RGB.b}` : 
       userData.col2 || "2";
   
   // URL mit RGB-Werten erstellen
   const cubeUrl = `https://gdbrowser.com/icon/icon?icon=${userData.icon}&form=cube&col1=${primaryColor}&col2=${secondaryColor}${userData.glow ? "&glow=1" : ""}`;
   
   return {
       cube: cubeUrl
   };
}

// Hauptfunktion zum Verarbeiten der Daten und Generieren des Leaderboards
function processLeaderboard(data) {
   // Spielerinformationen extrahieren
   const players = [];
   
   // Ab Spalte 1 (B) alle Spieler extrahieren
   for (let col = 1; col < data[0].length; col++) {
       if (data[0][col] && data[0][col].trim() !== '' && data[0][col] !== 'NULL') {
           const playerName = data[0][col];
           const playerPoints = parseInt(data[1][col]) || 0;
           
           players.push({
               name: playerName,
               points: playerPoints,
               completed: 0
           });
       }
   }
   
   // Wenn keine gültigen Spieler gefunden wurden, verwende Testdaten
   if (players.length === 0) {
       return generateLeaderboardHTML([
           { name: "NULL", points: 0, completed: 0 }
       ], 1);
   }
   
   // Gesamtzahl der Challenges berechnen (zähle nicht-leere Einträge in Spalte A ab Zeile 2)
   let totalChallenges = 0;
   for (let i = 2; i < data.length; i++) {
       if (data[i] && data[i][0] && data[i][0].trim() !== '' && data[i][0] !== 'NULL') {
           totalChallenges++;
       }
   }
   
   // Bei leeren Daten oder wenn keine Challenges gefunden wurden
   if (totalChallenges === 0) {
       totalChallenges = 1; // Standardwert
   }
   
   // Zähle abgeschlossene Challenges für jeden Spieler
   for (let i = 2; i < data.length; i++) {
       // Überspringe, wenn diese Zeile keinen Challenge-Namen hat
       if (!data[i] || !data[i][0] || data[i][0].trim() === '' || data[i][0] === 'NULL') {
           continue;
       }
       
       // Überprüfe für jeden Spieler, ob die Challenge abgeschlossen ist
       for (let j = 0; j < players.length; j++) {
           const playerCol = j + 1;
           if (data[i] && data[i][playerCol] === 'x') {
               players[j].completed++;
           }
       }
   }
   
   // Sortiere Spieler nach Punkten (absteigend)
   players.sort((a, b) => b.points - a.points);
   
   // Generiere HTML für das Leaderboard
   return generateLeaderboardHTML(players, totalChallenges);
}

// Generiere HTML für das Leaderboard im Challenge-Stil mit größeren Icons
function generateLeaderboardHTML(players, totalChallenges) {
    let html = '';
    
    players.forEach((player, index) => {
        const playerId = `player-${index}`;
        
        html += `
            <div class="challenge" id="${playerId}">
                <div class="gd-icon-container" id="icon-${playerId}" style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; padding: 0; margin: auto 15px auto 15px;">
                    <!-- Icon wird per JS hier eingefügt -->
                    <div class="icon-placeholder" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                        <svg width="60" height="60" viewBox="0 0 100 100">
                            ${index === 0 ? 
                                `<rect x="20" y="20" width="25" height="25" fill="white" />
                                <rect x="55" y="20" width="25" height="25" fill="white" />
                                <rect x="20" y="55" width="60" height="25" fill="white" />` :
                                `<rect x="35" y="35" width="30" height="30" fill="white" />`
                            }
                        </svg>
                    </div>
                </div>
                <div class="challenge-info" style="padding: 10px; padding-top: 5px;">
                    <div class="challenge-title" style="margin-top: 0; margin-bottom: 8px;">#${index + 1} - ${player.name}</div>
                    <div class="info-grid" style="margin-bottom: 8px;">
                        <div class="info-label">Completed:</div>
                        <div class="info-value">${player.completed} / ${totalChallenges}</div>
                        
                        <div class="info-label">Points:</div>
                        <div class="points-value">
                            <span class="points-badge">${player.points}</span>
                        </div>
                    </div>
                </div>  
            </div>
        `;
    });
    
    return html;
 }
// XLSB-Datei laden und verarbeiten
async function loadXLSBFile() {
   try {
       // XLSB-Datei aus dem lokalen Verzeichnis laden
       const response = await fetch('./MISC/MainData.xlsb');
       
       if (!response.ok) {
           throw new Error(`HTTP-Fehler! Status: ${response.status}`);
       }
       
       const arrayBuffer = await response.arrayBuffer();
       
       // XLSB-Datei mit SheetJS verarbeiten
       const data = new Uint8Array(arrayBuffer);
       const workbook = XLSX.read(data, {
           type: 'array',
           cellStyles: true,
           cellDates: true,
           cellNF: true
       });
       
       // WICHTIGER UNTERSCHIED: Wir verwenden die ZWEITE Tabelle (Index 1) anstatt der ersten
       if (workbook.SheetNames.length < 2) {
           console.error("Die Excel-Datei enthält weniger als zwei Arbeitsblätter!");
           return null;
       }
       
       const leaderboardSheet = workbook.Sheets[workbook.SheetNames[1]];
       
       // In Array konvertieren
       const sheetData = XLSX.utils.sheet_to_json(leaderboardSheet, { header: 1 });
       
       return sheetData;
   } catch (error) {
       console.error('Fehler beim Laden der XLSB-Datei:', error);
       return null;
   }
}

// Funktion zum Laden der Testdaten (für Debugging-Zwecke)
function loadTestData() {
   return [
       ["PLAYER", "MentosTeeDG", "SFApfel", "yJulieen"],
       ["POINTS", "174", "100", "131"],
       ["Fenchelhonig", "", "x", ""],
       ["Fledermaus", "x", "", ""],
       ["Fotosynthese", "", "", "x"],
       ["so CRACKED", "", "", ""],
       ["Silent Steissbein", "x", "", "x"],
       ["almost alright", "x", "", ""],
       ["Apfel Never Clear", "x", "", "x"],
       ["celeste", "x", "", "x"]
   ];
}

// Lädt Icons für alle Spieler im Leaderboard
async function loadGDIcons(players) {
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player.name && player.name !== 'NULL') {
            const userData = await fetchGDUserData(player.name);
            if (userData) {
                const iconUrls = getGDIconUrls(userData);
                const iconContainer = document.getElementById(`icon-player-${i}`);
                
                if (iconContainer && iconUrls) {
                    // Icon-Bild erstellen und einfügen
                    const img = document.createElement('img');
                    img.src = iconUrls.cube;
                    img.alt = `${player.name} Icon`;
                    img.style.width = '85%';        // Größeres Icon aber mit etwas Rand
                    img.style.height = '85%';       // Größeres Icon aber mit etwas Rand
                    img.style.objectFit = 'contain';
                    img.style.margin = 'auto';     // Für bessere Zentrierung
                    img.style.display = 'block';    // Blockdisplay für Zentrierung
                    img.style.backgroundColor = 'transparent';
                    
                    // Placeholder entfernen und neues Bild einfügen
                    iconContainer.innerHTML = '';
                    iconContainer.appendChild(img);
                }
            }
        }
    }
 }

// Hauptfunktion zum Initialisieren des Leaderboards
async function initLeaderboard() {
   let data;
   
   try {
       // Versuche, XLSB-Datei zu laden
       data = await loadXLSBFile();
   } catch (error) {
       console.warn('XLSB-Datei konnte nicht geladen werden:', error);
   }
   
   // Wenn keine Daten geladen werden konnten, verwende Testdaten
   if (!data || data.length < 2) {
       data = loadTestData();
   }
   
   // Prüfen, ob die Daten gültig sind
   if (!data || data.length === 0) {
       document.querySelector('.challenge-list').innerHTML = "<div class='challenge'>Keine Daten verfügbar!</div>";
       return;
   }
   
   // Extrahiere Spieler für spätere Icon-Ladung
   const players = [];
   for (let col = 1; col < data[0].length; col++) {
       if (data[0][col] && data[0][col].trim() !== '' && data[0][col] !== 'NULL') {
           players.push({
               name: data[0][col],
               points: parseInt(data[1][col]) || 0
           });
       }
   }
   
   // Sortiere nach Punkten
   players.sort((a, b) => b.points - a.points);
   
   // Leaderboard verarbeiten und anzeigen
   const leaderboardHtml = processLeaderboard(data);
   
   // In die challenge-list einfügen
   const challengeListElement = document.querySelector('.challenge-list');
   if (challengeListElement) {
       // Vorhandene Scripts identifizieren und behalten
       const scripts = Array.from(challengeListElement.querySelectorAll('script'));
       
       // Container leeren
       challengeListElement.innerHTML = '';
       
       // Scripts wieder einfügen
       scripts.forEach(script => {
           challengeListElement.appendChild(script);
       });
       
       // Leaderboard HTML einfügen
       const tempDiv = document.createElement('div');
       tempDiv.innerHTML = leaderboardHtml;
       while (tempDiv.firstChild) {
           challengeListElement.appendChild(tempDiv.firstChild);
       }
       
       // GD-Icons für alle Spieler laden
       loadGDIcons(players);
   } else {
       console.error('Element .challenge-list nicht gefunden');
   }
}

// Starte die Initialisierung, wenn die Seite vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
   initLeaderboard();
});

// Falls DOMContentLoaded bereits gefeuert wurde
if (document.readyState === 'complete' || document.readyState === 'interactive') {
   setTimeout(initLeaderboard, 1);
}
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
     
     // URL mit allen Parametern für die korrekten Farben
     const cubeUrl = `https://gdbrowser.com/icon/icon?icon=${userData.icon}&form=cube&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`;
     console.log(`Generiere Icon-URL für ${userData.username}:`, cubeUrl);
     
     return {
         cube: cubeUrl,
         ship: `https://gdbrowser.com/icon/icon?icon=${userData.ship}&form=ship&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`,
         ball: `https://gdbrowser.com/icon/icon?icon=${userData.ball}&form=ball&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`,
         ufo: `https://gdbrowser.com/icon/icon?icon=${userData.ufo}&form=ufo&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`,
         wave: `https://gdbrowser.com/icon/icon?icon=${userData.wave}&form=wave&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`,
         robot: `https://gdbrowser.com/icon/icon?icon=${userData.robot}&form=robot&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`,
         spider: `https://gdbrowser.com/icon/icon?icon=${userData.spider}&form=spider&col1=${userData.col1}&col2=${userData.col2}${userData.glow ? "&glow=1" : ""}`
     };
 }
 
 // Hauptfunktion zum Verarbeiten der Daten und Generieren des Leaderboards
 function processLeaderboard(data) {
     console.log("Verarbeite Daten:", data);
     
     // Spielerinformationen extrahieren
     const players = [];
     
     // Ab Spalte 1 (B) alle Spieler extrahieren
     for (let col = 1; col < data[0].length; col++) {
         if (data[0][col] && data[0][col].trim() !== '' && data[0][col] !== 'NULL') {
             const playerName = data[0][col];
             const playerPoints = parseInt(data[1][col]) || 0;
             
             console.log(`Spieler gefunden: ${playerName} mit ${playerPoints} Punkten`);
             
             players.push({
                 name: playerName,
                 points: playerPoints,
                 completed: 0
             });
         }
     }
     
     // Wenn keine gültigen Spieler gefunden wurden, verwende Testdaten
     if (players.length === 0) {
         console.log("Keine gültigen Spieler gefunden. Verwende Testdaten.");
         return generateLeaderboardHTML([
             { name: "NULL", points: 0, completed: 0 }
         ], 1);
     }
     
     // Gesamtzahl der Challenges berechnen (zähle nicht-leere Einträge in Spalte A ab Zeile 2)
     let totalChallenges = 0;
     for (let i = 2; i < data.length; i++) {
         if (data[i] && data[i][0] && data[i][0].trim() !== '' && data[i][0] !== 'NULL') {
             totalChallenges++;
             console.log(`Challenge gefunden: ${data[i][0]}`);
         }
     }
     
     // Bei leeren Daten oder wenn keine Challenges gefunden wurden
     if (totalChallenges === 0) {
         totalChallenges = 1; // Standardwert
         console.log("Keine oder leere Challenge-Liste. Setze totalChallenges auf 1.");
     }
     
     // Zähle abgeschlossene Challenges für jeden Spieler
     // Überprüfe nur Zeilen, die gültige Challenges haben (Optimierung)
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
                 console.log(`Spieler ${players[j].name} hat Challenge ${data[i][0]} abgeschlossen`);
             }
         }
     }
     
     // Sortiere Spieler nach Punkten mit Bubblesort (absteigend)
     bubbleSortByPoints(players);
     
     // Generiere HTML für das Leaderboard
     return generateLeaderboardHTML(players, totalChallenges);
 }
 
 // Bubblesort-Algorithmus zum Sortieren der Spieler nach Punkten (absteigend)
 function bubbleSortByPoints(players) {
     const n = players.length;
     
     for (let i = 0; i < n - 1; i++) {
         for (let j = 0; j < n - i - 1; j++) {
             if (players[j].points < players[j + 1].points) {
                 // Tausche Spieler
                 const temp = players[j];
                 players[j] = players[j + 1];
                 players[j + 1] = temp;
             }
         }
     }
     
     return players;
 }
 
 // Generiere HTML für das Leaderboard
 function generateLeaderboardHTML(players, totalChallenges) {
     let html = '';
     
     players.forEach((player, index) => {
         const playerId = `player-${index}`;
         
         html += `
             <div class="challenge" id="${playerId}">
                 <div class="gd-icon-container" id="icon-${playerId}">
                     <!-- Icon wird per JS hier eingefügt -->
                 </div>
                 <div class="challenge-info">
                     <div class="challenge-title">#${index + 1} - ${player.name}</div>
                     <div class="description">Points: ${player.points}</div>
                     <div class="description">Completed: ${player.completed} / ${totalChallenges}</div>
                 </div>  
             </div>
         `;
     });
     
     return html;
 }
 
 // XLSB-Datei laden und verarbeiten
 async function loadXLSBFile() {
     try {
         console.log("Starte Laden der XLSB-Datei...");
         
         // XLSB-Datei aus dem lokalen Verzeichnis laden
         const response = await fetch('./MISC/MainData.xlsb');
         
         if (!response.ok) {
             throw new Error(`HTTP-Fehler! Status: ${response.status}`);
         }
         
         const arrayBuffer = await response.arrayBuffer();
         
         console.log("Datei geladen, verarbeite XLSB...");
         
         // XLSB-Datei mit SheetJS verarbeiten
         const data = new Uint8Array(arrayBuffer);
         const workbook = XLSX.read(data, {
             type: 'array',
             cellStyles: true,
             cellDates: true,
             cellNF: true
         });
         
         // Sheet-Namen anzeigen
         console.log("Verfügbare Arbeitsblätter:", workbook.SheetNames);
         
         // WICHTIGER UNTERSCHIED: Wir verwenden die ZWEITE Tabelle (Index 1) anstatt der ersten
         if (workbook.SheetNames.length < 2) {
             console.error("Die Excel-Datei enthält weniger als zwei Arbeitsblätter!");
             return null;
         }
         
         const leaderboardSheet = workbook.Sheets[workbook.SheetNames[1]];
         console.log("Verwende zweites Arbeitsblatt:", workbook.SheetNames[1]);
         
         // In Array konvertieren
         const sheetData = XLSX.utils.sheet_to_json(leaderboardSheet, { header: 1 });
         console.log("Daten aus dem zweiten Arbeitsblatt:", sheetData);
         
         return sheetData;
     } catch (error) {
         console.error('Fehler beim Laden der XLSB-Datei:', error);
         return null;
     }
 }
 
 // Funktion zum Laden der Testdaten (für Debugging-Zwecke)
 function loadTestData() {
     console.log("Lade Testdaten...");
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
             console.log(`Lade GD-Icon für ${player.name}...`);
             
             const userData = await fetchGDUserData(player.name);
             if (userData) {
                 console.log(`GD-Daten erhalten für ${player.name}:`, userData);
                 const iconUrls = getGDIconUrls(userData);
                 const iconContainer = document.getElementById(`icon-player-${i}`);
                 
                 if (iconContainer && iconUrls) {
                     // Icon-Bild erstellen und einfügen
                     const img = document.createElement('img');
                     img.src = iconUrls.cube; // Standard: Cube-Icon
                     img.alt = `${player.name} Icon`;
                     img.style.width = '100%';
                     img.style.height = '100%';
                     img.style.objectFit = 'contain'; // Bild vollständig anzeigen ohne Beschneidung
                     img.style.backgroundColor = 'transparent'; // Hintergrund transparent
                     
                     // Vorhandene Inhalte entfernen und neues Bild einfügen
                     iconContainer.innerHTML = '';
                     iconContainer.appendChild(img);
                     
                     console.log(`Icon für ${player.name} geladen:`, iconUrls.cube);
                 }
             } else {
                 console.warn(`Keine GD-Daten für ${player.name} gefunden`);
             }
         }
     }
 }
 
 // Hauptfunktion zum Initialisieren des Leaderboards
 async function initLeaderboard() {
     console.log("Initialisiere Leaderboard...");
     
     let data;
     
     try {
         // Versuche, XLSB-Datei zu laden
         data = await loadXLSBFile();
     } catch (error) {
         console.warn('XLSB-Datei konnte nicht geladen werden:', error);
     }
     
     // Wenn keine Daten geladen werden konnten, verwende Testdaten
     if (!data || data.length < 2) {
         console.log("Keine gültigen Daten aus XLSB. Verwende Testdaten.");
         data = loadTestData();
     }
     
     // Prüfen, ob die Daten gültig sind
     if (!data || data.length === 0) {
         console.error("Keine Daten verfügbar!");
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
         
         console.log("Leaderboard erfolgreich gerendert.");
         
         // GD-Icons für alle Spieler laden
         loadGDIcons(players);
     } else {
         console.error('Element .challenge-list nicht gefunden');
     }
 }
 
 // Starte die Initialisierung, wenn die Seite vollständig geladen ist
 document.addEventListener('DOMContentLoaded', function() {
     console.log("Seite geladen, starte Leaderboard-Initialisierung...");
     initLeaderboard();
 });
 
 // Falls DOMContentLoaded bereits gefeuert wurde
 if (document.readyState === 'complete' || document.readyState === 'interactive') {
     console.log("Seite bereits geladen, starte Leaderboard-Initialisierung...");
     setTimeout(initLeaderboard, 1);
 }
 
 // Zusätzliche CSS-Styles für die Icons
 document.addEventListener('DOMContentLoaded', function() {
     // CSS für Icon-Container dynamisch hinzufügen
     const style = document.createElement('style');
     style.textContent = `
         .challenge {
             display: flex;
             align-items: stretch;
         }
         
         .gd-icon-container {
             width: 80px;
             height: auto;
             background-color: rgba(20, 20, 20, 0.3);
             display: flex;
             align-items: center;
             justify-content: center;
             padding: 5px;
             margin-right: 15px;
         }
         
         .challenge-info {
             flex: 1;
         }
         
         .challenge-title {
             display: flex;
             align-items: center;
         }
     `;
     document.head.appendChild(style);
 });
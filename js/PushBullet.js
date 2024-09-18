const accessToken = 'o.2fBO20OkMwk7EzsQkSMGQiNzjwEKS4ra'; // Din Pushbullet API-nyckel

// Skapa en WebSocket-anslutning till Pushbullet
const socket = new WebSocket(`wss://stream.pushbullet.com/websocket/${accessToken}`);

// Lyssna efter WebSocket-anslutningens öppnande
socket.onopen = function(event) {
    console.log("WebSocket ansluten till Pushbullet!");
};

// Hantera inkommande meddelanden från Pushbullet
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    // Kontrollera om det är ett pushmeddelande
    if (data.type === 'push') {
        console.log("Pushbullet-meddelande mottaget:", data.push);

        // Gör något med meddelandet, t.ex. visa i UI
        // Exempel:
        if (data.push.type === 'note') {
            console.log(`Titel: ${data.push.title}`);
            console.log(`Meddelande: ${data.push.body}`);
        }
    }
};

// Hantera eventuella fel med WebSocket
socket.onerror = function(error) {
    console.error("WebSocket fel:", error);
};

// Stäng WebSocket-anslutningen när det behövs
socket.onclose = function(event) {
    console.log("WebSocket stängd.");
};

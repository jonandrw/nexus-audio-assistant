// simulador-m32.js
const { Client } = require('node-osc');

// Apuntamos al puerto de escucha (SSE) de tu aplicación
const client = new Client('127.0.0.1', 10024);

console.log("Simulando que la M32 se conecta y envía datos...");

// Simulamos que la consola nombra los 3 primeros canales
client.send('/ch/01/config/name', 'Pastor Main');
client.send('/ch/02/config/name', 'Coro L');
client.send('/ch/03/config/name', 'Bajo DI');

// Simulamos que alguien muteó el canal 1 en la consola física
setTimeout(() => {
    console.log("Muteando el canal 1...");
    client.send('/ch/01/mix/on', 0);
}, 2000);

// Cerramos el simulador
setTimeout(() => {
    client.close();
    console.log("Simulación terminada.");
}, 3000);
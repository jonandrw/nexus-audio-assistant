import { Server } from "node-osc";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let oscServer: Server;
      try {
        oscServer = new Server(10024, "0.0.0.0", () => {
          console.log("OSC Listener Server is running on port 10024");
        });

        oscServer.on("message", (msg) => {
          // msg is [address, ...args]
          const address = msg[0];
          const args = msg.slice(1);
          
          const payload = JSON.stringify({ address, args });
          // Format as Server-Sent Event
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        });

      } catch (err: any) {
        console.error("OSC Server creation failed:", err);
        if (err.code === "EADDRINUSE") {
           controller.enqueue(encoder.encode(`data: {"error": "EADDRINUSE"}\n\n`));
        }
      }

      // Limpieza segura de memoria cuando el cliente de Next.js se desconecta
      request.signal.addEventListener("abort", () => {
        console.log("Client disconnected, closing OSC Server on port 10024");
        if (oscServer) {
          oscServer.close();
        }
      });
    },
    cancel() {
      console.log("ReadableStream cancelled");
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

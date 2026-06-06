import { NextResponse } from "next/server";
import { Client, Message } from "node-osc";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, args, ip = "192.168.1.100", port = 10023 } = body;

    // Validación básica
    if (!address) {
      return NextResponse.json(
        { success: false, error: "El campo 'address' es requerido." },
        { status: 400 }
      );
    }

    if (args === undefined || args === null) {
      return NextResponse.json(
        { success: false, error: "El campo 'args' es requerido." },
        { status: 400 }
      );
    }

    return await new Promise<NextResponse>((resolve) => {
      // Inicializar el cliente OSC
      const client = new Client(ip, port);
      
      // Asegurarse de que los argumentos sean un arreglo
      const oscArgs = Array.isArray(args) ? args : [args];
      
      // Crear el mensaje OSC
      const message = new Message(address, ...oscArgs);

      // Enviar el mensaje
      client.send(message, (err: Error | null) => {
        if (err) {
          console.error("OSC Send Error:", err);
          // Cierre seguro en caso de error
          client.close();
          resolve(
            NextResponse.json(
              { success: false, error: "Fallo al enviar el mensaje OSC", details: err.message },
              { status: 500 }
            )
          );
        } else {
          // Cierre seguro tras éxito
          client.close();
          resolve(
            NextResponse.json(
              { success: true, message: `Comando enviado a ${ip}:${port} en la ruta ${address}` },
              { status: 200 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    console.error("OSC API Error:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}

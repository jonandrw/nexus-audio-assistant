export interface OscCommandResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export async function sendOscCommand(
  address: string,
  args: any | any[],
  ip: string = "192.168.1.100",
  port: number = 10023
): Promise<OscCommandResponse> {
  try {
    const res = await fetch("/api/osc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, args, ip, port }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("OSC fetch error:", err);
    return {
      success: false,
      error: "Error de red al intentar enviar el comando OSC.",
      details: err.message,
    };
  }
}

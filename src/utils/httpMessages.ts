import { IncomingMessage } from "node:http";

const MAX_BODY_SIZE = 64 * 1024; // 64 KB

export async function getReqBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let chunks = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        return reject(new Error("Payload too large"));
      }
      chunks += chunk.toString();
    });

    req.on("end", () => {
      resolve(chunks);
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

export async function parseJSONBody(req: IncomingMessage) {
  return JSON.parse(await getReqBody(req));
}

export function validateFields(obj: any, fields: string[]): string | null {
  for (const field of fields) {
    if (typeof obj?.[field] !== "string" || obj[field].trim() === "")
      return `Campo requerido: ${field}`;
  }
  return null;
}

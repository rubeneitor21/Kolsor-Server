import { IncomingMessage } from "node:http";

export async function getReqBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let chunks = "";

    req.on("data", (chunk) => {
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

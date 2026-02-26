import * as fs from "node:fs"
import chalk from "chalk"

let writeStream: fs.WriteStream

export class Logger {
    env: "production" | "development"

    constructor() {
        this.env = process.env.NODE_ENV === "development" ? process.env.NODE_ENV : "production";

        fs.writeFileSync("latest.log", "hola", {
            flag: "w"
        });

        writeStream = fs.createWriteStream("latest.log")
    }

    private saveFile(level: string, text: string) {
        const timestamp = new Date().toISOString();
        writeStream.write(`[${timestamp}] [${level}]: ${text}\n`)
    }

    private log(level: "INFO" | "WARNING" | "ERROR", text: string) {
        if (this.env === "development") {
            const timestamp = new Date().toLocaleDateString() + " " + new Date().toTimeString().split(" ")[0];
            let logLevel: string = "INFO";

            if (level === "INFO") {
                logLevel = chalk.blue("Info")
            }
            if (level === "WARNING") {
                logLevel = chalk.yellow("Warning")
            }
            if (level === "ERROR") {
                logLevel = chalk.red("Error")
            }

            console.log(`[${timestamp}] [${logLevel}]: ${text}`)
        }

        this.saveFile(level, text)
    }

    info(info: string): void {
        this.log("INFO", info)
    }

    warning(warning: string): void {
        this.log("WARNING", warning)
    }

    error(error: string): void {
        this.log("ERROR", error)
    }
}

export default Logger
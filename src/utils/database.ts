import "dotenv/config"

import { Db, MongoClient, ObjectId } from "mongodb"
import { Logger } from "@utils/logger"

import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken";

enum Collections {
  USERS = "users"
}

export class Database {

  private static database = new Database
  public static getDatabase = () => Database.database

  private logger: Logger = Logger.getLogger()
  private client: MongoClient
  private db!: Db

  private SALT_ROUNDS = 10

  private constructor() {
    this.client = new MongoClient(process.env.DB_CONNECTION || "")
  }

  public async createUser(user: UserRegister) {
    try {
      const newUser = {
        "username": user.username,
        "password": await bcrypt.hash(user.password, this.SALT_ROUNDS),
        "level": 1,
        "stats": { "wins": 0, "losses": 0, "disconnections": 0 },
        "createdAt": new Date()
      }

      const userCol = this.db.collection(Collections.USERS)

      const newUserId = (await userCol.insertOne(newUser)).insertedId

      this.logger.info("hola?")

      return { success: true, id: newUserId }
    }
    catch (e: any) {
      this.logger.error(e)
      if (e.code == 11000)
        return { success: false, error: "Username already exists" }
    }
  }

  public async getUser(user: string) {
    const userCol = this.db.collection(Collections.USERS)
    const userInfo = await userCol.findOne({_id: new ObjectId(user)})

    return userInfo
  }

  public async loginUser(credentials: UserRegister) {
    try {
      const userCol = this.db.collection(Collections.USERS);
      const user = await userCol.findOne({ username: credentials.username });

      if (!user) return { success: false, error: "Credenciales inválidas" };

      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) return { success: false, error: "Credenciales inválidas" };

      const token = jwt.sign(
        { id: user._id.toString(), username: user.username },
        process.env.JWT_SECRET || "temp1234",
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        user: { id: user._id.toString(), username: user.username }
      };

    } catch (e) {
      return { success: false, error: "Error interno" };
    }
  }

  public async init() {
    await this.client.connect()
    this.db = this.client.db("kolsor")

    const ping = await this.db.command({ ping: 1 })
    if (ping.ok) {
      this.logger.info("DB connection successful")
    }
    else {
      this.logger.error("Error connecting to DB")
    }
  }
}

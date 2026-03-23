import seedrandom from "seedrandom"
import { Logger } from "@utils/logger"

export enum KolsorFace {
  AXE = "Axe",
  ARROW = "Arrow",
  HELMET = "Helmet",
  SHIELD = "Shield",
  HAND = "Hand",
}

export class DiceRNG {
  private prng: seedrandom.PRNG
  private room: string
  private logger = Logger.getLogger()

  constructor(seed: string, room: string) {
    this.room = room
    this.prng = seedrandom(seed)

    const n = Math.floor(this.prng() * 20)

    // Los primeros numeros pueden tener entropia muy pobre
    for (let i = 0; i < n; i++) {
      this.prng()
    }
  }

  private generateBits(): number {
    const faceIndex = Math.floor(this.prng() * 5)
    const hasEnergy = this.prng() < 0.4 ? 1 : 0
    
    const bits = (hasEnergy << 3) | faceIndex

    // this.logger.info(`${this.room}: 0b${bits.toString(2).padStart(4, '0')}`);

    return bits 
  }

  private decodeBits(bits: number): DiceResult {
    const faces = [
      KolsorFace.AXE,
      KolsorFace.ARROW,
      KolsorFace.HELMET,
      KolsorFace.SHIELD,
      KolsorFace.HAND
    ]

    return {
      face: faces[bits & 0x7]!,
      energy: Boolean((bits >> 3) & 1)
    }
  }

  getRolls(n = 1): DiceResult[] {
    let arr: DiceResult[] = [];

    if (n <= 0) return arr

    for (let i = 0; i < n; i++) {
      arr.push(this.decodeBits(this.generateBits()))
    }

    return arr;
  }

  getStart() {
    return this.prng() > 0.5 ? 1 : 0
  }
}

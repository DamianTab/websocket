export class Cell {
  x: number;
  y: number;
  occupied: boolean;
  playerNick: string | undefined;
  color: string;


  constructor(x: number, y: number, occupied: boolean, playerNick: string | undefined, color: string) {
    this.x = x;
    this.y = y;
    this.occupied = occupied;
    this.playerNick = playerNick;
    this.color = color;
  }
}

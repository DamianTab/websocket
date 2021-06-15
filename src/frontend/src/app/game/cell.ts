export class Cell {
  x: number;
  y: number;
  occupied: boolean;
  color: string;


  constructor(x: number, y: number, occupied: boolean, color: string) {
    this.x = x;
    this.y = y;
    this.occupied = occupied;
    this.color = color;
  }
}

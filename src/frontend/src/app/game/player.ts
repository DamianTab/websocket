export class Player{
  nick: string;
  x: number;
  y: number;
  score: number;
  color: string;

  constructor(nick: string, x: number, y: number, score: number, color: string) {
    this.nick = nick;
    this.x = x;
    this.y = y;
    this.score = score;
    this.color = color;
  }
}

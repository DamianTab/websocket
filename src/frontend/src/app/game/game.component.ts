import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Player} from "./player";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D ;
  private webSocket!: WebSocket;

  private backgroundColor: string = 'rgb(240, 240, 240)'
  private playerRadius: number = 25
  private cellRadius: number = 10
  private movementSpeed: number = 4

  players: Map<string, Player> = new Map()

  room: string = "room"
  nick: string = "nick"
  score: number = 0

  mouseX: number = 450
  mouseY: number = 450
  animationFrameId: number = 0

  constructor(private activatedRoute: ActivatedRoute) {
    activatedRoute.params.subscribe(result => {
      this.nick = result.nick
      this.room = result.room

      this.players.set(this.nick, new Player(this.nick, this.randomBetween(100,800), this.randomBetween(100,800), 0, this.random_rgb()))
      console.log(this.players)

      this.webSocket = new WebSocket(`ws://localhost:8080/game?room=${this.room}&player=${this.nick}`);
      this.webSocket.binaryType = "arraybuffer";
      this.webSocket.onmessage = this.receiveMessage
    })
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    //Init background
    this.clearCanvas();
    //Init player
    const currentPlayer = this.players.get(this.nick)!
    this.drawPlayer(currentPlayer, currentPlayer.color)

    const rectangle = new Path2D();
    rectangle.rect(10, 10, 50, 50);
    this.context.stroke(rectangle);

    this.drawCircle(100, 100, this.cellRadius)
  }

  exitGame() {
    this.score += 1
  }

  receiveMessage(event: any) {
    console.debug("WebSocket message received:", event);
  }

  sendMessage() {
    const encoder = new TextEncoder()
    this.webSocket?.send(encoder.encode("Jazda!"))
  }

  @HostListener('document:click', ['$event'])
  click(event: any) {
    cancelAnimationFrame(this.animationFrameId)
    this.mouseX = event.x - this.canvas?.offsetLeft
    this.mouseX = this.standardizeValue(this.mouseX)
    this.mouseY = event.y - this.canvas?.offsetTop
    this.mouseY = this.standardizeValue(this.mouseY)
    this.movePlayer()
  }

  movePlayer() {
    const currentPlayer : Player = this.players.get(this.nick)!
    let dx = (this.mouseX - currentPlayer.x) * .125;
    let dy = (this.mouseY - currentPlayer.y) * .125;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.movementSpeed) {
      this.clearPlayer(currentPlayer)
      dx *= this.movementSpeed / distance;
      dy *= this.movementSpeed / distance;
      currentPlayer.x += Math.round(dx)
      currentPlayer.y += Math.round(dy)
      currentPlayer.x = this.standardizeValue(currentPlayer.x)
      currentPlayer.y = this.standardizeValue(currentPlayer.y)
      this.drawPlayer(currentPlayer, currentPlayer.color)
      this.animationFrameId = requestAnimationFrame(this.movePlayer.bind(this))
    } else {
      cancelAnimationFrame(this.animationFrameId)
    }
    console.log("1111")
  }

  clearPlayer(player: Player){
    this.drawCircle(player.x, player.y, this.playerRadius+1, this.backgroundColor)
  }

  drawPlayer(player: Player, color: string) {
    this.drawCircle(player.x, player.y, this.playerRadius, color)
    this.drawText(player.x, player.y, player.nick)
    this.drawScore(player.x, player.y, player.score)
  }

  drawCircle(x: number, y: number, radius: number, color: string = this.random_rgb()) {
    const circle = new Path2D();
    this.context.fillStyle = color
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    this.context.fill(circle);
  }

  drawText(x: number, y: number, text: string) {
    this.context.fillStyle = 'rgb(0,0,0)';
    this.context.font = '18px arial';
    this.context.textAlign = "center";
    this.context?.fillText(text, x, y, 100);
  }

  drawScore(x: number, y: number, score: number) {
    this.context.fillStyle = 'rgb(0,0,0)';
    this.context.font = '20px arial';
    this.context.textAlign = "center";
    this.context?.fillText(score.toString(), x, y + 18, 30);
  }

  clearCanvas() {
    this.context.fillStyle = this.backgroundColor
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private random_rgb() {
    const r = this.randomBetween(30, 240);
    const g = this.randomBetween(30, 240);
    const b = this.randomBetween(30, 240);
    return `rgb(${r},${g},${b})`;
  }

  randomBetween(min: number, max: number){
    return min + Math.floor(Math.random() * (max - min + 1));
  }


  private standardizeValue(value: number) {
    if (value < 0) return 0;
    else if (value > 900) return 900
    else return value
  }
}

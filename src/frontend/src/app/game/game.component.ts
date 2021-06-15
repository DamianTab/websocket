import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Player} from "./player";
import {Cell} from "./cell";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private webSocket!: WebSocket;

  private backgroundColor: string = 'rgb(240, 240, 240)'
  private playerRadius: number = 35
  private cellRadius: number = 10
  private movementSpeed: number = 3

  players: Map<string, Player> = new Map()
  cells: Cell[] = []

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
      this.webSocket = new WebSocket(`ws://localhost:8080/game?room=${this.room}&player=${this.nick}`);
      this.webSocket.binaryType = "arraybuffer";
      this.webSocket.onmessage = this.receiveMessage
      this.players.set(this.nick, new Player(this.nick, this.randomBetween(100, 800), this.randomBetween(100, 800), 0, this.random_rgb()))
      //todo przesylac tutaj wiadomosc do backendu o polozeniu gracza
    })
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    //  todo usunac to jest testowe
    this.cells.push(new Cell(this.randomBetween(100, 800), this.randomBetween(100, 800), false, undefined, this.random_rgb()))
    this.cells.push(new Cell(this.randomBetween(100, 800), this.randomBetween(100, 800), false, undefined, this.random_rgb()))
    this.cells.push(new Cell(this.randomBetween(100, 800), this.randomBetween(100, 800), true, undefined, this.random_rgb()))
    this.cells.push(new Cell(this.randomBetween(100, 800), this.randomBetween(100, 800), false, undefined, this.random_rgb()))
    this.cells.push(new Cell(this.randomBetween(100, 800), this.randomBetween(100, 800), true, undefined, this.random_rgb()))

    //Draw all entities
    this.redrawAll()
  }

  exitGame() {
    this.score += 1
    const player: Player = this.players.get(this.nick)!
    player.score += 1
    //  todo zrobic wychodzenie i obsluge odświezania
  }

  receiveMessage(event: any) {
    // console.debug("WebSocket message received:", event);
    let data = new Int8Array(event.data);
    console.log(data)
    //  todo odbieranie
  }

  sendPlayerPositionMessage(player: Player) {
    let data: Int8Array | Int16Array = Int16Array.of(1, player.x, player.y, player.score)
    data = new Int8Array(data.buffer)
    data = this.concatStringWithTypedArrays(data, player.nick);
    this.webSocket?.send(data)
  }

  concatStringWithTypedArrays(array: Int8Array, string: string) {
    const encoder = new TextEncoder()
    const stringAsBytes = encoder.encode(string)
    const newArray = new Int8Array(array.length + string.length);
    newArray.set(array, 0);
    newArray.set(stringAsBytes, array.length);
    return newArray;
  }

  stringToArrayInt(str: string) {

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
    const currentPlayer: Player = this.players.get(this.nick)!
    let dx = (this.mouseX - currentPlayer.x) * .125;
    let dy = (this.mouseY - currentPlayer.y) * .125;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.movementSpeed) {
      dx *= this.movementSpeed / distance;
      dy *= this.movementSpeed / distance;
      currentPlayer.x += Math.round(dx)
      currentPlayer.y += Math.round(dy)
      currentPlayer.x = this.standardizeValue(currentPlayer.x)
      currentPlayer.y = this.standardizeValue(currentPlayer.y)
      this.sendPlayerPositionMessage(currentPlayer)
      this.redrawAll()
      this.animationFrameId = requestAnimationFrame(this.movePlayer.bind(this))
    } else {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  redrawAll() {
    this.clearCanvas();
    this.cells.forEach(cell => {
      if (!cell.occupied) {
        this.drawCircle(cell.x, cell.y, this.cellRadius, cell.color)
      }
    })
    this.players.forEach(player => this.drawPlayer(player))
  }

  drawPlayer(player: Player) {
    this.drawCircle(player.x, player.y, this.playerRadius, player.color)
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

  randomBetween(min: number, max: number) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private standardizeValue(value: number) {
    if (value < 0) return 0;
    else if (value > 900) return 900
    else return value
  }
}

import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Player} from "./player";
import {Cell} from "./cell";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private webSocket!: WebSocket;

  private backgroundColor: string = 'rgb(240, 240, 240)'
  private playerRadius: number = 35
  private cellRadius: number = 10
  private movementSpeed: number = 4

  players: Map<string, Player> = new Map()
  cells: Cell[] = []

  room: string = "room"
  nick: string = "nick"
  score: number = 0

  mouseX: number = 450
  mouseY: number = 450
  animationFrameId: number = 0

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute.params.subscribe(result => {
      this.nick = result.nick
      this.room = result.room
      this.webSocket = new WebSocket(`ws://localhost:8080/game?room=${this.room}&player=${this.nick}`);
      this.webSocket.binaryType = "arraybuffer";
      this.webSocket.onmessage = this.receiveMessage.bind(this)
    })
  }

  ngOnDestroy(): void {
    this.webSocket.close();
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.redrawAll()
  }

  exitGame() {
    this.router.navigate(['/'])
  }

  receiveMessage(event: any) {
    const data = new DataView(event.data);

    switch (data.getInt16(0)) {
      //Player move
      case 1:
        const nickBuffer = data.buffer.slice(8, data.byteLength)
        const decoder = new TextDecoder();
        const nick = decoder.decode(nickBuffer)
        const x = data.getInt16(2)
        const y = data.getInt16(4)
        const score = data.getInt16(6)
        const color = this.players.has(nick) ? this.players.get(nick)!.color : this.random_rgb()
        // console.log(`Type: ${data.getInt16(0)}, X: ${data.getInt16(2)}, Y: ${data.getInt16(4)}, SCORE: ${data.getInt16(6)}, Nick: ${decoder.decode(nickBuffer)}`)

        //Delete user that already left match
        if(x == -1 && y == -1 && score ==-1){
          this.players.delete(nick)
          this.redrawAll()
        }else if (this.nick == nick && this.players.get(this.nick)) {
          //If the same player then only update score
          const currentPlayer = this.players.get(this.nick)
          currentPlayer!.score = score;
        } else {
          //Update other players
          this.players.set(nick, new Player(nick, x, y, score, color))
          this.redrawAll()
        }
        break;

      //Cell Info
      case 2:
        const xCell = data.getInt16(2)
        const yCell = data.getInt16(4)
        const occupied = data.getInt16(6)
        this.cells.push(new Cell(xCell, yCell, occupied !== 0, this.random_rgb()))
        this.redrawAll()
        break;

      case 3:
        //todo game start
        console.log("3333333333333333333")
        break;

      case 4:
        //todo game end
        console.log("444444444444444444444")
        break;
    }


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

  private randomBetween(min: number, max: number) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private standardizeValue(value: number) {
    if (value < 0) return 0;
    else if (value > 900) return 900
    else return value
  }
}

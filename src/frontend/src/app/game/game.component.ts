import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  private canvas: HTMLCanvasElement | undefined;
  private context: CanvasRenderingContext2D | undefined;
  private webSocket: WebSocket | undefined;

  private backgroundColor: string = 'rgb(240, 240, 240)'
  private playerRadius: number = 25
  private cellRadius: number = 10
  private movementSpeed: number = 3

  room: string = "room"
  nick: string = "nick"
  score: number = 0
  x: number = 450
  y: number = 450
  playerCircle: Path2D | undefined

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
    })
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    //Init background
    this.context.fillStyle = this.backgroundColor
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    //Init player
    this.playerCircle = this.drawPlayer(this.x, this.y, this.nick, this.score)
    // this.playerCircle.moveTo(800, 800)


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
    // @ts-ignore
    this.mouseX = event.x - this.canvas?.offsetLeft
    this.mouseX = this.standardizeValue(this.mouseX)
    // @ts-ignore
    this.mouseY = event.y - this.canvas?.offsetTop
    this.mouseY = this.standardizeValue(this.mouseY)
    this.movePlayer()
  }

  movePlayer() {
    // @ts-ignore
    let dx = (this.mouseX - this.x) * .125;
    // @ts-ignore
    let dy = (this.mouseY - this.y) * .125;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.movementSpeed) {
      dx *= this.movementSpeed / distance;
      dy *= this.movementSpeed / distance;
      this.x += dx
      this.y += dy
      this.x = this.standardizeValue(this.x)
      this.y = this.standardizeValue(this.y)
      this.drawPlayer(this.x, this.y, this.nick, this.score)
      this.animationFrameId = requestAnimationFrame(this.movePlayer.bind(this))
    } else {
      cancelAnimationFrame(this.animationFrameId)
    }
    console.log("1111")
  }

  drawPlayer(x: number, y: number, nick: string, score: number) {
    const player = this.drawCircle(x, y, this.playerRadius)
    this.drawText(x, y, nick)
    this.drawScore(x, y, score)
    return player
  }

  drawCircle(x: number, y: number, radius: number) {
    const circle = new Path2D();
    // @ts-ignore
    this.context.fillStyle = this.random_rgb();
    circle.arc(x, y, radius, 0, 2 * Math.PI);
    // @ts-ignore
    this.context.fill(circle);
    return circle;
  }

  drawText(x: number, y: number, text: string) {
    // @ts-ignore
    this.context.fillStyle = 'rgb(0,0,0)';
    // @ts-ignore
    this.context.font = '18px arial';
    // @ts-ignore
    this.context?.textAlign = "center";
    // @ts-ignore
    this.context?.fillText(text, x, y, 100);
  }

  drawScore(x: number, y: number, score: number) {
    // @ts-ignore
    this.context.fillStyle = 'rgb(0,0,0)';
    // @ts-ignore
    this.context.font = '20px arial';
    // @ts-ignore
    this.context?.textAlign = "center";
    // @ts-ignore
    this.context?.fillText(score.toString(), x, y + 18, 30);
  }

  random_rgb() {
    const randomBetween = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
    const r = randomBetween(30, 240);
    const g = randomBetween(30, 240);
    const b = randomBetween(30, 240);
    return `rgb(${r},${g},${b})`;
  }


  private standardizeValue(value: number) {
    if (value < 0) return 0;
    else if (value > 900) return 900
    else return value
  }
}

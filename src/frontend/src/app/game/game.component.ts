import {Component, OnInit} from '@angular/core';
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

  room: string = "room"
  nick: string = "nick"
  score: number = 0
  x: number = 0
  y: number = 0

  constructor(private activatedRoute: ActivatedRoute) {
    activatedRoute.params.subscribe(result => {
      this.nick = result.nick
      this.room = result.room
      this.createWebSocket(this.room, this.nick)
    })
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (this.canvas.getContext) {
      this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

      this.context.fillStyle = 'rgb(100, 100, 100)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);


      const rectangle = new Path2D();
      rectangle.rect(10, 10, 50, 50);
      this.context.stroke(rectangle);


      const circle = new Path2D();
      circle.moveTo(125, 35);
      circle.arc(100, 35, 25, 0, 2 * Math.PI);
      this.context.fill(circle);
    }
  }

  exitGame() {

  }

  private createWebSocket(room: string, nick: string) {
    this.webSocket = new WebSocket("ws://localhost:8080/game");
    this.webSocket.binaryType = "arraybuffer";
    this.webSocket.onmessage = this.receiveMessage
  }

  private receiveMessage(event: any) {
    console.debug("WebSocket message received:", event);
  }





}

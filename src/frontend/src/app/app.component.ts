import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'frontend';
  // private canvas: HTMLCanvasElement;
  // private context: CanvasRenderingContext2D;
  canvas: any

  constructor() {
  }

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas');
    if (this.canvas.getContext){
      const ctx = this.canvas.getContext('2d');

      const rectangle = new Path2D();
      rectangle.rect(10, 10, 50, 50);

      const circle = new Path2D();
      circle.moveTo(125, 35);
      circle.arc(100, 35, 25, 0, 2 * Math.PI);

      ctx.stroke(rectangle);
      ctx.fill(circle);
    }

  }


}

import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  roomName: string = ""
  nick: string = ""

  constructor(private router: Router) { }

  joinGame() {
    this.router.navigate(["/game/" + this.roomName + "/" + this.nick]);
  }
}

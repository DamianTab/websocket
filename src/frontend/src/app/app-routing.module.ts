import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GameComponent} from "./game/game.component";
import {LoginComponent} from "./login/login.component";

const routes: Routes = [
  {
    path: "",
    component: LoginComponent
  },
  {
    path: "game/:room/:nick",
    component: GameComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

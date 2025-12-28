import {Routes} from '@angular/router';
import {LoginComponent} from "./login/login.component";
import {UserProfileComponent} from "./user-profile/user-profile.component";

import {RegisterComponent} from './register/register.component';
import {HomepageComponent} from './homepage/homepage.component';
import {JamSessionComponent} from './jam-session/jam-session.component';
import {EditUserComponent} from './edit-user/edit-user.component';
import {JamSessionPageComponent} from './jam-session-page/jam-session-page.component';
import {AdminPanelComponent} from './admin-panel/admin-panel.component';
import {MyJamSessionsComponent} from './my-jam-sessions/my-jam-sessions.component';
import {UserListComponent} from './user-list/user-list.component';
import {EditJamSessionComponent} from './edit-jam-session/edit-jam-session.component';
import {SignedUpJamSessionsComponent} from './signed-up-jam-sessions/signed-up-jam-sessions.component';
import {NewJamSessionComponent} from './new-jam-session/new-jam-session.component';

export const routes: Routes = [
  {path: '', component: HomepageComponent},
  {path: 'login', component: LoginComponent},
  {path: 'profile', component: UserProfileComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'home', component: HomepageComponent},
  {path: 'jam-session', component: JamSessionComponent},
  {path: 'new-jam-session', component: NewJamSessionComponent},
  {path: 'jam-session-page/:id', component: JamSessionPageComponent},
  {path: 'my-jam-sessions', component: MyJamSessionsComponent},
  {path: 'signed-up-jam-sessions', component: SignedUpJamSessionsComponent},
  {path: 'edit-jam-session/:id', component: EditJamSessionComponent},
  {path: 'users', component: UserListComponent},
  {path: 'profile/:id/edit', component: EditUserComponent},
  {path: 'admin', component: AdminPanelComponent},
  {path: '**', redirectTo: '', pathMatch: 'full'}
]

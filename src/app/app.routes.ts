import {Routes} from '@angular/router';
import { AdminPanelComponent } from './features/admin/admin-panel/admin-panel.component';
import { HomepageComponent } from './features/homepage/homepage.component';
import { EditJamSessionComponent } from './features/jam-session/edit-jam-session/edit-jam-session.component';
import { JamSessionPageComponent } from './features/jam-session/jam-session-page/jam-session-page.component';
import { JamSessionComponent } from './features/jam-session/jam-session/jam-session.component';
import { MyJamSessionsComponent } from './features/jam-session/my-jam-sessions/my-jam-sessions.component';
import { NewJamSessionComponent } from './features/jam-session/new-jam-session/new-jam-session.component';
import { SignedUpJamSessionsComponent } from './features/jam-session/signed-up-jam-sessions/signed-up-jam-sessions.component';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { EditUserComponent } from './features/user/edit-user/edit-user.component';
import { UserListComponent } from './features/user/user-list/user-list.component';
import { UserProfileComponent } from './features/user/user-profile/user-profile.component';


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

import { Routes } from '@angular/router';
import { MatchManagementComponent } from './components/match-management/match-management.component';
import { QueueDisplayComponent } from './components/queue-display/queue-display.component';
import { RankingsComponent } from './components/rankings/rankings.component';
import { AdminComponent } from './components/admin/admin.component';
import { PlayerDetailsComponent } from './components/player-details/player-details.component';

export const routes: Routes = [
  { path: '', component: MatchManagementComponent },
  { path: 'queue-display', component: QueueDisplayComponent },
  { path: 'rankings', component: RankingsComponent },
  { path: 'player/:id', component: PlayerDetailsComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];

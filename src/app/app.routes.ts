import { Routes } from '@angular/router';
import { ListApprovisionnement } from './features/approvisionnement/pages/list/list';
import { AddComponent } from './features/approvisionnement/pages/add/add';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'approvisionnements',
    pathMatch: 'full'
  },
  { 
    path: 'approvisionnements', 
    children: [
      {
        path: '',
        component: ListApprovisionnement,
        title: 'Liste des approvisionnements',
        data: { breadcrumb: 'Liste' }
      },
      {
        path: 'ajouter',
        component: AddComponent,
        title: 'Nouvel approvisionnement',
        data: { breadcrumb: 'Nouveau' }
      },
      {
        path: 'modifier/:id',
        component: AddComponent,
        title: 'Modifier un approvisionnement',
        data: { breadcrumb: 'Modifier' }
      }
    ]
  },
  { 
    path: '**', 
    redirectTo: 'approvisionnements' 
  }
];

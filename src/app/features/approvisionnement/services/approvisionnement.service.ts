import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Approvisionnement, NewApprovisionnement, Article, Fournisseur } from '../models/approvisonnement.model';

interface ArticleCommande {
  articleId: number;
  quantite: number;
  prixUnitaire: number;
}
import { MOCK_APPROVISIONNEMENTS } from '../../../../shared/mock';

@Injectable({
  providedIn: 'root'
})
export class ApprovisionnementService {
  private approvisionnements: Approvisionnement[] = MOCK_APPROVISIONNEMENTS;

  constructor() {
  }

  getApprovisionnements(): Observable<Approvisionnement[]> {
    return of(this.approvisionnements);
  }

  getApprovisionnementById(id: number): Observable<Approvisionnement | undefined> {
    const appro = this.approvisionnements.find(a => a.id === id);
    return of(appro);
  }

  addApprovisionnement(approvisionnement: NewApprovisionnement): Observable<Approvisionnement> {
    const newId = this.getNextId();
    const newApprovisionnement: Approvisionnement = {
      ...approvisionnement,
      id: newId,
      date: new Date(),
      status: 'en_attente',
      montantTotal: this.calculateTotal(approvisionnement.articles),
      fournisseur: {
        ...approvisionnement.fournisseur,
        id: newId 
      },
      articles: approvisionnement.articles.map(article => ({
        articleId: article.articleId,
        quantite: article.quantite,
        prixUnitaire: article.prixUnitaire
      }))
    };
    
    this.approvisionnements = [...this.approvisionnements, newApprovisionnement];
    return of(newApprovisionnement);
  }

  private getNextId(): number {
    return Math.max(0, ...this.approvisionnements.map(a => a.id)) + 1;
  }

  private calculateTotal(articles: ArticleCommande[]): number {
    return articles.reduce((total, item) => total + (item.quantite * item.prixUnitaire), 0);
  }

  updateStatus(id: number, status: 'en_attente' | 'recu'): Observable<Approvisionnement> {
    const index = this.approvisionnements.findIndex(a => a.id === id);
    if (index === -1) {
      return throwError(() => new Error('Approvisionnement non trouvé'));
    }
    
    const updated = {
      ...this.approvisionnements[index],
      status
    };
    
    this.approvisionnements = [
      ...this.approvisionnements.slice(0, index),
      updated,
      ...this.approvisionnements.slice(index + 1)
    ];
    
    return of(updated);
  }

  deleteApprovisionnement(id: number): Observable<boolean> {
    const index = this.approvisionnements.findIndex(a => a.id === id);
    if (index === -1) {
      return throwError(() => new Error('Approvisionnement non trouvé'));
    }
    
    this.approvisionnements = [
      ...this.approvisionnements.slice(0, index),
      ...this.approvisionnements.slice(index + 1)
    ];
    
    return of(true);
  }

  getFournisseurs(): Observable<Fournisseur[]> {
    const fournisseursMap = new Map<number, Fournisseur>();
    
    
    for (const appro of this.approvisionnements) {
      if (appro.fournisseur) {
        fournisseursMap.set(appro.fournisseur.id, appro.fournisseur);
      }
    }
    
    return of(Array.from(fournisseursMap.values()));
  }

  getArticles(): Observable<Article[]> {
    const articles: Article[] = [
      { id: 1, libelle: 'Ordinateur portable', quantite: 0, prixUnitaire: 800 },
      { id: 2, libelle: 'Souris sans fil', quantite: 0, prixUnitaire: 30 },
      { id: 3, libelle: 'Clavier mécanique', quantite: 0, prixUnitaire: 80 },
      { id: 4, libelle: 'Écran 24 pouces', quantite: 0, prixUnitaire: 200 },
      { id: 5, libelle: 'Casque audio', quantite: 0, prixUnitaire: 100 }
    ];
    
    return of(articles);
  }
}

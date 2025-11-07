import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApprovisionnementService } from '../../services/approvisionnement.service';
import { Approvisionnement, Fournisseur, ArticleCommande, Article } from '../../models/approvisonnement.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-approvisionnement',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, FormsModule],
  templateUrl: './list.html',
  styleUrls: ['./list.css']
})
export class ListApprovisionnement implements OnInit, OnDestroy {
  approvisionnements: Approvisionnement[] = [];
  filteredApprovisionnements: Approvisionnement[] = [];
  suppliers: Fournisseur[] = [];
  availableArticles: Article[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Filtres
  searchTerm = '';
  selectedSupplier: number | null = null;
  selectedArticle: number | null = null;
  selectedStatus: 'en_attente' | 'recu' | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  
  // Statistiques
  totalMontant = 0;
  mainSupplier: Fournisseur | null = null;
  mainSupplierTotal = 0;
  mainSupplierPercentage = 0;
  
  private readonly subscriptions = new Subscription();
  
  // Stockage des articles pour la recherche (en lecture seule)
  private readonly articlesMap: Map<number, Article> = new Map();

  constructor(private readonly approvisionnementService: ApprovisionnementService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadData(): void {
    this.isLoading = true;
    
    const sub = this.approvisionnementService.getApprovisionnements().subscribe({
      next: (data) => {
        this.approvisionnements = data;
        this.loadSuppliers();
        this.loadArticles();
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.error = 'Erreur lors du chargement des approvisionnements';
        this.isLoading = false;
        console.error('Erreur:', err);
      }
    });
    
    this.subscriptions.add(sub);
  }
  
  private loadArticles(): void {
    const sub = this.approvisionnementService.getArticles().subscribe({
      next: (articles: Article[]) => {
        this.availableArticles = articles;
        for (const article of articles) {
          this.articlesMap.set(article.id, article);
        }
        this.calculateStats();
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des articles', err);
        this.error = 'Erreur lors du chargement des articles';
      }
    });
    this.subscriptions.add(sub);
  }
  
  private loadSuppliers(): void {
    const sub = this.approvisionnementService.getFournisseurs().subscribe({
      next: (fournisseurs) => {
        this.suppliers = fournisseurs;
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des fournisseurs:', err);
      }
    });
    this.subscriptions.add(sub);
  }
  
  applyFilters(): void {
    // Appliquer les filtres
    let result = [...this.approvisionnements];
    
    // Filtre par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(appro => {
        const hasMatchingSupplier = appro.fournisseur?.nom.toLowerCase().includes(term) || false;
        const hasMatchingId = appro.id.toString().includes(term);
        
        // Vérifier si un article correspond au terme de recherche
        const hasMatchingArticle = appro.articles.some(artCmd => {
          const article = this.articlesMap.get(artCmd.articleId);
          return article?.libelle.toLowerCase().includes(term) || false;
        });
        
        return hasMatchingSupplier || hasMatchingId || hasMatchingArticle;
      });
    }
    
    // Filtre par fournisseur
    if (this.selectedSupplier) {
      result = result.filter(appro => appro.fournisseur.id === this.selectedSupplier);
    }
    
    // Filtre par article
    if (this.selectedArticle) {
      result = result.filter(appro => 
        appro.articles.some(artCmd => artCmd.articleId === this.selectedArticle)
      );
    }
    
    // Filtre par statut
    if (this.selectedStatus) {
      result = result.filter(appro => appro.status === this.selectedStatus);
    }
    
    // Filtre par date
    if (this.startDate) {
      const start = new Date(this.startDate);
      result = result.filter(appro => new Date(appro.date) >= start);
    }
    
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // Fin de la journée
      result = result.filter(appro => new Date(appro.date) <= end);
    }
    
    // Trier
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    // Mettre à jour la pagination
    this.totalItems = result.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    // Appliquer la pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredApprovisionnements = result.slice(startIndex, startIndex + this.pageSize);
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedSupplier = null;
    this.selectedArticle = null;
    this.selectedStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.applyFilters();
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  private calculateStats(): void {
    // Calcul du montant total
    this.totalMontant = this.approvisionnements.reduce(
      (sum, appro) => sum + this.getTotal(appro.articles), 0
    );
    
    // Calcul du fournisseur principal
    const supplierTotals = new Map<number, number>();
    
    for (const appro of this.approvisionnements) {
      const supplierId = appro.fournisseur.id;
      const currentTotal = supplierTotals.get(supplierId) || 0;
      supplierTotals.set(supplierId, currentTotal + this.getTotal(appro.articles));
    }
    
    let maxTotal = 0;
    let mainSupplierId: number | null = null;
    
    for (const [supplierId, total] of supplierTotals.entries()) {
      if (total > maxTotal) {
        maxTotal = total;
        mainSupplierId = supplierId;
      }
    }
    
    if (mainSupplierId !== null) {
      this.mainSupplier = this.suppliers.find(s => s.id === mainSupplierId) || null;
      this.mainSupplierTotal = maxTotal;
      this.mainSupplierPercentage = this.totalMontant > 0 ? (maxTotal / this.totalMontant) * 100 : 0;
    }
  }
  
  getTotal(articles: ArticleCommande[]): number {
    return articles.reduce((total, item) => {
      const article = this.articlesMap.get(item.articleId);
      return total + (item.quantite * (article?.prixUnitaire || item.prixUnitaire || 0));
    }, 0);
  }
  
  getArticleLibelle(articleCmd: ArticleCommande): string {
    return this.articlesMap.get(articleCmd.articleId)?.libelle || `Article ${articleCmd.articleId}`;
  }
  
  getCurrentPeriod(): string {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    } else if (this.startDate) {
      const date = new Date(this.startDate);
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } else if (this.endDate) {
      const date = new Date(this.endDate);
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;
  }
  
  private formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  }
  
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  }
  
  getReference(appro: Approvisionnement): string {
    const year = new Date(appro.date).getFullYear();
    return `APP-${year}-${String(appro.id).padStart(3, '0')}`;
  }
  
  markAsReceived(approId: number): void {
    if (confirm('Marquer cet approvisionnement comme reçu ?')) {
      const sub = this.approvisionnementService.updateStatus(approId, 'recu').subscribe({
        next: (updatedAppro) => {
          // Mettre à jour l'approvisionnement dans la liste
          const index = this.approvisionnements.findIndex(a => a.id === approId);
          if (index !== -1) {
            this.approvisionnements[index] = updatedAppro;
            this.applyFilters();
            this.calculateStats();
          }
        },
        error: (err: Error) => {
          console.error('Erreur lors de la mise à jour du statut:', err);
          alert('Une erreur est survenue lors de la mise à jour du statut');
        }
      });
      this.subscriptions.add(sub);
    }
  }
  
  deleteApprovisionnement(approId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet approvisionnement ? Cette action est irréversible.')) {
      const sub = this.approvisionnementService.deleteApprovisionnement(approId).subscribe({
        next: () => {
          this.approvisionnements = this.approvisionnements.filter(a => a.id !== approId);
          this.applyFilters();
          this.calculateStats();
        },
        error: (err: Error) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Une erreur est survenue lors de la suppression');
        }
      });
      this.subscriptions.add(sub);
    }
  }

  getStatusText(status: 'en_attente' | 'recu'): string {
    return status === 'recu' ? 'Reçu' : 'En attente';
  }

  getStatusClass(status: 'en_attente' | 'recu'): string {
    return status === 'recu' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  }
}

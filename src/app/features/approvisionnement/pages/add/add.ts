import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApprovisionnementService } from '../../services/approvisionnement.service';
import { Article, NewApprovisionnement, Fournisseur, ArticleCommande } from '../../models/approvisonnement.model';

@Component({
  selector: 'app-add-approvisionnement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './add.html',
  styleUrls: ['./add.css']
})
export class AddComponent implements OnInit {
  approvisionnementForm: FormGroup;
  articles: Article[] = []; // Liste des articles disponibles
  fournisseurs: Fournisseur[] = []; // Liste des fournisseurs disponibles
  addedArticles: ArticleCommande[] = []; // Articles ajoutés au tableau
  currentArticle: ArticleCommande = {
    articleId: 0,
    quantite: 1,
    prixUnitaire: 0
  };
  currentArticleTotal: number = 0;
  currentDate: string = new Date().toISOString().split('T')[0];
  totalGeneral: number = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly approvisionnementService: ApprovisionnementService,
    private readonly router: Router
  ) {
    this.approvisionnementForm = this.fb.group({
      date: [this.currentDate, Validators.required],
      fournisseurId: ['', Validators.required],
      reference: ['', Validators.required],
      observations: ['']
    });
  }

  ngOnInit(): void {
    this.loadArticles();
    this.loadFournisseurs();
  }

  private loadArticles(): void {
    this.approvisionnementService.getArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
      },
      error: (error) => console.error('Erreur lors du chargement des articles', error)
    });
  }
  
  private loadFournisseurs(): void {
    this.approvisionnementService.getFournisseurs().subscribe({
      next: (fournisseurs) => {
        this.fournisseurs = fournisseurs;
      },
      error: (error) => console.error('Erreur lors du chargement des fournisseurs', error)
    });
  }

  onCurrentArticleSelect(): void {
    if (this.currentArticle.articleId) {
      const article = this.articles.find(a => a.id === this.currentArticle.articleId);
      if (article) {
        this.currentArticle.prixUnitaire = article.prixUnitaire;
        this.calculateCurrentArticleTotal();
      }
    }
  }
  
  calculateCurrentArticleTotal(): void {
    this.currentArticleTotal = (this.currentArticle.quantite || 0) * (this.currentArticle.prixUnitaire || 0);
  }
  
  addCurrentArticle(): void {
    if (!this.currentArticle.articleId || !this.currentArticle.quantite || !this.currentArticle.prixUnitaire) {
      alert('Veuillez remplir tous les champs de l\'article');
      return;
    }
    
    if (this.currentArticle.quantite <= 0) {
      alert('La quantité doit être supérieure à 0');
      return;
    }
    
    if (this.currentArticle.prixUnitaire < 0) {
      alert('Le prix unitaire doit être positif');
      return;
    }
    
    // Ajouter l'article à la liste
    this.addedArticles.push({
      articleId: this.currentArticle.articleId,
      quantite: this.currentArticle.quantite,
      prixUnitaire: this.currentArticle.prixUnitaire
    });
    
    // Réinitialiser le formulaire d'article
    this.currentArticle = {
      articleId: 0,
      quantite: 1,
      prixUnitaire: 0
    };
    this.currentArticleTotal = 0;
    
    // Recalculer le total général
    this.calculateTotal();
  }
  
  removeArticle(index: number): void {
    this.addedArticles.splice(index, 1);
    this.calculateTotal();
  }
  
  calculateTotal(): void {
    this.totalGeneral = this.addedArticles.reduce((total, article) => {
      return total + (article.quantite * article.prixUnitaire);
    }, 0);
  }
  
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  }
  
  getArticleLibelle(articleId: number): string {
    const article = this.articles.find(a => a.id === articleId);
    return article ? article.libelle : 'Article inconnu';
  }

  cancel(): void {
    if (confirm('Voulez-vous vraiment annuler ? Les modifications non enregistrées seront perdues.')) {
      this.router.navigate(['/approvisionnements']);
    }
  }

  onSubmit(): void {
    if (this.approvisionnementForm.valid && this.addedArticles.length > 0) {
      const formValue = this.approvisionnementForm.value;
      const selectedFournisseur = this.fournisseurs.find(f => f.id === +formValue.fournisseurId);
      
      if (!selectedFournisseur) {
        console.error('Fournisseur non trouvé');
        return;
      }
      
      const newApprovisionnement: NewApprovisionnement = {
        date: new Date(formValue.date),
        fournisseur: selectedFournisseur,
        reference: formValue.reference,
        observations: formValue.observations || '',
        status: 'en_attente',
        articles: this.addedArticles.map(a => ({
          articleId: a.articleId,
          quantite: a.quantite,
          prixUnitaire: a.prixUnitaire
        })),
        montantTotal: this.totalGeneral
      };
      
      this.approvisionnementService.addApprovisionnement(newApprovisionnement).subscribe({
        next: () => {
          this.router.navigate(['/approvisionnements']);
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout de l\'approvisionnement', error);
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.approvisionnementForm.markAllAsTouched();
      if (this.addedArticles.length === 0) {
        alert('Veuillez ajouter au moins un article');
      }
    }
  }
}

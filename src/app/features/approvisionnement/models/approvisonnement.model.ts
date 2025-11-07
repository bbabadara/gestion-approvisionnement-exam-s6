export interface Article {
  id: number;
  libelle: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Fournisseur {
  id: number;
  nom: string;
  telephone: string;
}

export interface ArticleCommande {
  articleId: number;
  quantite: number;
  prixUnitaire: number;
}

export interface Approvisionnement {
  id: number;
  date: Date;
  articles: ArticleCommande[];
  fournisseur: Fournisseur;
  status: 'en_attente' | 'recu';
  observations?: string;
  montantTotal: number;
}

export interface NewApprovisionnement {
  date: Date;
  articles: ArticleCommande[];
  fournisseur: Omit<Fournisseur, 'id'>;
  observations?: string;
  reference: string;
  status: 'en_attente' | 'recu';
  montantTotal: number;
}

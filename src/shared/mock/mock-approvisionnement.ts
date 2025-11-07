import { Approvisionnement } from "../../app/features/approvisionnement/models/approvisonnement.model";
import { MOCK_FOURNISSEURS } from "./mock-fournisseur";


export const MOCK_APPROVISIONNEMENTS: Approvisionnement[] = [
  {
    id: 1,
    date: new Date('2025-11-01'),
    fournisseur: MOCK_FOURNISSEURS[0],
    articles: [
      { articleId: 1, quantite: 10, prixUnitaire: 1500 },
      { articleId: 2, quantite: 20, prixUnitaire: 200 },
    ],
    status: 'en_attente',
    observations: 'Livraison partielle attendue',
    montantTotal: 10 * 1500 + 20 * 200,
  },
  {
    id: 2,
    date: new Date('2025-10-25'),
    fournisseur: MOCK_FOURNISSEURS[1],
    articles: [
      { articleId: 3, quantite: 100, prixUnitaire: 50 },
    ],
    status: 'recu',
    observations: '',
    montantTotal: 100 * 50,
  },
];

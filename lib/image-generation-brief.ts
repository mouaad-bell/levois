import type { VisualAssetTask } from './visual-asset-plan';
import type { StudioFamily } from './studio-schema';

export type ImageGenerationBrief = {
  version: 'LEVOIS_IMAGE_BRIEF_V1';
  taskId: string;
  allowed: boolean;
  reason: string;
  prompt?: string;
  negativeConstraints: string[];
  requiredQualifier?: string;
};

const NEGATIVE_CONSTRAINTS = [
  'Ne pas représenter un bien réel identifiable.',
  'Ne pas ajouter de texte, chiffre, adresse, logo tiers ou donnée absente du dossier.',
  'Ne pas faire croire qu’une scène fictive est une photographie documentaire.',
  'Ne pas introduire de défaut immobilier, risque, DPE, prix ou caractéristique technique non demandé.',
  'Ne pas imiter une capture d’annonce immobilière réelle.',
  'Éviter les clichés de banque d’images, les poses publicitaires et les personnages regardant la caméra.',
];

export function buildImageGenerationBrief(
  task: VisualAssetTask,
  family: StudioFamily,
): ImageGenerationBrief {
  if (task.mode !== 'generated_explanatory_allowed') {
    return {
      version: 'LEVOIS_IMAGE_BRIEF_V1',
      taskId: task.taskId,
      allowed: false,
      reason:
        task.mode === 'real_source_required'
          ? 'Une source réelle est requise : génération interdite.'
          : task.mode === 'programmatic'
            ? 'Le visuel doit être produit programmatiquement à partir du scénario ou des données.'
            : 'La matière éditoriale ne nécessite pas une génération figurative.',
      negativeConstraints: NEGATIVE_CONSTRAINTS,
    };
  }

  const qualifier = task.qualifierRequired
    ? 'CAS FICTIF / ILLUSTRATION'
    : undefined;

  const prompt = [
    'Créer une illustration éditoriale verticale 4:5 pour LEVOIS.',
    'Rôle exact : ' + task.requirement + '.',
    'Le visuel sert uniquement à expliquer une situation immobilière pédagogique, jamais à documenter un bien réel.',
    'Direction : photographie éditoriale contemporaine ou maquette tangible selon le besoin, lumineuse, contrastée, précise, premium, sans esthétique publicitaire générique.',
    'Palette de composition : base bleu nuit / blanc cassé ; accent de la famille ' +
      family.label +
      ' : ' +
      family.accent +
      '.',
    'Préserver de larges zones calmes pour la typographie ajoutée ensuite par le renderer.',
    'Aucun texte intégré dans l’image finale.',
    qualifier
      ? 'La qualification "' +
        qualifier +
        '" sera ajoutée ensuite par le renderer ; ne pas l’intégrer dans l’image.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    version: 'LEVOIS_IMAGE_BRIEF_V1',
    taskId: task.taskId,
    allowed: true,
    reason:
      'La tâche est explicitement pédagogique et ne porte aucun fait immobilier réel.',
    prompt,
    negativeConstraints: NEGATIVE_CONSTRAINTS,
    requiredQualifier: qualifier,
  };
}

# 📚 Justicia Legal Corpus Collector

Script pour crawler et télécharger les textes juridiques officiels de Côte d'Ivoire et de la zone OHADA.

## Sources couvertes

1. **OHADA** (ohada.org) - Actes uniformes
2. **BCEAO/UMOA** (downloads.bceao.int) - Réglementation bancaire et financière
3. **BRVM/CREPMF** (brvm.org) - Marché financier régional
4. **AfricanLII** (agp.africanlii.org) - Textes législatifs CI
5. **JORCI** (alegre.ci) - Journal Officiel de Côte d'Ivoire
6. **UEMOA** (e-docucenter.uemoa.int) - Documents UEMOA

## Installation

```bash
pip install requests beautifulsoup4 pyyaml
```

## Utilisation

```bash
cd scripts
python collector.py --seeds seeds.yml --out ../data/legal_corpus --max-pages 1500 --delay 1.25
```

### Options

- `--seeds` : Fichier YAML contenant les seeds (obligatoire)
- `--out` : Dossier de sortie (défaut: `data/legal_corpus`)
- `--max-pages` : Nombre maximum de pages HTML par seed (défaut: 800)
- `--delay` : Délai entre les requêtes en secondes (défaut: 1.0)

## Structure de sortie

```
data/legal_corpus/
├── ohada_official/
│   ├── manifest.jsonl
│   ├── acte_uniforme_1.pdf
│   └── ...
├── bceao_reglementations/
│   ├── manifest.jsonl
│   └── ...
└── ...
```

## Format du manifest.jsonl

Chaque ligne contient :
```json
{
  "seed": "ohada_official",
  "url": "https://www.ohada.org/...",
  "path": "data/legal_corpus/ohada_official/acte_uniforme_1.pdf",
  "sha256": "abc123...",
  "content_type": "application/pdf",
  "bytes": 123456,
  "downloaded_at": 1703260800
}
```

## Intégration au RAG

Après le crawl, utilisez le service `legalCitationService.ts` pour :
1. Extraire le texte des PDFs
2. Chunker par article/section
3. Indexer avec métadonnées (source, date, type, référence)
4. Générer les embeddings

## Respect des conditions d'utilisation

Le script respecte :
- Délai entre les requêtes (rate limiting)
- Domaines autorisés uniquement
- User-Agent identifiable

⚠️ **Important** : Vérifiez les conditions d'utilisation de chaque site avant de lancer le crawler.

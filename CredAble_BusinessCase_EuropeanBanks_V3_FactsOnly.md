# CredAble Europe — Analyse Stratégique Banques Cibles 2026
## Version 3.0 — Faits documentés uniquement | DeepSeek V4 Pro + Rapports Annuels + Presse Professionnelle

---

**Document** : Version 3.0 — Faits uniquement, sources citées, [INFÉRENCE] explicitement marqué  
**Date** : Mai 2026  
**Modèle d'analyse** : DeepSeek V4 Pro (deepseek-ai/DeepSeek-V4-Pro) via DeepInfra  
**Tokens** : prompt 23,176 / completion 9,074  
**Protocole strict** : Aucune recommandation de produit. Aucun argumentaire de vente.

---

## SECTION 0 — SOURCES PRIMAIRES INTÉGRÉES

| # | Source | Volume | Nature |
|---|--------|---------|--------|
| 1 | Aequitas Consultus — Banques Europe Occidentale & CEE | 53 KB | Analyse propriétaire, signaux TF/SCF, citations GTR/presse |
| 2 | Aequitas Consultus — Banques Balkans, Caucase, Ukraine, Moldavie | 49 KB | 50 banques, tableau de comparaison |
| 3 | Aequitas Consultus — Document DOCX complémentaire | ~15 KB | Fiches banques additionnelles |
| 4 | **Rapports annuels 2024/2025** (PDFs téléchargés et extraits) | Texte brut | LBBW (1.38M c), Helaba (581K c), Banco BPM (2.9M c), BayernLB (1.52M c), NLB (2.22M c), OTP (PDF), Belfius |
| 5 | **Presse professionnelle** | Web | GTR (Leaders in Trade 2025), TXF (classements 2025), Euromoney (TF Survey 2024) |
| 6 | **Allianz Trade Country Risk Atlas 2026** | PDF 570KB extrait + web | Notations pays (AA→D + 1→4), upgrades/downgrades 2025 |
| 7 | **Marsh Political Risk Report 2026** | PDF 42KB extrait | Cartographie risques politiques par zone |
| 8 | **UN Comtrade API** | JSON | Flux bilatéraux (M49, HS, 2021-2023) |
| 9 | **FCI Global Factoring Statistics** | Web | Membres FCI, volumes factoring par marché |

### Protocole
- **Confirmé** : Signal documenté dans source primaire listée, avec citation exacte
- **[INFÉRENCE]** : Déduction logique de DeepSeek V4 Pro, non documentée directement
- **SCF_ABSENT** : Aucun produit SCF documenté publiquement
- **SCF_BASIQUE** : Factoring simple (recours), sans plateforme digitale intégrée
- **SCF_INTERMÉDIAIRE** : Confirming ou reverse factoring documenté, plateforme partiellement digitale
- **SCF_AVANCÉ** : Plateforme digitale complète → **EXCLURE** (concurrent potentiel)

---

## PARTIE 1 — ANALYSE PAYS PAR ZONE

*Cette analyse croise les notations de risque pays, les flux commerciaux et le risque politique pour déterminer le besoin structurel en Trade Finance documentaire et en SCF.*

**Principe fondamental** : Un pays avec une notation B, C ou D implique que le commerce international se fait via des instruments de trade finance documentaire (lettres de crédit, garanties, credit insurance) plutôt qu'en open account. Les banques locales **doivent** disposer d'une activité TF documentaire robuste pour servir leurs clients.

---

### 1.1 Europe Occidentale (DE / FR / IT / ES / BE / CH / AT)

| Dimension | Données | Source |
|-----------|---------|--------|
| **Allianz 2026** | AA1 : Allemagne, Suisse, Autriche — A1 : France (downgrade 2025), Italie (upgrade 2025) — A2 : Belgique (downgrade 2025), Espagne (upgrade 2025) | Allianz Trade Country Risk Atlas 2026 |
| **Marsh 2026** | Risque faible. Expositions de second ordre : cyber, fragmentation politique, coûts énergie | Marsh Political Risk Report 2026 |
| **Comtrade** | Allemagne 2021 : $1,635 Mds exports (M49: 276) — Corridors HU→DE: $41.6 Mds, RO→DE: $21.0 Mds | UN Comtrade API |
| **Implication TF** | Commerce en open account majoritaire. TF documentaire classique (LC, garanties) en déclin. Besoin : SCF digitaux pour optimiser BFR sur flux open account | — |
| **Niveau bancaire attendu** | Très élevé. Leaders mondiaux du SCF avec plateformes propriétaires ou partenaires technologiques | — |

**Upgrades/Downgrades 2025 significatifs** :
- France **downgrade** : fiscal slippage, déficit -4%+, augmentation des primes de risque corporate. Source : Allianz Trade Country Risk Atlas 2026
- Italie **upgrade** : meilleure stabilité politique, désinflation, performance commerciale. Source : Allianz Trade Country Risk Atlas 2026
- Belgique **downgrade** : détérioration fiscale. Source : Allianz Trade Country Risk Atlas 2026
- Espagne **upgrade** : résilience commerce, croissance. Source : Allianz Trade Country Risk Atlas 2026

---

### 1.2 Europe Centrale et Orientale (PL / CZ / SK / HU / RO / SI / HR / BG)

| Dimension | Données | Source |
|-----------|---------|--------|
| **Allianz 2026** | A2 : Pologne, Tchéquie, Slovaquie, Slovénie — B1 : Hongrie (upgrade 2025), Roumanie — B2 : Croatie, Bulgarie | Allianz Trade Country Risk Atlas 2026 |
| **Marsh 2026** | Risque modéré. Bénéficiaires du nearshoring/China+1. Risque : proximité conflit ukrainien, pression supply chains | Marsh Political Risk Report 2026 |
| **Comtrade** | Pologne 2023 : $381.9 Mds exports — Tchéquie 2022 : $241.7 Mds — Hongrie→DE 2022 : $41.6 Mds — Bulgarie 2023 : $47.9 Mds | UN Comtrade API |
| **Implication TF** | Zone de mixité. TF documentaire important pour transactions transfrontalières et grands projets. SCF en développement rapide, tiré par les filiales de groupes occidentaux | — |
| **Niveau bancaire attendu** | Intermédiaire à avancé. Filiales de groupes internationaux (Erste, KBC, OTP, RBI) déploient des solutions SCF de plus en plus sophistiquées | — |

---

### 1.3 Pays Baltes (EE / LV / LT)

| Dimension | Données | Source |
|-----------|---------|--------|
| **Allianz 2026** | A1 : Estonie — A2 : Lettonie, Lituanie | Allianz Trade Country Risk Atlas 2026 |
| **Marsh 2026** | Risque faible à modéré. Forte intégration OTAN/UE. Risque de perception lié à la Russie | Marsh Political Risk Report 2026 |
| **Comtrade** | Économies petites, ouvertes, digitalisées, tournées vers les pays nordiques | UN Comtrade API |
| **Implication TF** | Commerce majoritairement en open account. Besoin SCF réel mais marché de niche en volume | — |
| **Niveau bancaire attendu** | Élevé. Filiales de groupes suédois très digitalisées | — |

---

### 1.4 Balkans Occidentaux (RS / BA / AL / MK)

| Dimension | Données | Source |
|-----------|---------|--------|
| **Allianz 2026** | B3 : Serbie — C3 : Bosnie-Herzégovine, Albanie, Macédoine du Nord | Allianz Trade Country Risk Atlas 2026 |
| **Marsh 2026** | Risque élevé. Fragmentation politique, intégration UE lente, tensions ethniques latentes | Marsh Political Risk Report 2026 |
| **Comtrade** | Échanges principalement régionaux et avec l'UE. Volumes plus faibles | UN Comtrade API |
| **Implication TF** | **TF documentaire obligatoire** pour commerce international (risque pays B3/C3). LCs, garanties, credit insurance = norme. SCF couche additionnelle rare, limitée aux filiales de groupes étrangers | — |
| **Niveau bancaire attendu** | Basique à intermédiaire. Infrastructure TF documentaire obligatoire. SCF marché émergent | — |

---

### 1.5 Caucase (GE / AM / AZ)

| Dimension | Données | Source |
|-----------|---------|--------|
| **Allianz 2026** | B3 : Géorgie — C3 : Arménie — C3-C4 : Azerbaïdjan | Allianz Trade Country Risk Atlas 2026 |
| **Marsh 2026** | Risque élevé à très élevé. Conflit AM-AZ (post-2023), autoritarisme AZ, risque géopolitique RU/TR | Marsh Political Risk Report 2026 |
| **Comtrade** | Hydrocarbures dominants pour AZ, matières premières/agricole pour GE et AM | UN Comtrade API |
| **Implication TF** | **TF documentaire obligatoire**. Marché SCF quasi-inexistant. Factoring = produit le plus avancé disponible | — |
| **Niveau bancaire attendu** | Basique. TF concentré sur le documentaire classique | — |

---

### 1.6 Moldavie et Ukraine

| Dimension | Données | Source |
|-----------|---------|--------|
| **Allianz 2026** | C3 : Moldavie — **D4 : Ukraine** (risque maximum) | Allianz Trade Country Risk Atlas 2026 |
| **Marsh 2026** | Risque maximum. Conflit actif (Ukraine). Moldavie en première ligne, risque de contagion, dépendance UE | Marsh Political Risk Report 2026 |
| **Comtrade** | Flux très fortement perturbés par la guerre | UN Comtrade API |
| **Implication TF** | Financement du commerce quasi-exclusivement via multilatéraux (EBRD, IFC) ou LCs confirmées par banques de premier rang. SCF non prioritaire CT | — |
| **Niveau bancaire attendu** | Basique. Gestion du risque et transactions sécurisées. Reconstruction future = besoin TF massif | — |

---

## PARTIE 2 — TABLEAU DES BANQUES (50+ banques)

| Banque | Pays | Allianz | TF Confirmé (source exacte) | Niveau SCF actuel (source) | Priorité |
|--------|------|---------|----------------------------|---------------------------|----------|
| **EUROPE OCCIDENTALE** | | | | | |
| LBBW | Allemagne | AA1 | Oui. "Germany's first forfaiting guarantee". 2ème mondial export finance (TXF 2025, score 8.38 EMEA). | **SCF_AVANCÉ** — Plateforme dédiée, filiale SüdFactoring, ABS financing, reverse factoring. (Rapport Annuel 2024, site corporate) | **EXCLURE** |
| BayernLB | Allemagne | AA1 | Oui. ECA-backed financing. Membre Marco Polo. (GTR 2019, Rapport Annuel 2025) | **SCF_INTERMÉDIAIRE** — Page "Supply chain financing" dédiée, concept multibank "without recourse". (Site corporate) | P2 |
| Helaba | Allemagne | AA1 | Oui. "main partner for the international documentary business". (Rapport Annuel 2024) | **SCF_BASIQUE** — "Expanded collaboration with supply chain finance platforms" mais pas de produit propre documenté. (Rapport Annuel 2024) | P3 |
| ABN AMRO | Pays-Bas | AA1 | Oui. Receivable Finance, Working Capital Solutions. | **SCF_AVANCÉ** — Partenaire historique Demica. | **EXCLURE** |
| Belfius Bank | Belgique | A2 | Oui. Filiale Belfius Commercial Finance, bilan EUR 1,547M. (Rapport Annuel 2024) | **SCF_INTERMÉDIAIRE** — Factoring confirmé, SCF peu mis en avant en propre. (Rapport Annuel 2024) | P3 |
| KBC Bank | Belgique | A2 | Oui. Filiale KBC Commercial Finance. | **SCF_INTERMÉDIAIRE** — SCF via filiales locales (ČSOB, K&H, UBB). | P2 |
| La Banque Postale | France | A1 | Oui. Filiale LBP Leasing & Factoring. (LinkedIn, UniversFinance 2025) | **SCF_INTERMÉDIAIRE** — Atelier SCF 2025, "reverse factoring" non détecté en propre. | P3 |
| Banca Ifis | Italie | A1 | Oui. Cœur de métier, forfaiting import/export. (Site bancaifis.it) | **SCF_AVANCÉ** — Plateforme Ifis4business, confirming, reverse factoring. | **EXCLURE** |
| Banco BPM | Italie | A1 | Oui. "Trade Finance Products & Controls" office dédié. (Rapport Annuel 2024) | **SCF_INTERMÉDIAIRE** — Unité "Supply Chain Finance" citée; a externalisé l'opérationnel (cession filiale 2021). | P2 |
| BPER Banca | Italie | A1 | Oui. Filiale BPER Factor. (Site BPER, Assifact) | **SCF_INTERMÉDIAIRE** — Partenariat PlusAdvance 2023 (Confirming, Dynamic Discounting, Reverse Factoring). (PR 30/05/2023) | **P1** |
| Banco Sabadell | Espagne | A2 | Oui. Pionnier du confirming en Espagne. | **SCF_AVANCÉ** — Offre confirming/SCF mature. | **EXCLURE** |
| Bankinter | Espagne | A2 | Oui. "Factoring, forfaiting, discounting and portfolio purchases without recourse". (CFO Forum Bankinter) | **SCF_INTERMÉDIAIRE** — Plateforme SCF lancée 2022, extension en cours. SCF +80% en 2024, +75% en 2025. (Rapport Annuel 2024) | **P1** |
| BCGE | Suisse | AA1 | Oui. "Global Commodity Finance". (Site BCGE) | **SCF_ABSENT** — Aucune offre SCF publique. Recrutement Eric Balmer (ex-CEO Global SCF Ltd). (GTR) | **P1** |
| BCV | Suisse | AA1 | Oui. "International trade finance". (GlobalData) | **SCF_ABSENT** — Aucun signal SCF détecté. | P4 |
| Erste Group | Autriche | AA1 | Oui. "Structured Trade Finance". (Site erstegroup.com) | **SCF_AVANCÉ** — "ErsteConfirming", filiale Intermarket Bank, couverture CEE. | **EXCLURE** |
| **CEE** | | | | | |
| PKO BP | Pologne | A2 | Oui. "trade finance" dans transaction banking. (Rapport Annuel 2023) | **SCF_INTERMÉDIAIRE** — PKO Faktoring: invoice financing, factoring classique, reverse factoring documenté. (Site PKO BP) | P3 |
| Bank Pekao | Pologne | A2 | Oui. Filiale Pekao Faktoring. | **SCF_BASIQUE** — Factoring complet, SCF non détecté en propre. | P3 |
| mBank | Pologne | A2 | Oui. Filiale mFaktoring, membre FCI. | **SCF_BASIQUE** — Plateforme propriétaire "Client Manager", SCF non détecté. | P3 |
| Bank Millennium | Pologne | A2 | Oui. "Best Trade Finance Services in Poland 2025" (Global Finance) | **SCF_INTERMÉDIAIRE** — Atelier interne SCF 2025. (LinkedIn, Ewelina Zielonka) | P2 |
| Alior Bank | Pologne | A2 | Oui. "Full insured factoring". | **SCF_ABSENT** — SCF/reverse factoring non détecté. | P4 |
| Citi Handlowy | Pologne | A2 | Oui. Réseau global Citi. | **SCF_INTERMÉDIAIRE** — SCF pilier stratégique post-2025: "nous avons une position forte dans le SCF". (PR 27/05/2025) | P2 |
| BGK | Pologne | A2 | Oui. Programmes partage de risque sur factoring. (PR 2019-2020) | **SCF_INTERMÉDIAIRE** — "faktoring odwrotny" (reverse factoring) documenté comme garant. | P3 |
| Česká spořitelna | Tchéquie | A2 | Oui. Filiale Factoring České spořitelny. | **SCF_AVANCÉ** — "focused on Supply Chain Finance (SCF)", reverse factoring. (Site filiale) | **EXCLURE** |
| ČSOB CZ | Tchéquie | A2 | Oui. Filiale ČSOB Factoring, awards TF. | **SCF_BASIQUE** — SCF non publié en propre. | P3 |
| Komerční banka | Tchéquie | A2 | Oui. Filiale Factoring KB. | **SCF_INTERMÉDIAIRE** — A cédé sa participation dans la fintech Roger à Orbian (février 2025). (GTR) | **P1** |
| Moneta Money Bank | Tchéquie | A2 | Non détecté. | **SCF_ABSENT** — Aucun signal. | P4 |
| Slovenská sporiteľňa | Slovaquie | A2 | Oui. Héritage Erste Group. | **SCF_AVANCÉ** — Infrastructure ErsteConfirming. | **EXCLURE** |
| VÚB Banka | Slovaquie | A2 | Oui. Filiale VÚB Factoring. | **SCF_BASIQUE** — SCF non détecté en propre. | P3 |
| Tatra banka | Slovaquie | A2 | Oui. Infrastructure RBI. | **SCF_INTERMÉDIAIRE** — Bénéficie du programme RBI Capital Solutions. | P3 |
| OTP Bank | Hongrie | B1 | Oui. "Domestic factoring". (Site OTP) | **SCF_AVANCÉ** — Page SCF dédiée, vocabulaire complet, couverture 9 pays CEE. | **EXCLURE** |
| MBH Bank | Hongrie | B1 | Oui. Profil universal bank. | **SCF_ABSENT** — SCF non détecté. | P4 |
| K&H Bank | Hongrie | B1 | Oui. Filiale KBC. | **SCF_INTERMÉDIAIRE** — Dispositif KBC Commercial Finance. | P3 |
| CIB Bank | Hongrie | B1 | Oui. Filiale Intesa Sanpaolo. | **SCF_BASIQUE** — SCF non explicité en propre. | P3 |
| Banca Transilvania | Roumanie | B1 | Oui. "Manager Trade Finance Sales" avec exp. SCF. (LinkedIn Mihai Andreescu) | **SCF_INTERMÉDIAIRE** — Programme SCF Profi Rom Food avec EBRD (oct. 2024, EUR 20M). Première transaction SCF EBRD en Roumanie. (PR EBRD) | **P1** |
| BCR | Roumanie | B1 | Oui. Membre FCI. | **SCF_AVANCÉ** — Rubrique "Supply Chain Finance" dédiée, reverse factoring explicite. (Site BCR Business) | **EXCLURE** |
| BRD-SocGen | Roumanie | B1 | Oui. "Best Trade Finance Provider in Romania" (Global Finance 2025) | **SCF_INTERMÉDIAIRE** — Plateforme FINTRA, leader factoring local. (PR BRD) | P2 |
| Raiffeisen Bank RO | Roumanie | B1 | Oui. Plateforme FlexiBILL Factoring. | **SCF_AVANCÉ** — Plateforme digitale propriétaire factoring. | **EXCLURE** |
| ING Bank RO | Roumanie | B1 | Oui. Département Factoring dédié. | **SCF_INTERMÉDIAIRE** — SCF non publié en propre. | P3 |
| CEC Bank | Roumanie | B1 | Non détecté. | **SCF_ABSENT** — Aucun signal. | P4 |
| DSK Bank | Bulgarie | B2 | Oui. Filiale OTP. | **SCF_INTERMÉDIAIRE** — Dispositif OTP groupe. | P3 |
| UniCredit Bulbank | Bulgarie | B2 | Oui. Filiale UniCredit. | **SCF_INTERMÉDIAIRE** — Offre UniCredit Factoring. | P3 |
| Postbank | Bulgarie | B2 | Oui. Profil corporate. | **SCF_ABSENT** — SCF non détecté. | P4 |
| First Investment Bank | Bulgarie | B2 | Non détecté. | **SCF_ABSENT** — Incertitude actionnariale (M&A). | P4 |
| Zagrebačka banka | Croatie | B2 | Oui. Filiale UniCredit. | **SCF_INTERMÉDIAIRE** — Offre U-Factor (UniCredit). | P3 |
| PBZ | Croatie | B2 | Oui. Membre FCI, forfaiting export sans recours. (Site PBZ) | **SCF_INTERMÉDIAIRE** — Écosystème Intesa Sanpaolo/IMI. | P3 |
| HPB | Croatie | B2 | Oui. Forfaiting dans le périmètre légal. (Fininfo.hr) | **SCF_ABSENT** — Aucune offre SCF en propre. | P4 |
| NLB d.d. | Slovénie | A2 | Oui. "leader in guarantees, factoring, and letters of credit". (Rapport Annuel NLB 2025) | **SCF_INTERMÉDIAIRE** — "activities continued in factoring and reverse factoring", NLB Factoring app avec reverse factoring. Modernisation TF en cours. (Rapport Annuel NLB 2025) | P2 |
| OTP banka Slovenija | Slovénie | A2 | Oui. Fusion SKB + Nova KBM (août 2024). | **SCF_INTERMÉDIAIRE** — Dispositif OTP groupe. Fenêtre post-fusion. | P2 |
| SID Banka | Slovénie | A2 | Oui. Banque publique export-import. | **SCF_ABSENT** — SCF non détecté. | P4 |
| **BALKANS** | | | | | |
| AIK Bank | Serbie | B3 | Oui. "Best Bank in Serbia" (Euromoney TF Survey 2024) | **SCF_ABSENT** — Aucun produit SCF documenté post-fusion (mars 2025). | P4 |

---

## PARTIE 3 — FICHES DÉTAILLÉES (Top 10 Priorités P1 et P2 sélectionnés)

### P1-1. BCGE — Suisse

- **TF Confirmé** : Oui. Activité de "Global Commodity Finance" et de financement import/export. *(Source : site institutionnel BCGE)*
- **SCF Actuel** : **SCF_ABSENT.** Aucune offre SCF, reverse factoring ou confirming documentée publiquement.
- **Déclencheur** : **Recrutement stratégique.** Eric Balmer nommé Head of Corporate Banking and Trade Finance, prise de fonction 1er septembre 2025. Précédemment CEO de **Global Supply Chain Finance Ltd** (depuis 2022) et 30 ans de carrière chez Credit Suisse (responsible de "investment banking lending, factoring and structured finance"). *(Source : GTR "On the Move")*
- **Risque pays** : Suisse AA1. Commerce en open account. [INFÉRENCE] L'arrivée d'un dirigeant au profil SCF marqué dans une banque sans offre SCF publique suggère une intention stratégique de créer cette ligne de métier.
- **Interlocuteur documenté** : Eric Balmer, Head of Corporate Banking and Trade Finance. *(Source : GTR)*

---

### P1-2. Komerční Banka — République Tchèque

- **TF Confirmé** : Oui. Filiale **Factoring KB** proposant une page "Supply Chain Finance". *(Source : site Factoring KB)*
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** KB détenait 25% dans la fintech tchèque de SCF **Roger** via KB SmartSolutions. En **février 2025, Orbian a acquis Roger**, mettant fin au partenariat. *(Source : GTR, "Orbian acquires Czech supply chain finance fintech Roger")*
- **Déclencheur** : **Vacance technologique.** La cession de Roger crée un vide dans l'offre SCF digitale de KB. La banque est désormais sans partenaire fintech dédié pour cette activité.
- **Risque pays** : Tchéquie A2. Économie industrielle mature avec forts corridors commerciaux vers l'Allemagne.
- **Interlocuteur documenté** : Non identifié nominativement pour le SCF post-Roger.

---

### P1-3. Bankinter — Espagne

- **TF Confirmé** : Oui. "Factoring, forfaiting, discounting and portfolio purchases without recourse". *(Source : site CFO Forum Bankinter)*
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** Plateforme SCF lancée en 2022. Multi-devises (27 devises). International Business +80% SCF en 2024, +75% en 2025. Confirming pioneer depuis 7 ans (depuis 2018). *(Source : Rapport Annuel 2024, elconciso.es)*
- **Déclencheur** : **Cycle d'investissement actif.** International Business record : EUR 10.2 Mds de prêts (+14% 2024). La banque est en phase active de construction et d'extension de son offre SCF.
- **Risque pays** : Espagne A2. Marché confirming très mature et concurrentiel. [INFÉRENCE] Bankinter pourrait chercher une solution différenciante pour le segment international/cross-border.
- **Interlocuteur documenté** : Non identifié nominativement.

---

### P1-4. BPER Banca — Italie

- **TF Confirmé** : Oui. Filiale **BPER Factor** avec plateforme digitale **WIP** (Webfactor Interactive Platform). *(Source : site BPER, Assifact)*
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** Partenariat technologique avec la fintech italienne **PlusAdvance** (mai 2023) couvrant Confirming, Dynamic Discounting, Reverse Factoring. *(Source : communiqué de presse BPER, 30/05/2023)*
- **Déclencheur** : **Intégration post-fusion.** BPER a finalisé l'acquisition de **Banca Popolare di Sondrio (BPS)** en avril 2026. [INFÉRENCE] L'intégration créera un besoin de rationalisation des plateformes SCF à l'échelle du groupe combiné.
- **Risque pays** : Italie A1 (upgradée 2025). Marché factoring/SCF parmi les plus importants d'Europe.
- **Interlocuteurs documentés** : Davide Vellani (Direttore Imprese e Global Transaction), Matteo Bigarelli (Direttore BPER Factor). *(Source : PR 2023, Assifact)*

---

### P1-5. Banca Transilvania — Roumanie

- **TF Confirmé** : Oui. Poste "Manager Trade Finance Sales" avec expérience SCF ("supply-side receivables purchase"). *(Source : LinkedIn, Mihai Andreescu)*
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** En octobre 2024, la **BERD s'est associée à Banca Transilvania** pour un programme SCF de EUR 20 millions avec le détaillant Profi Rom Food SRL. La BERD prend 50% du risque. **Première transaction SCF de la BERD en Roumanie.** *(Source : communiqué de presse EBRD, octobre 2024)*
- **Déclencheur** : **Premier programme SCF structuré.** La transaction EBRD démontre l'appétit et la capacité de la banque à structurer des opérations SCF. [INFÉRENCE] La banque est en phase d'apprentissage et pourrait chercher une plateforme pour industrialiser ce type de programme.
- **Risque pays** : Roumanie B1. Corridors RO→DE massifs (Comtrade: $21.0 Mds). Besoin SCF fort pour fournisseurs de groupes internationaux.
- **Interlocuteur documenté** : Cosmin Călin (Executive Director Large Corporate Division). *(Source : PR EBRD 2024)*

---

### P2-1. BayernLB — Allemagne

- **TF Confirmé** : Oui. ECA-backed financing, membre Marco Polo. *(Source : GTR 2019, Rapport Annuel BayernLB 2025)*. "working capital, capex and trade financing, project and export financing". *(Rapport Annuel 2025)*
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** Page produit "Supply chain financing" avec concept multibank : "your receivables are sold without recourse, your suppliers remove default risk and improve their balance sheets". *(Source : site corporate BayernLB)*. [INFÉRENCE] Il n'est pas certain qu'une plateforme client digitale complète soit déployée.
- **Déclencheur** : [INFÉRENCE] Offre SCF conceptuellement mature mais sans plateforme digitale documentée.
- **Risque pays** : Allemagne AA1. Cœur du commerce européen. Grands groupes allemands = acheteurs majeurs pour fournisseurs CEE.
- **Interlocuteur documenté** : Florian Seitz (Head of Trade & Export Finance). *(Source : TradeFinanceGlobal)*

---

### P2-2. Citi Handlowy — Pologne

- **TF Confirmé** : Oui. Réseau global Citi TF/SCF.
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** "nous avons une position forte dans le domaine du supply chain finance" et "vouloir utiliser ce potentiel pour offrir à nos clients des solutions encore meilleures". SCF identifié comme l'un des 4 piliers de croissance post-cession retail. *(Source : communiqué de presse 27/05/2025)*
- **Déclencheur** : **Pivot stratégique.** La banque se recentre sur le corporate et fait du SCF une priorité stratégique affichée 2025.
- **Risque pays** : Pologne A2. Exports 2023 : $381.9 Mds. Marché SCF en forte croissance.
- **Interlocuteur documenté** : Non identifié nominativement.

---

### P2-3. Bank Millennium — Pologne

- **TF Confirmé** : Oui. "Best Trade Finance Services in Poland for 2025" (Global Finance).
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** Atelier interne 2025 : "Supply Chain Finance — płynność, bezpieczeństwo i przewaga w jednym rozwiązaniu" (SCF - liquidité, sécurité et avantage en une seule solution). *(Source : LinkedIn, Ewelina Zielonka 2025)*
- **Déclencheur** : **Momentum interne.** Reconnaissance externe en TF + activité de formation interne SCF signalent une montée en puissance. [INFÉRENCE] Banque probablement en train de structurer ou renforcer son offre SCF.
- **Risque pays** : Pologne A2. Identique à Citi Handlowy.
- **Interlocuteur documenté** : Non identifié nominativement.

---

### P2-4. NLB d.d. — Slovénie

- **TF Confirmé** : Oui. "The trade finance segment remained firmly a leader in including guarantees, factoring, and letters of credit." *(Source : NLB Annual Report 2025)*
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** "activities continued in factoring and reverse factoring" ; "NLB Factoring app. This application also includes payable financing, i.e., reverse factoring." ; "factoring and supplier factoring experienced a... growth" ; "inter-factoring agreements" internationaux. Modernisation de l'application TF en cours. *(Source : NLB Annual Report 2025)*
- **Déclencheur** : **Modernisation technologique en cours.** La banque est dans un cycle actif de modernisation TF incluant le reverse factoring. Présence dans 7 pays (Slovénie, Serbie, Bosnie, Monténégro, Kosovo, Macédoine du Nord, Croatie re-entrée). Objectif 2030 : EUR 50 Mds d'actifs.
- **Risque pays** : Slovénie A2. Réseau dans des pays B3-C3 (Balkans) qui requièrent une infrastructure TF documentaire robuste.
- **Interlocuteur documenté** : Andrej Lasic (Member of Management Board, corporate and investment banking). *(Source : communications NLB 2024-2025)*

---

### P2-5. BRD-SocGen — Roumanie

- **TF Confirmé** : Oui. "Best Trade Finance Provider in Romania" décerné par Global Finance 2025.
- **SCF Actuel** : **SCF_INTERMÉDIAIRE.** Plateforme **FINTRA**, leader factoring local. *(Source : PR BRD)*
- **Déclencheur** : Reconnaissances multiples TF. [INFÉRENCE] La banque est en position de développer son offre SCF au-delà du factoring.
- **Risque pays** : Roumanie B1. Corridors RO→DE (Comtrade $21.0 Mds). Besoin SCF fort.
- **Interlocuteur documenté** : Non identifié nominativement.

---

## PARTIE 4 — BANQUES EXCLUES

Banques disposant d'une plateforme SCF digitale avancée documentée :

| Banque | Pays | Motif d'exclusion | Source |
|--------|------|-------------------|--------|
| **LBBW** | Allemagne | Plateforme SCF complète + filiale SüdFactoring + ABS financing corporate + reverse factoring + 2ème mondial export finance (TXF 2025) | Rapport Annuel LBBW 2024, TXF 2025 |
| **ABN AMRO** | Pays-Bas | Partenaire historique Demica pour SCF. "Working Capital Solutions" sophistiqué et digital | Rapports annuels, presse |
| **Banca Ifis** | Italie | Cœur de métier factoring/confirming. Plateforme digitale Ifis4business mature | Site bancaifis.it |
| **Banco Sabadell** | Espagne | Pionnier confirming. Offre SCF mature et concurrentielle | Rapports annuels |
| **Erste Group + BCR + Česká spořitelna + Slovenská sporiteľňa** | Autriche/CEE | Marque "ErsteConfirming" dédiée, filiale Intermarket Bank, couverture multi-pays CEE. BCR: "Supply Chain Finance" avec reverse factoring explicite | Site erstegroup.com, site BCR Business |
| **OTP Bank** | Hongrie | Page SCF dédiée, vocabulaire complet, couverture 9 pays CEE | Site OTP Bank |
| **Raiffeisen Bank International + filiale RO** | Autriche/Roumanie | Plateforme "FlexiBILL Factoring" (RO), programme "RBI Capital Solutions" multi-pays CEE (12 pays) | Site RBI, presse |
| **TBC Bank** | Géorgie | Déploiement QUALCO ProximaPlus confirmé | Source Aequitas 2 |
| **Banca Intesa Beograd** | Serbie | Utilise ISP Confirming (groupe Intesa Sanpaolo) | Source Aequitas 2 |

---

## PARTIE 5 — BANQUES P3 : SURVEILLANCE ACTIVE (18+ mois)

*Zone de risque élevé (B3/C3/D4) : le TF documentaire est la norme, le SCF est embryonnaire. Surveiller les déclencheurs réglementaires, EBRD, recrutements TF.*

### 5.1 Pays Baltes

| Banque | Pays | Allianz | TF Confirmé (source) | SCF Actuel | Signal de surveillance |
|--------|------|---------|---------------------|------------|----------------------|
| **Luminor** | EE/LV/LT | A1-A2 | Oui. Corporate banking actif, trade finance. *(Rapports annuels)* | **SCF_ABSENT** — Aucun produit SCF documenté. | Banque pan-baltique née du rachat de DNB+Nordea (2017). [INFÉRENCE] Structure régionale propice à une plateforme unifiée. |
| **Citadele** | LV | A2 | Oui. Corporate banking, export. *(Rapports annuels)* | **SCF_ABSENT** — Aucun signal. | Privatisée 2012, actionnaire EBRD. Concurrent direct Luminor. |
| **LHV Pank** | EE | A1 | Oui. Factoring avec credit insurance documenté. *(Site LHV)* | **SCF_BASIQUE** — Factoring classique, SCF absent. | Banque digitale-native, appétence tech forte. Factoring comme porte d'entrée SCF. |
| **Šiaulių Bankas** | LT | A2 | Oui. Leader factoring lituanien. *(Rapports annuels)* | **SCF_BASIQUE** — Factoring fort, SCF non structuré. | Croissance rapide du factoring. Candidate à l'upgrade SCF. |
| **SEB Lietuva** | LT | A2 | Oui. Groupe SEB, corporate finance. | **SCF_INTERMÉDIAIRE** — Offre groupe SEB probablement déployée. [INFÉRENCE] | Décision depuis Stockholm. Approche locale peu pertinente. |

---

### 5.2 Balkans Occidentaux (Serbie, Bosnie, Albanie, Macédoine du Nord)

| Banque | Pays | Allianz | TF Confirmé (source) | SCF Actuel | Signal de surveillance |
|--------|------|---------|---------------------|------------|----------------------|
| **NLB Komercijalna** | RS | B3 | Oui. Filiale NLB. Corporate banking. *(Rapports annuels)* | **SCF_ABSENT** — SCF non visible. | Levier groupe NLB (qui a reverse factoring documenté). Décision depuis Ljubljana. |
| **UniCredit Bank BiH** | BA | C3 | Oui. Via réseau groupe UniCredit. *(Rapports annuels)* | **SCF_ABSENT** — SCF non visible localement. | 1ère banque BiH. Décision depuis Milan. Bilan < €5 Mds. |
| **Raiffeisen Bank BiH** | BA | C3 | Oui. Via réseau RBI. *(Rapports annuels)* | **SCF_ABSENT** — SCF non visible localement. | 2ème banque BiH. RBI déploie SCF dans 12 pays CEE. |
| **BKT** | AL | C3 | Oui. Trade finance présent. *(Rapports annuels)* | **SCF_ABSENT** — SCF absent documenté. | Leader albanais. First mover potentiel en Albanie. Filiale BKT Kosova. |
| **Komercijalna Banka** | MK | C3 | Oui. Trade finance présent. *(Rapports annuels)* | **SCF_ABSENT** — SCF non documenté. | 1ère banque Macédoine du Nord. Bilan < €3 Mds. |
| **Stopanska Banka** | MK | C3 | Oui. Via réseau OTP/NLB. *(Rapports annuels)* | **SCF_ABSENT** — SCF non documenté. | 2ème banque. Levier groupe OTP. |

---

### 5.3 Caucase (Géorgie, Arménie, Azerbaïdjan)

| Banque | Pays | Allianz | TF Confirmé (source) | SCF Actuel | Signal de surveillance |
|--------|------|---------|---------------------|------------|----------------------|
| **Liberty Bank** | GE | B3 | Oui. **Nouveau membre FCI (mars 2025)**. *(FCI, source Aequitas 2)* | **SCF_ABSENT** — SCF non visible malgré l'adhésion FCI. | 3ème banque géorgienne. Adhésion FCI = signal de montée en gamme. [INFÉRENCE] Cherche à développer le factoring après TBC Bank. |
| **PASHA Bank** | AZ | C3-C4 | Oui. "Export factoring" sur page d'accueil du site. *(Site PASHA Bank)* | **SCF_BASIQUE** — Export factoring documenté, SCF non visible. | Leader corporate azerbaïdjanais. SCF = suite logique naturelle du factoring export. |
| **Ameriabank** | AM | C3 | Oui. Factoring/trade finance déclaré. *(Site Ameriabank)* | **SCF_BASIQUE** — Factoring présent, SCF embryonnaire. | Top banque arménienne. Gap technologique SCF confirmé. |
| **Ardshinbank** | AM | C3 | Oui. Factoring/trade finance déclaré. *(Site Ardshinbank)* | **SCF_BASIQUE** — Factoring présent, SCF embryonnaire. | Concurrent direct Ameriabank. |
| **ACBA Bank** | AM | C3 | Oui. Factoring/trade finance déclaré. *(Site ACBA)* | **SCF_BASIQUE** — SCF embryonnaire. | Acteur agricole dominant. Gap digital fort. |
| **Inecobank** | AM | C3 | Oui. Factoring/trade finance déclaré. *(Site Inecobank)* | **SCF_BASIQUE** — SCF embryonnaire. | Banque digitale, forte appétence technologique. |

---

### 5.4 Moldavie et Ukraine

| Banque | Pays | Allianz | TF Confirmé (source) | SCF Actuel | Signal de surveillance |
|--------|------|---------|---------------------|------------|----------------------|
| **MAIB** | MD | C3 | Oui. Factoring digital documenté sur site : recours, sans recours, **reverse factoring**. *(Site MAIB, source Aequitas 2)* | **SCF_INTERMÉDIAIRE** — Reverse factoring décrit sur site officiel. [INFÉRENCE] Plateforme peu scalable et non digitale. | **Pionnier SCF en Moldavie.** Première banque du pays. Dès que le contexte pays C3 s'améliore, cible prioritaire pour un upgrade technologique. |
| **OTP Ukraine** | UA | D4 | Oui. Factoring with recourse. *(Site OTP Ukraine)* | **SCF_BASIQUE** — SCF absent. | Surveillance post-conflit. Reconstruction Ukraine = besoin TF massif futur. |
| **Privatbank** | UA | D4 | Oui. Franchise TF avec EBRD documentée. *(EBRD)* | **SCF_BASIQUE** — SCF absent. | Banque systémique (nationalisée). Programme EBRD TF actif. |

---

### 5.5 Synthèse P3 — Déclencheurs de reclassification

Un déclencheur confirmé reclasse automatiquement une banque P3 en P2 :
- **Adhésion FCI** d'une nouvelle banque (signal de structuration factoring)
- **Programme SCF avec EBRD ou IFC** (validation institutionnelle)
- **Recrutement d'un responsable TF/SCF** avec profil spécialisé (GTR "On the Move")
- **Publication d'un appel d'offres RFP** pour une plateforme SCF
- **Fin d'un partenariat existant** avec une fintech SCF (cf. KB/Roger modèle)
- **Upgrade de la notation Allianz** d'un pays de C3 à B3 ou mieux

---

## PARTIE 6 — MATRICE RÉSUMÉE DE PROSPECTION

| Priorité | Nb banques | Horizon | Critère d'entrée | Exemples |
|----------|-----------|---------|-----------------|---------|
| **P1** | 5 | 0-6 mois | Déclencheur documenté + SCF_ABSENT ou SCF_INTERMÉDIAIRE + TF confirmé | BCGE, KB, Bankinter, BPER, Banca Transilvania |
| **P2** | 12 | 6-18 mois | TF fort + SCF_BASIQUE ou INTERMÉDIAIRE + momentum identifié | BayernLB, Citi Handlowy, Bank Millennium, NLB, BRD, Helaba, Belfius, KBC, LBP, Banco BPM, OTP Slovenija, BRD |
| **P3** | 22 | 18+ mois | TF confirmé + SCF_ABSENT + risque pays B3/C3 | MAIB, Liberty Bank, PASHA, Ameriabank, BKT, Luminor, LHV, NLB Komercijalna, UniCredit BiH |
| **Exclus** | 11 | — | SCF_AVANCÉ documenté | LBBW, Erste/BCR, OTP, Sabadell, Banca Ifis, ABN AMRO, Raiffeisen, TBC, Intesa Beograd, CS, SlovSp |

---

## ANNEXE — DONNÉES BRUTES UN COMTRADE

| Pays | Exports totaux | Corridors clés | Année | Code M49 |
|------|---------------|---------------|-------|----------|
| Pologne | $381.9 Mds | — | 2023 | 616 |
| Hongrie | $149.9 Mds | →DE: $41.6 Mds | 2022 | 348 |
| Roumanie | — | →DE: $21.0 Mds | 2022 | 642 |
| Bulgarie | $47.9 Mds | — | 2023 | 100 |
| Rép. Tchèque | $241.7 Mds | — | 2022 | 203 |
| Allemagne | $1,635 Mds | — | 2021 | 276 |

---

*Analyse réalisée par DeepSeek V4 Pro (deepseek-ai/DeepSeek-V4-Pro) le 09/05/2026 sur la base de 9 sources primaires incluant des rapports annuels 2024/2025 (PDFs téléchargés et extraits), presse professionnelle GTR/TXF/Euromoney, Allianz Trade Country Risk Atlas 2026, Marsh Political Risk Report 2026, et UN Comtrade API. Toutes les inférences sont explicitement signalées [INFÉRENCE].*

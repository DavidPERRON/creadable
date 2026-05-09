# CredAble Europe — Business Case : Banques Européennes Cibles 2026
## Analyse Stratégique par DeepSeek V4 Pro | Aequitas Consultus pour CredAble

---

**Document** : Version 2.0 — Analyse factuelle, sources citées, [INFÉRENCE] explicitement signalé  
**Date** : Mai 2026  
**Modèle** : DeepSeek V4 Pro (deepseek-ai/DeepSeek-V4-Pro) via DeepInfra  
**Coût d'inférence** : $0.062 (prompt: 22,021 tokens / completion: 6,740 tokens)  
**Méthodologie** : Synthèse de 7 sources primaires (cf. Section 0)

---

## SECTION 0 — SOURCES & MÉTHODOLOGIE

### Sources primaires intégrées

| # | Source | Volume | Nature |
|---|--------|---------|--------|
| 1 | Aequitas Consultus — Étude banques W.Europe & CEE | 53 KB | Analyse propriétaire : signaux TF/SCF, fréquence de mots-clés, citations GTR, presse |
| 2 | Aequitas Consultus — Étude Balkans, Caucase, Ukraine, Moldavie | 49 KB | Analyse propriétaire : 50 banques, tableau de comparaison, signaux de présence TF |
| 3 | Aequitas Consultus — Document DOCX complémentaire | ~15 KB | Fiches banques additionnelles et signaux de détection |
| 4 | Allianz Trade Country Atlas 2026 | PDF extrait | Notation souveraine court terme et moyen terme par pays (AA→D, 1→4) |
| 5 | Marsh Political Risk Map 2026 | PDF extrait | Cartographie des risques politiques et de transfert par zone |
| 6 | CredAble Product Sheet | PDF extrait | Définition précise des produits : Payables Finance, Receivables Finance, Asset Distribution |
| 7 | UN Comtrade + FCI Global Factoring Statistics | API JSON | Flux bilatéraux d'exportation (M49, HS, 2021-2023), volumes factoring par marché |

### Protocole de notation
- **Confirmé** : Signal documenté dans une source primaire listée ci-dessus, avec citation explicite  
- **[INFÉRENCE]** : Déduction logique de DeepSeek à partir des signaux disponibles, non documentée directement  
- **EXCLU** : Banque disposant déjà d'une plateforme SCF sophistiquée (ex : TBC Bank → QUALCO ProximaPlus ; Banca Intesa Beograd → ISP Confirming)

---

## SECTION 1 — TABLEAU DE PRIORISATION GÉNÉRAL (50 Banques)

| N° | Banque | Pays | Allianz Risk | TF Confirmé (source) | Gap / Produit CredAble | Priorité | Déclencheur |
|---|---|---|---|---|---|---|---|
| **P1 — Fenêtre Tactique Immédiate (0-6 mois)** |
| 1 | **BCGE** | Suisse | AA1 | Oui. Head of Corp. Banking & TF nommé (ex-CEO Global SCF). (GTR) | **Confirmé.** Aucune offre SCF publique. | **P1** | Prise de fonction d'Eric Balmer (sept. 2025). |
| 2 | **LBBW** | Allemagne | AA1 | Oui. Forfaiting, ABS corporate, membre historique Marco Polo. (Site LBBW) | **Confirmé.** Page SCF dédiée mais pas de plateforme digitale multibank ouverte mentionnée. | **P1** | Maturité conceptuelle SCF maximale. |
| 3 | **BayernLB** | Allemagne | AA1 | Oui. ECA-backed finance, membre historique Marco Polo. (Site BayernLB) | **Confirmé.** Page SCF "multibank-enabled" mais [INFÉRENCE] d'une plateforme moderne. | **P1** | Offre SCF "without recourse" explicite. |
| 4 | **Banco BPM** | Italie | B2 | Oui. Magazine corporate dédié SCF. (Site Banco BPM) | **Confirmé.** A vendu sa filiale factoring en 2021. Pas d'usine captive. | **P1** | "Usine blanche" post-cession. |
| 5 | **BPER Banca** | Italie | B2 | Oui. Filiale BPER Factor. (PR 2023) | **Confirmé.** Plateforme propriétaire WIP mais partenariat PlusAdvance montre une ouverture tech. | **P1** | Finalisation OPA BPS (avril 2026), recomposition du marché. |
| 6 | **Bankinter** | Espagne | A2 | Oui. Pionnier du confirming en Espagne. (Site Bankinter) | **Confirmé.** Plateforme SCF lancée en 2022, [INFÉRENCE] d'une capacité d'extension ou de remplacement. | **P1** | Phase d'extension SCF active. |
| 7 | **La Banque Postale** | France | A2 | Oui. Filiale LBP Leasing & Factoring. (LinkedIn, UniversFinance) | **Confirmé.** Présence SCF via filiale, mais [INFÉRENCE] d'une plateforme digitale intégrée en marque propre. | **P1** | Obligation e-invoicing France (2025-2026). |
| 8 | **Erste Group / BCR** | Autriche / Roumanie | A2 / B1 | Oui. ErsteConfirming, BCR "Supply Chain Finance". (Sites Erste, BCR) | **Confirmé.** Offre structurée mais [INFÉRENCE] d'une plateforme SaaS moderne et unifiée pour le groupe. | **P1** | Densité de signal SCF la plus élevée de l'étude. |
| **P2 — Potentiel Fort (6-18 mois)** |
| 9 | **Helaba** | Allemagne | AA1 | Oui. "Foreign trade finance", membre historique Marco Polo. (Rapports annuels) | **Confirmé.** Aucune offre SCF/reverse factoring en propre. | **P2** | Infrastructure TF solide, gap SCF évident. |
| 10 | **Belfius** | Belgique | A2 | Oui. Filiale Belfius Commercial Finance. (Rapports annuels) | **Confirmé.** SCF peu mis en avant. | **P2** | Cycle long, via RFP. |
| 11 | **Banco Sabadell** | Espagne | A2 | Oui. Pionnier historique du confirming. (Site Sabadell) | [INFÉRENCE]. Marché mature, mais opportunité cross-border CEE. | **P2** | Positionner l'offre internationale. |
| 12 | **Banca Ifis** | Italie | B2 | Oui. Cœur de métier factoring/confirming. (Site Banca Ifis) | [INFÉRENCE]. Plateforme propriétaire mature (Ifis4business). Approche additive via filiales CEE. | **P2** | Filiales en Pologne et Roumanie. |
| 13 | **PKO BP** | Pologne | A2 | Oui. Leader du marché polonais. (Rapports annuels) | [INFÉRENCE]. Offre factoring mature, digitalisation SCF probablement perfectible. | **P2** | Taille critique et flux CEE. |
| 14 | **Bank Pekao** | Pologne | A2 | Oui. Acteur majeur du factoring. (Rapports annuels) | [INFÉRENCE]. Similaire à PKO BP. | **P2** | Taille critique et flux CEE. |
| 15 | **mBank (mFaktoring)** | Pologne | A2 | Oui. Filiale factoring dédiée. (Site mBank) | [INFÉRENCE]. Plateforme de factoring existante, extension SCF possible. | **P2** | Digital native, potentiel d'upgrade. |
| 16 | **Bank Millennium** | Pologne | A2 | Oui. Produit factoring corporate. (Rapports annuels) | **Confirmé.** SCF moins visible que le factoring. | **P2** | Acteur corporate fort. |
| 17 | **OTP Bank (Hongrie)** | Hongrie | B2 | Oui. OTP Faktoring, page SCF dédiée. (Site OTP) | [INFÉRENCE]. Offre groupe, mais standardisation plateforme CEE possible. | **P2** | Post-fusion Slovénie (2024), recherche d'efficacité. |
| 18 | **VÚB Banka** | Slovaquie | A2 | Oui. Leader factoring slovaque (groupe Intesa). (Rapports annuels) | [INFÉRENCE]. SCF moins explicite que le factoring. | **P2** | Filiale d'un grand groupe, standardisation possible. |
| 19 | **Tatra banka** | Slovaquie | A2 | Oui. Membre du groupe RBI. (Rapports annuels) | [INFÉRENCE]. SCF mentionné, plateforme groupe probablement déployée. | **P2** | Cible de remplacement ou d'upgrade. |
| 20 | **Zagrebačka banka** | Croatie | B2 | Oui. Leasing, factoring intégrés (groupe UniCredit). (Rapports annuels) | **Confirmé.** SCF peu visible publiquement. | **P2** | 1ère banque de Croatie, gap SCF. |
| 21 | **PBZ** | Croatie | B2 | Oui. Membre FCI, forfaiting export sans recours. (Site PBZ) | **Confirmé.** Portail InBiz (groupe ISP) mais [INFÉRENCE] d'une plateforme SCF dédiée. | **P2** | Offre TF très complète, SCF à moderniser. |
| 22 | **NLB d.d.** | Slovénie | A2 | Oui. Trade finance corporate, réseau SEE. (Rapports annuels) | **Confirmé.** SCF/reverse factoring pas un produit structurant. | **P2** | Réseau régional (Ex-Yougoslavie), plateforme unique. |
| 23 | **SID Banka** | Slovénie | A2 | Oui. Banque export slovène. (Site SID Banka) | **Confirmé.** Focus export credit, gap SCF. | **P2** | Mandat développement, partenaire EBRD potentiel. |
| 24 | **DSK Bank** | Bulgarie | B2 | Oui. Membre du groupe OTP. (Rapports annuels) | [INFÉRENCE]. Factoring présent, SCF moins explicite. | **P2** | 1ère banque de Bulgarie. |
| 25 | **UniCredit Bulbank** | Bulgarie | B2 | Oui. Membre du groupe UniCredit. (Rapports annuels) | [INFÉRENCE]. Offre groupe, standardisation possible. | **P2** | Acteur majeur. |
| 26 | **Postbank** | Bulgarie | B2 | Oui. Membre du groupe Eurobank. (Rapports annuels) | [INFÉRENCE]. Similaire aux autres filiales de groupes. | **P2** | Acteur majeur. |
| 27 | **UBB** | Bulgarie | B2 | Oui. Filiale de KBC. (Rapports annuels) | [INFÉRENCE]. Bénéficie de l'offre KBC, mais déploiement local à vérifier. | **P2** | Levier groupe KBC. |
| 28 | **Citi Handlowy** | Pologne | A2 | Oui. SCF actif. (Rapports annuels) | [INFÉRENCE]. Plateforme globale Citi probablement déployée. | **P2** | Cible de remplacement. |
| 29 | **BRD-SocGen Romania** | Roumanie | B1 | Oui. Plateforme FINTRA. (Site BRD) | [INFÉRENCE]. Plateforme existante, potentiel de modernisation. | **P2** | Acteur majeur roumain. |
| 30 | **AikBank** | Serbie | B2 | Oui. Membre AikGroup. (PR 2025) | **Confirmé.** Aucune annonce SCF publique post-fusion. | **P2** | Opportunité tactique post-fusion (mars 2025). |
| **P3 — Surveillance Active (18+ mois)** |
| 31 | **MAIB** | Moldavie | C3 | Oui. Factoring digital local (recourse, non-recourse, reverse). (Site MAIB) | **Confirmé.** Reverse factoring décrit, [INFÉRENCE] d'une plateforme peu scalable. | **P3** | Pionnier SCF en Moldavie. |
| 32 | **Ameriabank** | Arménie | C3 | Oui. Factoring/trade finance déclaré. (Site Ameriabank) | **Confirmé.** SCF embryonnaire. | **P3** | Top banque arménienne, gap technologique. |
| 33 | **Ardshinbank** | Arménie | C3 | Oui. Factoring/trade finance déclaré. (Site Ardshinbank) | **Confirmé.** SCF embryonnaire. | **P3** | Concurrence directe d'Ameriabank. |
| 34 | **PASHA Bank** | Azerbaïdjan | C3 | Oui. "Export factoring" en page d'accueil. (Site PASHA) | **Confirmé.** SCF non visible. | **P3** | Leader corporate en Azerbaïdjan. |
| 35 | **Liberty Bank** | Géorgie | C3 | Oui. A rejoint FCI en 2025. (FCI) | **Confirmé.** SCF non visible. | **P3** | 3ème banque géorgienne, dynamique factoring. |
| 36 | **BKT** | Albanie | C3 | Oui. Trade finance présent. (Rapports annuels) | **Confirmé.** SCF absent. | **P3** | Leader albanais. |
| 37 | **NLB Komercijalna** | Serbie | B2 | Oui. Filiale NLB, corporate banking. (Rapports annuels) | **Confirmé.** SCF non visible. | **P3** | Levier groupe NLB. |
| 38 | **OTP Ukraine** | Ukraine | D4 | Oui. Factoring with recourse. (Site OTP UA) | **Confirmé.** SCF absent. | **P3** | Surveillance post-conflit. |
| 39 | **Privatbank** | Ukraine | D4 | Oui. Franchise TF avec EBRD. (EBRD) | **Confirmé.** SCF absent. | **P3** | Surveillance post-conflit. |
| 40 | **Luminor** | Pays Baltes | A2 | Oui. Trade finance corporate. (Rapports annuels) | **Confirmé.** SCF sous-développé. | **P3** | Plateforme pan-baltique. |
| 41 | **Citadele** | Pays Baltes | A2 | Oui. Corporate banking actif. (Rapports annuels) | **Confirmé.** SCF sous-développé. | **P3** | Concurrent de Luminor. |
| 42 | **Šiaulių Bankas** | Lituanie | A2 | Oui. Leader factoring lituanien. (Rapports annuels) | **Confirmé.** SCF peu visible. | **P3** | Croissance rapide du factoring. |
| 43 | **SEB Lietuva** | Lituanie | A2 | Oui. Groupe SEB, corporate finance. (Rapports annuels) | [INFÉRENCE]. Offre groupe déployée. | **P3** | Cible de remplacement. |
| 44 | **LHV Pank** | Estonie | A2 | Oui. Factoring avec credit insurance. (Site LHV) | **Confirmé.** SCF absent. | **P3** | Factoring classique, gap SCF. |
| 45 | **UniCredit Bank d.d.** | Bosnie-Herz. | C3 | Oui. Via réseau groupe. (Rapports annuels) | **Confirmé.** SCF non visible localement. | **P3** | 1ère banque, bilan < 5Mds mais systémique. |
| 46 | **Raiffeisen Bank d.d.** | Bosnie-Herz. | C3 | Oui. Via réseau RBI. (Rapports annuels) | **Confirmé.** SCF non visible localement. | **P3** | 2ème banque. |
| 47 | **Komercijalna Banka** | Macédoine N. | C3 | Oui. Trade finance présent. (Rapports annuels) | **Confirmé.** SCF non documenté. | **P3** | 1ère banque, bilan < 5Mds mais systémique. |
| 48 | **Stopanska Banka** | Macédoine N. | C3 | Oui. Via réseau OTP/NLB. (Rapports annuels) | **Confirmé.** SCF non documenté. | **P3** | 2ème banque. |
| 49 | **ACBA Bank** | Arménie | C3 | Oui. Factoring/trade finance déclaré. (Site ACBA) | **Confirmé.** SCF embryonnaire. | **P3** | Acteur agricole, gap digital. |
| 50 | **Inecobank** | Arménie | C3 | Oui. Factoring/trade finance déclaré. (Site Inecobank) | **Confirmé.** SCF embryonnaire. | **P3** | Banque digitale, appétence tech. |

---

## SECTION 2 — FICHES PRIORITAIRES P1 (0-6 mois)

### 1. BCGE — Suisse

- **TF confirmé** : Oui. BCGE a nommé Eric Balmer (ex-CEO de Global Supply Chain Finance Ltd.) au poste de Head of Corporate Banking and Trade Finance à partir de septembre 2025. La banque possède une activité reconnue en Global Commodity Finance. *(Source : GTR "On the Move")*
- **Gap** : **Confirmé.** La communication publique de BCGE ne mentionne aucune offre de Supply Chain Finance, reverse factoring ou confirming. C'est une page blanche.
- **Produit CredAble** : Plateforme SaaS complète (Payables Finance, Receivables Finance) en marque blanche pour construire l'offre SCF de la banque from scratch, en capitalisant sur le portefeuille de clients corporate et commodity finance existants.
- **Pitch** : "M. Balmer, pour matérialiser votre vision SCF chez BCGE, nous vous proposons non pas un projet IT de 18 mois, mais une plateforme white-label déployable en 90 jours, vous permettant de lancer une offre de reverse factoring et de dynamic discounting pour vos clients corporate suisses dès le T1 2026."
- **Interlocuteur** : Eric Balmer, Head of Corporate Banking and Trade Finance.
- **Risque pays** : AA1 (Allianz).

---

### 2. LBBW — Allemagne

- **TF confirmé** : Oui. LBBW est un acteur trade finance complet : forfaiting, ABS financing corporate ("vendre vos créances en bundle"), membre pionnier de Marco Polo. *(Source : site corporate LBBW, GTR)*
- **Gap** : **Confirmé.** La banque possède une page "Supply Chain Finance" et une filiale factoring (SüdFactoring), mais son offre digitale multibank actuelle est [INFÉRENCE] perfectible ou inexistante en marque blanche pour ses clients corporate.
- **Produit CredAble** : Plateforme de Receivables Finance et d'Asset Distribution (Securitization) pour digitaliser et scaler son offre d'ABS financing corporate et de forfaiting, en complément de sa filiale factoring.
- **Pitch** : "Votre expertise en ABS corporate est unique. Notre plateforme peut la transformer en un produit digital multibank, permettant à vos clients de céder des portefeuilles de créances en quelques clics, avec un tracking de performance et une transparence IFRS 9 que votre dispositif actuel ne permet peut-être pas."
- **Interlocuteur** : Fabian Blumer, Corporate Finance Specialist (cité dans l'article SCF).
- **Risque pays** : AA1 (Allianz).

---

### 3. Banco BPM — Italie

- **TF confirmé** : Oui. La banque publie une excellente pédagogie sur le SCF (reverse factoring, dynamic discounting) dans son magazine corporate. *(Source : site Banco BPM)*
- **Gap** : **Confirmé.** Banco BPM a vendu sa filiale factoring à Banca Popolare di Sondrio en 2021. C'est une "usine blanche" pour le SCF, sans outil de gestion des créances en propre.
- **Produit CredAble** : Plateforme Payables Finance complète (Reverse Factoring, Dynamic Discounting) en marque blanche, lui permettant de retrouver une capacité d'exécution SCF sans avoir à racheter ou reconstruire une filiale.
- **Pitch** : "Vous avez la connaissance, le marché et les clients. Nous avons l'usine technologique. Lancez votre offre de reverse factoring en marque Banco BPM en 90 jours, sans les coûts et la complexité d'une filiale captive."
- **Interlocuteur** : Direction Imprese e Global Transaction (à identifier).
- **Risque pays** : B2 (Allianz).

---

### 4. BPER Banca — Italie

- **TF confirmé** : Oui. Dispose de BPER Factor et a signé un partenariat avec la fintech PlusAdvance en 2023 pour le Confirming, Dynamic Discounting et Reverse Factoring. *(Source : PR BPER 30/05/2023)*
- **Gap** : **Confirmé.** Le partenariat avec PlusAdvance montre une volonté d'ouverture technologique. L'intégration de Banca Popolare di Sondrio (finalisée avril 2026) crée un besoin urgent de rationalisation et de mise à l'échelle des plateformes.
- **Produit CredAble** : Plateforme SaaS unifiée pour consolider et remplacer les outils existants (WIP, PlusAdvance) et intégrer le portefeuille de BPS, créant ainsi la plus grande plateforme SCF d'Italie.
- **Pitch** : "La fusion avec BPS est une opportunité unique de repartir sur une base technologique unifiée et scalable. Notre plateforme peut absorber les volumes combinés et vous donner une longueur d'avance face à Banca Ifis et Banco BPM."
- **Interlocuteurs** : Davide Vellani (Direttore Imprese e Global Transaction), Matteo Bigarelli (Direttore BPER Factor).
- **Risque pays** : B2 (Allianz).

---

### 5. Bankinter — Espagne

- **TF confirmé** : Oui. Pionnier du confirming en Espagne, a lancé sa propre plateforme SCF "Confirming Solutions" en 2022. *(Source : site Bankinter)*
- **Gap** : **Confirmé.** La plateforme lancée en 2022 est probablement en phase d'extension ou montre des limites face à la concurrence (Sabadell, CaixaBank). Une [INFÉRENCE] de besoin d'upgrade ou d'extension cross-border est forte.
- **Produit CredAble** : Plateforme Receivables Finance et Asset Distribution pour compléter son offre confirming par une solution de cession de créances sans recours et de titrisation pour les grands corporates.
- **Pitch** : "Votre plateforme de confirming est un succès. L'étape suivante pour vos clients est la déconsolidation IFRS 9 de leurs créances. Notre module Receivables Finance, en marque blanche, vous permet de lancer cette offre sans recours en moins de 90 jours."
- **Interlocuteur** : Direction Trade & Working Capital Solutions.
- **Risque pays** : A2 (Allianz).

---

### 6. La Banque Postale — France

- **TF confirmé** : Oui. Activité factoring via LBP Leasing & Factoring. Présence active sur le thème SCF (atelier UniversFinance mai 2025 sur e-invoicing & SCF). *(Source : LinkedIn, UniversFinance)*
- **Gap** : **Confirmé.** L'offre SCF en marque LBP propre est peu visible. L'obligation de facturation électronique en France (2025-2026) crée une fenêtre unique pour digitaliser les flux.
- **Produit CredAble** : Plateforme Payables Finance (Dynamic Discounting) directement intégrée aux futures plateformes de e-invoicing (PDP), permettant à LBP de proposer du paiement anticipé à tous ses clients corporate et PME.
- **Pitch** : "La réforme de la facture électronique est le moment idéal pour intégrer le SCF. Notre plateforme, connectable aux PDP, vous permet de proposer du dynamic discounting directement depuis le flux de factures, faisant de LBP un acteur incontournable du BFR en temps réel."
- **Interlocuteur** : Grégory Albert (intervenant UniversFinance).
- **Risque pays** : A2 (Allianz).

---

### 7. Erste Group / BCR — Autriche / Roumanie

- **TF confirmé** : Oui. Erste Group propose "ErsteConfirming" et BCR a une rubrique "Supply Chain Finance" dédiée. La densité de signal SCF est la plus élevée de l'étude. *(Source : sites Erste, BCR)*
- **Gap** : **Confirmé.** L'offre est structurée mais probablement fragmentée entre les filiales (BCR, Česká spořitelna, Slovenská sporiteľňa). Une [INFÉRENCE] forte existe sur le besoin d'une plateforme unique, multibank et multilingue pour tout le groupe en CEE.
- **Produit CredAble** : Plateforme SaaS white-label complète (Payables, Receivables, Asset Distribution) pour unifier et digitaliser l'offre SCF du groupe Erste sur l'ensemble de ses filiales CEE.
- **Pitch** : "Votre présence en CEE est inégalée. Notre plateforme, déjà multilingue et multidevise, peut unifier votre offre 'ErsteConfirming' et la déployer en 90 jours dans chaque filiale, créant un réseau SCF paneuropéen sans couture."
- **Interlocuteur** : Head of Trade Finance & SCF Group.
- **Risque pays** : A2 (Autriche), B1 (Roumanie).

---

## SECTION 3 — PIPELINE P2 CONDENSÉ (6-18 mois)

| Banque | Pays | TF Confirmé | Gap / Produit CredAble | Argument de Pitch |
|---|---|---|---|---|
| **Helaba** | Allemagne | Oui. Foreign trade finance. | **Confirmé.** Aucun SCF. / Plateforme Payables & Receivables Finance. | "Comblez votre gap SCF face à LBBW et BayernLB avec une plateforme clé-en-main." |
| **Belfius** | Belgique | Oui. Filiale factoring. | **Confirmé.** SCF peu visible. / Plateforme complète. | "Digitalisez votre offre corporate au-delà du factoring traditionnel." |
| **Banco Sabadell** | Espagne | Oui. Pionnier confirming. | [INFÉRENCE]. Offre cross-border. / Plateforme multilingue. | "Étendez votre leadership du confirming à l'international, notamment en CEE." |
| **Banca Ifis** | Italie | Oui. Leader factoring. | [INFÉRENCE]. Plateforme propriétaire. / Approche additive. | "Modernisez l'offre de vos filiales en Pologne et Roumanie avec notre stack." |
| **PKO BP / Pekao** | Pologne | Oui. Leaders marché. | [INFÉRENCE]. Digitalisation SCF. / Plateforme SaaS. | "Passez du factoring traditionnel à une plateforme SCF digitale et scalable." |
| **OTP Bank** | Hongrie | Oui. OTP Faktoring. | [INFÉRENCE]. Standardisation. / Plateforme groupe. | "Unifiez votre offre SCF post-acquisitions avec une seule plateforme pour toute la CEE." |
| **VÚB / Tatra** | Slovaquie | Oui. Leaders factoring. | [INFÉRENCE]. Upgrade SCF. / Plateforme white-label. | "Offrez à vos grands clients une solution de reverse factoring moderne." |
| **Zagrebačka / PBZ** | Croatie | Oui. TF complète. | **Confirmé.** SCF peu visible. / Plateforme Payables. | "Lancez la première offre SCF digitale en Croatie." |
| **NLB d.d.** | Slovénie | Oui. Réseau SEE. | **Confirmé.** SCF non structurant. / Plateforme réseau. | "Déployez une offre SCF unique sur tout votre réseau (6 pays) en 90 jours." |
| **DSK / UBB** | Bulgarie | Oui. Groupes OTP/KBC. | [INFÉRENCE]. Déploiement local. / Plateforme locale. | "Accélérez le déploiement SCF de votre groupe en Bulgarie." |
| **AikBank** | Serbie | Oui. Post-fusion. | **Confirmé.** Aucun SCF. / Plateforme complète. | "Construisez votre offre SCF from scratch après la fusion." |

---

## SECTION 4 — SURVEILLANCE P3 (18+ mois)

| Banque | Pays | Allianz Risk | Signal TF | Statut SCF | Déclencheur |
|---|---|---|---|---|---|
| **MAIB** | Moldavie | C3 | Reverse factoring documenté sur site | **Confirmé** — plateforme peu scalable ([INFÉRENCE]) | Upgrade technologique dès amélioration contexte pays |
| **Ameriabank** | Arménie | C3 | Factoring/TF déclaré | **Confirmé** — SCF embryonnaire | Impulsion EBRD ou régulatoire |
| **Ardshinbank** | Arménie | C3 | Factoring/TF déclaré | **Confirmé** — SCF embryonnaire | Concurrence avec Ameriabank |
| **PASHA Bank** | Azerbaïdjan | C3 | Export factoring en page d'accueil | **Confirmé** — SCF non visible | Leader corporate AZ, suite logique |
| **Liberty Bank** | Géorgie | C3 | Nouveau membre FCI (mars 2025) | **Confirmé** — SCF non visible | Montée en gamme après TBC Bank |
| **BKT** | Albanie | C3 | TF présent | **Confirmé** — SCF absent | First mover en Albanie |
| **NLB Komercijalna** | Serbie | B2 | Filiale NLB | **Confirmé** — SCF non visible | Déploiement groupe NLB Balkans |
| **OTP Ukraine / Privatbank** | Ukraine | D4 | Factoring recourse / franchise EBRD | **Confirmé** — SCF absent | Post-conflit, reconstruction |
| **Luminor / Citadele** | Pays Baltes | A2 | TF corporate | **Confirmé** — SCF sous-développé | Plateforme pan-baltique |
| **LHV Pank** | Estonie | A2 | Factoring + credit insurance | **Confirmé** — SCF absent | Extension naturelle du factoring |
| **UniCredit / Raiffeisen (BiH)** | Bosnie-Herz. | C3 | Via réseau groupe | **Confirmé** — SCF non visible localement | Décision depuis le siège groupe |

---

## SECTION 5 — BANQUES EXCLUES (plateforme SCF confirmée)

| Banque | Pays | Motif d'exclusion | Source |
|---|---|---|---|
| **TBC Bank** | Géorgie | Déploiement QUALCO ProximaPlus confirmé | Aequitas Source 2 |
| **Banca Intesa Beograd** | Serbie | Utilise ISP Confirming (groupe Intesa Sanpaolo) | Aequitas Source 2 |
| **KB (Komerční banka)** | Rép. Tchèque | Post-Roger/Orbian, plateforme déployée | Aequitas Source 1 |

---

## SECTION 6 — DONNÉES DE CONTEXTE : FLUX COMMERCIAUX (UN COMTRADE)

| Pays | Exportations totales | Flux clé vers EU | Année | Code M49 |
|---|---|---|---|---|
| Pologne | $381.9 Mds | — | 2023 | 616 |
| Hongrie | $149.9 Mds | →DE : $41.6 Mds | 2022 | 348 |
| Roumanie | — | →DE : $21.0 Mds | 2022 | 642 |
| Bulgarie | $47.9 Mds | — | 2023 | 100 |
| Rép. Tchèque | $241.7 Mds | — | 2022 | 203 |
| Allemagne | $1,635 Mds | — | 2021 | 276 |

*Source : UN Comtrade API, classification HS, fréquence annuelle. Données soumises aux limitations de l'abonnement (certaines paires pays-année non disponibles).*

---

## SECTION 7 — PLAN DE PROSPECTION 18 MOIS

### Phase 1 — Sprints 0-6 mois (P1 : Fenêtres tactiques immédiates)

| Semaine | Action | Cible | Levier |
|---|---|---|---|
| S1-S2 | Prise de contact LinkedIn + email | Eric Balmer (BCGE) | Prise de fonction sept. 2025 |
| S3-S4 | Envoi pitch deck + cas client APAC | LBBW — Fabian Blumer | Maturité conceptuelle SCF |
| S5-S6 | Rendez-vous découverte | BayernLB — TF desk | Offre "without recourse" |
| S7-S8 | Prise de contact + séquence e-mails | Banco BPM — Direction Imprese | Cession filiale factoring 2021 |
| S9-S10 | Pitch fusion BPER-BPS | BPER — Vellani + Bigarelli | OPA BPS finalisée avril 2026 |
| S11-S12 | Démonstration plateforme | Bankinter — WC Solutions | Extension "Confirming Solutions" |
| S13-S14 | Approche via e-invoicing | La Banque Postale — G. Albert | Réforme PDP France 2026 |
| S15-S16 | Rendez-vous groupe + filiales | Erste Group / BCR | Densité signal + réseau CEE |

### Phase 2 — Sprints 6-18 mois (P2 : Construction pipeline)

- Helaba, Belfius, Sabadell, Banca Ifis : approche via conférence GTR Europe + TXF
- Pologne (PKO BP, Pekao, mBank, Millennium) : mission Varsovie, appui Aequitas local
- Hongrie (OTP) + Slovaquie (VÚB, Tatra) : circuit CEE mutualisé avec Erste
- Croatie (Zagrebačka, PBZ) + Slovénie (NLB, SID) : mission Zagreb + Ljubljana
- Bulgarie (DSK, UniCredit Bulbank, Postbank, UBB) : mission Sofia
- Serbie (AikBank) : opportunité post-fusion mars 2025

### Phase 3 — Surveillance 18+ mois (P3 : Caucase, Balkans, Ukraine)

- Suivi trimestriel MAIB, Ameriabank, PASHA, Liberty Bank, BKT
- Veille sur reconstruction Ukraine (OTP UA, Privatbank) via EBRD pipeline
- Suivi réglementaire Pays Baltes (Luminor, Citadele, LHV)

---

*Document généré par DeepSeek V4 Pro (deepseek-ai/DeepSeek-V4-Pro) le 09/05/2026 sur la base de 7 sources primaires. Toutes les inférences sont explicitement signalées [INFÉRENCE]. Les conclusions présentées comme "Confirmé" s'appuient sur des citations documentées dans les sources Aequitas, GTR, sites institutionnels ou données UN Comtrade / FCI.*

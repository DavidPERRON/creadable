# Objection Handling — Réponses Type

**Principe** : Chaque objection cache un pain point ou une peur. Ne pas argumenter, sonder.

---

## "Nous avons déjà une plateforme."

**Sondes** :
- "Quelle plateforme ?"
- "Depuis combien de temps ?"
- "Si vous deviez la noter sur 10, vous diriez quoi ?"
- "Quel est son principal défaut aujourd'hui ?"

**Si vraiment SCF_AVANCÉ** : remettre la banque en EXCLU, ne pas insister.

**Si plateforme tierce avec plaintes** : "Vos fournisseurs vous remontent quoi sur l'expérience d'onboarding ?" → angle pain.

---

## "Notre groupe gère ce sujet, pas nous."

**Sondes** :
- "Qui exactement au groupe ? Quel département ?"
- "Quel est le calendrier de déploiement chez vous ?"
- "Quelle marge d'autonomie avez-vous pour des projets locaux ?"

**Action** : si autonomie zéro, ré-aiguiller vers groupe (changer de cible, garder le contact local pour intelligence).

**Si autonomie réelle ou délais groupe insatisfaisants** : "Souvent, les filiales locales déploient une couche complémentaire, plus adaptée au tissu de PME locales. Est-ce envisageable chez vous ?"

---

## "Nous n'avons pas de budget cette année."

**Sondes** :
- "À quel moment se construit votre budget de transformation 2027 ?"
- "Qui décide des arbitrages dans votre direction ?"
- "Quels seraient les critères pour qu'un projet entre au budget ?"

**Action** : transformer en "fenêtre de tir" identifiée, pas en perte de prospect.

**Variante intelligente** : "Le SCF a une logique d'auto-financement : la marge nette générée sur les invoices financées couvre rapidement le coût de la plateforme. Voulez-vous que nous regardions ensemble si votre volume actuel justifie déjà l'investissement ?"

---

## "Nous attendons les nouvelles règles Bâle III avant d'investir."

**Réponse** : "Justement, Bâle III final (CRR3, applicable 2025-2032) reconnaît plus favorablement les programmes de SCF avec credit insurance. Plusieurs banques utilisent désormais le SCF comme outil de **réduction de RWA** sur leur portefeuille corporate. Voulez-vous que nous regardions cet angle ?"

**À documenter** : préparer 1 slide chiffrée sur le treatment réglementaire SCF (à mettre dans le kit pré-call).

---

## "Le SCF marche pour les grands groupes, pas pour nos clients PME."

**Réponse** : "C'est l'argument standard. Mais le SCF nouvelle génération est précisément conçu pour adresser le segment ETI/PME : onboarding fournisseur en moins de 24h, pas de minimum de volume, frais marginaux faibles. La banque qui équipe ses **clients PME** crée un pont vers leurs **fournisseurs encore plus petits**, qui deviennent à leur tour clients de la banque. Effet réseau."

**Évidence à fournir** : exemple chiffré d'une banque peer ayant déployé sur le segment PME.

---

## "Nous avons peur du risque opérationnel et compliance."

**Réponse** : "C'est légitime. Trois éléments :
1. Nous prenons en charge le KYC/KYB initial des fournisseurs avec votre framework.
2. Toutes les données restent dans votre tenant (architecture multi-tenant strict, ou private deployment).
3. Audit trail complet, conforme DORA, exportable par votre compliance."

**À préparer** : 1 page "Sécurité et compliance" avec certifications (SOC2, ISO 27001, GDPR, DORA-ready).

---

## "Nous voulons développer en interne, c'est stratégique."

**Sondes** :
- "Quelle équipe interne ?"
- "Quels précédents avez-vous en build de plateforme transactionnelle ?"
- "Quel est votre TTM cible ?"

**Réponse non-confrontante** : "Je comprends. Beaucoup de banques avec lesquelles nous travaillons ont commencé par envisager le build, puis ont réalisé que le delta TTM est de 18-24 mois pour un produit fonctionnellement équivalent. Une option médiane : utiliser notre plateforme en white-label pendant la phase de construction, et basculer plus tard si vous le souhaitez. Cela évite la perte de marché pendant le build."

**À adapter** : si la banque a un track record technique fort (ex. : Bankinter avec sa plateforme propre), respecter l'orgueil et proposer plutôt l'angle "module spécifique" plutôt que "plateforme complète".

---

## "Vous êtes basés en Inde, nous voulons un partenaire européen."

**Réponse** :
- "CredAble a une présence européenne avec [bureaux/équipes]. Le développement est multi-localisé."
- "Nos références européennes : [liste à constituer dès première win européenne]."
- "Aequitas Consultus est votre interlocuteur local français/européen, et porte la relation."

**À construire** : kit "European footprint" (data residency EU, équipe support EU, références EU).

---

## "Pourquoi vous plutôt que Demica/Orbian/Kyriba ?"

**Réponse en 3 axes** (à adapter par banque) :
1. **Couverture** : "Nous adressons spécifiquement le segment ETI/PME que [concurrent] ne servait pas historiquement."
2. **Modèle** : "Le revenue share aligne nos intérêts sur les vôtres : nous gagnons quand vous gagnez."
3. **Différenciateur produit spécifique** (au choix) : multi-devises, onboarding express, AI-driven supplier risk scoring, etc. → à documenter en battle card par concurrent.

**À construire** : battle cards par concurrent (Demica, Orbian, Kyriba, PrimeRevenue) avec features/pricing/références publiques.

---

## "Donnez-moi vos prix."

**Réponse** : "Le pricing dépend de 3 paramètres : volume cible 12 mois, nombre de fournisseurs, couverture géographique. Je peux vous proposer une grille indicative aujourd'hui, mais le prix réel se calibre après une journée d'atelier de cadrage. Préférez-vous la grille ou l'atelier ?"

**Grille indicative type** (pas un engagement) :
- Setup fee : EUR 80,000 - 700,000 selon taille banque
- SaaS annuel : EUR 50,000 - 400,000
- Revenue share : 0.03% - 0.15% du volume SCF

**Anti-pattern** : ne **jamais** donner un prix au téléphone sans cadrage. Démontre que la banque n'est pas mûre, ou que vous bradez.

---

## "C'est trop cher."

**Sondes** :
- "Trop cher par rapport à quoi ?"
- "Quel ROI attendez-vous pour qu'un investissement de cette ampleur soit justifié ?"
- "Quelle alternative considérez-vous ?"

**Réponse type** : "Le coût total sur 3 ans représente X% de la marge nette générée par les invoices financées. Voulez-vous que nous fassions le calcul ensemble sur votre volume cible ?"

---

## "Revenez dans 6 mois."

**Sondes** :
- "Qu'est-ce qui sera différent dans 6 mois ?"
- "Quel signal devrais-je guetter pour savoir que c'est le bon moment ?"

**Action** : transformer la non-décision en **trigger futur** documenté. Saisir dans la base :
```json
"next_check": "2026-11-10",
"next_check_signal": "Validation budget 2027 OU recrutement Head of Innovation"
```

Et... revenir précisément dans 6 mois avec un trigger documenté.

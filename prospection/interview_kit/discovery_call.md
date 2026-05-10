# Discovery Call — Trame d'Entretien Bancaire

**Objectif** : Diagnostic, pas vente. 45-60 minutes. Cible : Head of Trade Finance, Head of Corporate Banking, ou Head of Transaction Banking.

**Préparation pré-appel** (15 min)
- Relire la fiche de la banque (`prospection/reports/V4_*.md`, section P1/P2)
- Vérifier les 3 derniers triggers et signaux TF
- Identifier l'interlocuteur sur LinkedIn (parcours, ancienneté au poste)
- Préparer 2 banques peers comparables (ex. : pour BPER → Banca Ifis, BCR)

---

## STAGE 1 — Cadrage (5 min)

> "Je vous remercie de me consacrer ce temps. Avant tout, je voudrais vous demander : qu'est-ce qui vous a fait accepter cet entretien ? Cela m'aidera à concentrer la discussion sur ce qui vous est utile."

**À écouter** :
- Mention spontanée d'un projet en cours = signal fort
- "Curiosité" = signal faible, recadrer sur diagnostic
- Mention d'un concurrent = signal de pression compétitive

---

## STAGE 2 — Cartographie produit (15 min)

> "J'aimerais comprendre votre périmètre actuel sur le trade et le supply chain finance. Pourriez-vous me décrire :"

1. **Périmètre TF documentaire** : LCs, garanties, forfaiting, credit insurance — volumes 2025 ?
2. **Factoring** : domestic vs international, recours vs sans recours, plateforme utilisée ?
3. **Reverse factoring / confirming** : si oui, depuis quand, plateforme propriétaire ou tierce ?
4. **Dynamic discounting** : proposé ? À quels segments ?
5. **Receivables finance** : titrisation, achat de créances en bloc ?
6. **Couverture géographique** : domestique uniquement ou cross-border ? Quels corridors prioritaires ?
7. **Segmentation client** : SCF est-il proposé aux PME, ETI, ou réservé aux grands corporates ?

**À écouter** :
- "Nous proposons mais via partenaire" = opportunité white-label
- "Nous avons un projet en cours" = priorité absolue
- Vocabulaire flou ("solution de financement de la chaîne") = SCF embryonnaire
- Vocabulaire précis (DPO/DSO, payable financing) = équipe sophistiquée

---

## STAGE 3 — Pain points & gaps (15 min)

> "Si vous deviez nommer 3 frustrations actuelles avec votre dispositif TF/SCF, quelles seraient-elles ?"

**Sondes d'approfondissement** :
- "Onboarding fournisseur" : combien de temps prend une PME à monter sur votre plateforme ?
- "Multi-devises" : combien de devises supportées ? Quelles limitations cross-border ?
- "Reporting client" : vos clients ont-ils un dashboard temps réel ou des extracts mensuels ?
- "Capital relief" : utilisez-vous le SCF pour optimiser votre RWA Bâle III ?
- "Filiales / réseau" : y a-t-il un produit groupe ou chaque pays gère sa plateforme ?
- "Concurrents locaux" : que font [bank X et Y du pays] que vous ne faites pas ?

> "Quel est votre processus actuel pour évaluer une nouvelle technologie SCF ?"

**À identifier** :
- Décideur (Head of TF, COO, CIO, CFO ?)
- Cycle d'achat typique (3 mois, 9 mois, 18 mois ?)
- Comité IT/risque/compliance impliqué ?
- Budget annuel transformation transaction banking ?

---

## STAGE 4 — Triggers et momentum (10 min)

**Questions adaptées au trigger documenté** :

| Trigger | Question à poser |
|---|---|
| **RECRUITMENT** | "[Nom du nouvel arrivant] a un profil très SCF. Y a-t-il une réflexion stratégique en cours sur ce périmètre ?" |
| **FINTECH_PARTNERSHIP_END** | "Avec [partenaire] désormais hors-jeu, comment envisagez-vous la suite ?" |
| **EBRD_PROGRAM** | "Le programme EBRD a-t-il vocation à être étendu ? À quels autres clients ?" |
| **M_AND_A** | "Comment l'intégration post-fusion impacte-t-elle vos plateformes TF/SCF ?" |
| **PROFESSIONAL_PRESS** | "Vous avez été reconnus [award X]. Quels sont vos chantiers prioritaires pour conserver cette position ?" |

---

## STAGE 5 — Test de l'appétence (5 min)

> "Si je vous propose de revenir avec un benchmark concret de ce que [2 banques peers] ont déployé sur ce sujet, et un cadrage de ce que cela représenterait pour vous, est-ce que cela aurait du sens ?"

**Si OUI** :
- Préciser le timing de retour (2 semaines max)
- Demander qui d'autre devrait être inclus dans la présentation
- Confirmer le format souhaité (deck, démo, white paper)

**Si "pas pour l'instant"** :
- Demander : "Qu'est-ce qui changerait votre réponse dans 6 mois ?"
- → Cette réponse devient le futur trigger à surveiller

---

## STAGE 6 — Clôture (5 min)

- Récapituler 3 points clés entendus
- Confirmer la prochaine étape (date, livrable, participants)
- Demander 1-2 contacts pertinents en interne ou chez des peers
- Proposer un lien LinkedIn

---

## Post-appel — Compte-rendu structuré (10 min)

Saisir dans `data/banks.json` :

```json
{
  "interlocutors": [
    { "name": "...", "role": "...", "linkedin": "...", "source": "Discovery call YYYY-MM-DD" }
  ],
  "scf_evidence": [
    { "source": "Discovery call YYYY-MM-DD", "verbatim": "[citation directe]" }
  ],
  "notes": "[3-5 lignes] Pain points, décideur, cycle achat, prochaine étape."
}
```

Puis : `make all` → la priorité se met à jour.

---

## Drapeaux rouges (à ne pas ignorer)

| Signal | Interprétation |
|---|---|
| L'interlocuteur ne connaît pas ses propres volumes | Pas le bon décideur |
| Refus de partager les pain points | Pas de prédisposition au changement |
| "Nous avons tout en interne" sans détail | Probablement bullshit ou ego |
| "Notre groupe gère ça" | Décision pas locale, ré-aiguiller |
| Mention répétée du prix | Cycle d'achat éloigné, focus features pas mûr |

---

## Drapeaux verts (signaux d'opportunité réelle)

| Signal | Interprétation |
|---|---|
| Mention spontanée d'un RFP | Pipeline actif |
| "Nous regardons ce que fait [concurrent]" | Pression compétitive |
| Demande de chiffres comparables | Prêt pour business case |
| Invitation à présenter à un comité | Sponsor en interne |
| Volonté de référence visite de confrère | Validation par les pairs cherchée |

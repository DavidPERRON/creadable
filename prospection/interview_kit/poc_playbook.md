# POC Playbook — Pilote SCF "5 fournisseurs / 30 jours"

**Objectif** : Convertir un intérêt qualifié en preuve technique et économique mesurable, sans engager la banque sur un déploiement complet.

**Format** : 30 jours, 5 fournisseurs, 1 acheteur (le client de la banque), facturation symbolique ou gratuite, contrat NDA + POC agreement standardisé.

---

## Conditions d'éligibilité (critères Aequitas/CredAble)

Une banque est éligible POC si **toutes** les conditions sont remplies :

- [x] Score V4 ≥ 22 (P1 ou P2)
- [x] Au moins 1 interlocuteur documenté avec rôle décisionnaire
- [x] Discovery call effectué et compte-rendu saisi
- [x] Pain point #1 identifié et explicitement formulé par l'interlocuteur
- [x] Sponsor interne identifié (Head of TF, COO, CIO, ou CFO)
- [x] Pas de plateforme SCF avancée déjà installée

Sinon : retour en discovery, pas de POC.

---

## Phase 0 — Cadrage (J-15 à J0)

| Livrable | Owner | Délai |
|---|---|---|
| **POC Charter** (1 page) — objectifs, KPIs, liste des 5 fournisseurs, périmètre | CredAble | J-15 |
| **NDA mutuel** | Juridique CredAble + Banque | J-10 |
| **POC Agreement** (T&Cs simplifiés, pas de SLA prod, gratuité ou prix nominal) | Juridique | J-7 |
| **Liste fournisseurs** validée par la banque | Banque | J-5 |
| **Onboarding KYC documents** des fournisseurs | Banque | J-3 |
| **Kickoff call** (60 min, équipes mixtes) | CredAble + Banque | J0 |

**KPIs à valider en kickoff** :
1. **Onboarding lead time** : temps moyen pour onboarder un fournisseur sur la plateforme (cible : <5 jours ouvrés)
2. **Time-to-first-discount** : délai entre onboarding et première opération de financement (cible : <3 jours)
3. **Adoption rate** : % des invoices éligibles qui sont effectivement financées (cible : >50%)
4. **Fournisseur NPS** : Net Promoter Score post-pilote (cible : >40)
5. **Bank operational cost per invoice** : coût marginal pour la banque (cible : <2 EUR/invoice)

---

## Phase 1 — Onboarding (J0 à J7)

Les 5 fournisseurs sont onboardés sur la plateforme avec :
- Compte utilisateur dédié
- Connexion bancaire (test)
- Formation 30 minutes via webinar
- Hotline support en langue locale

**Daily standup** entre équipes (15 min, async ok).

**Issue tracker** partagé (Notion / Jira / GitHub Issues — pas d'email).

---

## Phase 2 — Opérations (J7 à J27)

- Fournisseurs déposent des invoices réelles
- Banque approuve/finance via la plateforme
- CredAble mesure les KPIs en temps réel
- Hebdomadaire : steering call 30 min (banque + CredAble)

**Pivot points** : si un KPI dérive sérieusement de sa cible à J14, déclencher session de remédiation.

---

## Phase 3 — Évaluation (J27 à J30)

| Livrable | Owner | Format |
|---|---|---|
| **POC Report** (15 pages max) | CredAble | PDF |
| **KPI Dashboard final** | CredAble | Dashboard live + export |
| **Témoignages fournisseurs** (2 minimum, vidéo ou écrit) | CredAble | Vidéo 60s |
| **Business case rollout** (12 mois, 100 fournisseurs) | CredAble | Spreadsheet + slides |
| **Restitution exécutive** (90 min) | CredAble + Sponsor banque | Présentation |

---

## Pricing du POC

| Format | Aequitas/CredAble fees | Logique |
|---|---|---|
| **POC gratuit** (default P1) | 0 EUR | Investissement commercial. Banque assume ses coûts internes. |
| **POC nominal** (P2) | EUR 25,000 forfait | Couvre setup technique, allègement signal "free" |
| **POC payant** (P3) | EUR 75,000 forfait | Banque achète le diagnostic, indépendamment du rollout |

**À toujours faire signer** : POC Agreement avec clause "right of first refusal" sur le déploiement si POC concluant.

---

## Critères de succès / échec

**SUCCESS** : 4/5 KPIs atteignent leur cible → enclenchement immédiat de la phase commerciale (proposition de Master Agreement).

**MIXED** : 2-3/5 KPIs atteignent leur cible → analyse causale (technique, process, segmentation fournisseurs ?), POC v2 si justifié.

**FAILED** : 0-1/5 KPI atteint sa cible → debriefing honnête, leçons apprises, retour à la discovery dans 6-12 mois.

---

## Artefacts à archiver dans la base

Après chaque POC, documenter dans `data/banks.json` :
```json
{
  "poc": {
    "status": "SUCCESS|MIXED|FAILED",
    "start_date": "...",
    "end_date": "...",
    "kpis": { "onboarding_days": ..., "ttfd_days": ..., "adoption_pct": ..., "nps": ..., "ops_cost_eur": ... },
    "next_step": "Master Agreement | POC v2 | Stand-down"
  }
}
```

Le scoring engine peut être étendu pour donner +5 points à toute banque avec POC SUCCESS au cours des 12 derniers mois.

---

## Anti-patterns à éviter

1. **POC sans sponsor interne** : pas de transition possible vers le déploiement. **Ne jamais commencer.**
2. **POC trop large** (10+ fournisseurs, multi-devises, multi-pays) : explosion combinatoire, échec garanti. **Rester à 5/1/1.**
3. **POC sans KPIs validés** en kickoff : la banque "déplace les poteaux" en fin de projet.
4. **POC > 30 jours** : perte de momentum, sponsor changera, projet meurt.
5. **POC payant facturé après livraison** : signal de non-engagement banque. Demander acompte 50%.

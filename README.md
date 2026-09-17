# Family Market — Site officiel du supermarché

Site web pour un supermarché physique. Site client bilingue (FR / AR) + dashboard admin.

## Stack technique

| Outil             | Version  | Rôle                                      |
| ----------------- | -------- | ----------------------------------------- |
| Next.js           | 16       | Framework React (App Router)              |
| TypeScript        | 5        | Typage statique                           |
| Tailwind CSS      | 4        | Utilitaires CSS                           |
| Prisma            | 7.10     | ORM (PostgreSQL, driver adapter `@prisma/adapter-pg`) |
| PostgreSQL        | —        | Base de données (Neon en production)      |
| @node-rs/argon2   | —        | Hash des mots de passe admin (argon2id)   |
| jose              | —        | Sessions admin JWT (cookie HttpOnly)      |
| Vercel            | —        | Hébergement frontend / serverless         |
| Neon              | —        | Base de données PostgreSQL managée         |

## Structure du projet

```
family-market/
├── prisma/
│   ├── schema.prisma          # Schéma Prisma (modèles de données)
│   └── phase10-seed.sql       # Seed idempotent (paramètres + catégories)
├── public/
│   ├── images/
│   │   ├── logo/              # Logo du magasin (à fournir)
│   │   ├── hero/              # Images de la bannière principale (à fournir)
│   │   ├── products/          # Photos de produits (via le dashboard)
│   │   ├── categories/        # Photos de catégories (via le dashboard)
│   │   ├── promotions/        # Visuels de promotions (via le dashboard)
│   │   └── store/             # Photos du magasin (à fournir)
│   └── videos/
│       ├── hero/              # Vidéos bannière
│       └── promotions/        # Vidéos de promotions
├── src/
│   ├── app/
│   │   ├── globals.css        # Tokens de design (gold / black / white)
│   │   ├── layout.tsx         # Layout racine (fonts + metadata)
│   │   ├── (public)/          # Pages du site client (accueil, produits, catégories, promotions, contact)
│   │   └── (admin)/           # Dashboard admin (URL /admin/*)
│   ├── components/
│   │   ├── ui/                # Composants de design réutilisables
│   │   ├── admin/             # Formulaire produits, catégories, promotions, paramètres, médias
│   │   └── public/            # Header, footer, hero, cartes produit, horaires…
│   ├── generated/prisma/      # Client Prisma généré (non committé)
│   ├── lib/
│   │   ├── auth/              # Auth admin (config, argon2, sessions JWT, guards)
│   │   ├── i18n/              # Locale FR/AR + traductions
│   │   ├── public/            # Requêtes du site client (settings, hero, catalogue)
│   │   ├── admin/             # Requêtes du dashboard (counts, listes)
│   │   ├── actions/           # Server Actions (CRUD + paramètres)
│   │   └── db.ts              # Singleton PrismaClient (adapter pg)
│   └── scripts/
│       ├── create-admin.ts    # Crée le compte admin (ADMIN_EMAIL/PASSWORD)
│       └── seed-starter-catalog.ts # Catalogue de démarrage (60 produits, idempotent)
├── prisma7.config.ts          # Configuration Prisma CLI v7
├── next.config.ts             # Configuration Next.js
└── .env.example               # Template variables d'environnement
```

## Modèles de base de données

| Modèle            | Rôle                                                    |
| ----------------- | ------------------------------------------------------- |
| `AdminUser`       | Comptes administrateur du dashboard                     |
| `Category`        | Catégories de produits (FR / AR)                        |
| `Product`         | Produits avec prix, disponibilité, catégorie liée       |
| `Promotion`       | Offres avec dates (début / fin) et visuel               |
| `PromotionProduct`| Table de liaison promotion ↔ produits ciblés            |
| `StoreSettings`   | Paramètres du magasin (nom, contact, adresse, réseaux, horaires, logo, vitrine) |
| `MediaAsset`      | Images et vidéos téléversées, classées par catégorie (dont `LOGO`, `HERO`) |

## Authentification admin

- Connexion : `POST /api/admin/login` (e-mail + mot de passe).
- Mot de passe : haché avec **argon2id** (`@node-rs/argon2`).
- Session : **JWT** signé avec **jose** (`AUTH_SECRET`), stocké dans un
  cookie **HttpOnly** (`Secure` en production, `SameSite=Lax`, 7 jours).
- Le Proxy (`proxy.ts`) redirige les visiteurs sans session de `/admin/*`
  vers `/admin/login`; la vérification réelle est faite côté serveur
  (`requireAdmin()` dans `src/lib/auth/dal.ts`).

## Contenu du supermarché (guide du propriétaire)

Le site est prêt à recevoir le contenu réel. Tout se saisit dans le dashboard
(`/admin`), aucune donnée n'est inventée dans le code.

1. **Créer le compte administrateur** (une seule fois) :
   remplir `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env`, puis
   `npm run create-admin`.
2. **Informations du magasin** — `/admin/settings` : nom FR/AR, téléphone,
   WhatsApp, adresse, réseaux sociaux, horaires. Le logo et l'image/vidéo de
   vitrine se choisissent dans la bibliothèque média.
3. **Médias** — `/admin/media` : téléverser logo, photos de produits,
   catégories, promotions et vitrine. Les champs « Logo » et « Vitrine » se
   paramètrent ensuite dans `/admin/settings`.
4. **Catalogue** — `/admin/categories` puis `/admin/products` : les 12
   catégories de départ existent déjà (bilingues). Ajouter produits, prix et
   disponibilité.

   Un **catalogue de démarrage** (60 produits bilingues, 5 par catégorie) peut
   être chargé avec `npm run seed:starter`. ⚠️ Les prix fournis sont des
   **valeurs indicatives de développement, à revoir** : la source de vérité
   reste `/admin/products`. Ces produits n'ont ni image ni prix promo — à
   compléter par le propriétaire. Le script est idempotent : les produits déjà
   présents (même slug) ne sont jamais écrasés.

5. **Promotions** — `/admin/promotions` : créer une offre (dates + produits
   concernés). Elles apparaissent sur l'accueil tant que la période est active.

Tant qu'un champ n'est pas renseigné (téléphone, adresse, réseaux…), le site
affiche une version neutre : les boutons correspondants ne sont pas montrés
et les sections vides affichent « Aucun produit disponible » / « Aucune
promotion active ».

## Commandes

```bash
# Développement
npm run dev

# Production
npm run build
npm start

# Vérification de code
npm run lint
npm run typecheck

# Base de données
npm run db:generate    # Régénérer le client Prisma
npm run db:push        # Appliquer le schéma (additif)
npx prisma db execute --file prisma/phase10-seed.sql  # Seed paramètres + catégories
npm run seed:starter   # Catalogue de démarrage (60 produits) — prix indicatifs à revoir
npm run db:studio      # Ouvrir Prisma Studio (éditeur de données)

# Compte admin initial (après db push)
npm run create-admin   # Lit ADMIN_EMAIL + ADMIN_PASSWORD dans .env
```

## Variables d'environnement

| Variable         | Rôle                                              |
| ---------------- | ------------------------------------------------- |
| `DATABASE_URL`   | URL PostgreSQL (Neon)                             |
| `AUTH_SECRET`    | Secret de signature des sessions JWT              |
| `ADMIN_EMAIL`    | E-mail du premier compte admin (`create-admin`)   |
| `ADMIN_PASSWORD` | Mot de passe du premier compte admin              |

Voir `.env.example`. Aucun secret n'est committé.

## Tokens de design

Couleurs principales :
- **Gold** (`bg-gold-500` → `#c9a227`) : couleur de marque, CTA, accents
- **Black** (`bg-black` → `#0a0a0a`) : texte, footer, éléments sombres
- **White** (`bg-surface` → `#ffffff`) : fonds, cartes, surfaces

Typographie : Geist Sans (FR) + Noto Sans Arabic (AR), via `next/font`.

## Déploiement

| Étape | Outil   | Action                                                  |
| ----- | ------- | ------------------------------------------------------- |
| 1     | GitHub  | Pousser le code dans un dépôt GitHub                    |
| 2     | Neon    | Créer la base PostgreSQL et copier l'URL de connexion   |
| 3     | Vercel  | Connecter le repo GitHub, définir `DATABASE_URL`        |
| 4     | Vercel  | La migration s'applique via `postinstall` + `prisma generate` |

## Ce qu'il reste

- Fournir les **visuels réels** : logo, photos du magasin, bannière de vitrine
  (déposés via « Médias » ou dans `public/images/…`), puis les relier dans
  `/admin/settings`.
- Saisir le **catalogue** (produits, prix, disponibilité) et les **promotions**
  dans le dashboard.
- Renseigner le **numéro de téléphone** (champ désormais facultatif) pour activer
  l'appel direct, le WhatsApp et la fiche de contact.
- Client peut créer le compte admin à tout moment via `npm run create-admin`.

## Phases réalisées

| Phase  | Contenu                                                         |
| ------ | --------------------------------------------------------------- |
| 1 ✅   | Fondations : Next.js + Tailwind + Prisma + composants de base  |
| 2 ✅   | DB Neon + Prisma (schéma admin/catalogue/promotions) + auth admin + /admin protégé |
| 3 ✅   | Pages client : Home, produits, catégories, promotions, contact |
| 4 ✅   | Dashboard admin : CRUD produits, catégories, promotions, paramètres, médias |
| 5 ✅   | Internationalisation FR/AR (locale + traductions)               |
| 6 ✅   | Horaires, statut ouvert/fermé, carte, réseaux sociaux           |
| 7 ✅   | SEO, performance, accessibilité, erreurs gérées côté serveur    |
| 8 ✅   | Médias : bibliothèque, téléversement, picker, catégories        |
| 9 ✅   | Polissage : tokens, header mobile, hero responsive, confirmations de suppression |
| 10 ✅  | Contenu initial : 12 catégories bilingues, paramètres par défaut sûrs, dashboards PILOTÉS par la base, guide propriétaire |
| 11 ✅  | Catalogue de démarrage : champ taille/format + SKU produit, 60 produits de référence bilingues (5 par catégorie), chargement idempotent `npm run seed:starter` |
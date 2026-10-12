# Taxi Nord Lille

Site vitrine et outil de gestion de demandes de devis pour **Taxi Nord Lille** —
gares, aéroports et longues distances depuis Lille.

L'objectif du site est simple : **recueillir des demandes de devis qualifiées**.
Aucun paiement en ligne, aucun calcul de tarif automatique, aucune réservation
automatique. L'exploitant reçoit la demande et recontacte le client
lui-même pour confirmer le prix et les détails du trajet.

---

## Sommaire

1. [Ce que fait le site](#ce-que-fait-le-site)
2. [Stack technique](#stack-technique)
3. [Démarrage rapide](#démarrage-rapide)
4. [Configuration](#configuration)
5. [Base de données](#base-de-données)
6. [Comptes administrateur](#comptes-administrateur)
7. [Notifications](#notifications)
8. [Stockage d'images](#stockage-dimages)
9. [Structure du projet](#structure-du-projet)
10. [Sécurité et vie privée](#sécurité-et-vie-privée)
11. [Référencement](#référencement)
12. [Déploiement](#déploiement)
13. [À faire avant la mise en ligne](#à-faire-avant-la-mise-en-ligne)

---

## Ce que fait le site

### Côté visiteur

| Page | Route | Rôle |
| --- | --- | --- |
| Accueil | `/` | Présentation, services, processus, FAQ, derniers articles |
| Services | `/services` | Vue d'ensemble + tableau comparatif |
| Taxi gare | `/services/taxi-gare-lille` | Transferts gare, formulaire pré-sélectionné |
| Transfert aéroport | `/services/transfert-aeroport-lille` | Lille-Lesquin et aéroports voisins |
| Longue distance | `/services/trajets-longue-distance` | Trajets hors agglomération |
| Demande de devis | `/demande-de-devis` | **Formulaire principal**, validé et enregistré |
| Contact | `/contact` | Formulaire de contact + coordonnées |
| Blog | `/blog`, `/blog/[slug]` | Articles publiés uniquement |
| Mentions légales | `/mentions-legales` | Modèle à compléter |
| Politique de confidentialité | `/politique-de-confidentialite` | Modèle à compléter |
| Gestion des cookies | `/gestion-des-cookies` | État réel des cookies utilisés |

Le site est **bilingue** : le français est la langue par défaut et vit à la
racine (`/services`), l'anglais est sous `/en/...`. Un sélecteur de langue est
présent dans l'en-tête.

### Côté administrateur

| Page | Route | Rôle |
| --- | --- | --- |
| Connexion | `/admin/connexion` | Point d'entrée, non protégé |
| Tableau de bord | `/admin` | Compteurs, dernières demandes, alertes de configuration |
| Demandes | `/admin/demandes` | Recherche, filtres, statut, export CSV |
| Détail d'une demande | `/admin/demandes/[id]` | Coordonnées, trajet, notes, statut, notifications |
| Messages | `/admin/messages` | Messages du formulaire de contact |
| Blog | `/admin/blog` | Liste, création, édition, aperçu, publication |
| Paramètres | `/admin/parametres` | Coordonnées, SEO, légal, notifications |

---

## Stack technique

- **Next.js 16.4** (App Router, Turbopack, React 19.3)
- **TypeScript** en mode strict
- **Tailwind CSS v4** (`@theme` inline, design tokens dans `globals.css`)
- **Neon PostgreSQL** via `@neondatabase/serverless`
- **Drizzle ORM** (schéma typé + migrations versionnées)
- **React Hook Form + Zod** (validation identique côté client et serveur)
- **Resend** (e-mails transactionnels)
- **API WhatsApp Business Cloud** (notifications opérateur)
- **bcryptjs** (hachage des mots de passe)
- **sanitize-html** (assainissement du HTML des articles)

Polices : **Manrope** (texte courant) et **Playfair Display** (titres, en
écho au logotype de la marque). Couleurs : noir chaud `#050404` et or
champagne `#d4b668`, **échantillonnés directement sur le logo fourni**.

---

## Démarrage rapide

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env.local
#    puis renseigner DATABASE_URL

# 3. Migrations
npm run db:migrate

# 4. Compte administrateur
ADMIN_EMAIL=vous@exemple.fr ADMIN_PASSWORD='un-mot-de-passe-fort' npm run seed:admin

# 5. Démarrage
npm run dev
```

Le site est disponible sur <http://localhost:3000>, l'administration sur
<http://localhost:3000/admin>.

### Scripts disponibles

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Tests unitaires de la logique métier (validation, dates, HTML, CSV, photos, chargeur) |
| `npm run check` | lint + typecheck + tests + build |
| `npm run db:generate` | Génère une migration depuis le schéma |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:push` | Pousse le schéma sans migration (prototypage) |
| `npm run db:verify` | Vérifie la connexion et liste les tables / leur contenu |
| `npm run db:requests` | Affiche les dernières demandes enregistrées |
| `npm run db:studio` | Interface Drizzle Studio |
| `npm run seed:admin` | Crée/met à jour l'administrateur |
| `npm run photos` | Télécharge puis traite les photographies sous licence |
| `npm run photos:fetch` | Télécharge les sources et régénère `scripts/photo-credits.json` |
| `npm run photos:process` | Recadre, étalonne et décline les images dans `public/images/places` |
| `npm run brand:prepare` | Régénère les fichiers de marque depuis le logo source |

---

## Configuration

Toutes les variables sont documentées dans [`.env.example`](./.env.example).

### Obligatoire

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion Neon (poolée) |
| `NEXT_PUBLIC_SITE_URL` | Origine publique, ex. `https://taxinordlille.fr` |

### Optionnelles — le site fonctionne sans

Le site accepte et enregistre les demandes même si aucune de ces variables
n'est renseignée. L'état réel est affiché dans le journal des notifications
de chaque demande, plutôt que de faire croire à un envoi réussi.

| Variable | Effet si absente |
| --- | --- |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Notification e-mail : `non_configure` |
| `WHATSAPP_*` | Notification WhatsApp : `non_configure`, bouton `wa.me` manuel |
| `CLOUDINARY_*` ou `BLOB_READ_WRITE_TOKEN` | Téléversement d'images indisponible ; collage d'une URL externe toujours possible |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Utilisées uniquement au moment du `seed:admin` |

---

## Base de données

### Créer un projet Neon

1. [console.neon.tech](https://console.neon.tech) → créer un projet.
2. **Connection Details** → récupérer la chaîne **poolée** pour
   `DATABASE_URL` (celle que l'application utilise) et la chaîne **directe**
   pour les migrations.
3. Les migrations Drizzle utilisent `DATABASE_URL`. Si vous utilisez une
   chaîne poolée, basculez temporairement `DATABASE_URL` sur la chaîne
   directe le temps de `npm run db:migrate`, puis remettez la poolée.

### Migrations

```bash
npm run db:generate   # après toute modification de src/lib/db/schema.ts
npm run db:migrate    # applique les migrations
```

Les migrations versionnées se trouvent dans `drizzle/`.

### Tables

| Table | Contenu |
| --- | --- |
| `admin_users` | Comptes administrateurs (hash bcrypt, rôle, activation) |
| `admin_sessions` | Sessions ; **seul le SHA-256 du jeton est stocké** |
| `quote_requests` | Demandes de devis, référence, statut, consentement, notes internes |
| `contact_messages` | Messages du formulaire de contact |
| `blog_posts` | Articles : contenu, slug, SEO, couverture, statut |
| `blog_categories` | Catégories du blog |
| `site_settings` | Ligne unique (`id = 1`), JSON validé par Zod |
| `notification_logs` | Une ligne par tentative d'envoi, avec son résultat |
| `admin_activity` | Journal d'activité de l'administration |
| `rate_limits` | Compteurs anti-abus (fenêtres fixes) |

Tous les horodatages sont stockés en **UTC** (`timestamptz`) et affichés en
**Europe/Paris** dans l'interface. Le fuseau est codé en dur
(`BUSINESS_TIMEZONE` dans `src/lib/utils.ts`) et non déduit du serveur : le
déploiement est en UTC mais un poste de développement peut être n'importe où,
et l'exploitant doit toujours voir l'heure qu'il a donnée au client.

---

## Comptes administrateur

**Il n'existe aucune inscription publique.** Le seul moyen de créer un compte
est la commande de seed, qui écrit directement en base :

```bash
ADMIN_EMAIL=vous@exemple.fr \
ADMIN_NAME="Votre nom" \
ADMIN_PASSWORD='au moins 12 caractères, avec majuscule, minuscule et chiffre' \
npm run seed:admin
```

Réexécuter la commande sur le même e-mail **met à jour le mot de passe**.

### Authentification

- Mots de passe hachés avec **bcrypt (cost 12)**.
- Session **serveur** : un jeton aléatoire de 32 octets est envoyé dans un
  cookie `httpOnly`, `sameSite=lax`, `secure` en production ; la base ne
  conserve que son **SHA-256**. Une fuite de la base n'est donc pas rejouable.
- Expiration de **12 heures**, avec renouvellement à mi-parcours.
- **Limitation de tentatives** par IP (10 tentatives / 15 minutes) ; un
  compteur de tempo est remis à zéro après une connexion réussie.
- Un hash factice est vérifié quand aucun compte ne correspond, afin que le
  temps de réponse ne révèle pas quels e-mails existent.
- La déconnexion supprime la ligne de session en base.

> **Proxy n'est pas la barrière de sécurité.** Il n'effectue aucune vérification
> de session (il peut s'exécuter en périphérie du CDN). Chaque Server Action
> appelle `requireAdminAction()` et chaque lecture de données est protégée par
> le `requireAdmin()` du layout. Masquer un lien ne protège rien.

---

## Notifications

### E-mail (Resend)

Trois modèles distincts, en HTML, aux couleurs de la marque :

1. **Notification opérateur** — référence, client, trajet, passagers, lien
   direct vers la demande dans l'administration.
2. **Accusé de réception client** — envoyé uniquement si le client a renseigné
   une adresse e-mail. Il confirme la **réception** de la demande et n'indique
   ni prix, ni confirmation de trajet.
3. **Message de contact** — pour le formulaire `/contact`.

### WhatsApp

- **Bouton public** : lien `wa.me` vers le numéro configuré, avec un message
  pré-rempli. Fonctionne sans aucune intégration.
- **Alerte automatique** : via l'API WhatsApp Business Cloud de Meta.
  Nécessite `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` et
  `WHATSAPP_BUSINESS_RECIPIENT`. Le message contient la référence, le trajet
  résumé et un lien vers la demande.

### Fiabilité

- La demande est **écrite en base avant** toute notification. Aucun échec
  d'envoi ne peut supprimer ni invalider une demande.
- Chaque tentative est journalisée dans `notification_logs` avec un statut
  parmi `envoye`, `echec`, `non_configure`, et une raison **assainie**
  (identifiants et jetons expurgés, longueur limitée).
- Le résultat est affiché honnêtement dans l'administration. Aucun
  « envoyé » n'est affiché sans confirmation de l'API.
- **Renvoyer les notifications** depuis le détail d'une demande lorsque les
  identifiants ont été ajoutés après coup.

---

## Stockage d'images

Deux fournisseurs, sélectionnés automatiquement :

| Variable | Fournisseur |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary (téléversement signé côté serveur) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |

Sans fournisseur, le CMS reste utilisable : collez l'URL d'une image. Les
images sont stockées **hors de la base** — Postgres ne contient que les URL et
les métadonnées.

Limites : 5 Mo par fichier ; JPEG, PNG, WebP, AVIF, GIF et SVG.

---

## Structure du projet

```
src/
├─ app/
│  ├─ sitemap.ts                 Sitemap XML (fr + en + articles publiés)
│  ├─ robots.ts                  Directives d'indexation
│  └─ [lang]/                    Segment racine de langue
│     ├─ layout.tsx              <html>, polices, contexte de contact
│     ├─ (site)/                 Site public (header, footer, barre mobile)
│     │  ├─ page.tsx             Accueil
│     │  ├─ services/            Services + fiches détaillées
│     │  ├─ demande-de-devis/    Formulaire de devis + Server Action
│     │  ├─ contact/             Formulaire de contact + Server Action
│     │  ├─ blog/                Liste et articles
│     │  └─ mentions-legales/ …  Pages légales (modèles)
│     └─ (admin)/admin/          Administration
│        ├─ layout.tsx            Coquille (non protégée)
│        ├─ connexion/            Connexion
│        └─ (protected)/          Zone protégée par requireAdmin()
│           ├─ page.tsx           Tableau de bord
│           ├─ demandes/          Liste, détail, export CSV
│           ├─ messages/          Messages de contact
│           ├─ blog/              CMS (liste, éditeur, aperçu)
│           └─ parametres/        Réglages du site
├─ components/
│  ├─ brand/artwork.tsx           Illustrations SVG gravées
│  ├─ site/                       En-tête, pied de page, formulaires…
│  ├─ admin/                      Éditeur de texte riche
│  └─ ui/                         Primitives (button, field, primitives…)
├─ lib/
│  ├─ db/                         Client Drizzle + schéma
│  ├─ auth/                       Mot de passe, sessions
│  ├─ blog/                       Requêtes des articles
│  ├─ notifications/              E-mail, WhatsApp, journalisation
│  ├─ i18n/                       Langues, configuration, dictionnaires
│  ├─ seo/                        Métadonnées et JSON-LD
│  ├─ settings/                   Schéma Zod et accès aux réglages
│  ├─ validation/                 Schémas de validation partagés
│  ├─ rate-limit.ts               Limitation de débit en base
│  ├─ media.ts                    Téléversement d'images
│  ├─ sanitize.ts                 Assainissement HTML
│  └─ utils.ts                    Dates, slugs, CSV, formatage
├─ proxy.ts                       Routage des langues

drizzle/                          Migrations versionnées
scripts/
├─ seed-admin.ts                  Création du compte administrateur
├─ test-logic.ts                  Tests de la logique métier
├─ fetch-photos.mjs               Téléchargement des photographies sous licence
├─ process-photos.mjs             Recadrage, étalonnage et déclinaisons
├─ contact-sheet.mjs              Planche de contrôle visuel des photographies
└─ prepare-logo.mjs               Préparation des fichiers de marque
public/
├─ brand/                         Logo et variantes
└─ images/places/                 Photographies traitées (AVIF, WebP, JPEG)
```

> `drizzle.config.ts` et `scripts/seed-admin.ts` chargent eux-mêmes `.env.local`
> : `npm run db:migrate` et `npm run seed:admin` fonctionnent donc sans exporter
> de variable à la main. Une variable déjà présente dans l'environnement
> (CI, production) est toujours prioritaire.

### Identité visuelle

Le logo fourni (`public/brand/source-logo.jpg`, à ne pas modifier) est
transformé en PNG transparents par `npm run brand:prepare` :

| Fichier | Usage |
| --- | --- |
| `logo-mark.png` | Emblème (laurier + voiture) — en-tête, formulaire de devis |
| `logo-seal.png` | Médaillon complet — pied de page, page de connexion |
| `og-default.png` | Image de partage par défaut (1200 × 630) |
| `icon.png` / `favicon.ico` | Icône d'application |

Le fond noir du logo d'origine est **supprimé par transparence**, ce qui permet
de poser le emblème sur n'importe quelle surface du site sans raccord visible.
La rampe de couleurs de l'interface (`src/app/globals.css`) a été **échantillonnée
sur ce fichier** : `#d4b668` est l'or mesuré, et le texte utilise ses
dégradés. Remplacez `source-logo.jpg` puis relancez `npm run brand:prepare`
après toute évolution de la marque.

### Photographies sous licence

Chaque sujet de la vitrine est une photographie réelle, publiée sous licence
libre sur Wikimedia Commons. **Aucune icône, illustration filaire, pastille ni
dégradé ne sert d'image principale.** Le site en publie exactement quatre, une
par sujet, jamais réutilisées d'une carte à l'autre :

| Emplacement | Sujet | Licence |
| --- | --- | --- |
| Héros | Berline noire (Lexus ES 300h) en service taxi | CC BY-SA 4.0 |
| Carte et page « Gare » | Façade de la gare Lille-Flandres | CC BY-SA |
| Carte et page « Aéroport » | Voie d'accès à l'aéroport de Lille-Lesquin | CC BY-SA |
| Carte et page « Longue distance » | Autoroute A1 à Lesquin (Nord) | CC BY-SA 3.0 |

Le traitement les recadre, les désature et les étalonne vers la palette noire et
or afin qu'elles restent lisibles derrière le texte doré. Elles sont déclinées
en AVIF, WebP et JPEG sur quatre largeurs, avec leurs dimensions intrinsèques,
afin qu'aucune image ne provoque de décalage de mise en page à l'arrivée. Un
texte alternatif décrit la scène ; il est vide lorsque l'image est purement
décorative.

```bash
npm run photos          # téléchargement + traitement complet
npm run photos:fetch    # sources Commons et métadonnées d'attribution
npm run photos:process  # dérivés AVIF/WebP/JPEG et manifeste des crédits
```

Les sources originales ne sont pas versionnées : elles peuvent être
retéléchargées à tout moment. Les dérivés publiés se trouvent dans
`public/images/places/`, avec leurs crédits générés dans
`src/lib/photos/credits.json`. La page `/credits-photographiques`, liée dans
le pied de page et le sitemap, indique l'auteur, la licence, la source et les
modifications apportées à chaque image.

**Limite documentée.** Il n'existe pas, sous licence libre, de photographie
d'un taxi noir à Lille, ni d'un taxi noir devant la gare Lille-Flandres ou le
terminal de Lille-Lesquin. Pour ne pas recourir à une illustration de
remplacement, le héros utilise une berline noire en service taxi (photographiée
à Paris) et les cartes gare/aéroport montrent les lieux réels de Lille que le
client fréquentera. La page de crédits et cette note consignent le manque plutôt
que de le masquer ; toute photo locale sous licence libre pourra remplacer ces
fichiers via `fetch-photos.mjs` sans toucher aux composants.

Pour contrôler visuellement un nouveau traitement avant publication :

```bash
node scripts/contact-sheet.mjs /tmp/planche-photos.jpg
```

### Chargeur de transition de page

Le chargeur noir et or (emblème, « Taxi Nord Lille », taxi sur une route)
apparaît à trois moments, et uniquement ceux-là : la **première visite**,
**la navigation vers une autre page interne** et **précédent/suivant** du
navigateur. La décision de première visite se prend côté serveur à partir du
cookie `tnl_intro`, si bien qu'une visite de retour ne contient aucun chargeur
dans le HTML et ne peut pas clignoter.

La durée d'affichage est d'au moins 2 000 ms, même si la destination est
instantanée : un affichage de quelques millisecondes ne serait qu'un
scintillement. Un plafond de 8 s libère la page si une navigation n'aboutit
jamais, et une règle `<noscript>` masque l'ensemble sans JavaScript. Le
chargeur ignore le bruit : liens de la même page, ancres, clics modifiés,
hôtes externes, `target="_blank"`, `download`, et tout élément marqué
`data-no-loader` ; il ne réagit ni au focus ni à la saisie dans les formulaires.
Il vit au niveau applicatif (capture des clics sur les liens internes et
`popstate`), jamais dans la base de données, le rendu serveur ou les API, donc
il n'ajoute aucun délai artificiel. `prefers-reduced-motion` fige les boucles
décoratives tout en gardant un fondu court.

### Ce que couvrent les tests

`npm run test` vérifie la logique qui ne dépend pas d'une base de données :
validation du formulaire de devis (dates passées, téléphone, e-mail,
consentement, adresses identiques, ordre aller/retour), conversion des heures
locales Europe/Paris en UTC **avec gestion de l'heure d'été** (CET et CEST),
assainissement HTML (scripts, gestionnaires d'événements, `javascript:`),
ancres de sommaire, slugs accentués, protection contre l'injection de formule
CSV et routage des langues. Il vérifie aussi la cohérence entre le catalogue
photographique, les crédits de licence et les fichiers générés ; l'accord entre
la page et le composant sur le cookie du chargeur ; ainsi que la durée minimale
et le plafond du chargeur et les filtres qui l'empêchent de se déclencher sur
le bruit.

---

## Sécurité et vie privée

- **Validation systématique** : Zod côté client *et* côté serveur, avec les
  mêmes clés de message (les messages d'erreur sont en français).
- **Anti-robots** : champ leurre (`website`) invisible ; soumission acceptée
  sans stockage pour ne pas eruditer le robot.
- **Limitation de débit** : devis (6/h), contact (6/h), téléversements (30/h),
  connexion (10/15 min) — en base, donc partagée entre instances.
- **Validation stricte** des dates et heures, dans le fuseau Europe/Paris,
  avec conversion explicite en UTC.
- **En-têtes** : `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy` ; `/admin` en `no-store`.
- **Données personnelles** : jamais dans les URL, jamais dans les journaux.
  Le formulaire rapide de l'accueil transmet les premières saisies via
  `sessionStorage` — jamais par query string.
- **Injection de formule** neutralisée dans l'export CSV.
- **HTML des articles** assaini à l'écriture *et* à l'affichage.
- **Rétention** : configurable dans `Admin → Paramètres`
  (`dataRetentionMonths`, 24 mois par défaut). See [Purge](#purge-des-données-personnelles).

### Purge des données personnelles

Pour supprimer les demandes plus anciennes que la durée de rétention :

```sql
-- Aperçu avant exécution
DELETE FROM quote_requests
WHERE created_at < now() - interval '24 months'
RETURNING reference, created_at;
```

```sql
-- Idem pour les messages de contact
DELETE FROM contact_messages
WHERE created_at < now() - interval '24 months';
```

Les lignes `notification_logs` sont supprimées automatiquement par
`ON DELETE CASCADE`.

---

## Référencement

- Titre et description uniques par page, **modifiables depuis l'administration**.
- URL canonique et **alternatives `hreflang`** (`fr`, `en`, `x-default`).
- Open Graph et Twitter Card sur toutes les pages.
- `sitemap.xml` généré (pages statiques + articles publiés, dans les deux langues).
- `robots.txt` avec exclusion explicite de `/admin`.
- Données structurées : `TaxiService`, `Organization`, `Service`,
  `BreadcrumbList`, `FAQPage`, `BlogPosting`.
  **Seules les informations réellement renseignées sont publiées** : ni note,
  ni avis, ni horaire inventé.
- Fil d'Ariane visible et données structurées correspondantes.
- Les articles non publiés renvoient une **404** : aucun contenu fuite.

---

## Déploiement

### Premier déploiement, pas à pas

L'ordre compte : **la base doit exister avant le premier déploiement**, sinon
le site renverra une erreur sur chaque page.

**1. Pousser le code sur GitHub**

Crée un dépôt vide sur github.com, puis :

```bash
git remote add origin https://github.com/<ton-compte>/taxinordlille.git
git push -u origin main
```

La branche s'appelle `main`.

**2. Créer la base Neon**

1. [console.neon.tech](https://console.neon.tech) → **Create Project**.
2. région proche de tes utilisateurs (ex. `AWS eu-west-1` pour Lille).
3. Le plan gratuit suffit pour démarrer.
4. **Connection Details** → **Pooled connection** : cette chaîne devient
   `DATABASE_URL` pour l'application.
5. **Direct connection** : garde-la de côté, elle sert aux migrations.

> **Pooled vs Direct** — la chaîne *poolée* passe par un proxy PgBouncer qui ne
> supporte pas les requêtes préparées, dont Drizzle a besoin pour migrer.
> L'application fonctionne très bien avec la poolée.

**3. Préparer la base en local**

Crée `.env.local` à la racine :

```bash
DATABASE_URL="<chaîne POOLÉE>"
DIRECT_DATABASE_URL="<chaîne DIRECTE>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Puis :

```bash
npm run db:migrate
npm run seed:admin
```

Si `db:migrate` échoue avec une erreur de *prepared statement*, c'est que
`DATABASE_URL` pointe sur la chaîne poolée : bascule temporairement sur la
**directe** pour cette commande, puis remets la poolée.

**4. Importer sur Vercel**

1. [vercel.com/new](https://vercel.com/new) → **Add New → Project** → choisis
   le dépôt GitHub.
2. Vercel détecte Next.js. Vérifie : build `npm run build`, install `npm install`.
3. **Avant de cliquer Deploy**, ouvre **Environment Variables** et ajoute :

| Name | Value | Environments |
| --- | --- | --- |
| `DATABASE_URL` | chaîne **poolée** Neon | Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | URL Vercel, ex. `https://taxinordlille.vercel.app` | Production |
| `ADMIN_EMAIL` | ton e-mail | Production |
| `ADMIN_PASSWORD` | mot de passe fort (12+ car., 1 majuscule, 1 chiffre) | Production |

4. Deploy.

**5. Après le déploiement**

- Note l'URL obtenue.
- **Settings → Environment Variables** : mets `NEXT_PUBLIC_SITE_URL` à cette
  URL exacte, puis **Redploy**. Sinon les URL canoniques, le sitemap et les
  liens des e-mails seront faux.
- Connecte-toi sur `/admin/connexion`.
- Remplace les valeurs de démonstration dans **Admin → Paramètres** (le
  bandeau en haut de l'administration les liste).

> ⚠️ **Ne lance pas les migrations dans le build Vercel.** Vercel peut builder
> plusieurs commits en parallèle, et la chaîne poolée échoue sur les
> migrations. Prépare la base une seule fois, depuis ta machine ou une CI.

### Résumé Vercel

- Dépôt GitHub importé, preset Next.js.
- Variables : `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, plus les intégrations
  souhaitées (`RESEND_*`, `WHATSAPP_*`, `CLOUDINARY_*` / `BLOB_READ_WRITE_TOKEN`).
- Migrations **une fois**, en local :
  ```bash
  DATABASE_URL="<chaîne DIRECTE>" npm run db:migrate
  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
  ```

### Auto-hébergé

```bash
npm ci
npm run build
npm start          # écoute sur $PORT
```

Placez le service derrière un reverse proxy HTTPS. Si vous faites tourner
plusieurs instances, définissez `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
(32 octets en base64, **identiques sur toutes les instances**) afin que les
Server Actions restent déchiffrables.

---

## À faire avant la mise en ligne

Ces points ne peuvent pas être réglés par un développeur : ils exigent des
informations que seul le propriétaire connaît.

### 1. Remplacer les valeurs de démonstration

L'administration affiche un bandeau listant les champs encore à la valeur par
défaut. Renseignez-les dans **Admin → Paramètres** :

- [ ] Numéro de téléphone
- [ ] Numéro WhatsApp
- [ ] Adresse e-mail de contact
- [ ] Identifiants légaux (raison sociale, SIRET, RCS, TVA)
- [ ] Assureur et hébergeur
- [ ] Adresse postale
- [ ] Zone d'intervention détaillée
- [ ] Horaires (restent masqués tant qu'ils sont vides)

### 2. Faire valider les pages légales

`/mentions-legales`, `/politique-de-confidentialite` et
`/gestion-des-cookies` sont des **modèles**. Ils portent un avertissement
visible et contiennent des champs entre crochets `[…]`. Faites-les relire par
un juriste et complétez-les avant publication.

### 3. Confirmer les affirmations commerciales

Le site ne contient **ni avis, ni note, ni chiffre, ni certification, ni
-horaire 24/7** — tant qu'ils ne sont pas confirmés. La section « Pourquoi nous
choisir » est volontairement formulée en engagements de procédure et non en
résultats. Si vous souhaitez ajouter des éléments factuels, faites-le avec des
données réelles.

### 4. Renseigner la variable `NEXT_PUBLIC_SITE_URL`

`NEXT_PUBLIC_SITE_URL` doit correspondre au domaine final, sinon les URL
canoniques, le sitemap et les liens des e-mails seront incorrects.

### 5. Vérifier la zone d'intervention

La liste des communes desservies est volontairement réduite aux pôles mentionnés
initialement. Élargissez-la uniquement pour les communes réellement couvertes.

### 6. Configurer les intégrations

Ajoutez les clés Resend et/ou WhatsApp, vérifiez le domaine expéditeur, puis
testez une demande de devis de bout en bout.

---

## Licence

Code privé. Tous droits réservés.
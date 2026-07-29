# Sama Impôt

**Application web de paiement des impôts au Sénégal.**

Sama Impôt permet aux contribuables de consulter leurs impôts dus, de les régler
en ligne via **Wave** ou **Orange Money** (simulation), de suivre l'historique
de leurs paiements et de recevoir des rappels d'échéance. Une interface
d'administration permet le suivi global des recouvrements.

Projet réalisé à l'**ISEP Diamniadio** — encadrement : M. Faye.

---

## Architecture

| Couche | Technologie |
| --- | --- |
| Frontend | React 18 + Vite, React Router |
| Backend | Django 5 + Django REST Framework |
| Authentification | JWT (djangorestframework-simplejwt) |
| Base de données | PostgreSQL (production) / SQLite (développement) |
| Paiement | Simulation Wave & Orange Money |

```
minisite/
├── backend/        # API Django REST
│   ├── samaimpot/  # configuration du projet
│   ├── accounts/   # utilisateurs & authentification
│   ├── taxes/      # impôts, catégories, notifications
│   └── payments/   # paiements (Wave / Orange Money)
└── frontend/       # interface React
    └── src/
        ├── pages/      # écrans de l'application
        ├── components/ # mise en page, routes protégées
        ├── context/    # authentification
        └── api/        # client HTTP (axios)
```

---

## Installation en local

### Prérequis
- Python 3.11+
- Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # ajustez les valeurs si besoin
python manage.py migrate
python manage.py seed_demo       # données de démonstration (facultatif)
python manage.py runserver
```

L'API est disponible sur `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_URL=http://localhost:8000
npm run dev
```

L'interface est disponible sur `http://localhost:5173`.

---

## Utilisation

- **Payer un impôt** : menu **« Payer un impôt »** → choisir le type d'impôt
  (le montant indicatif se pré-remplit), ajuster le montant, sélectionner
  **Wave** ou **Orange Money**, saisir le numéro puis valider → reçu de paiement.
- **Espace administrateur** : se connecter avec un compte `is_staff` →
  le menu **« Administration »** apparaît (suivi des recouvrements et paiements).
  La console Django complète reste disponible sur `/admin/`.

---

## Comptes de démonstration

Créés par la commande `python manage.py seed_demo` :

| Rôle | Email | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@samaimpot.sn` | `Admin@2025` |
| Contribuable | `awa.ndiaye@example.sn` | `Passer@2025` |
| Contribuable | `moussa.fall@example.sn` | `Passer@2025` |
| Contribuable | `fatou.sarr@example.sn` | `Passer@2025` |

> Numéros valides pour la simulation : Orange Money → `77` / `78`,
> Wave → `70`, `75`, `76`, `77`, `78` (9 chiffres, ex. `770123456`).

---

## Principales routes de l'API

| Méthode | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/inscription/` | Créer un compte |
| POST | `/api/auth/connexion/` | Connexion (renvoie les tokens JWT) |
| GET/PATCH | `/api/auth/profil/` | Profil de l'utilisateur connecté |
| GET/POST | `/api/impots/` | Liste et déclaration d'un impôt (filtre `?statut=`) |
| GET | `/api/impots/resume/` | Totaux dus / payés / en retard |
| GET | `/api/categories/` | Catalogue des types d'impôts |
| GET/POST | `/api/paiements/` | Historique et création d'un paiement |
| GET | `/api/notifications/` | Notifications du contribuable |
| — | `/admin/` | Console d'administration Django |

---

## Tests

```bash
cd backend
python manage.py test
```

---

## Déploiement

- **Backend** (Render) : le fichier `backend/render.yaml` provisionne le service
  web et la base PostgreSQL. Le build exécute `build.sh` (dépendances,
  `collectstatic`, migrations). Un `Procfile` est également fourni pour Railway.
- **Frontend** (Vercel) : dossier racine `frontend`, `vercel.json` gère le
  routage SPA. Définir la variable `VITE_API_URL` avec l'URL du backend
  déployé, et renseigner `CORS_ALLOWED_ORIGINS` côté backend avec l'URL Vercel.

---

## Équipe projet

- **Ibrahima Diop** — Backend Django & base de données
- **Rokhy Marone** — Frontend React & intégration des interfaces
- **Soule Sall** — Modélisation de la base & tests
- **Awa Diome** — UI/UX & documentation

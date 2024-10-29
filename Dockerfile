# Dockerfile

# Étape 1 : Construction du frontend React
FROM node:18-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Installer create-react-app globalement
RUN npm install -g create-react-app

# Créer une nouvelle application React
RUN create-react-app my-app

# Changer le répertoire de travail vers my-app
WORKDIR /app/my-app

# Installer les dépendances supplémentaires
RUN npm install react-confirm-alert react-icons framer-motion styled-components react-circular-progressbar react-minimal-pie-chart

# Copier le reste des fichiers du frontend (écrasera les fichiers par défaut de create-react-app)
COPY my-app/ ./

# Construire l'application React
RUN npm run build

# Étape 2 : Configuration du backend FastAPI et intégration avec Nginx
FROM python:3.11-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    build-base \
    nginx \
    supervisor

# Définir le répertoire de travail pour le backend
WORKDIR /app

# Copier le fichier requirements.txt
COPY backend/requirements.txt ./backend/

# Installer les dépendances Python
RUN pip install --upgrade pip
RUN pip install -r backend/requirements.txt

# Copier le code backend
COPY backend/ ./backend/

# Copier les fichiers frontend construits depuis l'étape de build
COPY --from=build /app/my-app/build /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copier la configuration Supervisor
COPY supervisor.conf /etc/supervisor.d/supervisord.ini

# Installer apache2-utils pour utiliser htpasswd
RUN apk add --no-cache apache2-utils

# Créer le fichier .htpasswd avec les informations d'identification
RUN htpasswd -bc /etc/nginx/.htpasswd admin ch12345

# Exposer les ports nécessaires
EXPOSE 80 8000

# Créer les répertoires de log pour Supervisor
RUN mkdir -p /var/log/nginx && mkdir -p /var/log/uvicorn

# Définir les variables d'environnement (remplacez par vos valeurs ou utilisez un fichier .env)
ENV BI_DOMAIN=your_bi_domain \
    BI_CLIENT_ID=your_client_id \
    BI_CLIENT_SECRET=your_client_secret \
    BI_USER_ID=your_user_id \
    BI_REDIRECT_URI=your_redirect_uri \
    BI_USERS_SECRET=your_users_secret

# Définir le point d'entrée à Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]

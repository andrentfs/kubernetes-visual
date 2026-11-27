# Kubernetes Visual — imagem para rodar o site localmente.
# O site é estático e não tem etapa de build: a imagem só serve os arquivos com nginx.
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY data /usr/share/nginx/html/data
COPY i18n /usr/share/nginx/html/i18n
COPY licao /usr/share/nginx/html/licao
COPY en /usr/share/nginx/html/en
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

# Kubernetes Visual — imagem para rodar o site localmente.
# O site é estático e não tem etapa de build: a imagem só serve os arquivos com nginx.
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html scenes.js pt.js en.js certs.js term.js /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

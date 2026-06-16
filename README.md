# BigQuery Release Notes Tracker & Publisher

Una aplicación web moderna y de alto rendimiento construida con **Python Flask, HTML5, JavaScript y CSS estándar (Premium UI)** que permite obtener, filtrar y compartir las notas de la versión oficiales de BigQuery.

---

## ⚡ Características Principales

1. **Obtención en Tiempo Real**: Consume directamente el feed Atom XML oficial de BigQuery (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
2. **Procesamiento Inteligente (Parsing)**: Divide el contenido HTML del feed XML en actualizaciones individuales estructuradas (por ejemplo: *Feature*, *Issue*, *Changed*, *Deprecation*, *General*).
3. **Filtros Avanzados y Búsqueda en el Cliente**:
   - Barra de búsqueda interactiva con resaltado visual (`<mark>`) de términos coincidentes en el texto.
   - Filtrado rápido por categoría de actualización.
   - Ordenación flexible (cronológica ascendente o descendente).
4. **Diseño Premium y Oscuro (Sleek Dark UI)**:
   - Apariencia estética inspirada en las interfaces de Google Cloud y Gemini (gradientes azules y púrpuras).
   - Efecto de cristal pulido (Glassmorphism), sombras profundas y transiciones animadas fluidas.
   - Estados de carga interactivos (Loading Skeletons) para una experiencia de usuario excepcional.
5. **Simulador de Twitter / X Realista**:
   - Permite componer un post a partir de cualquier actualización seleccionada con un solo clic.
   - Simulador visual interactivo de post de Twitter en tiempo real con avatar de usuario y vista previa del enlace.
   - Contador de caracteres dinámico (anillo de progreso circular que cambia de color de verde a amarillo y rojo).
   - Ajuste inteligente y automático de longitud para que quepa en los 280 caracteres recomendados.
   - Conexión oficial y directa con el Web Intent de Twitter (`https://twitter.com/intent/tweet`) para publicar sin necesidad de configurar APIs o credenciales complejas de desarrollador.
6. **Copiar al Portapapeles (Visual Feedback)**:
   - Copia instantánea al portapapeles del texto depurado de cualquier actualización.
   - Animación de confirmación que cambia temporalmente el botón a color verde con un indicador de "Copiado".
7. **Exportador Inteligente a CSV**:
   - Exporta a un archivo CSV las actualizaciones cargadas, respetando en tiempo real tus filtros de tipo y búsqueda activa en pantalla.
   - Formateado RFC 4180 que inyecta una firma UTF-8 BOM (`\uFEFF`) para compatibilidad directa con acentos al abrirse en Microsoft Excel.

---

## 🛠️ Tecnologías Utilizadas

- **Backend**: Python 3 con Flask (para API endpoints, enrutamiento y parsing XML ligero).
- **Frontend**: HTML5 Semántico, Vanilla JavaScript (ES6+), Vanilla CSS3 (diseño responsivo, animaciones nativas y variables CSS).
- **Iconografía**: FontAwesome 6 (CDN).
- **Tipografía**: Google Fonts (Outfit para títulos principales y visuales, Inter para cuerpo de texto y legibilidad).

---

## 🚀 Cómo Ejecutar la Aplicación

### Requisitos Previos

- Python 3.3 o superior instalado en el sistema.

### Instalación y Ejecución

La aplicación ya cuenta con un entorno virtual configurado (`venv`) en este workspace. Para ponerla en marcha de inmediato:

1. Abre tu terminal de preferencia (PowerShell, Command Prompt o Bash) en este directorio.
2. Ejecuta el backend de Flask iniciando el servidor:

   **En PowerShell (Windows):**
   ```powershell
   .\venv\Scripts\python.exe app.py
   ```

   **En CMD (Windows):**
   ```cmd
   venv\Scripts\python.exe app.py
   ```

   **En sistemas Unix/macOS:**
   ```bash
   ./venv/bin/python app.py
   ```

3. Abre tu navegador web favorito y accede a:
   ```
   http://127.0.0.1:5000
   ```

---

## 📂 Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

```text
bq-releases-notes/
│
├── app.py                # Servidor backend Flask y lógica de parsing de XML/Atom.
├── README.md             # Este archivo con documentación de la app.
│
├── templates/
│   └── index.html        # Página web principal y estructura semántica.
│
└── static/
    ├── css/
    │   └── styles.css    # Hojas de estilo y animaciones (Sleek Dark Mode).
    └── js/
        └── app.js        # Lógica del cliente, filtrado interactivo e integración con Twitter.
```

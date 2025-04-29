# Agente-Conversacional-para-Consultas-de-Bases-de-Datos-Empresariales
<p align="center">
  <img src="/public/img/Portada_Hackaton_2025.jpg" width="400"/>
  <br>agentes conversacional de inteligencia artificial que permite realizar consultas en lenguaje natural sobre múltiples bases de datos: SQL Server, MySQL y MongoDB usando Node.js 
</p>

# 📊 Agente Conversacional para Consultas en Bases de Datos

Este agente conversacional de inteligencia artificial que permite realizar consultas en lenguaje natural sobre múltiples bases de datos empresariales (SQL Server, MySQL y MongoDB), y esta desarrollado en Node.js.
## 🚀 Flujo de Proeycto
<p align="center">
  <img src="/public/img/Flujo_Proyecto.png" alt="Pantalla Principal" width="400"/>
  <br>diagrama de flujo del proeyecto 
</p>
## 🚀 Características Principales

- Consulta de bases de datos usando lenguaje natural (escrito o hablado).
- Generación automática de consultas SQL y adaptación para MongoDB.
- Visualización de resultados en gráficos dinámicos.
- Exportación de reportes en PDF.
- Soporte multimodal: texto, voz, gráficos y documentos.
- Compatibilidad con múltiples LLMs: OpenAI y Gemini.

## 🛠️ Instalación

Pasos detallados para instalar las dependencias y configurar el entorno:

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/julopnica/Agente-Conversacional-para-Consultas-de-Bases-de-Datos-Empresariales.git
   cd tu_repositorio
   ```

2. Instalar las dependencias usando npm:

   ```bash
   npm install
   ```

Dependencias principales instaladas:

```bash
├── @google/generative-ai@0.21.0
├── babel-eslint@10.1.0
├── chart.js@3.9.1
├── chartjs-node-canvas@4.1.6
├── chartjs-plugin-datalabels@2.2.0
├── cors@2.8.5
├── dotenv@16.5.0
├── eslint@9.17.0
├── express@4.21.2
├── html-pdf@3.0.1
├── javascript@1.0.0
├── mongodb@6.16.0
├── msnodesqlv8@4.5.0
├── mssql@11.0.1
├── multer@1.4.5-lts.1
├── mysql2@3.12.0
├── openai@4.96.0
├── path@0.12.7
├── typescript@5.7.2
└── webpack@5.97.1
```

## 🧹 Uso

1. Levanta el servidor con:
   ```bash
   npm node server.js
   ```
2. Accede a la interfaz web.
3. Haga clic en la parte superior derecha de la pagina [Configuracion], seleciona el gestor de base de datos.
4. Selecciona la base de datos de tu preferencias.
5. Si escribe la consulta en lenguaje natual, haga clic en el icono de tuerca.
6. si quiere dictar o hablar tu consulta, clic en el icono de microfono.
7. Para generar PDF pronunciar la palabra pdf (por ejemplo: *"¿Cuáles fueron los productos más vendidos este mes?  pdf"*).
8. Para generar el Grifico pronunciar la palabra grafico de barra (por ejemplo: *"¿Cuáles fueron los productos más vendidos este mes?  grafico de barra"*).
9. Para generar PDF, escribe  (por ejemplo: *"¿Cuáles fueron los productos más vendidos este mes?, pdf"*).
10. El agente procesará la consulta, generará el gráfico y permitirá exportarlo en PDF.
11. tambien puede canbiar de Modelo, al dar clic en menu superior [OpemAi],[Gemini].
12. Repite los pasos desde el 3.

## 🖼️ Imágenes de Ejemplo


| Pantalla Principal | Informe del Agente | Genera Graficos | Análisis de datos |
|:------------------:|:-------------------------:|:--------------------:|:-----------------:|
| ![Pantalla Principal](/public/img/Pantalla_Principal.png) | ![Funcionalidad de Búsqueda](/public/img/informe.png) | ![Resultados Generados](/public/img/grafico.png) | ![Reporte Exportado](/public/img/analisis.png) |
## 🖼️ Video de Presenatcion
[Video de Presentacion del Proyecto (si está disponible)](https://www.youtube.com/watch?v=Jy_EqMabO_A)


## 🎜️ Demo (Opcional)

[Ver Demo en YouTube (si está disponible)](https://www.youtube.com/watch?v=Jy_EqMabO_A)

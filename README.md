# Conversational Agent for Enterprise Database Queries
<p align="center">
  <img src="/public/img/Portada_Hackaton_2025.jpg" width="400"/>
  <br>Conversational artificial intelligence agents that allow you to perform natural language queries on multiple databases: SQL Server, MySQL, and MongoDB using Node.js
</p>

# 📊 Conversational Agent for Database Queries

This conversational artificial intelligence agent allows you to perform natural language queries on multiple enterprise databases (SQL Server, MySQL, and MongoDB) and is developed in Node.js.
## 🚀 Project Flow
<p align="center">
  <img src="/public/img/Flujo_Proyecto.png" alt="Pantalla Principal" width="400"/>
  <br>project flowchart 
</p>
## 🚀 Main Features

- Database queries using natural language (written or spoken).
- Automatic SQL query generation and adaptation for MongoDB.
- Visualization of results in dynamic graphs.
- Export of PDF reports.
- Multimodal support: text, voice, graphics, and documents.
- Compatibility with multiple LLMs: OpenAI and Gemini.

## 🛠️ Install

Detailed steps to install dependencies and configure the environment:

1. Clone the repository:

   ```bash
   git clone https://github.com/julopnica/Agente-Conversacional-para-Consultas-de-Bases-de-Datos-Empresariales.git
   cd tu_repositorio
   ```

2. Install dependencies using npm:

   ```bash
   npm install
   ```

Main dependencies installed:

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

## 🧹 Use

1. Raise the server with:
   ```bash
   npm node server.js
   ```
2. Access the web interface.
3. Click [configuration] in the top right corner of the page, select the database manager.
4. Select the database you prefer.
5. If you are typing your query in natural language, click the gear icon.
6. If you want to dictate or speak your query, click the microphone icon.
7. To generate a PDF, say the word pdf (for example: *"What were the best-selling products this month? pdf"*).
8. To generate a graph, say the word bar chart (for example: *"What were the best-selling products this month? bar chart"*).
9. To generate a PDF, type (for example: *"What were the best-selling products this month?, pdf"*).
10. The agent will process the query, generate the graph, and allow you to export it to PDF.
11. You can also change the model by clicking [OpemAi], [Gemini] in the top menu.
12. Repeat steps 3 and above.

## 🖼️ Example Images


| Main Screen | Agent Report | Generates Graphics | Data analysis |
|:------------------:|:-------------------------:|:--------------------:|:-----------------:|
| ![Main Screen](/public/img/Pantalla_Principal.png) | ![Agent Report](/public/img/informe.png) | ![ Generates Graphics](/public/img/grafico.png) | ![Data analysis](/public/img/analisis.png) |
## 🖼️ Presentation Video
[](https://www.youtube.com/watch?v=Jy_EqMabO_A)
[![Alt text](https://img.youtube.com/vi/Jy_EqMabO_A/0.jpg)](https://www.youtube.com/watch?v=Jy_EqMabO_A)

## 🎜️ Demo (Optional)

[](https://www.youtube.com/watch?v=Jy_EqMabO_A)
[![Alt text](https://img.youtube.com/vi/Jy_EqMabO_A/0.jpg)](https://www.youtube.com/watch?v=Jy_EqMabO_A)

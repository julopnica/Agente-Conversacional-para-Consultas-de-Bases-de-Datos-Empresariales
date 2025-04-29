

/*
|***************************************************************************************************************************|
|   Proyecto: Aplicación Web para la Generación de Consultas SQL y NoSQL | HACKATHON MICROSOFT 2025                        |
|   Descripción: Esta aplicación permite a los usuarios realizar consultas con comando de voz en lenguaje natural.          |
|   Con resultados en formato SQL o NoSQL, así como generar gráficos y documentos PDF a partir de los resultados obtenidos. | 
|   La aplicación utiliza OpenAI y Gemini para el procesamiento del lenguaje natural y la generación de consultas.          |
|                                                                                                                           |
|   Autor: Juan Pablo López Narváez                                                                                         |
|   Pais: Nicaragua                                                                                                         |     
|   Fecha: 27-04-2025                                                                                                       |
|   Version: 1.0.0                                                                                                          |
|   Contacto:julopnica@gmail.com    Site: https://softlopezaplicaciones.web.app/                                            |
|   Telefono: +505 5502 8880                                                                                                |
|   Este proyecto es propiedad de Juan Pablo López Narváez y no puede ser reproducido sin su consentimiento.                |
|***************************************************************************************************************************|
*/

//* Importar las dependencias necesarias */
const express = require('express');
const sql = require('mssql');
const mysql = require('mysql2/promise');
const pdf = require('html-pdf');
const path = require("path");
const cors = require('cors');
const { MongoClient } = require('mongodb');
require("dotenv").config();
const fs = require('fs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
//dependencias de OpenAI
const OpenAI = require('openai');
// dependencia de Gemini (Google Generative AI)
const { GoogleGenerativeAI } = require("@google/generative-ai");
let modeloIA="OpenAI"; // Variable para almacenar el modelo seleccionado
const ChartDataLabels = require('chartjs-plugin-datalabels');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
let preguntas="";
let dbtype=""; // Variable para almacenar el gestor de base de datos seleccionado


// configuracion de sql server
let sqlConfig = {
   user: process.env.SQL_SERVER_USER,
   password: process.env.SQL_SERVER_PASSWORD,
    server: process.env.SQL_SERVER_HOST,
    database: process.env.SQL_SERVER_DATABASE,
    port: parseInt(process.env.SQL_SERVER_PORT, 10),
    options: {
        encrypt: true,
        trustServerCertificate: true,
        trustedConnection: true
    },
};

//------------------------------------------------------------------
// Configuración MySQL
let mysqlConfig = {
    host: process.env.MYSQL_SERVER,
    port: parseInt(process.env.MYSQL_PORT, 10), // Incluye el puerto como un número
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

//Cofiguracion   mongodb
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "Enfermedades"; // Nombre de la base de datos
const COLLECTION_NAME = process.env.COLLECTION_NAME || "mevi";// Nombre de la colección
if (!MONGO_URI) {
    console.error("Error: Por favor, configura MONGO_URI ");
    process.exit(1);
}

// Configurar Conexión a MongoDB ---
const client = new MongoClient(MONGO_URI);

// esquema de la colección 'mevi'.
const SCHEMA_NOSQL = {
    description: "Documentos que representan enfermedades en la base de datos.",
    fields: [
        // Verifica si IdEnfer es string o number en tu BD real
        { name: "IdEnfer", type: "string", description: "Identificador único de la enfermedad." },
        { name: "Enfermedad", type: "string", description: "Nombre de la enfermedad." },
        // Verifica si Sintomas es un array de strings o un solo string
        { name: "Sintomas", type: "array", items_type: "string", description: "Lista de síntomas asociados a la enfermedad." },
        { name: "Diagnostico", type: "string", description: "Descripción del diagnóstico o criterios." },
        // Verifica si Medicamentos es un array de strings o un solo string
        { name: "Medicamentos", type: "string", description: "Lista de medicamentos o descripción del tratamiento farmacológico." },
        // Si tienes más campos, añádelos aquí con su tipo y descripción
    ]
};

client.connect(); // Conecta el cliente primero
console.log("Conexión exitosa!");
// *** AQUÍ ES DONDE SE DEFINE LA VARIABLE 'db' ***
const db = client.db(DB_NAME);
// *** Y AQUÍ SE DEFINE LA VARIABLE 'collection' (si la necesitas en ese ámbito) ***
const collection = db.collection(COLLECTION_NAME);

//---------Modelos de IA----------------------------------------------//
// Configuración de OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });  

//------------- Gemini API setup
const API_KEY = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model:"gemini-2.0-flash-exp" });

//--------------------------------------------------------------------//
//
// Ruta a la imagen
const rutaImg = path.join(__dirname, "public","img","nube_circulo.png");

// Lee la imagen y conviértela a Base64 para usarla en el PDF
const base64Image = fs.readFileSync(rutaImg, { encoding: "base64" });

// Api endpoint para obtener la lista de bases de datos
app.get('/api/listDatabases/:dbType', async (req, res) => {
    const { dbType } = req.params; // Get the database type (sqlserver or mysql)

    try {
        let result;
        let colecciones=0;
        if (dbType === 'sqlserver') {
            // SQL Server query
            const pool = await sql.connect(sqlConfig);
            result = await pool.request().query("SELECT name AS databaseName FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb');");
        } else if (dbType === 'mysql') {
           // MySQL query (You will need to install and configure a MySQL client)
     
           const connection = await mysql.createConnection(mysqlConfig);
            const [rows, fields] = await connection.query("SHOW DATABASES WHERE `Database` NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys');");
            result = rows.map(row => ({ databaseName: row.Database }));
            connection.end();
        }else if(dbType === 'nosql'){
            colecciones=1;
            const collectionsCursor = db.listCollections();
            const collectionsList = await collectionsCursor.toArray();
            result = collectionsList.map(colInfo => ({ databaseName: colInfo.name }));
        } else {
            return res.status(400).json({ error: "Unsupported database type. Use 'sqlserver' or 'mysql'." });
        }
        if(colecciones==0)
        {  res.status(200).json(result.recordset || result); }
        else{
            res.status(200).json(result);  
            console.log("colecciones: "+result); 
        }
       
    } catch (error) {
        console.error("Error getting databases:", error);
        res.status(500).json({ error: error.message });
    } finally {
       if(sql.connected){
            try { await sql.close() } catch (err) { /*ignore close error*/ }
        }
    }
});
// Api para recibir la base de datos seleccionada
app.post('/api/selectDatabase', (req, res) => {
    const { dbType, databaseName } = req.body;
    console.log("dbType: "+dbType+" databaseName: "+databaseName);
    database = databaseName;
    if (!dbType || !databaseName) {
        return res.status(400).json({ error: "Faltan parámetros: dbType y/o databaseName" });
   }
    if(dbType==='sqlserver'){
    
           sqlConfig = {
        user: process.env.SQL_SERVER_USER,
        password: process.env.SQL_SERVER_PASSWORD,
         server: process.env.SQL_SERVER_HOST,
         database: databaseName,
         port: parseInt(process.env.SQL_SERVER_PORT, 10),
         options: {
             encrypt: true,
             trustServerCertificate: true,
             trustedConnection: true
         },
     }; 
    }else if(dbType==='mysql'){
       
        mysqlConfig = {
            host: process.env.MYSQL_SERVER,
            port: parseInt(process.env.MYSQL_PORT, 10), // Incluye el puerto como un número
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: databaseName,
          };
    }else if(dbType==='nosql'){
        
        dbName=databaseName;
       
    }

     
   
    dbtype = dbType;

    if (!dbType || !databaseName) {
      return res.status(400).json({ error: "Faltan parámetros: dbType y/o databaseName" });
    }
    console.log(`Base de datos seleccionada: ${databaseName} del gestor ${dbType}`);
    return res.json({ message: `Base de datos ${databaseName} del gestor ${dbType} seleccionada correctamente.` });
  });
  

//funcion para formatear moneda
function formatCurrency(number) {
    if (typeof number !== 'number') return number;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(number);
  }
  

//funcion para formatear fecha y hora a cadena
function formatDateTime(date) {
    if (!(date instanceof Date)) {
        try {
            date = new Date(date);
             if(isNaN(date)){
                  return date
             }
        } catch (error) {
          return date
        }
      }

    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };

    const formattedDate = date.toLocaleDateString('es-ES', optionsDate);
    const formattedTime = date.toLocaleTimeString('en-US', optionsTime);
      return `${formattedDate}, hora ${formattedTime}`;
}

//funcion para obtener el esquema de la base de datos
async function getDbSchema(dbType) {
    if (dbType === 'mysql') {
        try {
          const connection = await mysql.createConnection(mysqlConfig);
          const [tables] = await connection.query('SHOW TABLES'); // Obtener todas las tablas
       
          const schema = {};
          for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
            schema[tableName] = columns.map(col => ({
              field: col.Field,
              type: col.Type,
              nullable: col.Null === 'YES',
              key: col.Key,
              default: col.Default,
              extra: col.Extra,
            }));
          }
    
          await connection.end();
          return schema; // Devuelve el esquema como un objeto JSON
        } catch (error) {
          console.error('Error obteniendo el esquema de MySQL:', error.message);
          throw error;
        }
      }
      
   if(dbType==='sqlserver'){
        const schema = {};
        let pool;
        try {
            
            pool = await sql.connect(sqlConfig);
           
            // Obtener todas las tablas y sus columnas con tipos de datos
            const tablesResult = await pool
                .request()
                .query(`
                    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                `);
            
            const columns = tablesResult.recordset;

            // Construir el esquema con tablas, columnas y tipos
            columns.forEach(({ TABLE_NAME, COLUMN_NAME, DATA_TYPE }) => {
                if (!schema[TABLE_NAME]) {
                    schema[TABLE_NAME] = [];
                }
                schema[TABLE_NAME].push({ name: COLUMN_NAME, type: DATA_TYPE });
            });

            return schema;
        } catch (error) {
            console.error("Error al obtener el esquema de la base de datos:", error.message);
            throw new Error(`Error al obtener el esquema de la base de datos: ${error.message}`);
        } finally {
            if (pool) {
                pool.close();
            }
        }
   }

}


//iniciar graficos
const chartJsFactory = () => {
    const Chart = require('chart.js');
    Chart.register(ChartDataLabels);
    delete require.cache[require.resolve('chart.js')];
     delete require.cache[require.resolve('chartjs-plugin-datalabels')];
    return Chart;
}

//funcion para determinar el tipo de grafico a crear con la pregunta enviada
function getChartTypeFromQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes("pastel") || lowerQuestion.includes("pie")) return "pie";
    if (lowerQuestion.includes("dona") || lowerQuestion.includes("donut")) return "doughnut";
    if (lowerQuestion.includes("barra") || lowerQuestion.includes("bar")) return "bar";
    if (lowerQuestion.includes("linea") || lowerQuestion.includes("line")) return "line";
    if (lowerQuestion.includes("burbuja") || lowerQuestion.includes("bubble")) return "bubble";
    if (lowerQuestion.includes("radar") || lowerQuestion.includes("radar")) return "radar";
    //if (lowerQuestion.includes("anillos") || lowerQuestion.includes("ring")) return "ring";
    //if (lowerQuestion.includes("combinados") || lowerQuestion.includes("conbined")) return "conbined";
   
    return null; // Default to table if no chart type is found
}


//funcion para crear graficos
async function createChart(data, chartType) {
    if (!data || data.length === 0) {
        throw new Error("No data to create chart.");
    }

    const labels = data.map((item) => {
      const firstKey = Object.keys(item)[0];
       return String(item[firstKey]);
    });


    const datasets = Object.keys(data[0]).filter(key => key !== Object.keys(data[0])[0]).map((key, index) => {
       return {
            label: key,
            data: data.map(item => {
                const value = item[key];
                  if (typeof value === 'string' && value.startsWith('$')) {
                         return Number(value.replace(/[^0-9.-]/g, ''));
                     }
                  return value
              }),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',   // Rojo
                'rgba(54, 162, 235, 0.6)',   // Azul
                'rgba(255, 206, 86, 0.6)',   // Amarillo
                'rgba(75, 192, 192, 0.6)',   // Verde Agua
                'rgba(153, 102, 255, 0.6)',  // Púrpura
                'rgba(255, 159, 64, 0.6)'    // Naranja
            ],
              borderColor:  [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
              borderWidth: 1,
          };
     });
  
     const chartJs = chartJsFactory();
    const canvasRenderService = new ChartJSNodeCanvas({ width: 800, height: 400, chartJs });

    const configuration = {
        type: chartType,
        data: {
            labels: labels,
            datasets: datasets,
        },
       options: {
           responsive: true,
             plugins: {
                 legend: {
                   position: 'top',
                 },
               title: {
                   display: true,
                   text: 'Resumen'
               },
              datalabels: {
                   /* Color del texto */
              color: "white",
              /* Formato de la fuente */
              font: {
                family: '"Times New Roman", Times, serif',
                size: "14",
                weight: "bold",
              },
                anchor:"center",
                align:'center',
                padding: "2",
                 formatter: formatCurrency(Number)
                    
                   },
            },
            scales:  ['pie', 'doughnut'].includes(chartType) ? {} : { // si es un grafico pie o dona, no se define escalas
                y: {
                    beginAtZero: true,
                
                },
                x: {
                   title: {
                       display: true,
                       text: Object.keys(data[0])[0],
                       color:'white',
                   },
                    ticks:{
                        maxRotation: 90,
                        minRotation: 45,
                    }
               }
           
            }
       }, plugins:['pie', 'doughnut'].includes(chartType) ? {} :[ChartDataLabels]
      
    };
    const chartBuffer = await canvasRenderService.renderToBuffer(configuration);
    return chartBuffer.toString('base64');
}
module.exports = { createChart };

//funcion para formatear resultados
function formatResults(results, schema) {
    return results.map(row => {
        const formattedRow = { ...row };

        for (const key in formattedRow) {
            if (formattedRow.hasOwnProperty(key)) {
                // Buscar la columna directamente en las tablas del esquema
                const columnInfo = Object.values(schema)
                    .flat()
                    .find(column => column.name === key);

                if (columnInfo) {
                    // Verificar tipo de dato desde el esquema
                    const columnType = columnInfo.type ? columnInfo.type.toLowerCase() : '';

                    if (['money', 'smallmoney', 'decimal', 'numeric'].includes(columnType)) {
                        // Formatear como moneda
                        formattedRow[key] = formatCurrency(formattedRow[key]);
                    } else if (['date', 'datetime', 'datetime2', 'smalldatetime'].includes(columnType)) {
                        // Formatear como fecha
                        formattedRow[key] = formatDateTime(formattedRow[key]);
                    }
                }
            }
        }

        return formattedRow;
    });
}

//funcion para generar el pdf
async function generatePdf(data) { // Asegúrate de pasar 'preguntas' y 'base64Image' a la función
    const tableRows = data.map(row => `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`).join('');
    const tableHeaders = `<tr>${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}</tr>`;

    // Get current date for the printed date
    const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });


    const html = `
    <html>
    <head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        .header-page {
            display: flex;
            align-items: center;
            width: 100%;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .logo-page {
            width: 80px;
            height: auto;
            margin-right: 15px;
        }
        .company-info-page {
            font-size: 12px;
        }
        .date-page {
            text-align: right;
            font-size: 10px;
        }
        h4 {
            text-align: left;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid black;
            padding: 6px;
            text-align: left;
            font-size: 10px; /* Reducir un poco el tamaño de la fuente para tablas grandes */
        }
        th {
            background-color: #f2f2f2;
        }
        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            border-top: 1px solid black;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #777;
        }
        .page-number {
            text-align: right;
        }
    </style>
    </head>
    <body>
        <div class="header-content"> <div class="header">
                <img src="data:image/png;base64,${base64Image}" alt="Company Logo" class="logo" />
                <div class="company-info">
                    <strong>Empresa: SOFTLOPEZ</strong><br>
                    <strong>URL:https://softlopezaplicaciones.web.app/</strong><br>
                    <strong>Teléfono:</strong> +505 5502 8880.
                </div>
            </div>
            <div class="date">Fecha de impresión: ${currentDate}</div>
            <h4>${preguntas}</h4>
        </div>
        <table class="table table-bordered table-striped">
            <thead>
                ${tableHeaders}
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </body>
    </html>
    `;

    const options = {
        format: "A4",
        header: {
            height: "30mm", // Ajusta la altura según tu contenido
            contents: `
                <div style="display: flex; align-items: center; width: 100%; border-bottom: 1px solid #ccc; padding-bottom: 5px; font-size: 10px;">
                   <img src="data:image/png;base64,${base64Image}" alt="Company Logo" class="logo" style="width: 30px;margin-button:; height: auto; margin-right: 10px; />
                    <div style="flex-grow: 1;">
                        <strong>Informe Generado por SOFTLOPEZ</strong>
                    </div>
                    <div style="text-align: right; font-size: 10px;">
                        Fecha: ${currentDate}
                    </div>
                     
                </div>
            `
        },
        footer: {
            height: "15mm",
            contents: {
                default: `
                    <div style="text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 5px;">
                        Página {{page}} de {{pages}} - Autor: Juan Pablo López Narváez
                    </div>`
            }
        }
    };

    return new Promise((resolve, reject) => {
        pdf.create(html, options).toBuffer((err, buffer) => { // Pasa el objeto 'options' aquí
            if (err) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });
}


//funcion para analizar resultados usando OPENAI
async function analyzeResults(results) {
    if (!results || results.length === 0) {
        return "No results to analyze.";
    }

    let dataString = JSON.stringify(results);
    //console.log("Datos a analizar:", dataString);
   // Prompt optimizado para análisis (prompt_analista_optimizado)
        const prompt = `
        Eres un Agente IA experto en análisis de datos.
        Para el análisis, sigue estas reglas:
        1. Analiza los resultados  SQL:${dataString}
        - no genres consultas SQL; solo analiza.
        - Analiza resultados: tendencias, patrones y puntos clave.
        - Formatea decimales, miles y millones como dólares (p.ej. $1,000.00).
        - Incluye Análisis, Conclusiones y Recomendaciones para ALMACENSA.
        - Añade predicción (ROI, ventas, etc.).
        - Limita cada línea a 50 caracteres.
        - Cierra con: "si necesitas algo más sobre análisis, no dudes en hacer más consultas."

        2. Analiza los resultados NoSQL[mogodb]:${dataString}
        - No generes consultas NOSQL; solo analiza.
        - Asume rol de médico: analiza tratamientos y sugiere mejoras.
        - Muestras un una respuesta como medico experto en enfermedades y  mejoras que deben hacerse en el tratamiento de las enfermedades.
        - Finaliza con estas palabras: si necesitas algo mas sobre analisis de Enfermedades, no dudes en hacer mas consultas.
       
        
         
        3. No generes consultas SQL; solo analiza.
        `.trim()


    try {
        if(modeloIA === "Gemini"){
            console.log("Modo_Analisis:", modeloIA);
            let geminiResponse = await model.generateContent(prompt);
            return geminiResponse.response.text();
        }else if(modeloIA ==="OpenAI"){
            console.log("Modo_Analisis:", modeloIA);
        let completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // or gpt-4
            messages: [
                { role: "system", content: prompt }, // Usa el prompt CON el esquema SQL
                { role: "user", content: preguntas },
            ],
           // response_format: { type: "json_object" },
        });
       
        return completion.choices[0].message.content.trim();
    }
    } catch (error) {
        console.error("Error analyzing results:", error);
        return "Could not analyze results.";
    }
}


//funcion para validar y ajustar la consulta SQL si es necesario
function validateAndAdjustSQL(sqlQuery, schema) {
    const lowerSqlQuery = sqlQuery.toLowerCase();
    if (!lowerSqlQuery.includes('substring')) {
        return sqlQuery;
    }
    for (const table in schema) {
        const columns = schema[table];
         for(const column of columns){
           if(lowerSqlQuery.includes(column.name.toLowerCase()) && column.type.toLowerCase() == "date"){
                console.warn(`Detected SUBSTRING on date column '${column.name}'. Removing SUBSTRING or adding other type date function.`);
                // This remove all substring functions (More Robust)
                sqlQuery = sqlQuery.replace(
                    new RegExp(`substring\\s*\\(\\s*${column.name}\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)`, 'gi'),
                    column.name
                );
            }
         }
    }
    return sqlQuery;
}

// Función para formatear valores según su tipo
function formatValue(value, type) {
    if (type === "integer") {
      return value.toLocaleString("en-US", { useGrouping: false });
    }
    if (type === "decimal") {
      return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    if (type === "date") {
      const date = new Date(value);
      return date.toLocaleDateString("en-US");
    }
    return value; // Retorna el valor sin cambios si no hay un formato definido
  }
  // Normaliza el esquema de MySQL para un formato más simple
  function normalizeMySQLSchema(schema) {
    const normalizedSchema = {};
    for (const [tableName, columns] of Object.entries(schema)) {
      for (const column of columns) {
        normalizedSchema[column.field] = column.type; // Usa el nombre de la columna y su tipo
      }
    }
    return normalizedSchema;
  }

  // Define el endpoint POST para cambiar el modelo
app.post('/cambiar-modelo', (req, res) => {
    // Accede a los datos enviados en el cuerpo de la solicitud
    const modeloRecibido = req.body.modelo;

    // Verifica si se recibió el nombre del modelo
    if (modeloRecibido) {
        console.log('Servidor recibió el modelo:', modeloRecibido);
        modeloIA = modeloRecibido; // Actualiza la variable global con el nuevo modelo

        // Aquí es donde integrarías la lógica para cambiar el modelo
        // Por ejemplo, actualizar una variable global, guardar en DB, etc.

        // Envía una respuesta al cliente
        res.json({
            status: 'success',
            message: `Modelo ${modeloRecibido} recibido correctamente.`,
            modelo: modeloRecibido
        });

    } else {
        // Si no se recibió el nombre del modelo en el cuerpo
        console.log('Servidor recibió una solicitud sin nombre de modelo.');
        res.status(400).json({ // 400 Bad Request
            status: 'error',
            message: 'Nombre del modelo no proporcionado en el cuerpo de la solicitud.'
        });
    }
});
  
//api endpoint de consultas natural para generar de consultas SQL y NoSQL
app.post('/consulta', async (req, res) => {
    const { question } = req.body;
   
    if (!question) {
        return res.status(400).json({ error: "Please provide a question." });
    }
    
   
    try {
        const lowerQuestion = question.toLowerCase();

          // Eliminar palabras clave de la pregunta antes de usarla como prompt SQL
      let  quest = question
        .replace(/pdf/gi, '')
        .replace(/gr[aá]fico (de |del )?barra/gi, '')
        .replace(/gr[aá]fico (de |del )?pastel/gi, '')
        .replace(/gr[aá]fico (de |del )?dona/gi, '')
        .replace(/barra/gi, '')
        .replace(/pastel/gi, '')
        .replace(/dona/gi, '')
        .trim();

        preguntas = quest; // Actualizamos la variable question con la nueva frase
        console.log("Consulta en LN",preguntas);
           
        // tipo de gestor por defecto sqlserver
        if(dbtype == 'default'){
           dbtype = 'sqlserver'
        }
    //variables globales para almacenar resultados
     let results = null;
     let mongoresults = null;
     let sqlQuery = null;
     let schema  = null;
     let formattedResults = null;
     let normalizedSchema;
     let mongoQueryString = null;
   
 
   // determinar el tipo de gesrtor de base de datos a usar
    switch (dbtype) {
        case 'sqlserver': {

         schema = await getDbSchema(dbtype);
         normalizedSchema = normalizeMySQLSchema(schema);
         
         const schemaString = JSON.stringify(schema);
      
// Prompt optimizado para generar SQL (prompt_sql_optimizado)
        const prompt = `
        Eres un Agente IA experto en SQL Server 2022. Usa **únicamente** este esquema:
        \`${schemaString}\`

        Reglas:
        - Fechas NULL → ISNULL(campo, 0).
        - FORMAT(sum(campo), '$#,##0.00', 'us-US') AS  alias,
        - FORMAT(sum(campo),'$#,##0.00', 'us-US') AS  alias, 
        - FORMAT(sum(campo), '$#,##0.00', 'us-US') AS alias, 
        - FORMAT(campo,'dddd dd \de MMMM \del yyyy') as alias,
        - Meses en español.
        - Limita con TOP.
        - Agrupa: GROUP BY… HAVING …; ordena: ORDER BY… ASC.
        - Concatenar nombres: CONCAT(c.NOMBRE, '.', c.APELLIDOS).
        - Usa corchetes [ ] para nombres con espacios.
        - **Prohibido**: SUBSTR, STRFTIME, LIMIT.
        - Devuelve **solo** la consulta SQL, sin comentarios.
        - Consulta NL: "${preguntas}"
        - Ignora tablas no relacionadas a: "${preguntas}"
        `.trim()
        
       if(modeloIA==="Gemini"){
        console.log("Modo:", modeloIA);
        const geminiResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.0 }
        });
       
        sqlQuery = geminiResult.response.text().replace(/```sql|```/g, '').trim();
        sqlQuery = validateAndAdjustSQL(sqlQuery, schema);
        console.log("Consulta SQL generada:", sqlQuery);
        const pool = await sql.connect(sqlConfig);
        console.log("configuracion sqlserver:",sqlConfig);
        const sqlResult = await pool.request().query(sqlQuery);
        results = sqlResult.recordset;
       }
         else if(modeloIA ==="OpenAI"){
            console.log("Modo:", modeloIA);
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // or gpt-4
                messages: [
                    { role: "system", content: prompt }, // Usa el prompt CON el esquema SQL
                    { role: "user", content: preguntas },
                ],
            // response_format: { type: "json_object" },
            temperature: 0.4, // ¡Importantísimo para consultas SQL!
            });
            const response = completion.choices[0].message.content.replace(/```sql|```/g, '').trim();
        
            sqlQuery = validateAndAdjustSQL(response, schema);   
            console.log("Consulta SQL generada:", sqlQuery);
            const pool = await sql.connect(sqlConfig);
            console.log("configuracion sqlserver:",sqlConfig);
            const sqlResult = await pool.request().query(sqlQuery);
            results = sqlResult.recordset;
       }  
         break;     
        }
            case 'mysql': {
              
               schema = await getDbSchema(dbtype);
               normalizedSchema = normalizeMySQLSchema(schema);
                 const schemaString = JSON.stringify(schema);
                const prompt = `
                 Eres un Agente IA experto en MySQL. Usa **solo** este esquema:
                 "${schemaString}"
                 
                 Reglas:
                 - FechaHora: DATE_FORMAT(campo, '%d-%b-%Y %h:%i %p')
                 - Moneda: CONCAT('$', FORMAT(valor, 2, 'es-ES'))
                 - Ignora tablas no relacionadas a: "${preguntas}"
                 - Devuelve **solo** la consulta MySQL correcta
                 
                 Consulta NL: "${preguntas}"
                 `.trim();
                
                if(modeloIA==="Gemini"){
                    console.log("Modo:", modeloIA);
                    const geminiResult = await model.generateContent({
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.0 }
                    });
                    sqlQuery = geminiResult.response.text().replace(/```sql|```/g, '').trim();
                    sqlQuery = validateAndAdjustSQL(sqlQuery, schema);
                    const connection = await mysql.createConnection(mysqlConfig);
                    const [rows] = await connection.query(sqlQuery);
                    results = rows;
                    connection.end();
                }else if(modeloIA === "OpenAI"){
                    console.log("Modo:", modeloIA);
                   const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // or gpt-4
                    messages: [
                        { role: "system", content: prompt }, // Usa el prompt CON el esquema SQL
                        { role: "user", content: preguntas },
                    ],
                  //  response_format: { type: "json_object" },
                  temperature: 0.4, // ¡Importantísimo para consultas SQL!
                   });
                    sqlQuery = completion.choices[0].message.content.replace(/```sql|```/g, '').trim();
                    console.log("Consulta SQL generada:", sqlQuery);
                    const connection = await mysql.createConnection(mysqlConfig);
                    const [rows] = await connection.execute(sqlQuery);
                    results = rows;
                    connection.end();
                }
                  break;
            }
          
          case 'nosql': {
            const prompt = `
            Eres un experto en MongoDB. Generarás consultas para una colección llamada "${COLLECTION_NAME}" en la base de datos "${DB_NAME}" que contiene documentos sobre enfermedades. Cada documento tiene estos campos: "Diagnostico"(string), "Enfermedad"(string), "IdEnfer"(string), "Medicamentos"(string), y "Sintomas"(string).
        
            Genera la sintaxis de consulta de MongoDB (para el driver Node.js, usando 'collection') para encontrar o contar documentos basándote en esta pregunta en lenguaje natural: "${preguntas}".
        
            Usa la siguiente estructura como MODELO o guía para el proceso de traducción y análisis de la consulta. Tu respuesta FINAL debe ser SOLO la sintaxis completa de JavaScript para MongoDB (como una cadena de texto):
        
            **1. Descripción de la Consulta:** ["${preguntas}"]
        
            **2. Filtrado (Opcional):**
                * **Condición 1:**
                    * Campo: [IdEnfer, Enfermedad, Sintomas, Diagnostico, Medicamentos]
                    * Operador MongoDB: [$eq, $ne, $lt, $gt, $lte, $gte, $in, $nin, $all, $regex, $exists, $not, etc.]
                    * Valor: [Valor a comparar (usa tipos de datos de JavaScript: string, number, boolean, null, RegExp, etc.)]
                * **Condición 2 (Opcional):**
                    * Campo: [IdEnfer, Enfermedad, Sintomas, Diagnostico, Medicamentos]
                    * Operador MongoDB: [$eq, $ne, $lt, $gt, $lte, $gte, $in, $nin, $all, $regex, $exists, $not, etc.]
                    * Valor: [Valor a comparar]
                * **Combinación Lógica (Opcional):** [$and, $or, $not - describe la estructura del objeto filter de MongoDB usando estos operadores]
                ... (Más condiciones si son necesarias, describe la estructura completa del objeto filter de MongoDB)
        
            **3. Orden (Opcional):**
                * Campo: [IdEnfer, Enfermedad, Sintomas, Diagnostico, Medicamentos]
                * Dirección MongoDB: [1 (ascendente) o -1 (descendente)]
                ... (Describe la estructura del objeto sort de MongoDB, ej: {{campo: direccion}})
        
            **4. Límite (Opcional):**
                * Número de Resultados: [Número entero positivo]
        
            Si la pregunta solicita un total o un conteo, genera la sintaxis completa de "collection.countDocuments({...filter...})".
            De lo contrario, genera la sintaxis completa de "collection.find({...filter...}, {...projection...}).sort({...sort...}).limit(limit_number).toArray()"".
            Incluye ".sort(), .limit(), .toArray()" y el objeto de proyección en "find()" *solo* si son necesarios según la consulta y el esquema.
            Asegúrate de que el objeto filter, projection, sort y el número limit estén correctamente formateados como objetos/valores de JavaScript dentro de la cadena de la consulta.
            Siempre genera la sintaxis completa necesaria para ejecutar la operación y obtener resultados (contar o traer documentos a un array).
        
            Devuelve SOLAMENTE la sintaxis completa de la consulta de MongoDB como una cadena de texto en formato JavaScript del SDK (usando la variable 'collection'). No devuelvas ningún otro texto, explicaciones o comentarios.
        
            Consulta en Lenguaje Natural: "${preguntas}"
        `;
        try {
           
            if(modeloIA==="Gemini"){
                console.log("Modo:", modeloIA);
                const geminiResult = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.0 }
                });
                // Limpiar la posible envoltura de markdown como ```javascript
                mongoQueryString = geminiResult.response.text().replace(/```javascript|```/g, '').trim();
                // Opcional: Validación básica de la cadena generada
                if (!mongoQueryString.startsWith('collection.') || (!mongoQueryString.includes('.find(') && !mongoQueryString.includes('.countDocuments('))) {
                    console.error('Generated MongoDB Query String:', mongoQueryString); // Log the problematic string
                    throw new Error('Invalid MongoDB query string generated. Should start with "collection." and include find() or countDocuments().');
                }
            }else if(modeloIA === "OpenAI"){
                console.log("Modo:", modeloIA);
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // or gpt-4
                    messages: [
                        { role: "system", content: prompt }, // Usa el prompt CON el esquema SQL
                        { role: "user", content: preguntas },
                    ],
                //  response_format: { type: "json_object" },
                temperature: 0.4, // ¡Importantísimo para consultas SQL!
                });
                mongoQueryString = completion.choices[0].message.content.trim();
                // Opcional: Validación básica de la cadena generada
                if (!mongoQueryString.startsWith('collection.') || (!mongoQueryString.includes('.find(') && !mongoQueryString.includes('.countDocuments('))) {
                    console.error('Generated MongoDB Query String:', mongoQueryString); // Log the problematic string
                    throw new Error('Invalid MongoDB query string generated. Should start with "collection." and include find() or countDocuments().');
                }
           }  
            let results;
            try {
                results = await eval(mongoQueryString);
            } catch (evalError) {
                console.error("Error durante la ejecución de la consulta generada:", evalError);
                throw new Error("Error al ejecutar la consulta generada por Gemini.");
            }

           
            let isCountQuery = mongoQueryString.includes('countDocuments('); // Detectar si fue una consulta de conteo

            if (isCountQuery) {
                // Si la consulta fue countDocuments(), el resultado es un número
                mongoresults = [{ count: results }]; // Formatear como array de objeto { count: numero }
              

            } else {
                // Si la consulta fue find().toArray(), el resultado es un array de documentos
                // Adaptar el formato de los documentos si es necesario para la respuesta
                mongoresults = results.map(doc => {
                    const cleanDoc = { ...doc }; // Copiar el documento original

                    // Convertir el _id de ObjectId a String para compatibilidad JSON si existe
                    if (cleanDoc._id) {
                        cleanDoc._id = cleanDoc._id.toString();
                    }

                    // Si quieres seleccionar SOLO los campos específicos como en tu ejemplo de Firestore:
                    
                    return {
                        Enfermedad: cleanDoc.Enfermedad,
                        Sintomas: cleanDoc.Sintomas,
                        Diagnostico: cleanDoc.Diagnostico,
                        Medicamentos: cleanDoc.Medicamentos,
                        // Si hay otros campos en tu esquema y quieres incluirlos, añádelos aquí
                        
                    };
                    

                });
               

            }

            // Si hay errors en la consulta, manejarlo aquí
            } catch (error) {
                console.error("Error en el proceso de consulta:", error);
                // Manejar el error (ej: enviar respuesta de error HTTP)
                // res.status(500).json({ error: "Error al procesar la consulta", details: error.message });
                throw error; // Re-lanzar el error si se maneja en un nivel superior
            }



     break;
    }
                   
}

 //--------------fomateo de salida de la consulta de slqserver, mysql y nosql---------------------------      
    if(dbtype === 'sqlserver' || dbtype === 'mysql'){
        formattedResults = formatResults(results, sqlQuery);
         
           formattedResults = results.map(row => {
            const formattedRow = {};
            for (const [key, value] of Object.entries(row)) {
           let type = null; // Determina el tipo desde el esquema normalizado
           if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                type = 'integer';
            } else {
                type = 'decimal';
            }
        }

            formattedRow[key] = type ? formatValue(value, type) : value;
            }
            return formattedRow;
            }); 

           
//si solo hay un resultado y es un solo valor, se formatea como moneda
if (formattedResults.length === 1 && Object.keys(formattedResults[0]).length === 1) {
    let analysis = await analyzeResults(formattedResults);
    let singleValue = Object.values(formattedResults[0])[0];
   
    // Si es un valor monetario, lo formateamos
  
    let formattedValue = singleValue;
        // Convertimos el valor en centavos (ej: 540040 => 5400.40)
        const valueInDecimal = Number(singleValue) / 100;
        formattedValue = valueInDecimal.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        });
        return res.json({
            response: `The result is: ${formattedValue}`,
            analysis: analysis,
        });
    


}


///************************ exportar en PDF *********************************************** */

        if (lowerQuestion.includes('pdf')) {
            // Generar el PDF con los resultados formateados
                const pdfBuffer =  await generatePdf(formattedResults);
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="data.pdf"'
                );
                res.send(pdfBuffer);
                return;
            
        }



//**********************graficar consultas********************************************** */
     //si la pregunta tiene que ver con graficos
        const chartType = getChartTypeFromQuestion(lowerQuestion);
        let chartData = null;
        if (chartType) {
            try {
                chartData = await createChart(formattedResults, chartType);
            } catch (chartError) {
                console.error("Error creating chart:", chartError);
            }
        }


        
       
//**********************salida de consultas sqlser y mysql ********************************************** */  
    //muestramos la consulta sql generada y el resultado formateado
                 const analysis = await analyzeResults(formattedResults);
         return res.json({
             sql: sqlQuery,
              respuesta: formattedResults,
             chart: chartData,
             chartType: chartType,
             analysis: analysis,
           
         });

         
//**********************formateo salida de consultas nosql ********************************************** */
}else if(dbtype === 'nosql'){
    let formatted =JSON.stringify(mongoresults, null, 2);
      
    if(mongoresults[0].count === 0 ){
     return res.json({
         response: `El resultado es: ${mongoresults[0].count}`,  
     });
    }else if(mongoresults[0].count >= 1){
    // devuelve el conteo de enfermedades
     return res.json({
        response: `El resultado es: ${mongoresults[0].count}`,
     });
      }else{
            //si la pregunta tiene que ver con PDF
         if (lowerQuestion.includes('pdf')) {
           
             const pdfBuffer =  await generatePdf(mongoresults);
             res.setHeader("Content-Type", "application/pdf");
             res.setHeader(
                 "Content-Disposition",
                 'attachment; filename="data.pdf"'
             );
             res.send(pdfBuffer);
             return;
         }
     } 

        //muetrasmos la consulta generada y el resultado formateado
            let analysis = await analyzeResults(formatted);
            return res.json({
                sql: mongoQueryString,
                nosql: mongoresults,
                analysis: analysis,
            });
    }


//si hay errores en la consulta, manejarlo aquí
    } catch (error) {
        console.error("Error executing query or processing request:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (sql.connected) {
            try { await sql.close() } catch (err) { /*ignore close error*/ }
        }
    }
});
//inicimos el servidor
app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});

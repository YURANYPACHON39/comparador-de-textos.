const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Configuración de CORS
const opcionesCors = {
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
};

// Aplicar CORS
app.use(cors(opcionesCors));

// Protección mediante encabezados HTTP
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                connectSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net"
                ]
            }
        }
    })
);

// Configurar recepción de datos JSON
app.use(express.json({ limit: "50kb" }));

// Proteger archivos internos
app.use((req, res, next) => {
    const archivosProtegidos = [
        "/server.js",
        "/package.json",
        "/package-lock.json"
    ];

    if (
        archivosProtegidos.includes(req.path) ||
        req.path.startsWith("/node_modules") ||
        req.path.startsWith("/.git")
    ) {
        return res.status(403).json({
            error: "Acceso no permitido."
        });
    }

    next();
});

// Publicar archivos de la aplicación
app.use(express.static(__dirname));

// Abrir aplicación principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "proyecto.html"));
});

// Comprobar funcionamiento del servidor
app.get("/api", (req, res) => {
    res.status(200).json({
        mensaje: "Servidor del Comparador de Textos funcionando correctamente."
    });
});

// Comparar y validar textos
app.post("/api/comparar", (req, res) => {
    const cuerpo = req.body || {};

    const textoOriginal = cuerpo.textoOriginal;
    const textoNuevo = cuerpo.textoNuevo;

    if (
        typeof textoOriginal !== "string" ||
        typeof textoNuevo !== "string"
    ) {
        return res.status(400).json({
            error: "Los dos textos deben ser cadenas de caracteres."
        });
    }

    if (
        textoOriginal.trim() === "" ||
        textoNuevo.trim() === ""
    ) {
        return res.status(400).json({
            error: "Debe ingresar los dos textos."
        });
    }

    if (
        textoOriginal.length > 20000 ||
        textoNuevo.length > 20000
    ) {
        return res.status(400).json({
            error: "Cada texto debe tener máximo 20.000 caracteres."
        });
    }

    res.status(200).json({
        mensaje: "Textos recibidos y validados correctamente.",
        textoOriginal,
        textoNuevo
    });
});

// Revisar ortografía con LanguageTool
app.post("/api/ortografia", async (req, res) => {
    try {
        const texto = req.body?.texto;

        if (typeof texto !== "string") {
            return res.status(400).json({
                error: "El texto debe ser una cadena de caracteres."
            });
        }

        if (texto.trim() === "") {
            return res.status(400).json({
                error: "Debe ingresar un texto para revisar."
            });
        }

        if (Buffer.byteLength(texto, "utf8") > 20000) {
            return res.status(400).json({
                error: "El texto supera el límite de 20 KB."
            });
        }

        const datos = new URLSearchParams();

        datos.append("text", texto);
        datos.append("language", "es");

        const respuesta = await fetch(
            "https://api.languagetool.org/v2/check",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: datos
            }
        );

        if (!respuesta.ok) {
            return res.status(502).json({
                error: "LanguageTool no pudo procesar la solicitud."
            });
        }

        const resultado = await respuesta.json();

        if (!Array.isArray(resultado.matches)) {
            return res.status(502).json({
                error: "La respuesta de LanguageTool no es válida."
            });
        }

        res.status(200).json({
            matches: resultado.matches
        });

    } catch (error) {
        console.error("Error en LanguageTool:", error.message);

        res.status(502).json({
            error: "No fue posible conectar con el servicio de revisión ortográfica."
        });
    }
});

// Rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        error: "La ruta solicitada no existe."
    });
});

// Manejo de errores
app.use((error, req, res, next) => {

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            error: "La información enviada supera el tamaño permitido."
        });
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: "El formato de los datos enviados no es válido."
        });
    }

    console.error("Error del servidor:", error.message);

    res.status(500).json({
        error: "Ocurrió un error interno en el servidor."
    });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
    console.log("Servidor disponible en la red local.");
});

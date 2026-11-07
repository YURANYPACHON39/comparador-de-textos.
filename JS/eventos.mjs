
import { compararTextos } from "./comparador.mjs";
import { revisarOrtografia } from "./api.mjs";

const API_URL = "/api";

export function iniciarEventos() {

    // Obtener elementos del HTML
    const textoOriginal = document.getElementById("textoOriginal");
    const textoNuevo = document.getElementById("textoNuevo");
    const btnComparar = document.getElementById("btnComparar");
    const btnCorregir = document.getElementById("btnCorregir");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnModo = document.getElementById("modo");
    const resultado = document.getElementById("comparacion");
    const correcciones = document.getElementById("correcciones");

    // Verificar que existan todos los elementos
    if (
        !textoOriginal ||
        !textoNuevo ||
        !btnComparar ||
        !btnCorregir ||
        !btnLimpiar ||
        !btnModo ||
        !resultado ||
        !correcciones
    ) {
        console.error("No se encontraron todos los elementos del HTML.");
        return;
    }

    // Variables para almacenar los resultados ortográficos
    let erroresActuales = [];
    let textoRevisado = "";

    // Recuperar textos guardados
    textoOriginal.value = localStorage.getItem("textoOriginal") || "";
    textoNuevo.value = localStorage.getItem("textoNuevo") || "";

    // Guardar textos automáticamente
    textoOriginal.addEventListener("input", () => {
        localStorage.setItem("textoOriginal", textoOriginal.value);
    });

    textoNuevo.addEventListener("input", () => {
        localStorage.setItem("textoNuevo", textoNuevo.value);
    });

    // Navegación con teclado
    document.addEventListener("keydown", evento => {
        if (evento.key === "Tab") {
            document.body.classList.add("uso-teclado");
        }
    });

    document.addEventListener("pointerdown", () => {
        document.body.classList.remove("uso-teclado");
    });

    // Configurar modo claro y oscuro
    const temaGuardado = localStorage.getItem("tema") || "light";
    const temaInicial = temaGuardado === "dark" ? "dark" : "light";

    document.documentElement.setAttribute(
        "data-bs-theme",
        temaInicial
    );

    function actualizarBotonModo() {

        const temaActual =
            document.documentElement.getAttribute("data-bs-theme");

        if (temaActual === "dark") {
            btnModo.textContent = "Modo claro";
            btnModo.setAttribute("aria-label", "Cambiar al modo claro");
            btnModo.setAttribute("aria-pressed", "true");

        } else {
            btnModo.textContent = "Modo oscuro";
            btnModo.setAttribute("aria-label", "Cambiar al modo oscuro");
            btnModo.setAttribute("aria-pressed", "false");
        }
    }

    actualizarBotonModo();

    btnModo.addEventListener("click", () => {

        const temaActual =
            document.documentElement.getAttribute("data-bs-theme");

        const nuevoTema =
            temaActual === "dark" ? "light" : "dark";

        document.documentElement.setAttribute(
            "data-bs-theme",
            nuevoTema
        );

        localStorage.setItem("tema", nuevoTema);

        actualizarBotonModo();
    });

    // Comparar textos mediante Express
    btnComparar.addEventListener("click", async () => {

        const original = textoOriginal.value.trim();
        const nuevo = textoNuevo.value.trim();

        if (!original || !nuevo) {
            resultado.textContent = "Debe ingresar los dos textos.";
            return;
        }

        if (original.length > 20000 || nuevo.length > 20000) {
            resultado.textContent =
                "Cada texto debe tener máximo 20.000 caracteres.";
            return;
        }

        btnComparar.disabled = true;
        resultado.textContent = "Comparando textos...";

        try {

            const respuesta = await fetch(`${API_URL}/comparar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    textoOriginal: original,
                    textoNuevo: nuevo
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error || "No se pudieron comparar los textos."
                );
            }

            compararTextos(
                datos.textoOriginal,
                datos.textoNuevo,
                resultado
            );

            // Guardar última comparación
            sessionStorage.setItem(
                "resultadoComparacion",
                JSON.stringify({
                    textoOriginal: datos.textoOriginal,
                    textoNuevo: datos.textoNuevo
                })
            );

        } catch (error) {

            resultado.textContent =
                "Error al comparar: " + error.message;

            console.error(error);

        } finally {
            btnComparar.disabled = false;
        }
    });

    // Recuperar última comparación
    const resultadoGuardado =
        sessionStorage.getItem("resultadoComparacion");

    if (resultadoGuardado) {

        try {

            const datos = JSON.parse(resultadoGuardado);

            if (
                typeof datos.textoOriginal === "string" &&
                typeof datos.textoNuevo === "string"
            ) {
                compararTextos(
                    datos.textoOriginal,
                    datos.textoNuevo,
                    resultado
                );
            }

        } catch (error) {

            sessionStorage.removeItem("resultadoComparacion");

            console.error(
                "No se pudo recuperar la comparación.",
                error
            );
        }
    }

    // Revisar ortografía
    async function mostrarCorrecciones() {

        const texto = textoNuevo.value;

        correcciones.replaceChildren();
        erroresActuales = [];
        textoRevisado = "";

        if (!texto.trim()) {
            correcciones.textContent =
                "Ingrese un texto para revisar.";
            return;
        }

        btnCorregir.disabled = true;
        correcciones.textContent = "Revisando texto...";

        try {

            const errores = await revisarOrtografia(texto);

            // Comprobar que el texto no haya cambiado
            if (textoNuevo.value !== texto) {
                correcciones.textContent =
                    "El texto cambió durante la revisión. Vuelve a revisar la ortografía.";
                return;
            }

            erroresActuales = errores;
            textoRevisado = texto;

            correcciones.replaceChildren();

            if (errores.length === 0) {
                correcciones.textContent =
                    "¡Excelente! No se encontraron errores.";
                return;
            }

            // Mostrar cantidad de errores
            const titulo = document.createElement("h3");

            titulo.textContent = errores.length === 1
                ? "Se encontró 1 posible error:"
                : `Se encontraron ${errores.length} posibles errores:`;

            correcciones.appendChild(titulo);

            // Mostrar errores y sugerencias
            errores.forEach((error, indice) => {

                const elemento = document.createElement("div");
                const mensaje = document.createElement("p");

                mensaje.textContent =
                    `${indice + 1}. ${error.message}`;

                elemento.appendChild(mensaje);

                const sugerencias = error.replacements || [];

                if (sugerencias.length > 0) {

                    const textoSugerencia =
                        document.createElement("p");

                    textoSugerencia.textContent =
                        "Posibles correcciones:";

                    elemento.appendChild(textoSugerencia);

                    // Crear botones de sugerencias
                    sugerencias.slice(0, 5).forEach((opcion, indiceOpcion) => {

                        const boton = document.createElement("button");

                        boton.type = "button";
                        boton.textContent =
                            `Aplicar: ${opcion.value}`;

                        boton.dataset.errorIndex = indice;
                        boton.dataset.optionIndex = indiceOpcion;

                        boton.style.display = "block";
                        boton.style.marginBottom = "8px";

                        elemento.appendChild(boton);
                    });

                } else {

                    const sinSugerencia =
                        document.createElement("p");

                    sinSugerencia.textContent =
                        "No hay sugerencias disponibles.";

                    elemento.appendChild(sinSugerencia);
                }

                correcciones.appendChild(elemento);
            });

        } catch (error) {

            erroresActuales = [];
            textoRevisado = "";

            correcciones.textContent =
                "Error al revisar el texto: " + error.message;

            console.error(error);

        } finally {
            btnCorregir.disabled = false;
        }
    }

    // Revisar ortografía al presionar el botón
    btnCorregir.addEventListener("click", mostrarCorrecciones);

    // Delegación de eventos para aplicar sugerencias
    correcciones.addEventListener("click", async evento => {

        const boton = evento.target.closest(
            "button[data-error-index][data-option-index]"
        );

        if (!boton || !correcciones.contains(boton)) {
            return;
        }

        // Verificar que el texto siga siendo el mismo
        const textoActual = textoNuevo.value;

        if (textoActual !== textoRevisado) {
            correcciones.textContent =
                "El texto cambió. Vuelve a revisar la ortografía.";
            return;
        }

        const indiceError = Number(boton.dataset.errorIndex);
        const indiceOpcion = Number(boton.dataset.optionIndex);

        const error = erroresActuales[indiceError];

        if (!error || !error.replacements) {
            correcciones.textContent =
                "No se encontró la sugerencia seleccionada.";
            return;
        }

        const opcion = error.replacements[indiceOpcion];

        if (!opcion || typeof opcion.value !== "string") {
            correcciones.textContent =
                "La corrección seleccionada no es válida.";
            return;
        }

        const inicio = Number(error.offset);
        const longitud = Number(error.length);

        // Validar posición del error
        if (
            !Number.isInteger(inicio) ||
            !Number.isInteger(longitud) ||
            inicio < 0 ||
            longitud < 0 ||
            inicio + longitud > textoActual.length
        ) {
            correcciones.textContent =
                "No se pudo aplicar la corrección.";
            return;
        }

        // Aplicar corrección
        textoNuevo.value =
            textoActual.substring(0, inicio) +
            opcion.value +
            textoActual.substring(inicio + longitud);

        // Actualizar almacenamiento
        localStorage.setItem(
            "textoNuevo",
            textoNuevo.value
        );

        // Volver a revisar el texto
        await mostrarCorrecciones();
    });

    // Limpiar campos y resultados
    btnLimpiar.addEventListener("click", () => {

        textoOriginal.value = "";
        textoNuevo.value = "";

        localStorage.removeItem("textoOriginal");
        localStorage.removeItem("textoNuevo");

        sessionStorage.removeItem("resultadoComparacion");

        erroresActuales = [];
        textoRevisado = "";

        resultado.replaceChildren();
        correcciones.replaceChildren();

        resultado.textContent =
            "El resultado de la comparación aparecerá aquí.";

        correcciones.textContent =
            "Los resultados de la revisión aparecerán aquí.";
    });
}

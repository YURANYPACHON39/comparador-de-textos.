export async function revisarOrtografia(texto) {

    if (!texto.trim()) {
        throw new Error("Debes escribir un texto para revisar.");
    }

    if (new TextEncoder().encode(texto).length > 20000) {
        throw new Error("El texto supera el límite de 20 KB.");
    }

    const respuesta = await fetch("/api/ortografia", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            texto: texto
        })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            resultado.error || "No fue posible conectar con LanguageTool."
        );
    }

    if (!Array.isArray(resultado.matches)) {
        throw new Error("La respuesta de la API no es válida.");
    }

    return resultado.matches;
}

export function compararTextos(textoOriginal, textoNuevo, contenedor) {

    // Dividir los textos en palabras
    const palabrasOriginales = textoOriginal.trim().split(/\s+/);
    const palabrasNuevas = textoNuevo.trim().split(/\s+/);

    // Evitar arreglos con una palabra vacía
    const originales = textoOriginal.trim() ? palabrasOriginales : [];
    const nuevas = textoNuevo.trim() ? palabrasNuevas : [];

    const filas = originales.length + 1;
    const columnas = nuevas.length + 1;

    // Crear matriz para calcular la subsecuencia común más larga
    const matriz = Array.from(
        { length: filas },
        () => Array(columnas).fill(0)
    );

    // Calcular coincidencias
    for (let i = originales.length - 1; i >= 0; i--) {
        for (let j = nuevas.length - 1; j >= 0; j--) {

            if (originales[i] === nuevas[j]) {
                matriz[i][j] = 1 + matriz[i + 1][j + 1];
            } else {
                matriz[i][j] = Math.max(
                    matriz[i + 1][j],
                    matriz[i][j + 1]
                );
            }
        }
    }

    // Limpiar el resultado anterior
    contenedor.replaceChildren();

    const fragmento = document.createDocumentFragment();

    let i = 0;
    let j = 0;

    // Recorrer las palabras y mostrar las diferencias
    while (i < originales.length || j < nuevas.length) {

        const elemento = document.createElement("span");

        if (
            i < originales.length &&
            j < nuevas.length &&
            originales[i] === nuevas[j]
        ) {
            elemento.className = "igual";
            elemento.textContent = originales[i];

            i++;
            j++;

        } else if (
            i < originales.length &&
            (
                j >= nuevas.length ||
                matriz[i + 1][j] >= matriz[i][j + 1]
            )
        ) {
            elemento.className = "eliminado";
            elemento.textContent = originales[i];

            i++;

        } else {
            elemento.className = "agregado";
            elemento.textContent = nuevas[j];

            j++;
        }

        fragmento.appendChild(elemento);
        fragmento.appendChild(document.createTextNode(" "));
    }

    contenedor.appendChild(fragmento);
}

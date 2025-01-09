const graphqlEndpoint = "http://localhost:4000/graphql";

// Mostrar formularios
function mostrarFormulario(jugador) {
    document.getElementById("seleccionJugador").style.display = "none";
    document.getElementById(`form${jugador}`).style.display = "block";
}

// Volver a la selección de jugador
function volverSeleccion() {
    document.getElementById("seleccionJugador").style.display = "block";
    document.getElementById("formJugador1").style.display = "none";
    document.getElementById("formJugador2").style.display = "none";
}

// Crear partida
async function crearPartida() {
    const codigoPartida = document.getElementById("codigoPartidaInput").value;

    const query = `
        mutation {
            iniciarJoc(idPartida: "${codigoPartida}", jugador: "jugador1") {
                idPartida
                estado
            }
        }
    `;

    const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });

    const result = await response.json();
    if (result.data) {
        alert("Partida creada. Esperando al Jugador 2.");
        document.getElementById("codigoGenerado").innerText = codigoPartida;
        document.getElementById("codigoPartida1").style.display = "block";
    } else {
        alert("Error al crear la partida");
    }
}

// Unirse a partida
async function unirsePartida() {
    const codigoPartida = document.getElementById("codigoPartida").value;

    const query = `
        mutation {
            iniciarJoc(idPartida: "${codigoPartida}", jugador: "jugador2") {
                idPartida
                estado
            }
        }
    `;

    const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });

    const result = await response.json();
    if (result.data) {
        alert("Te has unido a la partida.");
        document.getElementById("juego").style.display = "block";
    } else {
        alert("Error al unirse a la partida");
    }
}

// Realizar movimiento
async function realizarMovimiento(eleccion) {
    const codigoPartida = document.getElementById("codigoPartidaInput").value;

    const query = `
        mutation {
            moureJugador(idPartida: "${codigoPartida}", jugador: "jugador1", eleccion: "${eleccion}")
        }
    `;

    const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });

    const result = await response.json();
    alert(result.data.moureJugador || "Error en el movimiento");
}

// Consultar estado de la partida
async function consultarEstado() {
    const codigoPartida = document.getElementById("codigoPartidaInput").value;

    const query = `
        query {
            consultarEstatPartida(idPartida: "${codigoPartida}") {
                estado
                jugador1
                jugador2
            }
        }
    `;

    const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });

    const result = await response.json();
    alert(JSON.stringify(result.data.consultarEstatPartida));
}

// Finalizar partida
async function finalizarPartida() {
    const codigoPartida = document.getElementById("codigoPartidaInput").value;

    const query = `
        mutation {
            acabarJoc(idPartida: "${codigoPartida}")
        }
    `;

    const response = await fetch(graphqlEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    });

    const result = await response.json();
    alert(result.data.acabarJoc || "Error al finalizar la partida");
}
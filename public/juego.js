const baseUrl = 'http://localhost:4000/graphql';
let jugadorActivo = '';
let idPartida = '';

function mostrarFormulario(jugador) {
    document.getElementById('seleccionJugador').style.display = 'none';
    if (jugador === 'jugador1') {
        document.getElementById('formJugador1').style.display = 'block';
    } else {
        document.getElementById('formJugador2').style.display = 'block';
    }
}

function reiniciarInterfaz() {
    document.getElementById('seleccionJugador').style.display = 'block';
    document.getElementById('formJugador1').style.display = 'none';
    document.getElementById('formJugador2').style.display = 'none';
    document.getElementById('juego').style.display = 'none';
    document.getElementById('codigoPartida1').style.display = 'none';
    document.getElementById('menuPartida').style.display = 'none';
    document.getElementById('codigoGenerado').innerHTML = '';
    document.getElementById('jugadorActivo').innerHTML = 'Jugador:';

    jugadorActivo = null;
    idPartida = null;

    document.getElementById('resultado').style.display = 'none';
    document.getElementById('mensajeResultado').innerText = '';
}

function nuevaeleccion() {
    reiniciarInterfaz();
}

async function realizarMovimiento(eleccion) {
    const query = `
                mutation {
                    moureJugador(idPartida: "${idPartida}", jugador: "${jugadorActivo}", eleccion: "${eleccion}")
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);

        alert(data.moureJugador);

        await consultarEstado();

        const partidaTerminada = await verificarFinPartida();
        if (partidaTerminada) {
            reiniciarInterfaz();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function crearPartida() {
    idPartida = document.getElementById('codigoPartidaInput').value.trim();

    if (!idPartida || isNaN(idPartida)) {
        alert('Por favor ingresa un código válido.');
        return;
    }

    const query = `
                mutation {
                    iniciarJoc(idPartida: "${idPartida}", jugador: "jugador1") {
                        idPartida
                        estado
                        jugador1
                        jugador2
                    }
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);
        alert('Partida creada con éxito');
        document.getElementById('codigoPartida1').style.display = 'block';
        document.getElementById('codigoGenerado').innerHTML = idPartida;

        document.getElementById('formJugador1').style.display = 'none';
        document.getElementById('juego').style.display = 'block';
        jugadorActivo = 'jugador1';

        document.getElementById('jugadorActivo').innerHTML = 'Jugador 1';
        document.getElementById('menuPartida').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
    }
}

async function unirsePartida() {
    idPartida = document.getElementById('codigoPartida').value.trim();

    if (!idPartida || isNaN(idPartida)) {
        alert('Por favor ingresa un código de partida válido.');
        return;
    }

    const query = `
                mutation {
                    iniciarJoc(idPartida: "${idPartida}", jugador: "jugador2") {
                        idPartida
                        estado
                        jugador1
                        jugador2
                    }
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);
        alert('Jugador 2 se ha unido a la partida.');

        document.getElementById('formJugador2').style.display = 'none';
        document.getElementById('juego').style.display = 'block';
        jugadorActivo = 'jugador2';

        document.getElementById('jugadorActivo').innerHTML = 'Jugador 2';
        document.getElementById('menuPartida').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
    }
}

async function realizarMovimiento(eleccion) {
    const query = `
                mutation {
                    moureJugador(idPartida: "${idPartida}", jugador: "${jugadorActivo}", eleccion: "${eleccion}")
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);
        if (data.moureJugador.includes('No es tu turno')) {
            alert(data.moureJugador);
            return;
        }

        alert(data.moureJugador);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function consultarEstado() {
    const query = `
                query {
                    consultarEstatPartida(idPartida: "${idPartida}") {
                        estado
                        jugador1
                        jugador2
                        victorias1
                        victorias2
                    }
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);

        const partida = data.consultarEstatPartida;
        document.getElementById('resultado').style.display = 'block';
        document.getElementById('mensajeResultado').innerText = `
            Estado de la partida: ${partida.estado}
            Victorias Jugador 1: ${partida.victorias1}
            Victorias Jugador 2: ${partida.victorias2}
        `;

        return partida;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function verificarFinPartida() {
    const query = `
                query {
                    consultarEstatPartida(idPartida: "${idPartida}") {
                        estado
                        victorias1
                        victorias2
                    }
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);
        const partida = data.consultarEstatPartida;

        if (partida.victorias1 === 3 || partida.victorias2 === 3) {
            alert(`¡La partida ha terminado! ${
                partida.victorias1 === 3 ? 'Jugador 1' : 'Jugador 2'
            } ha ganado con 3 victorias.`);
            await acabarPartida();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error al verificar el fin de la partida:', error);
    }
}

async function acabarPartida() {
    const query = `
                mutation {
                    acabarJoc(idPartida: "${idPartida}")
                }
            `;

    try {
        const data = await realizarPeticionGraphQL(query);
        alert(data.acabarJoc);
        reiniciarInterfaz();
    } catch (error) {
        console.error('Error:', error);
    }
}
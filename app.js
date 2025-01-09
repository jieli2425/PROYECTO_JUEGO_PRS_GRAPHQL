const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const opciones = {
  piedra: { piedra: "empate", papel: "perdido", tijera: "victoria" },
  papel: { papel: "empate", tijera: "perdido", piedra: "victoria" },
  tijera: { tijera: "empate", piedra: "perdido", papel: "victoria" }
};

let partidas = {}; // { idPartida: { jugador1, jugador2, eleccion1, eleccion2, estado, turno } }

// Definición del esquema
const schema = buildSchema(`
  type Partida {
    idPartida: String
    jugador1: String
    jugador2: String
    eleccion1: String
    eleccion2: String
    estado: String
    turno: String
  }

  type Query {
    consultarEstatPartida(idPartida: String!): Partida
  }

  type Mutation {
    iniciarJoc(idPartida: String!, jugador: String!): Partida
    moureJugador(idPartida: String!, jugador: String!, eleccion: String!): String
    acabarJoc(idPartida: String!): String
  }
`);

// Resolvers
const root = {
  consultarEstatPartida: ({ idPartida }) => {
    const partida = partidas[idPartida];
    if (!partida) throw new Error("Partida no encontrada");
    return partida;
  },

  iniciarJoc: ({ idPartida, jugador }) => {
    if (!idPartida || !jugador) {
      throw new Error("Faltan datos: idPartida o jugador");
    }

    if (!partidas[idPartida]) {
      if (jugador === "jugador1") {
        partidas[idPartida] = {
          idPartida,
          jugador1: jugador,
          jugador2: null,
          eleccion1: null,
          eleccion2: null,
          estado: "esperando",
          turno: "jugador1",
        };
        return partidas[idPartida];
      } else {
        throw new Error("Partida no encontrada");
      }
    }

    if (partidas[idPartida].jugador2 === null && jugador === "jugador2") {
      partidas[idPartida].jugador2 = jugador;
      partidas[idPartida].estado = "en curso";
      return partidas[idPartida];
    }

    throw new Error("La partida ya está completa o no puedes unirte como este jugador");
  },

  moureJugador: ({ idPartida, jugador, eleccion }) => {
    if (!["piedra", "papel", "tijera"].includes(eleccion)) {
      throw new Error("Movimiento inválido");
    }

    const partida = partidas[idPartida];
    if (!partida) throw new Error("Partida no encontrada");

    if (jugador !== partida.turno) {
      throw new Error("No es tu turno. Espera al otro jugador.");
    }

    if (jugador === "jugador1") partida.eleccion1 = eleccion;
    else if (jugador === "jugador2") partida.eleccion2 = eleccion;
    else throw new Error("Jugador no pertenece a esta partida");

    partida.turno = jugador === "jugador1" ? "jugador2" : "jugador1";

    if (partida.eleccion1 && partida.eleccion2) {
      const resultado = evaluarResultado(partida.eleccion1, partida.eleccion2, partida.jugador1, partida.jugador2);
      partida.estado = resultado;

      // Reiniciar elecciones para la siguiente ronda
      partida.eleccion1 = null;
      partida.eleccion2 = null;

      return `Resultado: ${resultado}. ¡Selecciona otra opción!`;
    }

    return "Esperando al otro jugador...";
  },

  acabarJoc: ({ idPartida }) => {
    if (!partidas[idPartida]) throw new Error("Partida no encontrada");
    delete partidas[idPartida];
    return "Partida eliminada con éxito";
  },
};

// Lógica para evaluar resultados
function evaluarResultado(eleccion1, eleccion2, jugador1, jugador2) {
  const resultado = opciones[eleccion1][eleccion2];
  if (resultado === "empate") return "Empate";
  return resultado === "victoria" ? `${jugador1} gana` : `${jugador2} gana`;
}

// Configuración del servidor Express
const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true, // Interfaz de prueba GraphQL
  })
);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor de GraphQL ejecutándose en http://localhost:${PORT}/graphql`);
});
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const path = require('path');

let partidas = {};

const schema = buildSchema(`
  type Partida {
    idPartida: String
    jugador1: String
    jugador2: String
    eleccion1: String
    eleccion2: String
    estado: String
    turno: String
    resultado: String
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

const arrel = {
  consultarEstatPartida: ({ idPartida }) => {
    const partida = partidas[idPartida];
    if (!partida) return new Error("Partida no encontrada");

    if (partida.eleccion1 && partida.eleccion2) {
      const resultado = evaluarResultado(partida, idPartida);
      partida.resultado = resultado;
    } else {
      partida.resultado = "Esperando a los jugadores";
    }
  
    return partida;
  },

  iniciarJoc: ({ idPartida, jugador }) => {
    if (!idPartida || !jugador) {
      return new Error("Faltan datos: idPartida o jugador");
    }

    if (!partidas[idPartida]) {
      if (jugador === "jugador1") {
        partidas[idPartida] = {
          idPartida,
          jugador1: jugador,
          jugador2: null,
          eleccion1: null,
          eleccion2: null,
          victorias1: 0,
          victorias2: 0,
          estado: "esperando",
          turno: "jugador1",
        };
        return partidas[idPartida];
      } else {
        return new Error("Partida no encontrada");
      }
    }

    if (partidas[idPartida].jugador2 === null && jugador === "jugador2") {
      partidas[idPartida].jugador2 = jugador;
      partidas[idPartida].estado = "en curso";
      return partidas[idPartida];
    }

    return new Error("La partida ya está completa o no puedes unirte como este jugador");
  },

  moureJugador: ({ idPartida, jugador, eleccion }) => {
    if (!["piedra", "papel", "tijera"].includes(eleccion)) {
      return new Error("Movimiento inválido");
    }

    const partida = partidas[idPartida];
    if (!partida) return new Error("Partida no encontrada");

    if (jugador !== partida.turno) {
      return new Error("No es tu turno. Espera al otro jugador.");
    }

    if (jugador === "jugador1") {
      partida.eleccion1 = eleccion;
    } else if (jugador === "jugador2") {
      partida.eleccion2 = eleccion;
    } else {
      return new Error("Jugador no pertenece a esta partida");
    }

    partida.turno = jugador === "jugador1" ? "jugador2" : "jugador1";

    if (partida.eleccion1 && partida.eleccion2) {
      const resultado = evaluarResultado(partida, idPartida);
      partida.resultado = resultado;

      if (partida.victorias1 === 3) {
        reiniciarPartida(idPartida);
        return `${partida.jugador1} ha ganado 3 partidas. ¡El partido ha finalizado!`;
      } else if (partida.victorias2 === 3) {
        reiniciarPartida(idPartida);
        return `${partida.jugador2} ha ganado 3 partidas. ¡El partido ha finalizado!`;
      }

      return `Resultado: ${resultado}. ¡Selecciona otra opción!`;
    }

    return "Esperando al otro jugador...";
  },

  acabarJoc: ({ idPartida }) => {
    if (!partidas[idPartida]) return new Error("Partida no encontrada");
    delete partidas[idPartida];
    return "Partida eliminada con éxito";
  },
};

function evaluarResultado(partida, idPartida) {
  let resultado;
  switch (partida.eleccion1) {
    case "piedra":
      resultado = partida.eleccion2 === "piedra" ? "empate" : partida.eleccion2 === "papel" ? "perdido" : "victoria";
      break;
    case "papel":
      resultado = partida.eleccion2 === "papel" ? "empate" : partida.eleccion2 === "tijera" ? "perdido" : "victoria";
      break;
    case "tijera":
      resultado = partida.eleccion2 === "tijera" ? "empate" : partida.eleccion2 === "piedra" ? "perdido" : "victoria";
      break;
  }

  if (resultado === "empate") return "Empate";
  if (resultado === "victoria") {
    partidas[idPartida].victorias1++;
    return `${partida.jugador1} gana`;
  } else {
    partidas[idPartida].victorias2++;
    return `${partida.jugador2} gana`;
  }
}

function reiniciarPartida(idPartida) {
  if (partidas[idPartida]) {
    delete partidas[idPartida];
  }
}

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: arrel,
    graphiql: true,
  })
);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', './public/index.html'));
});

app.listen(4000, () => {
  console.log(`Servidor de GraphQL ejecutándose en http://localhost:4000/graphql`);
});
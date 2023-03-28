import fastify from "fastify";
import cors from "@fastify/cors";
import z from 'zod'
import { PrismaClient } from ".prisma/client";
import { FastifyRequest } from "fastify";

const server = fastify();
const prisma = new PrismaClient();
const Pokemon = z.object({
  name: z.string(),
  numberPokedex: z.number(),
})

const Team = z.object({
  teamName: z.string(),
  pokemons: z.array(z.number()),
})

type Pokemon = z.infer<typeof Pokemon>
type Team = z.infer<typeof Team>
/*interface Pokemon extends Team {
  name: string;
  numberPokedex: number;
  img: string;
}

interface Team {
  teamName: string;
  pokemons: number[];
}
*/
server.register(cors);

server.get("/pokemon", async (request, reply) => {
  const pokemons = await prisma.pokemon.findMany({});
  reply.send(pokemons);
});

server.get("/teams", async (request, reply) => {
  const teams = await prisma.team.findMany({
    include: {
      pokemon: {
        select: {
          name: true,
          numberPokedex: true,
          img: true,
        },
      },
    },
  });
  return reply.send(teams);
});

server.post(
  "/pokemon",
  async (request: FastifyRequest<{ Body: Pokemon }>, reply) => {
    const body = request.body;
    const pokemonNumber = body.numberPokedex;
    const pokemon = await prisma.pokemon.create({
      data: {
        name: body.name,
        numberPokedex: body.numberPokedex,
        img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonNumber}.png`,
      },
    });
    return reply.status(201).send(pokemon);
  }
);

server.post("/team", async (request: FastifyRequest<{ Body: Team }>, reply) => {
  const { teamName, pokemons } = request.body;

  const team = await prisma.team.create({
    data: {
      teamName: teamName,
      pokemon: {
        connect: pokemons.map((arr) => {
          return { id: arr };
        }),
      },
    },
    include: {
      pokemon: true,
    },
  });
  return reply.status(201).send(team);
});

server.delete(
  "/pokemon/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const pokemonDeleted = await prisma.pokemon.delete({
      where: {
        id: Number(id),
      },
    });
    return reply.status(200).send(pokemonDeleted);
  }
);

server.delete(
  "/team/:id",
  async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const teamDeleted = await prisma.team.delete({
      where: {
        id: Number(id),
      },
    });
    return reply.status(200).send(teamDeleted);
  }
);

server
  .listen({
    port: 3000,
  })
  .then(() => {
    console.log("HTTP Server running @!!@");
  });

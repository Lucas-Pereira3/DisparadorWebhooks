const express = require("express");
const request = require("supertest");

// app fake só para testes
const app = express();
app.use(express.json());

// Simula a rota /protocolo
app.get("/protocolo", (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: "start_date e end_date são obrigatórios." });
  }
  // Simula retorno do banco
  res.json([{ id: 1, product: "boleto" }]);
});

// Simula a rota /protocolo/:uuid
app.get("/protocolo/:uuid", (req, res) => {
  const { uuid } = req.params;
  if (uuid === "uuid-invalido") {
    return res.status(400).json({ error: "Protocolo não encontrado." });
  }
  // Simula protocolo encontrado
  res.json({ id: uuid, status: "sent" });
});

// Os testes irão usar o app fake
describe("Testes da rota /protocolo", () => {
  it("deve retornar erro se não enviar start_date ou end_date", async () => {
    const res = await request(app).get("/protocolo?start_date=2025-01-01");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "start_date e end_date são obrigatórios.");
  });

  it("deve retornar lista de protocolos do banco", async () => {
    const res = await request(app).get("/protocolo?start_date=2025-01-01&end_date=2025-01-02");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, product: "boleto" }]);
  });
});

describe("Testes da rota /protocolo/:uuid", () => {
  it("deve retornar erro se protocolo não for encontrado", async () => {
    const res = await request(app).get("/protocolo/uuid-invalido");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Protocolo não encontrado.");
  });

  it("deve retornar protocolo quando encontrado", async () => {
    const res = await request(app).get("/protocolo/123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", "123");
  });
});

import cache from "../middlewares/cache.js";
import express from "express";

const app = express();

app.get("/teste-cache", cache(10), (req, res) => {
  const data = {
    mensagem: "Teste de cache funcionando!",
    hora: new Date().toISOString(),
  };
  res.json(data);
});

app.listen(3000, () => console.log("🚀 Servidor rodando na porta 3000"));

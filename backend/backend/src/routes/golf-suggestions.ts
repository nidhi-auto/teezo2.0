import { Router } from "express";

const SUGGESTIONS = [
  { id: "1", name: "Pine Valley Golf Club", city: "Pine Valley", country: "US" },
  { id: "2", name: "Augusta National", city: "Augusta", country: "US" },
  { id: "3", name: "St Andrews Links", city: "St Andrews", country: "UK" },
];

export const golfSuggestionsRouter = Router();

golfSuggestionsRouter.get("/", (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const items = q
    ? SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(q))
    : SUGGESTIONS;
  res.json({ items });
});
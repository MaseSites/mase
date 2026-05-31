// Kleiner zod-Wrapper für Eingabevalidierung an Routen-Boundaries.

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      if (req.accepts('json') && !req.accepts('html')) {
        return res.status(400).json({ error: 'Validierungsfehler', issues });
      }
      req.validationErrors = issues;
      return next(); // Route entscheidet, wie die Fehler dargestellt werden
    }
    req.valid = result.data;
    next();
  };
}

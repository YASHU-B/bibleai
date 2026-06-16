module.exports = function(app, fs, PREDEFINED_FILE, loadPredefined, savePredefined) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.EXPO_ADMIN_SECRET || 'dev-secret';

  let predefinedMap = loadPredefined();

  app.get('/admin/responses', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    predefinedMap = loadPredefined();
    return res.json(predefinedMap);
  });

  app.post('/admin/responses', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const { key, text } = req.body || {};
    if (!key || !text) return res.status(400).json({ error: 'need key and text' });
    const map = loadPredefined();
    map[key.toLowerCase().trim()] = String(text);
    savePredefined(map);
    return res.json({ ok: true, key, text });
  });

  app.delete('/admin/responses', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const { key } = req.body || req.query || {};
    if (!key) return res.status(400).json({ error: 'need key' });
    const map = loadPredefined();
    delete map[key.toLowerCase().trim()];
    savePredefined(map);
    return res.json({ ok: true, key });
  });

  app.post('/admin/reload', (req, res) => {
    const secret = req.headers['x-admin-secret'] || req.query.admin_secret;
    if (secret !== ADMIN_SECRET) return res.status(401).json({ error: 'unauthorized' });
    const map = loadPredefined();
    return res.json({ ok: true, count: Object.keys(map).length });
  });
};

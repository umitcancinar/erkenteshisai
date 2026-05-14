const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Model selection: gemini-1.5-flash is standard, gemini-2.0-flash is faster but might have lower limits
const MODEL_NAME = 'gemini-3-flash-preview';

exports.chat = async (req, res) => {
  try {
    const { message, history, lang } = req.body;
    const contents = [];
    if (history) {
      history.forEach(msg => {
        contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content || msg.text || '' }] });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const systemInstruction = lang === 'TR' 
        ? "Sen Erken Teşhis AI adında bir sağlık danışmanısın. Türkçe yanıt ver."
        : "You are Early Diagnosis AI, a health advisor. Respond in English.";

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      systemInstruction: systemInstruction
    });

    const aiMessage = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text || "Yapay zeka yanıt üretemedi.";
    
    if (req.user?.userId) {
      await db.query(
        'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3)',
        [req.user.userId, 'chat', aiMessage.substring(0, 500)]
      );
    }
    res.json({ response: aiMessage });
  } catch (err) {
    console.error('Chat AI Error:', err);
    res.status(500).json({ error: `AI Error: ${err.message}` });
  }
};

exports.analyzeImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya yok' });
    const { symptoms, moodScore, lang } = req.body;
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    let prompt = lang === 'TR' ? "Bu görüntüyü analiz et." : "Analyze this image.";
    if (symptoms) prompt += ` Semptomlar: ${symptoms}`;
    
    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ inlineData: { data: base64Image, mimeType: mimeType } }, { text: prompt }] }]
    });

    const aiAnalysis = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text || "Analiz yapılamadı.";
    await db.query('INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3)', [req.user.userId, 'image_analysis', aiAnalysis]);
    res.json({ analysis: aiAnalysis });
  } catch (err) {
    console.error('Image AI Error:', err);
    res.status(500).json({ error: `Image AI Error: ${err.message}` });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { lang } = req.body;
    const healthResult = await db.query(
      'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 10',
      [req.user.userId]
    );
    
    if (healthResult.rows.length === 0) return res.status(400).json({ error: 'Veri yok' });

    const dataString = healthResult.rows.map(e => `[${e.date}] Pulse:${e.pulse}`).join('\n');
    const prompt = `Health data:\n${dataString}\n\nGenerate a summary. Language: ${lang}`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const reportContent = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text || "Rapor oluşturulamadı.";
    const newReport = await db.query(
      'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, 'report', reportContent]
    );
    res.json({ report: newReport.rows[0] });
  } catch (err) {
    console.error('Report AI Error:', err);
    res.status(500).json({ error: `Report AI Error: ${err.message}` });
  }
};

exports.generateDoctorSummary = async (req, res) => {
  try {
    const { lang } = req.body;
    const healthResult = await db.query(
      'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 10',
      [req.user.userId]
    );
    
    if (healthResult.rows.length === 0) return res.status(400).json({ error: 'Veri yok' });

    const dataString = healthResult.rows.map(e => `[${e.date}] Pulse:${e.pulse}`).join('\n');
    const prompt = `Doctor summary for:\n${dataString}\n\nLanguage: ${lang}`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const summaryContent = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || result.text || "Özet oluşturulamadı.";
    const newReport = await db.query(
      'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, 'doctor_summary', summaryContent]
    );
    res.json({ report: newReport.rows[0] });
  } catch (err) {
    console.error('Doctor Summary AI Error:', err);
    res.status(500).json({ error: `Doctor Summary AI Error: ${err.message}` });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await db.query(
      'SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(reports.rows);
  } catch (err) {
    res.status(500).json({ error: 'Hata' });
  }
};

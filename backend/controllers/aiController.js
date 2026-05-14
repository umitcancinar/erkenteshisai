const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Construct conversation context
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
         contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] });
      });
    }
    
    // Add current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    // System instruction
    const systemInstruction = "You are Early Diagnosis AI, a professional health advisor. You provide general health information and analysis based on user symptoms and data. Always emphasize that your advice is a preliminary screening and not a professional medical diagnosis, and suggest seeing a doctor for official results. Be empathetic and professional.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    const aiMessage = response.text;
    
    if (req.user && req.user.userId) {
      await db.query(
        'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3)',
        [req.user.userId, 'chat', `User: ${message}\nAI: ${aiMessage}`]
      );
    }

    res.json({ response: aiMessage });
  } catch (err) {
    console.error('Chat AI Error:', err);
    res.status(500).json({ error: 'Yapay zeka yanıt üretirken hata oluştu.' });
  }
};

exports.analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen bir fotoğraf yükleyin.' });
    }

    const { symptoms, moodScore } = req.body;
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    let prompt = "Analyze this image as a health expert. Is there any visible issue or symptom related to skin, eyes, mouth, or hair?";
    if (symptoms) prompt += `\nAdditional symptoms stated by the user: ${symptoms}`;
    if (moodScore) prompt += `\nUser's mood score (0-10): ${moodScore}`;
    prompt += "\nReport in detailed but understandable English. Remember: This is a preliminary screening, always recommend seeing a doctor for a definitive decision.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        prompt
      ]
    });

    const aiAnalysis = response.text;

    // Save to database
    await db.query(
      'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3)',
      [req.user.userId, 'image_analysis', aiAnalysis]
    );

    res.json({ analysis: aiAnalysis });
  } catch (err) {
    console.error('Image AI Error:', err);
    res.status(500).json({ error: 'Görüntü analiz edilirken hata oluştu.' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    // Get recent health entries
    const healthResult = await db.query(
      'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 7',
      [req.user.userId]
    );
    
    const entries = healthResult.rows;
    if (entries.length === 0) {
      return res.status(400).json({ error: 'Rapor oluşturmak için yeterli sağlık veriniz yok.' });
    }

    const dataString = entries.map(e => 
      `Tarih: ${e.date}, Nabız: ${e.pulse}, Tansiyon: ${e.blood_pressure}, Şeker: ${e.blood_sugar}, Ateş: ${e.body_temperature}, Uyku: ${e.sleep_hours} saat, Stres: ${e.stress_level}/10, Semptomlar: ${e.symptoms}`
    ).join('\n');

    const prompt = `Below is the user's health data for the last 7 days. Analyze this data to create a detailed "Weekly Health Report" and a "Summary for Doctor". Write in professional English.\n\nData:\n${dataString}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    const reportContent = response.text;
    const newReport = await db.query(
      'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, 'report', reportContent]
    );

    res.json({ report: newReport.rows[0] });
  } catch (err) {
    console.error('Report AI Error:', err);
    res.status(500).json({ error: 'Rapor oluşturulurken hata oluştu.' });
  }
};

exports.generateDoctorSummary = async (req, res) => {
  try {
    const healthResult = await db.query(
      'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 30',
      [req.user.userId]
    );
    
    const entries = healthResult.rows;
    if (entries.length === 0) {
      return res.status(400).json({ error: 'Özet oluşturmak için yeterli sağlık veriniz yok.' });
    }

    const dataString = entries.map(e => 
      `[${e.date}] Nabız: ${e.pulse}, Tansiyon: ${e.blood_pressure}, Şeker: ${e.blood_sugar}, Ateş: ${e.body_temperature}, Uyku: ${e.sleep_hours}sa, Stres: ${e.stress_level}, Semptomlar: ${e.symptoms}`
    ).join('\n');

    const prompt = `Transform the following data into a professional "Doctor Summary Report" format that a doctor can quickly review. Highlight critical changes, use appropriate medical terminology but keep it understandable for the patient. Write in English.\n\nData:\n${dataString}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    const summaryContent = response.text;

    const newReport = await db.query(
      'INSERT INTO analyses (user_id, type, content) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, 'doctor_summary', summaryContent]
    );

    res.json({ report: newReport.rows[0] });
  } catch (err) {
    console.error('Doctor Summary AI Error:', err);
    res.status(500).json({ error: 'Doktor özeti oluşturulurken hata oluştu.' });
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
    console.error(err);
    res.status(500).json({ error: 'Raporlar getirilirken hata oluştu.' });
  }
};

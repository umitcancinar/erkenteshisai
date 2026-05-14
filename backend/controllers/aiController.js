const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-1.5-flash';

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

    // System instruction (can be passed in config)
    const systemInstruction = "Sen Erken Teşhis AI adında bir sağlık danışmanısın. Kullanıcılara tıbbi konularda genel bilgiler verirsin, ancak her zaman kesin teşhis için bir doktora görünmeleri gerektiğini belirtirsin. Türkçe ve empatik bir dille yanıt ver.";

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

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    const prompt = "Bir sağlık uzmanı gibi bu görüntüyü analiz et. Cilt, göz, ağız veya saçla ilgili belirgin bir sorun veya semptom var mı? Detaylı, ancak anlaşılır bir dille Türkçe olarak raporla. Unutma: Bu bir ön teşhistir, her zaman kesin karar için doktora görünmeyi tavsiye et.";

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

    const prompt = `Kullanıcının son 7 günlük sağlık verileri aşağıdadır. Bu verileri analiz ederek detaylı bir "Haftalık Sağlık Raporu" ve "Doktor İçin Özet" oluştur. Türkçe olarak profesyonel bir dille yaz.\n\nVeriler:\n${dataString}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    const reportContent = response.text;

    // Save report
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

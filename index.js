import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('WhatsApp Server Online');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'whatsapp-server'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp server running on port ${PORT}`);
});

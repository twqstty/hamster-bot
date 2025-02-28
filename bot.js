const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000; // Порт из логов Render
app.use(express.json());

const token = process.env.TOKEN;
if (!token) {
    console.error('Ошибка: Токен не задан в переменной окружения TOKEN');
    process.exit(1);
}

const bot = new TelegramBot(token);
const adminId = '857785777'; // Твой Telegram ID
let players = {};

if (fs.existsSync('players.json')) {
    players = JSON.parse(fs.readFileSync('players.json'));
}

app.post(`/bot${token}`, (req, res) => {
    console.log('Получен запрос от Telegram:', req.body);
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.setWebHook(`https://hamster-bot-jj2f.onrender.com/bot${token}`)
    .then(() => console.log('Webhook успешно установлен'))
    .catch(err => console.error('Ошибка установки webhook:', err));

bot.on('message', (msg) => {
    if (msg.web_app_data) {
        const data = JSON.parse(msg.web_app_data.data);
        players[data.playerName] = {
            score: data.score,
            clicks: data.clicks,
            level: data.level
        };
        fs.writeFileSync('players.json', JSON.stringify(players));
        console.log(`Сохранены данные игрока ${data.playerName}: ${data.score} очков`);
    }
});

bot.onText(/\/start/, (msg) => {
    console.log(`Получена команда /start от ${msg.from.id}`);
    bot.sendMessage(msg.chat.id, 'Жми "Играть" и погнали!', {
        reply_markup: {
            keyboard: [[{ text: 'Играть', web_app: { url: 'https://twqstty.github.io/HAMSTERR/' } }]],
            resize_keyboard: true
        }
    });
});

bot.onText(/\/stats/, (msg) => {
    console.log(`Получена команда /stats от ${msg.from.id}`);
    if (msg.from.id.toString() === adminId) {
        let reply = 'Статистика игроков:\n';
        for (const [name, stats] of Object.entries(players)) {
            reply += `${name}: ${stats.score} очков, ${stats.clicks} кликов, ур. ${stats.level}\n`;
        }
        bot.sendMessage(adminId, reply || 'Пока никто не играл');
    } else {
        bot.sendMessage(msg.chat.id, 'Ты не админ, братан!');
    }
});

bot.onText(/\/reset/, (msg) => {
    console.log(`Получена команда /reset от ${msg.from.id}`);
    if (msg.from.id.toString() === adminId) {
        players = {};
        try {
            fs.writeFileSync('players.json', JSON.stringify(players));
            bot.sendMessage(adminId, 'Статистика всех игроков сброшена!');
            console.log('Статистика успешно сброшена админом');
        } catch (err) {
            console.error('Ошибка при сбросе статистики:', err);
            bot.sendMessage(adminId, 'Ошибка при сбросе статистики!');
        }
    } else {
        bot.sendMessage(msg.chat.id, 'Ты не админ, братан!');
    }
});

app.listen(port, () => {
    console.log(`Бот запущен на порту ${port}`);
});
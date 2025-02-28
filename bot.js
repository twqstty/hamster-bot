const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const token = process.env.TOKEN || '8070086700:AAF-aqPY_6MOqgeBLv5lrB_B75TzeWYkGVM'; // Замени на свой токен
const bot = new TelegramBot(token);
const adminId = '857785777'; // Замени на свой Telegram ID
let players = {};

if (fs.existsSync('players.json')) {
    players = JSON.parse(fs.readFileSync('players.json'));
}

app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.setWebHook(`https://hamster-bot-jj2f.onrender.com${token}`); // Обновишь после Render

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
    bot.sendMessage(msg.chat.id, 'Жми "Играть" и погнали!', {
        reply_markup: {
            keyboard: [[{ text: 'Играть', web_app: { url: 'https://twqstty.github.io/HAMSTERR/' } }]],
            resize_keyboard: true
        }
    });
});

bot.onText(/\/stats/, (msg) => {
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

app.listen(port, () => {
    console.log(`Бот запущен на порту ${port}`);
});
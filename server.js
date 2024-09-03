require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // 引入 bcrypt
const cors = require('cors');

const app = express();

// 配置 CORS
app.use(cors());

// 解析 JSON 格式的请求体
app.use(bodyParser.json());

// MySQL 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'zjh123hh',
  database: 'map',
};

// 使用 async/await 来处理数据库连接
(async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('MySQL connected...');
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(); // 如果连接失败，退出进程
  }
})();

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // 查询数据库以获取用户记录
      const [rows] = await connection.execute(
        `SELECT * FROM users WHERE username = ?`,
        [username]
      );
  
      if (rows.length === 0) {
        // 用户不存在
        return res.status(401).json({ message: '用户名不存在' });
      }
  
      // 假设 rows[0] 包含了用户信息
      const user = rows[0];
  
      // 检查密码是否匹配
      if (user.password === password) {
        // 密码匹配，登录成功
        res.json({ message: '登录成功' });
      } else {
        // 密码不匹配
        res.status(401).json({ message: '密码错误' });
      }
    } catch (error) {
      // 服务器错误
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
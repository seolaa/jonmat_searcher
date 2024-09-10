const express = require('express');
const path = require('path'); // 파일 경로 조작을 위한 모듈
const app = express();

const PORT = process.env.PORT || 5500;

// 정적 파일을 제공할 디렉토리 설정 (예: search_window 디렉토리)
app.use(express.static(path.join(__dirname, 'search_window')));

// 기본 라우트에서 index.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'search_window', 'jonmat.html')); // 메인 HTML 파일 제공
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const app = express();
const request = require('request');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

var client_id = 'Vu2aqGX7dU78M70tu32Z';
var client_secret = 'eiz0z8DTmY';
const KAKAO_API_KEY = '3201548e6d7f4f17944721862a5549cc';

// 모든 도메인에서 요청을 허용
app.use(cors());
app.use(express.json());


// 카카오맵 장소 검색 API를 사용해 검색어에 해당하는 장소 가져오기
app.get('/proxy/kakao/searchPlace', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).send('검색어가 제공되지 않았습니다.');
    }

    console.log(`카카오맵에서 검색 요청을 받았습니다. 검색어: ${query}`);

    const kakaoSearchUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(kakaoSearchUrl, {
            headers: {
                Authorization: `KakaoAK ${KAKAO_API_KEY}`
            }                   // 헤더에 KakaoAK + API 키
        });

        // API 응답 처리
        if (response.status === 200 && response.data.documents.length > 0) {
            const place = response.data.documents[0];  // 첫 번째 검색 결과 선택
            const placeId = place.id;
            console.log(`Place ID: ${placeId}`);
            res.json({ placeId, placeName: place.place_name });
        } else {
            console.error('검색 결과가 없습니다.');
            res.status(404).send('검색 결과가 없습니다.');
        }
    } catch (error) {
        console.error('Place 검색 중 오류 발생:', error.message);
        res.status(500).send('카카오 API 요청 중 오류가 발생했습니다.');
    }
});

/*
// Place ID로 카카오맵 댓글 가져오기
app.get('/proxy/kakao/comments', async (req, res) => {
    const placeId = req.query.placeId;
    if (!placeId) {
        return res.status(400).send('Place ID가 제공되지 않았습니다.');
    }

    console.log(`Place ID: ${placeId}에 대한 댓글 요청을 받았습니다.`);
    const kakaoApiUrl = `https://place.map.kakao.com/commentlist/v/${placeId}`;

    try {
        const response = await axios.get(kakaoApiUrl);
        if (response.status === 200) {
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
            res.send(response.data);
        } else {
            res.status(response.status).send('카카오 API에서 데이터를 가져오는 데 실패했습니다.');
        }
    } catch (error) {
        console.error('카카오 API 요청 중 오류 발생:', error.message);
        res.status(500).send('카카오 API 요청 중 오류가 발생했습니다.');
    }
});
*/
// Place ID로 카카오맵 댓글 및 별점 가져오기
app.get('/proxy/kakao/comments', async (req, res) => {
    const placeId = req.query.placeId;
    if (!placeId) {
        return res.status(400).send('Place ID가 제공되지 않았습니다.');
    }

    console.log(`Place ID: ${placeId}에 대한 댓글 및 별점 요청을 받았습니다.`);
    const kakaoApiUrl = `https://place.map.kakao.com/commentlist/v/${placeId}`;

    try {
        const response = await axios.get(kakaoApiUrl);
        if (response.status === 200) {
            const commentData = response.data.comment;

            if (commentData) {
                // 별점 계산 (scoresum / scorecnt)
                const rating = commentData.scoresum / commentData.scorecnt || 0;

                // 댓글 데이터와 함께 별점 데이터도 전송
                res.setHeader('Content-Type', 'application/json;charset=utf-8');
                res.json({
                    comments: commentData.list || [],  // 댓글 리스트
                    rating: rating.toFixed(2),          // 평균 별점
                    scoreCount: commentData.scorecnt    // 리뷰 개수
                });
            } else {
                res.status(404).send('Comment 데이터가 없습니다.');
            }
        } else {
            res.status(response.status).send('카카오 API에서 데이터를 가져오는 데 실패했습니다.');
        }
    } catch (error) {
        console.error('카카오 API 요청 중 오류 발생:', error.message);
        res.status(500).send('카카오 API 요청 중 오류가 발생했습니다.');
    }
});


// Place ID로 카카오맵 이미지 가져오기
app.get('/proxy/kakao/photolist', async (req, res) => {
    const placeId = req.query.placeId;
    if (!placeId) {
        return res.status(400).send('Place ID가 제공되지 않았습니다.');
    }

    console.log(`Place ID: ${placeId}에 대한 이미지 요청을 받았습니다.`);
    const kakaoApiUrl = `https://place.map.kakao.com/photolist/v/${placeId}`;

    try {
        const response = await axios.get(kakaoApiUrl);
        if (response.status === 200) {
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
            res.send(response.data);
        } else {
            res.status(response.status).send('카카오 API에서 데이터를 가져오는 데 실패했습니다.');
        }
    } catch (error) {
        console.error('카카오 API 요청 중 오류 발생:', error.message);
        res.status(500).send('카카오 API 요청 중 오류가 발생했습니다.');
    }
});



// 블로그 검색 api
app.get('/search/blog', function (req, res) {
    var api_url = 'https://openapi.naver.com/v1/search/blog?query=' + encodeURI(req.query.query);
    var options = {
        url: api_url,
        headers: {
            'X-Naver-Client-Id':client_id, 
            'X-Naver-Client-Secret': client_secret}
     };
    request.get(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
        res.end(body);
      } else {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    });
 });



 // 이미지 검색 API 라우트
app.get('/search/image', function (req, res) {
    var api_url = 'https://openapi.naver.com/v1/search/image?query=' + encodeURI(req.query.query);
    var options = {
        url: api_url,
        headers: {
            'X-Naver-Client-Id': client_id,
            'X-Naver-Client-Secret': client_secret
        }
    };
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
            res.end(body);
        } else {
            res.status(response.statusCode).end();
            console.log('error = ' + response.statusCode);
        }
    });
});


const PORT = process.env.PORT || 5500;
app.listen(PORT, function () {
    console.log('Server is running at http://127.0.0.1:5500');
 });


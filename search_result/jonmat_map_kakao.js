window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const placeId = urlParams.get('placeId') || 'ChIJN1t_tDeuEmsRUsoyG83frY4';
    
    const searchQueryElement = document.getElementById('searchQuery');

    if (searchQueryElement && query) {
        searchQueryElement.innerText = `#${query}의 리뷰를 보여드릴게요! ฅ₍ˆ- ̫-ˆ₎‧˚🐾`;
        
        /* 순서 바꾸면 개큰지랄남 */
        fetchPlaceId(query);  // 검색어로 Place ID 요청

        fetchSearchResults(query)    // 네이버 리뷰 가져옴
        fetchPlaceIdGoogle(query)    // 구글 리뷰 가져옴

        startMapSearch(query);
    } else {
        console.error("Query parameter is missing");
    }
}

// Place ID 가져오기
async function fetchPlaceId(query) {
    try {
        const response = await fetch(`http://localhost:5500/proxy/kakao/searchPlace?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.placeId) {
            console.log(`Found Place ID: ${data.placeId}`);
            fetchComments(data.placeId);  // Place ID로 댓글 요청
            fetchPlacePhotos(data.placeId); // Place ID로 사진 요청
        } else {
            console.error('Place ID를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error fetching Place ID:', error);
    }
}

// Place ID로 댓글 및 별점 가져오기
async function fetchComments(placeId) {
    try {
        console.log(`Fetching comments and rating for Place ID: ${placeId}...`);
        const response = await fetch(`http://localhost:5500/proxy/kakao/comments?placeId=${placeId}`);
        const data = await response.json();

        const commentSection = document.getElementById('comment-section');
        const ratingDisplay = document.getElementById('ratingDisplay');

        if (!commentSection) {
            console.error("댓글을 표시할 'comment-section' 요소가 존재하지 않습니다.");
            return;
        }

        // 댓글 표시
        if (data.comments.length === 0) {
            commentSection.innerHTML = "<p>매장주 요청으로 후기가 제공되지 않는 장소이거나 리뷰가 없습니다.😢</p>";
        } else {
            data.comments.forEach(comment => {
                const reviewLink = `https://www.place.map.kakao.com/${placeId}`;
                const commentDiv = document.createElement('div');
                commentDiv.className = 'review-item';  // review-item 클래스 적용
                commentDiv.innerHTML = `
                    <strong>${comment.username} - ${comment.point} ★</strong><br><p>${comment.contents}</p>
                `;
                commentSection.appendChild(commentDiv);
            });
        }

        // 별점 표시
        if (ratingDisplay) {
            ratingDisplay.innerText = `⭐ 평균 별점: ${data.rating || 'N/A'}`;
        } else {
            console.error('Rating element not found in the DOM.');
        }

        console.log("Comments and rating successfully displayed on the page.");
    } catch (error) {
        console.error('Error fetching comments and rating:', error);
        const commentSection = document.getElementById('comment-section');
        if (commentSection) {
            commentSection.innerHTML = '<p>매장주 요청으로 후기가 제공되지 않는 장소이거나 리뷰가 없습니다.😢</p>';
        }

    }
}

/*
function renderReviews(reviews) {
    const reviewsContainer = document.getElementById('comment-section'); // 리뷰를 표시할 HTML 요소

    // 기존 내용을 초기화
    reviewsContainer.innerHTML = '';

    // 리뷰가 없는 경우 처리
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p>리뷰가 없습니다.</p>';
        return;
    }

    // 리뷰 데이터를 순회하며 HTML로 변환하여 삽입
    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.classList.add('review');

        const reviewLink = `https://www.place.map.kakao.com/${review.place_id}`;
        reviewElement.innerHTML = 
            `<a href="${reviewLink}" target="_blank"><strong>${review.author_name}</strong> - ${review.rating} ★<br><p>${review.text}</p></a>`;
            //`<p><strong>Date:</strong> ${new Date(review.time * 1000).toLocaleDateString()}</p>`;

        // 리뷰 컨테이너에 추가
        reviewsContainer.appendChild(reviewElement);
    });
}
*/
// Place ID로 사진 가져오기 (placeId 인자를 받음)
async function fetchPlacePhotos(placeId) {
    try {
        console.log(`Fetching photos for Place ID: ${placeId}...`);
        const response = await fetch(`http://localhost:5500/proxy/kakao/photolist?placeId=${placeId}`);
        const data = await response.json();

        // 응답 데이터 구조 확인을 위해 콘솔 출력
        console.log('API 응답 데이터:', data);

        const photosContainer = document.getElementById('photos-container');
        if (!photosContainer) {
            console.error("사진을 표시할 'photos-container' 요소가 존재하지 않습니다.");
            return;
        }

        // 기존 사진 내용을 초기화
        photosContainer.innerHTML = '';

        // 사진 리스트가 있는지 확인
        if (data.photoViewer && data.photoViewer.list && data.photoViewer.list.length > 0) {
            // 이미지 URL을 사용하여 사진을 렌더링
            data.photoViewer.list.forEach(photo => {
                const img = document.createElement('img');
                img.src = photo.url;  // 각 사진의 URL
                img.alt = `사진`;
                img.classList.add('place-photo');  // 클래스 추가로 스타일 적용
                photosContainer.appendChild(img);
            });
            console.log("사진이 성공적으로 표시되었습니다.");
        } else {
            photosContainer.innerHTML = '<p>사진이 제공되지 않는 장소입니다.</p>';
            console.warn("장소에 사진이 없습니다.");
        }
    } catch (error) {
        console.error('Error fetching photos:', error);
        const photosContainer = document.getElementById('photos-container');
        if (photosContainer) {
            photosContainer.innerHTML = '<p>사진 데이터를 가져오는데 오류가 발생했습니다.</p>';
        }
    }
}




// 구글 리뷰 가져오기 위한 Place ID 검색
function fetchPlaceIdGoogle(query) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    const request = {
        query: query,
        fields: ['place_id']
    };

    service.textSearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const placeId = results[0].place_id;
            console.log(`Found Google Place ID: ${placeId}`); // Place ID가 제대로 나오는지 확인
            fetchGoogleReviews(placeId); // Place ID로 리뷰 가져오기
        } else {
            console.error('Place search failed:', status);
        }
    });
}

// 구글 리뷰 가져오기
function fetchGoogleReviews(placeId) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const request = {
        placeId: placeId,
        fields: ['name', 'rating', 'reviews', 'url']
    };

    
    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log('Google Place Details:', place); // 전체 place 데이터를 확인

            if (place.reviews.length > 0) {
                console.log('Google Reviews:', place.reviews); // 리뷰 데이터를 확인
                displaySearchResults(place.reviews, "google", true); // 리뷰 데이터 표시
            } else {
                document.getElementById('.first.s ul').innerHTML = '<li>리뷰가 없습니다.</li>';
            }
        } else {
            console.error("Failed to retrieve Google reviews:", status);
        }
    });
}


// 예시로 네이버 리뷰를 호출하는 부분
function fetchSearchResults(query) {
    fetch(`http://localhost:5500/search/blog?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log("Naver API results:", data);
            if (data.items) {
                displaySearchResults(data.items.slice(0, 4), "naver", true);  // 상단에 3개의 네이버 리뷰 표시
                
            }else {
                console.error("네이버 API 응답에서 리뷰를 찾을 수 없습니다.");
            }
        })
        .catch(error => console.error('Error:', error));
}


function displaySearchResults(items, source, isUpperList) {
    const upperList = document.querySelector('.first.s ul'); // 상단 리스트 

    if (isUpperList) {
        // 상단 리스트에 리뷰 4개를 추가
        items.slice(0, 4).forEach(item => {
            const li = document.createElement('li');

            if (source === "naver") {
                // 네이버 리뷰 처리
                li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
            } else if (source === "google") {
                // 구글 리뷰 처리
                const reviewLink = `https://www.google.com/maps/place/?q=place_id:${item.place_id}`;
                const reviewText = item.text ? item.text.substring(0, 30) : '리뷰 내용 없음';
                li.innerHTML = `<a href="${reviewLink}" target="_blank">${reviewText}...</a>`;
            }

            upperList.appendChild(li);
        });
    }
}



// 마커를 클릭하면 장소명을 표출할 인포윈도우 입니다
var infowindow = new kakao.maps.InfoWindow({zIndex:1});

var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
        level: 3 // 지도의 확대 레벨
    };  

// 지도를 생성합니다    
var map = new kakao.maps.Map(mapContainer, mapOption); 

// 장소 검색 객체를 생성합니다
var ps = new kakao.maps.services.Places(); 

function startMapSearch(query) {
    var ps = new kakao.maps.services.Places(); 
    ps.keywordSearch(query, placesSearchCB); 
}

// 키워드 검색 완료 시 호출되는 콜백함수 입니다
function placesSearchCB (data, status, pagination) {
    // 검색 상태 출력
    console.log("Search status:", status);
    
    // 검색 결과의 길이 출력
    console.log("Data length:", data.length);

    if (status === kakao.maps.services.Status.OK) {

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        var bounds = new kakao.maps.LatLngBounds();

        for (var i=0; i<1; i++) {
            console.log("Place found:", data[i].place_name); // 각 장소 이름 출력
            displayMarker(data[i]);    
            bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
        }       

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
        map.setBounds(bounds);
    } 
    else {
        // 검색 결과가 없거나 검색에 실패했을 때의 처리
        console.error("No results found or search failed:", status);
    }
}


// 지도에 마커를 표시하는 함수입니다
function displayMarker(place) {
    
    // 마커를 생성하고 지도에 표시합니다
    var marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(place.y, place.x) 
    });

    // 마커에 클릭이벤트를 등록합니다
    kakao.maps.event.addListener(marker, 'click', function() {
        // 마커를 클릭하면 장소명이 인포윈도우에 표출됩니다
        infowindow.setContent('<div style="padding:5px;font-size:12px;">' + place.place_name + '</div>');
        infowindow.open(map, marker);
    });
}

var button = document.querySelector('.naver_button');
button.addEventListener("click", function(event){
    event.preventDefault();

    // 현재 URL에서 쿼리 파라미터를 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    // 새로운 URL에 쿼리 파라미터 추가
    const url_naver = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map.html");
    url_naver.searchParams.append('query', query);

    // 새로운 URL로 이동
    window.location.href = url_naver;
});

var button2 = document.querySelector('.google_button');
button2.addEventListener("click", function(event){
    event.preventDefault();

   // 현재 URL에서 쿼리 파라미터를 가져오기
   const urlParams = new URLSearchParams(window.location.search);
   const query = urlParams.get('query');

   // 새로운 URL에 쿼리 파라미터 추가
   const url_google = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map_google.html");
   url_google.searchParams.append('query', query);

   // 새로운 URL로 이동
   window.location.href = url_google;
});

var button3 = document.querySelector('.kakao_button');
button3.addEventListener("click", function(event){
    event.preventDefault();
    
    // 현재 URL에서 쿼리 파라미터를 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    // 새로운 URL에 쿼리 파라미터 추가
    const url_kakao = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map_kakao.html");
    url_kakao.searchParams.append('query', query);

    // 새로운 URL로 이동
    window.location.href = url_kakao;
});
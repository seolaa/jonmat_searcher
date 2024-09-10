<<<<<<< HEAD
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const placeId = urlParams.get('placeId') || 'ChIJN1t_tDeuEmsRUsoyG83frY4';

    if (query) {
        document.getElementById('searchQuery').innerText = `#${query}의 리뷰를 보여드릴게요! ฅ₍ˆ- ̫-ˆ₎‧˚🐾`;

        // Fetch Naver reviews
        fetchSearchResults(query);
        
        // Fetch Google reviews
        fetchPlaceId(query);
        
        startMapSearch(query);
    } else {
        console.error("Query parameter is missing");
    }
};

// Fetch the search results from the Node.js server (Naver)
function fetchSearchResults(query) {
    fetch(`http://localhost:5500/search/blog?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log("Naver API results:", data);
            if (data.items) {
                displaySearchResults(data.items.slice(0, 8), "naver", true); // 네이버 리뷰 상단 8개 표시
            }
        })
        .catch(error => console.error('Error:', error));
}

// Fetch Google reviews using Place ID
function fetchPlaceId(query) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
        query: query,
        fields: ['place_id']
    };
    
    service.textSearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const placeId = results[0].place_id;
            fetchGoogleReviews(placeId); // place_id를 이용해 리뷰를 가져오는 함수 호출
        } else {
            console.error('Place search failed:', status);
        }
    });
}

function displaySearchResults(items, source, isUpperList) {
    const upperList = document.querySelector('.first.s ul'); // 상단 리스트
    const resultsElement = document.getElementById('reviews-list'); // 하단 결과 리스트

    if (source === "naver") {
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
            upperList.appendChild(li);
        });
    } else if (source === "google") {
        // 구글 리뷰 하단에 표시
        items.forEach(review => {
            const li = document.createElement('li');
            const reviewLink = `https://www.google.com/maps/place/?q=place_id:${review.place_id}`;
            li.innerHTML = `<a href="${reviewLink}" target="_blank"><strong>${review.author_name}</strong> - ${review.rating} ★<br><p>${review.text}</p></a>`;
            resultsElement.appendChild(li);
        });
    }
}

function fetchGoogleReviews(placeId) {
    var service = new google.maps.places.PlacesService(document.createElement('div'));
    var request = {
        placeId: placeId,
        fields: ['name', 'rating', 'reviews', 'url', 'photos']  // 장소의 사진을 가져오기 위해 photos 필드 추가
    };

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var reviewsList = document.getElementById('reviews-list');
            reviewsList.innerHTML = ''; // 기존 리뷰 지우기

            // 장소의 사진을 가로 방향으로 한 줄에 표시
            if (place.photos && place.photos.length > 0) {
                const photosContainer = document.createElement('div');
                photosContainer.classList.add('photos-container');  // 클래스 추가

                place.photos.forEach((photo) => {
                    const placePhotoUrl = photo.getUrl({ maxWidth: 200, maxHeight: 150 }); // 각 사진의 최대 크기 설정
                    const placeImg = document.createElement('img');
                    placeImg.src = placePhotoUrl;
                    placeImg.alt = "Place Image";
                    placeImg.classList.add('place-photo');  // 클래스 추가
                    photosContainer.appendChild(placeImg);
                });

                reviewsList.appendChild(photosContainer);
            }

             // 평균 별점을 사진 밑에 표시
             const ratingElement = document.createElement('div');
             ratingElement.id = 'average-rating';
             ratingElement.innerText = `⭐ 평균 별점: ${place.rating || 'N/A'}`;
             reviewsList.appendChild(ratingElement);

            // 구글 리뷰 하단에 모두 표시
            if (place.reviews && place.reviews.length > 0) {
            const googleReviews = place.reviews.map(review => ({
                ...review,
                place_id: placeId
            }));
            displaySearchResults(googleReviews, "google", false);
            } else {
                reviewsList.innerHTML = '<li>리뷰가 없습니다.</li>';
            }
        } else {
        console.error("Failed to retrieve reviews:", status);
        }
    });
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


/* 버튼 */
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
=======
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const placeId = urlParams.get('placeId') || 'ChIJN1t_tDeuEmsRUsoyG83frY4';

    if (query) {
        document.getElementById('searchQuery').innerText = `#${query}의 리뷰를 보여드릴게요! ฅ₍ˆ- ̫-ˆ₎‧˚🐾`;

        // Fetch Naver reviews
        fetchSearchResults(query);
        
        // Fetch Google reviews
        fetchPlaceId(query);
        
        startMapSearch(query);
    } else {
        console.error("Query parameter is missing");
    }
};

// Fetch the search results from the Node.js server (Naver)
function fetchSearchResults(query) {
    fetch(`http://localhost:5500/search/blog?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log("Naver API results:", data);
            if (data.items) {
                displaySearchResults(data.items.slice(0, 8), "naver", true); // 네이버 리뷰 상단 8개 표시
            }
        })
        .catch(error => console.error('Error:', error));
}

// Fetch Google reviews using Place ID
function fetchPlaceId(query) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    const request = {
        query: query,
        fields: ['place_id']
    };
    
    service.textSearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const placeId = results[0].place_id;
            fetchGoogleReviews(placeId); // place_id를 이용해 리뷰를 가져오는 함수 호출
        } else {
            console.error('Place search failed:', status);
        }
    });
}

function displaySearchResults(items, source, isUpperList) {
    const upperList = document.querySelector('.first.s ul'); // 상단 리스트
    const resultsElement = document.getElementById('reviews-list'); // 하단 결과 리스트

    if (source === "naver") {
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
            upperList.appendChild(li);
        });
    } else if (source === "google") {
        // 구글 리뷰 하단에 표시
        items.forEach(review => {
            const li = document.createElement('li');
            const reviewLink = `https://www.google.com/maps/place/?q=place_id:${review.place_id}`;
            li.innerHTML = `<a href="${reviewLink}" target="_blank"><strong>${review.author_name}</strong> - ${review.rating} ★<br><p>${review.text}</p></a>`;
            resultsElement.appendChild(li);
        });
    }
}

function fetchGoogleReviews(placeId) {
    var service = new google.maps.places.PlacesService(document.createElement('div'));
    var request = {
        placeId: placeId,
        fields: ['name', 'rating', 'reviews', 'url', 'photos']  // 장소의 사진을 가져오기 위해 photos 필드 추가
    };

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var reviewsList = document.getElementById('reviews-list');
            reviewsList.innerHTML = ''; // 기존 리뷰 지우기

            // 장소의 사진을 가로 방향으로 한 줄에 표시
            if (place.photos && place.photos.length > 0) {
                const photosContainer = document.createElement('div');
                photosContainer.classList.add('photos-container');  // 클래스 추가

                place.photos.forEach((photo) => {
                    const placePhotoUrl = photo.getUrl({ maxWidth: 200, maxHeight: 150 }); // 각 사진의 최대 크기 설정
                    const placeImg = document.createElement('img');
                    placeImg.src = placePhotoUrl;
                    placeImg.alt = "Place Image";
                    placeImg.classList.add('place-photo');  // 클래스 추가
                    photosContainer.appendChild(placeImg);
                });

                reviewsList.appendChild(photosContainer);
            }

             // 평균 별점을 사진 밑에 표시
             const ratingElement = document.createElement('div');
             ratingElement.id = 'average-rating';
             ratingElement.innerText = `⭐ 평균 별점: ${place.rating || 'N/A'}`;
             reviewsList.appendChild(ratingElement);

            // 구글 리뷰 하단에 모두 표시
            if (place.reviews && place.reviews.length > 0) {
            const googleReviews = place.reviews.map(review => ({
                ...review,
                place_id: placeId
            }));
            displaySearchResults(googleReviews, "google", false);
            } else {
                reviewsList.innerHTML = '<li>리뷰가 없습니다.</li>';
            }
        } else {
        console.error("Failed to retrieve reviews:", status);
        }
    });
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


/* 버튼 */
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
>>>>>>> f8bfd2b (Initial commit)

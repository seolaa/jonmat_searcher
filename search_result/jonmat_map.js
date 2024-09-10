<<<<<<< HEAD
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const placeId = urlParams.get('placeId') || 'ChIJN1t_tDeuEmsRUsoyG83frY4';

    if (query) {
        document.getElementById('searchQuery').innerText = `#${query}의 리뷰를 보여드릴게요! ฅ₍ˆ- ̫-ˆ₎‧˚🐾`;

        // 네이버 리뷰 가져오기
        fetchSearchResults(query);

        // 네이버 이미지 검색 결과 가져오기
        fetchImageResults(query);
        
        // 구글 리뷰 가져오기
        fetchPlaceId(query);
        
        startMapSearch(query);
    } else {
        console.error("Query parameter is missing");
    }
};

// 네이버 이미지 검색 API를 사용하여 이미지 검색 결과를 가져오는 함수
function fetchImageResults(query) {
    const url = `http://localhost:5500/search/image?query=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data && data.items) displayImageResults(data.items);
            else throw new Error('Invalid data structure');
        })
        .catch(error => {
            console.error('Error fetching images:', error);
            document.getElementById('image-results').innerHTML = '<p>이미지를 불러오는 중 문제가 발생했습니다.</p>';
        });
}

// 이미지 결과를 표시하는 함수
function displayImageResults(images) {
    const imageResultsDiv = document.getElementById('image-results');
    imageResultsDiv.innerHTML = '';

    if (Array.isArray(images)) {
        const photosContainer = document.createElement('div');
        photosContainer.classList.add('photos-container');

        images.forEach(image => {
            if (image.thumbnail) {
                const imgElement = document.createElement('img');
                imgElement.src = image.thumbnail;
                imgElement.classList.add('place-photo');
                photosContainer.appendChild(imgElement);
            }
        });

        imageResultsDiv.appendChild(photosContainer);
    } else {
        console.error("Expected an array of images, but got:", images);
        imageResultsDiv.innerHTML = '<p>이미지를 불러올 수 없습니다.</p>';
    }
}


// 예시로 네이버와 구글 리뷰를 모두 호출하는 부분
function fetchSearchResults(query) {
    fetch(`http://localhost:5500/search/blog?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log("Naver API results:", data);
            if (data.items) {
                displaySearchResults(data.items, "naver", true);  // 상단에 3개의 네이버 리뷰 표시
                displaySearchResults(data.items, "naver", false); // 하단에 나머지 네이버 리뷰 표시
            }else {
                console.error("네이버 API 응답에서 리뷰를 찾을 수 없습니다.");
            }
        })
        .catch(error => console.error('Error:', error));
}

// 구글 리뷰 가져오기 위한 Place ID 검색
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

    if (isUpperList) {
        // 상단 리스트에 리뷰 4개를 추가
        items.slice(0, 4).forEach(item => {
            const li = document.createElement('li');
            if (source === "naver") {
                li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
            } else if (source === "google") {
                const reviewLink = `https://www.google.com/maps/place/?q=place_id:${item.place_id}`;
                li.innerHTML = `<a href="${reviewLink}" target="_blank">${item.text.substring(0, 30)}...</a>`;
            }
            upperList.appendChild(li);
        });
    } else {
        // 하단 리스트에 상단에 표시된 3개 이후의 리뷰를 추가
        items.slice(4).forEach(item => {
            const li = document.createElement('li');
            if (source === "naver") {
                li.innerHTML = `<a href="${item.link}" target="_blank"><strong>${item.bloggername}</strong> - ${item.title}</a><br><p>${item.description}</p>`;;
                
            } else if (source === "google") {
                const reviewLink = `https://www.google.com/maps/place/?q=place_id:${item.place_id}`;
                li.innerHTML = `<a href="${reviewLink}" target="_blank">${item.text.substring(0, 30)}...</a>`;
            }
            resultsElement.appendChild(li);
        });
    }
}

// 구글 리뷰 가져오기
function fetchGoogleReviews(placeId) {
    var service = new google.maps.places.PlacesService(document.createElement('div'));
    var request = {
        placeId: placeId,
        fields: ['name', 'rating', 'reviews', 'url']
    };

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            document.getElementById('average-rating').innerText = `네이버는 평균 별점이 제공되지 않아요 😢`;

            if (place.reviews && place.reviews.length > 0) {
                displaySearchResults(place.reviews, "google", true);  // 상단에 3개의 구글 리뷰 표시
            } else {
                document.getElementById('reviews-list').innerHTML = '<li>리뷰가 없습니다.</li>';
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

   const urlParams = new URLSearchParams(window.location.search);
   const query = urlParams.get('query');

   const url_google = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map_google.html");
   url_google.searchParams.append('query', query);

   window.location.href = url_google;
});

var button3 = document.querySelector('.kakao_button');
button3.addEventListener("click", function(event){
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    const url_kakao = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map_kakao.html");
    url_kakao.searchParams.append('query', query);

    window.location.href = url_kakao;
});
=======
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const placeId = urlParams.get('placeId') || 'ChIJN1t_tDeuEmsRUsoyG83frY4';

    if (query) {
        document.getElementById('searchQuery').innerText = `#${query}의 리뷰를 보여드릴게요! ฅ₍ˆ- ̫-ˆ₎‧˚🐾`;

        // 네이버 리뷰 가져오기
        fetchSearchResults(query);

        // 네이버 이미지 검색 결과 가져오기
        fetchImageResults(query);
        
        // 구글 리뷰 가져오기
        fetchPlaceId(query);
        
        startMapSearch(query);
    } else {
        console.error("Query parameter is missing");
    }
};

// 네이버 이미지 검색 API를 사용하여 이미지 검색 결과를 가져오는 함수
function fetchImageResults(query) {
    const url = `http://localhost:5500/search/image?query=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data && data.items) displayImageResults(data.items);
            else throw new Error('Invalid data structure');
        })
        .catch(error => {
            console.error('Error fetching images:', error);
            document.getElementById('image-results').innerHTML = '<p>이미지를 불러오는 중 문제가 발생했습니다.</p>';
        });
}

// 이미지 결과를 표시하는 함수
function displayImageResults(images) {
    const imageResultsDiv = document.getElementById('image-results');
    imageResultsDiv.innerHTML = '';

    if (Array.isArray(images)) {
        const photosContainer = document.createElement('div');
        photosContainer.classList.add('photos-container');

        images.forEach(image => {
            if (image.thumbnail) {
                const imgElement = document.createElement('img');
                imgElement.src = image.thumbnail;
                imgElement.classList.add('place-photo');
                photosContainer.appendChild(imgElement);
            }
        });

        imageResultsDiv.appendChild(photosContainer);
    } else {
        console.error("Expected an array of images, but got:", images);
        imageResultsDiv.innerHTML = '<p>이미지를 불러올 수 없습니다.</p>';
    }
}


// 예시로 네이버와 구글 리뷰를 모두 호출하는 부분
function fetchSearchResults(query) {
    fetch(`http://localhost:5500/search/blog?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log("Naver API results:", data);
            if (data.items) {
                displaySearchResults(data.items, "naver", true);  // 상단에 3개의 네이버 리뷰 표시
                displaySearchResults(data.items, "naver", false); // 하단에 나머지 네이버 리뷰 표시
            }else {
                console.error("네이버 API 응답에서 리뷰를 찾을 수 없습니다.");
            }
        })
        .catch(error => console.error('Error:', error));
}

// 구글 리뷰 가져오기 위한 Place ID 검색
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

    if (isUpperList) {
        // 상단 리스트에 리뷰 4개를 추가
        items.slice(0, 4).forEach(item => {
            const li = document.createElement('li');
            if (source === "naver") {
                li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
            } else if (source === "google") {
                const reviewLink = `https://www.google.com/maps/place/?q=place_id:${item.place_id}`;
                li.innerHTML = `<a href="${reviewLink}" target="_blank">${item.text.substring(0, 30)}...</a>`;
            }
            upperList.appendChild(li);
        });
    } else {
        // 하단 리스트에 상단에 표시된 3개 이후의 리뷰를 추가
        items.slice(4).forEach(item => {
            const li = document.createElement('li');
            if (source === "naver") {
                li.innerHTML = `<a href="${item.link}" target="_blank"><strong>${item.bloggername}</strong> - ${item.title}</a><br><p>${item.description}</p>`;;
                
            } else if (source === "google") {
                const reviewLink = `https://www.google.com/maps/place/?q=place_id:${item.place_id}`;
                li.innerHTML = `<a href="${reviewLink}" target="_blank">${item.text.substring(0, 30)}...</a>`;
            }
            resultsElement.appendChild(li);
        });
    }
}

// 구글 리뷰 가져오기
function fetchGoogleReviews(placeId) {
    var service = new google.maps.places.PlacesService(document.createElement('div'));
    var request = {
        placeId: placeId,
        fields: ['name', 'rating', 'reviews', 'url']
    };

    service.getDetails(request, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            document.getElementById('average-rating').innerText = `네이버는 평균 별점이 제공되지 않아요 😢`;

            if (place.reviews && place.reviews.length > 0) {
                displaySearchResults(place.reviews, "google", true);  // 상단에 3개의 구글 리뷰 표시
            } else {
                document.getElementById('reviews-list').innerHTML = '<li>리뷰가 없습니다.</li>';
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

   const urlParams = new URLSearchParams(window.location.search);
   const query = urlParams.get('query');

   const url_google = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map_google.html");
   url_google.searchParams.append('query', query);

   window.location.href = url_google;
});

var button3 = document.querySelector('.kakao_button');
button3.addEventListener("click", function(event){
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');

    const url_kakao = new URL("http://127.0.0.1:5500/fe_practice/jonmat_searcher/search_result/jonmat_map_kakao.html");
    url_kakao.searchParams.append('query', query);

    window.location.href = url_kakao;
});
>>>>>>> f8bfd2b (Initial commit)

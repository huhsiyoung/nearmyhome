let markersByType = {
    CulturalPlace: [],
    Hospital: [],
    School: [],
    BibGourmand: [],
    LargeRetailStore: [],
    GasStation: [],
    Park: [],
    SubwayStation: [],
    EvChargingStation: [],
    ExcellentRestaurant: [],
    Home: []
};

var map = new naver.maps.Map("map", {
    center: new naver.maps.LatLng(37.534726, 126.979900),
    zoom: 13,
    minZoom: 12,
    zoomControl: true,
    zoomControlOptions: {
        position: naver.maps.Position.RIGHT_TOP
    }
});

var infoWindow = new naver.maps.InfoWindow({
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    disableAnchor: false,
    anchorSkew: false
});

map.setCursor('pointer');

function searchCoordinateToAddress(latlng) {
    naver.maps.Service.reverseGeocode({
        coords: latlng,
        orders: [
            naver.maps.Service.OrderType.ADDR,
            naver.maps.Service.OrderType.ROAD_ADDR
        ].join(',')
    }, function (status, response) {
        if (status === naver.maps.Service.Status.ERROR) {
            return alert('Something Wrong!');
        }

        var items = response.v2.results,
            address = '',
            htmlAddresses = [];

        for (var i = 0, ii = items.length, item, addrType; i < ii; i++) {
            item = items[i];
            address = makeAddress(item) || '';
            addrType = item.name === 'roadaddr' ? '[도로명 주소]' : '[지번 주소]';

            htmlAddresses.push(addrType + ' ' + address);
        }

        var contentHtml = [
            '<div id="infoWindowContent" style="padding: 15px; min-width: 200px; line-height: 150%; ' +
            'font-family: Nanum Gothic, sans-serif; font-size: 15px;">',
            '<div style="margin-bottom:8px;"><strong>이 위치로 검색하기</strong> ',
            '<button id="infoWindowSearchBtn" ' +
            'style="align-content: center; background: #E5E5E5; border: none; border-radius: 10px; ' +
            'margin-left: 5px; padding: 5px 8px; font-size: 15px">검색</button> ',
            '<button id="infoWindowCloseBtn" ' +
            'style="align-content: center; background: #E5E5E5; border: none; border-radius: 10px; ' +
            'margin-left: 5px; padding: 5px 8px; font-size: 15px">닫기</button></div>',
            '<div id="windowAddress">' + address + '</div>',
            '</div>'
        ].join('\n');

        infoWindow.setContent(contentHtml);
        infoWindow.open(map, latlng);

        const observer = new MutationObserver(() => {
            const searchBtn = document.getElementById('infoWindowSearchBtn');
            const addressElem = document.getElementById('windowAddress');
            const closeBtn = document.getElementById('infoWindowCloseBtn');

            if (searchBtn && addressElem) {
                searchBtn.addEventListener('click', () => {
                    const addressValue = addressElem.innerText;
                    infoWindow.close();
                    searchAddressToCoordinate(addressValue);
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    infoWindow.close();
                });
            }

            observer.disconnect();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function searchAddressToCoordinate(address) {
    document.getElementById('info-box').style.display = 'none';

    naver.maps.Service.geocode({
        query: address
    }, function(status, response) {
        if (status === naver.maps.Service.Status.ERROR) {
            return alert('지도 서비스 에러에요. 😢');
        }

        if (response.v2.meta.totalCount === 0) {
            return alert('주소로 검색한 결과가 없어요. 😢');
        }

        var htmlAddresses = [],
            item = response.v2.addresses[0],
            point = new naver.maps.Point(item.x, item.y);
            let district = item.addressElements[1].longName;

        if (item.roadAddress) {
            htmlAddresses.push(item.roadAddress);
        }

        if (item.jibunAddress) {
            htmlAddresses.push(item.jibunAddress);
        }

        if (
            !(item.roadAddress || '').includes('서울특별시') &&
            !(item.jibunAddress || '').includes('서울특별시')
        ) {
            return alert('서울에 있는 주소만 검색할 수 있어요. 😢')
        }

        sendSearchRequest(item, district);

        map.setCenter(point);

        map.setOptions('zoom', 14)
    });
}

async function sendSearchRequest(item, dist) {
    try {
        const latitude = encodeURIComponent(item.y);
        const longitude = encodeURIComponent(item.x);
        const district = encodeURIComponent(dist);

        const response = await fetch(`/search?latitude=${latitude}&longitude=${longitude}&district=${district}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        clearMarkersByType();

        data.forEach(place => {
            const markerPlaceType = place.place_type;
            const placeMarkerUrl = setPlaceMarkerUrl(markerPlaceType);

            const placeMarker = new naver.maps.Marker({
                position: new naver.maps.LatLng(place.latitude, place.longitude),
                map: map,
                icon: {
                    content: `
                        <div style="display: flex; flex-direction: column; align-items: center; 
                        -webkit-user-drag: none; user-select: none;">
                            <img src="${placeMarkerUrl}" style="width: 45px; height: 45px;" alt="마커" />
                            <div class="marker-label">${place.name}</div>
                        </div>`,
                    size: new naver.maps.Size(45, 45),
                    anchor: new naver.maps.Point(26, 45)
                }
            });

            markersByType[markerPlaceType].push(placeMarker);

            const isActive = document.querySelector
            (`.facility-button[data-type="${markerPlaceType}"]`)?.classList.contains('active');

            placeMarker.setVisible(!!isActive);

            const infoBox = document.getElementById('info-box');
            const infoBoxContent = document.getElementById('info-box-content');

            naver.maps.Event.addListener(placeMarker, 'click', function() {
                let htmlContent = '';

                if (place.name)
                    htmlContent
                        += `<p class="info-box-title"><strong>${place.name}</strong></p>`;

                if (place.address)
                    htmlContent
                        += `<p><img src="/img/info-box-icon/location.png"/> ${place.address}</p>`;

                if (place.phone)
                    htmlContent
                        += `<p><img src="/img/info-box-icon/phone.png"/> ${place.phone}</p>`;

                const typeIconMap = {
                    "CulturalPlace": "/img/info-box-icon/type.png",
                    "EvChargingStation": "/img/info-box-icon/charge.png",
                    "BibGourmand": "/img/info-box-icon/menu.png",
                    "School": "/img/info-box-icon/type.png",
                    "SubwayStation": "/img/info-box-icon/subway.png",
                    "ExcellentRestaurant": "/img/info-box-icon/menu.png",
                    "Hospital": "/img/info-box-icon/type.png"
                };

                if (place.subtype) {
                    const subtypeIcon = typeIconMap[place.place_type]
                    htmlContent += `<p><img src="${subtypeIcon}"/> ${place.subtype}</p>`;
                }

                if (place.hour) {
                    htmlContent += `<p><img src="/img/info-box-icon/time.png"/> ${place.hour}</p>`;
                }

                if (
                    typeof place.holiday === 'string'
                    && place.holiday.trim()
                    && place.holiday.trim().toLowerCase() !== 'null'
                ) {
                    htmlContent += `<p><img src="/img/info-box-icon/holiday.png"/> 휴무일 ${place.holiday}</p>`;
                }

                if (place.homepage) {
                    htmlContent += `<p><img src="/img/info-box-icon/homepage.png" /> <a href="${place.homepage}" target="_blank" rel="noopener noreferrer"> ${place.homepage}</a></p>`;
                }

                infoBoxContent.innerHTML = htmlContent;
                infoBox.style.display = 'block';
            });
        });

        const homeMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(item.y, item.x),
            map: map,
            icon: {
                url: '/img/place-marker/home-marker.png',
                size: new naver.maps.Size(70, 70),
                scaledSize: new naver.maps.Size(70, 70),
                anchor: new naver.maps.Point(15, 20),
                zIndex: 1000
            }
        });

        markersByType["Home"].push(homeMarker);

        await updateVisibleMarkers();
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateVisibleMarkers() {
    for (const type in markersByType) {
        markersByType[type].forEach(marker => {
            const isActive = type === "Home"
                ? true
                : document.querySelector(`.facility-button[data-type="${type}"]`)?.classList.contains('active');
            marker.setVisible(!!isActive);
        });
    }
}

// function updateVisibleMarkers() {
//     for (const type in markersByType) {
//         if (type === "Home") {
//             marker.setVisible(true);
//             continue;
//         }
//
//         markersByType[type].forEach(marker => {
//             const isActive = document.querySelector(`.facility-button[data-type="${type}"]`)?.classList.contains('active');
//             marker.setVisible(!!isActive);
//         });
//     }
// }

function initGeocoder() {
    map.addListener('click', function(e) {
        searchCoordinateToAddress(e.coord);
    });

    // $('#address').on('keydown', function(e) {
    //     var keyCode = e.which;
    //
    //     if (keyCode === 13) { // Enter Key
    //         searchAddressToCoordinate($('#address').val());
    //     }
    // });
}

function clearMarkersByType() {
    for (const type in markersByType) {
        markersByType[type].forEach(marker => marker.setMap(null));
        markersByType[type] = [];
    }
}

function setPlaceMarkerUrl(markerPlaceType) {
    const placeMap = new Map([
        ["CulturalPlace", "/img/place-marker/cultural-place.png"],
        ["Hospital", "/img/place-marker/hospital.png"],
        ["School", "/img/place-marker/school.png"],
        ["BibGourmand", "/img/place-marker/bib-gourmand.png"],
        ["LargeRetailStore", "/img/place-marker/store.png"],
        ["GasStation", "/img/place-marker/gas-station.png"],
        ["Park", "/img/place-marker/park.png"],
        ["SubwayStation", "/img/place-marker/subway-station.png"],
        ["EvChargingStation", "/img/place-marker/ev-charging-station.png"],
        ["ExcellentRestaurant", "/img/place-marker/restaurant.png"]
    ]);

    return placeMap.get(markerPlaceType);
}

function makeAddress(item) {
    if (!item) {
        return;
    }

    var name = item.name,
        region = item.region,
        land = item.land,
        isRoadAddress = name === 'roadaddr';

    var sido = '', sigugun = '', dongmyun = '', ri = '', rest = '';

    if (hasArea(region.area1)) {
        sido = region.area1.name;
    }

    if (hasArea(region.area2)) {
        sigugun = region.area2.name;
    }

    if (hasArea(region.area3)) {
        dongmyun = region.area3.name;
    }

    if (hasArea(region.area4)) {
        ri = region.area4.name;
    }

    if (land) {
        if (hasData(land.number1)) {
            if (hasData(land.type) && land.type === '2') {
                rest += '산';
            }

            rest += land.number1;

            if (hasData(land.number2)) {
                rest += ('-' + land.number2);
            }
        }

        if (isRoadAddress === true) {
            if (checkLastString(dongmyun, '면')) {
                ri = land.name;
            } else {
                dongmyun = land.name;
                ri = '';
            }

            if (hasAddition(land.addition0)) {
                rest += ' ' + land.addition0.value;
            }
        }
    }

    return [sido, sigugun, dongmyun, ri, rest].join(' ');
}

function hasArea(area) {
    return !!(area && area.name && area.name !== '');
}

function hasData(data) {
    return !!(data && data !== '');
}

function checkLastString (word, lastString) {
    return new RegExp(lastString + '$').test(word);
}

function hasAddition (addition) {
    return !!(addition && addition.value);
}

function toggleCategoryMarkers(category, show) {

    if (markersByType[category]) {
        markersByType[category].forEach(marker => {
            marker.setMap(show ? map : null);

            if (show && marker.placeData && !marker._hasClickListener) {

                naver.maps.Event.addListener(marker, 'click', function() {
                    const clickedPlace = this.placeData;
                    if (!clickedPlace) return;

                    const htmlContent = `
                        <div style="padding: 10px; font-size: 14px; font-family: 'Nanum Gothic', sans-serif;">
                            <p><strong>이름:</strong> ${clickedPlace.name || '정보 없음'}</p>
                            <p><strong>전화번호:</strong> ${clickedPlace.phone || '정보 없음'}</p>
                            <p><strong>주소:</strong> ${clickedPlace.address || '정보 없음'}</p>
                            <p><strong>운영시간:</strong> ${clickedPlace.hour || '정보 없음'}</p>
                            <p><strong>휴무일:</strong> ${clickedPlace.holiday || '정보 없음'}</p>
                            <p><strong>메뉴:</strong> ${clickedPlace.menu || '정보 없음'}</p>
                            <p><strong>업종:</strong> ${clickedPlace.businessType || '정보 없음'}</p>
                            <p><strong>충전타입:</strong> ${clickedPlace.chargingType || '정보 없음'}</p>
                            <p><strong>호선:</strong> ${clickedPlace.line || '정보 없음'}</p>
                        </div>
                    `;
                    infoWindow.setContent(htmlContent);
                    infoWindow.open(map, this);
                });
                marker._hasClickListener = true;
            }
        });

        if (!show && infoWindow.getMap()) {
            infoWindow.close();
        }
    }
}

function saveActiveFacilityButtons() {

    const activeTypes = [];

    document.querySelectorAll('.facility-button').forEach(btn => {
        const type = btn.getAttribute('data-type');
        if (btn.classList.contains('active')) {
            activeTypes.push(type);
        }
    });
    localStorage.setItem('activeFacilityTypes', JSON.stringify(activeTypes));
}

function restoreActiveFacilityButtons() {

    const saved = JSON.parse(localStorage.getItem('activeFacilityTypes') || '[]');

    document.querySelectorAll('.facility-button').forEach(btn => {
        const type = btn.getAttribute('data-type');
        if (saved.includes(type)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

naver.maps.onJSContentLoaded = initGeocoder;

document.addEventListener('DOMContentLoaded', function () {

    const saved = localStorage.getItem('activeFacilityTypes');

    if (saved) {
        restoreActiveFacilityButtons();
    } else {
        saveActiveFacilityButtons();
    }

    const addressInput = document.getElementById('address');
    const submitButton = document.getElementById('submit');

    if (addressInput && submitButton) {
        addressInput.addEventListener('keydown', function(e) {
            if (e.which === 13) {
                if (addressInput.value.trim() !== '') {
                    searchAddressToCoordinate(addressInput.value);
                }
            }
        });

        submitButton.addEventListener('click', function(e) {
            e.preventDefault();

            if (addressInput.value.trim() !== '') {
                searchAddressToCoordinate(addressInput.value);
            } else {
                alert("주소를 입력해주세요. 😊");
            }
        });
    } else {
        console.warn("주소 입력창 또는 제출 버튼을 찾을 수 없습니다.");
    }

    document.addEventListener('keydown', function(event) {
        const activeElement = document.activeElement;
        const isTyping = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

        if (event.key === '/' && !isTyping) {
            event.preventDefault();
            if (addressInput) {
                addressInput.focus();
            }
        }
    });

    const closeBtn = document.getElementById('info-box-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            document.getElementById('info-box').style.display = 'none';
        });
    }

    // document.querySelectorAll('.facility-button').forEach(button => {
    //     button.addEventListener('click', function () {
    //         this.classList.toggle('active');
    //         updateVisibleMarkers();
    //     });
    // });

    const currentLocationSearchBtn = document.querySelector('.search-current-location');
    currentLocationSearchBtn.addEventListener('click', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const userLocation = new naver.maps.LatLng(lat, lng);

                naver.maps.Service.reverseGeocode({
                    coords: userLocation,
                    orders: [
                        naver.maps.Service.OrderType.ROAD_ADDR,
                        naver.maps.Service.OrderType.ADDR
                    ].join(',')
                }, function (status, response) {
                    if (status !== naver.maps.Service.Status.OK) {
                        return alert('현재 위치의 주소를 찾을 수 없어요. 😢');
                    }

                    const item = response.v2.results[0];
                    const address = item.roadAddress?.name || item.region?.area1?.name;

                    if (!address) {
                        return alert('주소를 인식하지 못했어요. 😢');
                    }

                    searchAddressToCoordinate(address);
                });
            }, function () {
                alert('위치 정보를 불러오는 데 실패했어요. 😢');
            });
        } else {
            alert('이 브라우저에서는 위치 정보가 지원되지 않아요. 😢');
        }
    });

    const resetBtn = document.querySelector('.reset-map');
    resetBtn.addEventListener('click', function () {
        clearMarkersByType();
        document.getElementById('info-box').style.display = 'none';
    })

    document.querySelectorAll('.facility-button').forEach(button => {
        button.addEventListener('click', function () {
            this.classList.toggle('active');
            saveActiveFacilityButtons();
            updateVisibleMarkers();
        });
    });

    initGeocoder();
});
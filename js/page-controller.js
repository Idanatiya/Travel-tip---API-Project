'use strict';

import { travelService } from './services/travel-service.js';
import { mapService } from './services/map-service.js';

var gMap;
var unavailableWeather = { description: 'N/A', humidity: 'N/A', icon: 'N/A', speed: 'N/A', temp: 'N/A' }



window.onload = () => {
    initMap()
        .then(() => {
            // addMarker({ lat: 32.0749831, lng: 34.9120554 });
            const locations = travelService.getLocations();
            renderLocations(locations);
        })
        .catch(console.log);
}

document.querySelector('.search-form').addEventListener('submit', onSetSearch)
document.querySelector('.loc-btn').addEventListener('click', onFindUserLocation)
document.querySelector('.locations').addEventListener('click', (ev) => {
    console.log('locations',ev)
    const locId = ev.target.parentElement.parentElement.dataset.id;
    if (ev.target.className === 'delete-btn') onDeleteLocation(locId)
    else if (ev.target.className === 'show-loc-btn') onShowLocation(locId);
})
document.querySelector('.copy-btn').addEventListener('click', (ev) => {
    copyToClipBoard();
    Swal.fire({
        title: 'Copied to ClipBoard!',
        text: 'This is cool!',
        imageUrl: '../imgs/final.gif',
        imageWidth: 400,
        imageHeight: 200,
        imageAlt: 'Custom image',
    })
})


function copyToClipBoard() {
    const textArea = document.createElement('textarea');
    const currLoc = document.querySelector('.curr-loc').innerHTML;
    textArea.value = currLoc
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    console.log('copied!');
}

function onDeleteLocation(locId) {
    travelService.deleteLocation(locId);
    const locations = travelService.getLocations();
    renderLocations(locations);
}

function onShowLocation(locId) {
    const location = travelService.getLocById(locId);
    const { lat, lng } = location.results[0].geometry.location
    panTo(lat, lng)
}

function initMap(lat = 32.0749831, lng = 34.9120554) {
    return _connectGoogleApi()
        .then(() => {
            gMap = new google.maps.Map(
                document.querySelector('#map'), {
                    center: { lat, lng },
                    zoom: 15
                })
            gMap.addListener('click', e => {
                console.log(e)
                const latCoord = e.latLng.lat();
                const lngCoord = e.latLng.lng();
                console.log('lat cs:', e.latLng.lat());
                console.log('lng coords:', e.latLng.lng());
                document.querySelector('input[name=search-bar]').value = latCoord.toFixed(3) + ',' + lngCoord.toFixed(3);
                onSetSearch();
                var marker = new google.maps.Marker({ position: e.latLng, map: gMap, icon: '../imgs/stickers/15.png' });
                gMap.setCenter(marker.getPosition());
                //when user click center the map to the location of the marker
            })
        })
        //Get marker and position it based on the coords
}

function addMarker(loc) {
    console.log('coords:', loc)
    var marker = new google.maps.Marker({
        position: loc,
        map: gMap,
        icon: '../imgs/stickers/15.png'
    });
    console.log(marker)
    return marker;
}

function setMarker(lat, lng) {
    const position = { lat: +lat, lng: +lng };
    const marker = new google.maps.Marker({ position: position, map: gMap })
        //when user click center the map to the location of the marker
    gMap.setCenter(marker.getPosition())
    console.log(gMap);
    console.log('got after set center')
}

function panTo(lat, lng) {
    var laLatLng = new google.maps.LatLng(lat, lng);
    gMap.panTo(laLatLng);
}

function onSetSearch(ev) {
    if (ev) ev.preventDefault();
    var elInput = document.querySelector('input[name=search-bar]');
    travelService.setSearch(elInput.value).then(location => {
        const locations = travelService.getLocations();
        const { lat, lng } = location.results[0].geometry.location
        panTo(lat, lng)
        renderLocations(locations)
        renderWeatherBox(location.id)
    })
    document.querySelector('.curr-loc').innerHTML = elInput.value;
    elInput.value = '';
}

function renderWeatherBox(locId) {
    const location = travelService.getLocById(locId);
    // Naphtali - im trying to get the location to show the address... changed the loc name and solved the weather issue
    if (location.weather) {
        var { description, humidity, icon, speed, temp } = location.weather;
    } else {
        var { description, humidity, icon, speed, temp } = unavailableWeather;
    }
    const iconImg = `https://openweathermap.org/img/wn/${icon}@2x.png`
    const strHtml = `<div class="weather-card">
                   <h1>Weather At <span>${location.searchTerm}</span></h1>
                   <img src="${iconImg}" />
                   <div class="weather-info">
                        <span>${description}</span>
                        <span>Temp: ${temp} °C</span>
                        <span>humidity: ${humidity}</span>
                        <span>Wind speed: ${speed} m/s</span>
                   </div>
                </div>
                `
    document.querySelector('.weather-container').innerHTML = strHtml;
}





function renderLocations(locations) {
    const strHtmls = locations.map(loc => {
        // Naphtali - im trying to get the location to show the address... changed the loc name and solved the weather issue
        const locName = (loc.results.length === 0) ? loc.searchTerm : loc.results[0].address_components[0].long_name;
        // console.log('for loc id', loc.id, '-loc components is:', loc.results[0].address_components)
        const { lat, lng } = (loc.results.length === 0) ? loc.searchTerm: loc.results[0].geometry.location;
        const formatTime = new Date(loc.createdAt).toLocaleString();
        return `<div class="loc-card" data-id="${loc.id}" data-loc="${lat}-${lng}">
                   <h1>Location Name:${locName}</h1>
                   <span>Created at: ${formatTime}</span>
                   <div class="loc-btns">
                        <button class="delete-btn"><i class="fas fa-trash"></i> Delete</button>
                        <button class="show-loc-btn"><i class="fas fa-bolt"></i> Show</button>
                   </div>
                </div>
                `
    }).join('');
    document.querySelector('.locations').innerHTML = strHtmls;
}

function onFindUserLocation() {
    mapService.getPosition()
        .then(ans => {
            var location = { lat: ans.coords.latitude, lng: ans.coords.longitude };
            panTo(location.lat, location.lng);
            addMarker(location);
        })
        .catch(err => {
            console.log('err!!!', err);
        })
}

function _connectGoogleApi() {
    if (window.google) return Promise.resolve()
    const API_KEY = 'AIzaSyAb-nOgpqD_gjhW9jUy6raZW06HfTaFhPI';
    var elGoogleApi = document.createElement('script');
    elGoogleApi.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    elGoogleApi.async = true;
    document.body.append(elGoogleApi);

    return new Promise((resolve, reject) => {
        elGoogleApi.onload = resolve;
        elGoogleApi.onerror = () => reject('Google script failed to load')
    })
}

























// function renderMyLocations() {
//     console.log('this is going to be my locations')
// }

// function renderCurrLocation() {
//     console.log('this is the curr locations')

// }

// function renderWeatherBox() {
//     console.log('this is where we render the weather')

// }


// test if export works: 
// travelService.iAmAFunction()
// mapService.iAmAMap()
// storageService.justForTest()
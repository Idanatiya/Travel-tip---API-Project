'use strict';

const STORAGE_LOC_KEY = 'locationsDB';
var gLocations;
var gCurrLocation = {};

function getSearchRes(term) {
    return axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${term}&key=AIzaSyAb-nOgpqD_gjhW9jUy6raZW06HfTaFhPI`)
        .then(res => res.data)
}

function getWeather(term) {
    // console.log('term is:', term);
    const apiKey = 'aa7ad6b6ace55f0743177e2396dbcc10'
    const coords = term.split(',');
    console.log('coords:', coords);
    if (Number.isInteger(coords[0])) {
        console.log('in coords search')
        return axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${coords[0]}&lon=${coords[1]}&appid=aa7ad6b6ace55f0743177e2396dbcc10`)
            .then(res => res.data)

    } else {
        console.log('in term search!')
        return axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${term}&appid=${apiKey}`)
            .then(res => res.data)
    }
}

function setSearch(val) {
    console.log('getting val:', val);
    setCurrWeather(val);
    return getSearchRes(val)
        .then(ans => {
            gCurrLocation.id = makeId()
            gCurrLocation.searchTerm = val;
            gCurrLocation.results = ans.results;
            gCurrLocation.createdAt = Date.now();
            gCurrLocation.updatedAt = Date.now();
            console.log(gCurrLocation)
            saveLocationsToStorage(gCurrLocation);
            return gCurrLocation;
        })
    // .then(res => {
    //     return res;
    // })
}

function getLocById(id) {
    return gLocations.find(loc => loc.id === id)
}

function deleteLocation(id) {
    const idx = gLocations.findIndex(location => location.id === id);
    if (idx === -1) return;
    gLocations.splice(idx, 1)
    saveToStorage(STORAGE_LOC_KEY, gLocations);
}

function setCurrWeather(val) {
    return getWeather(val)
        .then(res => {
            const { icon, description } = res.weather[0];
            const { speed } = res.wind;
            const { humidity, temp } = res.main;
            return gCurrLocation.weather = {
                icon,
                description: description ? description : '',
                speed,
                humidity,
                temp: convertToCelius(temp)
            }
        })
}

function getLocations() {
    gLocations = loadFromStorage(STORAGE_LOC_KEY);
    console.log('Locations in service:', gLocations);
    return gLocations
}

function getCurrWeather() {
    return gCurrLocation.weather;
}

function saveLocationsToStorage(currLocation) {
    gLocations = loadFromStorage(STORAGE_LOC_KEY);
    if (!gLocations) gLocations = [];
    gLocations.unshift(currLocation);
    saveToStorage(STORAGE_LOC_KEY, gLocations);
    console.log('gLocations is:', gLocations)
}

export const travelService = {
    setSearch,
    getCurrWeather,
    getLocations,
    getLocById,
    deleteLocation
}




// utils:



function saveToStorage(key, val) {
    var str = JSON.stringify(val);
    localStorage.setItem(key, str);
}

function loadFromStorage(key) {
    var str = localStorage.getItem(key);
    return JSON.parse(str);
}

function makeId(length = 10) {
    var txt = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return txt;
}

function convertToCelius(temp) {
    return parseInt(temp - 273.15);
}
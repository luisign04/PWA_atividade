let userLocation = null;
let map = null;
let service = null;
let infowindow = null;

const statusEl = document.querySelector('.status');
const btnLocalizar = document.getElementById('btnLocalizar');
const resultsCard = document.getElementById('resultado');
const listaLocaisEl = document.getElementById('listaLocais');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
        .then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(function(error) {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}

function initApp(){
    btnLocalizar.addEventListener('click', getUserLocation);

    if(!navigator.geolocation){
        statusEl.textContent = 'Geolocalização não é suportada pelo seu navegador';
        statusEl.className = 'status erro';
        btnLocalizar.disabled = true;
    }
}

function getUserLocation() {
    statusEl.textContent = "Obtendo localização...";
    statusEl.className = "status carregando";
    btnLocalizar.disabled = true;

    navigator.geolocation.getCurrentPosition(
        function(position) {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            statusEl.textContent = "Localização obtida com sucesso!";
            statusEl.className = "status sucesso";
            
            // Iniciar o mapa e buscar assistências técnicas
            initMap();
            findNearbyComputerShops();
        },
        function(error) {
            let errorMessage;
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Permissão de localização negada.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Localização indisponível.";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Tempo de solicitação de localização excedido.";
                    break;
                default:
                    errorMessage = "Erro desconhecido.";
            }
            
            statusEl.textContent = errorMessage;
            statusEl.className = "status erro";
            btnLocalizar.disabled = false;
        },
        { timeout: 10000 }
    );
}

// Inicializar o mapa do Google
function initMap() {
    // Criar um mapa centrado na localização do usuário
    map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 14
    });
    
    // Adicionar marcador para a localização do usuário
    new google.maps.Marker({
        position: userLocation,
        map: map,
        title: "Sua localização",
        icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
    });
    
    // Inicializar o serviço de lugares e info window
    service = new google.maps.places.PlacesService(map);
    infowindow = new google.maps.InfoWindow();
    
    // Mostrar o card de resultados
    resultsCard.style.display = 'block';
}

// Buscar assistências técnicas próximas
function findNearbyComputerShops() {
    const request = {
        location: userLocation,
        radius: 5000, // 5km
        keyword: 'assistencia tecnica informatica computer repair'
    };
    
    statusEl.textContent = "Buscando assistências técnicas próximas...";
    statusEl.className = "status carregando";
    
    service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            statusEl.textContent = `Encontradas ${results.length} assistências técnicas próximas`;
            statusEl.className = "status sucesso";
            
            // Exibir resultados no mapa e na lista
            displayResults(results);
        } else {
            statusEl.textContent = "Não foi possível encontrar assistências técnicas próximas. Tente novamente.";
            statusEl.className = "status erro";
            
            // Habilitar o botão novamente
            btnLocalizar.disabled = false;
        }
    });
}

// Exibir resultados no mapa e na lista
function displayResults(places) {
    // Limpar a lista de locais
    listaLocaisEl.innerHTML = '';
    
    // Ordenar lugares por proximidade
    places.sort((a, b) => {
        const distA = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation), 
            new google.maps.LatLng(a.geometry.location)
        );
        
        const distB = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation), 
            new google.maps.LatLng(b.geometry.location)
        );
        
        return distA - distB;
    });
    
    // Adicionar cada lugar ao mapa e à lista
    places.forEach(place => {
        if (!place.geometry || !place.geometry.location) return;
        
        // Calcular distância
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation), 
            new google.maps.LatLng(place.geometry.location)
        );
        
        const distanceKm = (distance / 1000).toFixed(1);
        
        // Criar marcador no mapa
        const marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location,
            title: place.name
        });
        
        // Adicionar evento de clique no marcador
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(`
                <div>
                    <strong>${place.name}</strong><br>
                    ${place.vicinity || 'Endereço não disponível'}<br>
                    Distância: ${distanceKm} km
                </div>
            `);
            infowindow.open(map, this);
        });
        
        // Adicionar à lista
        const listItem = document.createElement('div');
        listItem.className = 'local-item';
        listItem.innerHTML = `
            <div class="local-info">
                <div class="local-nome">${place.name}</div>
                <div class="local-endereco">${place.vicinity || 'Endereço não disponível'}</div>
            </div>
            <div class="local-distancia">${distanceKm} km</div>
        `;
        
        listaLocaisEl.appendChild(listItem);
    });
    
    // Habilitar o botão novamente para permitir nova busca
    btnLocalizar.disabled = false;
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);
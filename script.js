const map = L.map('map', {
    center: [48.3794, 31.1656],
    zoom: 6,
    zoomControl: false,
    fadeAnimation: true,
    markerZoomAnimation: true
});

// Стабільне джерело мапи (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Додаємо шар радара (візуальний ефект)
const radarOverlay = document.createElement('div');
radarOverlay.id = 'radar-sweep';
document.getElementById('map').appendChild(radarOverlay);

L.control.zoom({ position: 'bottomright' }).addTo(map);

const icons = {
    shahed: L.icon({ iconUrl: 'icons/shahed_real.svg', iconSize: [45, 45], iconAnchor: [22, 22] }),
    cruise: L.icon({ iconUrl: 'icons/missile_cruise.svg', iconSize: [40, 40], iconAnchor: [20, 20] }),
    ballistic: L.icon({ iconUrl: 'icons/missile_ballistic.svg', iconSize: [40, 40], iconAnchor: [20, 20] }),
    ukr_drone: L.icon({ iconUrl: 'icons/ukr_drone.svg', iconSize: [45, 45], iconAnchor: [22, 22] })
};

let threats = [];

function addThreat(t) {
    const marker = L.marker([t.lat, t.lon], { icon: icons[t.type] }).addTo(map);
    
    // Анімація та поворот після додавання на карту
    const iconElement = marker.getElement();
    if (iconElement) {
        iconElement.classList.add('pulse-animation');
        iconElement.style.transform += ` rotate(${t.angle}deg)`;
    }

    const tooltipContent = `
        <div class="custom-popup">
            <div class="popup-title">${t.name}</div>
            <div class="popup-loc">ЛОКАЦІЯ: ${t.location}</div>
            <div class="popup-time">ВИЯВЛЕНО: ${t.time}</div>
        </div>
    `;
    marker.bindTooltip(tooltipContent, { sticky: true, className: 'tactical-tooltip' });
    threats.push(marker);
}

function loadData() {
    fetch('data.json?t=' + Date.now()) // Запобігання кешуванню
        .then(res => res.json())
        .then(data => {
            threats.forEach(m => map.removeLayer(m));
            threats = [];

            if (data.threats) {
                data.threats.forEach(addThreat);
            }

            const newsList = document.getElementById('news-list');
            newsList.innerHTML = '';
            if (data.news) {
                data.news.forEach(n => {
                    const item = document.createElement('div');
                    item.className = 'news-item';
                    item.innerHTML = `
                        <span class="news-channel">${n.channel}</span>
                        <span class="news-time">[${n.time}]</span> ${n.text}
                    `;
                    newsList.appendChild(item);
                });
            }
        })
        .catch(err => {
            console.error("Помилка завантаження даних:", err);
        });
}

// Виклик invalidateSize для коректного відображення мапи в flex-контейнері
setTimeout(() => map.invalidateSize(), 500);

loadData();
setInterval(loadData, 15000);

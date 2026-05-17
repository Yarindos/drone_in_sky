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
    
    // Додаємо анімацію та поворот через невелику затримку, щоб елемент встиг створитися
    setTimeout(() => {
        const iconElement = marker.getElement();
        if (iconElement) {
            iconElement.classList.add('pulse-animation');
            // Зберігаємо оригінальний translate, який Leaflet задає через inline style
            const currentTransform = iconElement.style.transform;
            iconElement.style.transform = `${currentTransform} rotate(${t.angle}deg)`;
        }
    }, 100);

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
    fetch('data.json?t=' + Date.now())
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
        .catch(err => console.error("Data load error:", err));
}

// Примусове оновлення розміру мапи
window.addEventListener('load', () => {
    setTimeout(() => map.invalidateSize(), 1000);
});

loadData();
setInterval(loadData, 30000);

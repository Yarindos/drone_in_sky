const map = L.map('map', {
    center: [48.3794, 31.1656],
    zoom: 6,
    zoomControl: false,
    fadeAnimation: true
});

// Надійне джерело мапи
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Конфігурація іконок
const iconSettings = {
    shahed: { url: 'icons/shahed_real.svg', size: 45 },
    cruise: { url: 'icons/missile_cruise.svg', size: 40 },
    ballistic: { url: 'icons/missile_ballistic.svg', size: 40 },
    ukr_drone: { url: 'icons/ukr_drone.svg', size: 45 }
};

let threats = [];

function addThreat(t) {
    const settings = iconSettings[t.type] || iconSettings.shahed;
    
    // Використовуємо DivIcon, щоб відокремити позиціонування Leaflet від нашого обертання
    const customIcon = L.divIcon({
        className: 'threat-icon-container',
        html: `<img src="${settings.url}" 
                    class="pulse-animation" 
                    style="transform: rotate(${t.angle}deg); width: ${settings.size}px; height: ${settings.size}px;">`,
        iconSize: [settings.size, settings.size],
        iconAnchor: [settings.size/2, settings.size/2]
    });

    const marker = L.marker([t.lat, t.lon], { icon: customIcon }).addTo(map);

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
            // Видаляємо старі маркери
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
        .catch(err => console.error("Update error:", err));
}

// Корекція розміру мапи
setTimeout(() => map.invalidateSize(), 500);

loadData();
setInterval(loadData, 20000);

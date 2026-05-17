const map = L.map('map', {
    center: [48.3794, 31.1656], // Center of Ukraine
    zoom: 6,
    zoomControl: false
});

// Додаємо стиль темної мапи (Jawg Dark)
L.tileLayer('https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=guest', {
    attribution: '&copy; JawgMaps',
    minZoom: 0,
    maxZoom: 22
}).addTo(map);

// CSS Фільтр для "радарного" вигляду
document.getElementById('map').style.filter = "hue-rotate(10deg) brightness(0.8) contrast(1.2) saturate(0.5)";

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Типи іконок
const icons = {
    shahed: L.icon({ iconUrl: 'icons/shahed_real.svg', iconSize: [45, 45], iconAnchor: [22, 22] }),
    cruise: L.icon({ iconUrl: 'icons/missile_cruise.svg', iconSize: [40, 40], iconAnchor: [20, 20] }),
    ballistic: L.icon({ iconUrl: 'icons/missile_ballistic.svg', iconSize: [40, 40], iconAnchor: [20, 20] }),
    ukr_drone: L.icon({ iconUrl: 'icons/ukr_drone.svg', iconSize: [45, 45], iconAnchor: [22, 22] })
};

const threats = [];

// Функція для додавання загрози на мапу
function addThreat(type, lat, lon, angle, label, location, time) {
    const marker = L.marker([lat, lon], {
        icon: icons[type],
        interactive: true
    }).addTo(map);
    
    // Обертання та пульсація через CSS класи
    marker.on('add', function() {
        const img = marker._icon;
        if (img) {
            img.classList.add('pulse-animation');
            img.style.transformOrigin = 'center';
            img.style.transform += ` rotate(${angle}deg)`;
        }
    });

    // Надпис тільки при наведенні (не постійно)
    const popupContent = `
        <div class="custom-popup">
            <div class="popup-title">${label}</div>
            <div class="popup-loc">${location}</div>
            <div class="popup-time">${time}</div>
        </div>
    `;
    marker.bindTooltip(popupContent, { sticky: true, className: 'tactical-tooltip' });
    threats.push(marker);
}

// Функція завантаження даних (заглушка)
function loadData() {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            // Очищення старих маркерів
            threats.forEach(m => map.removeLayer(m));
            threats.length = 0;

            // Додавання нових
            data.threats.forEach(t => {
                addThreat(t.type, t.lat, t.lon, t.angle, t.name, t.location, t.time);
            });

            // Оновлення новин
            const newsList = document.getElementById('news-list');
            newsList.innerHTML = '';
            data.news.forEach(n => {
                const item = document.createElement('div');
                item.className = 'news-item';
                item.innerHTML = `<span class="news-time">${n.time}</span> ${n.text}`;
                newsList.appendChild(item);
            });
        })
        .catch(err => console.error("Помилка завантаження даних:", err));
}

// Початкове завантаження та інтервал
loadData();
setInterval(loadData, 10000); // Оновлення кожні 10 сек

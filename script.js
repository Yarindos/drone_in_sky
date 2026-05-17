const map = L.map('map', {
    center: [48.3794, 31.1656], // Center of Ukraine
    zoom: 6,
    zoomControl: false
});

// Додаємо стиль темної мапи (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Типи іконок
const icons = {
    shahed: L.icon({ iconUrl: 'icons/shahed.svg', iconSize: [30, 30], iconAnchor: [15, 15] }),
    cruise: L.icon({ iconUrl: 'icons/missile_cruise.svg', iconSize: [30, 30], iconAnchor: [15, 15] }),
    ballistic: L.icon({ iconUrl: 'icons/missile_ballistic.svg', iconSize: [30, 30], iconAnchor: [15, 15] })
};

const threats = [];

// Функція для додавання загрози на мапу
function addThreat(type, lat, lon, angle, label) {
    const marker = L.marker([lat, lon], {
        icon: icons[type],
        rotationAngle: angle // Потрібен плагін для обертання, але поки просто іконка
    }).addTo(map);
    
    marker.bindTooltip(label, { permanent: true, direction: 'top', className: 'threat-label' });
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
                addThreat(t.type, t.lat, t.lon, t.angle, t.name);
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

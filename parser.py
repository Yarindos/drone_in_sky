import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

CHANNELS = [
    'vanek_nikolaev',
    'kpszsu',           # Повітряні Сили
    'monitorwar',
    'povitryana_trivoga',
    'kyiv_sky',
    'kyiv_inform',
    'odesa_inf',
    'kharkivlife',
    'dnepr_operativ',
    'raketa_lviv',
    'razvedka_noe',
    'operativnoZSU'
]

# База міст (Україна + РФ для атак)
LOCATIONS = {
    "київ": [50.4501, 30.5234],
    "одес": [46.4825, 30.7233],
    "харк": [49.9935, 36.2304],
    "дніпр": [48.4647, 35.0462],
    "львів": [49.8397, 24.0297],
    "микол": [46.9750, 31.9946],
    "черк": [49.4444, 32.0597],
    "запор": [47.8388, 35.1396],
    "херсон": [46.6354, 32.6169],
    "крив": [47.9105, 33.3918],
    "вінни": [49.2331, 28.4682],
    "полтав": [49.5883, 34.5514],
    "черніг": [51.4982, 31.2893],
    "суми": [50.9077, 34.7981],
    "старокост": [49.7500, 27.2167],
    "бєлгород": [50.5997, 36.5982],
    "курськ": [51.7373, 36.1874],
    "брянськ": [53.2521, 34.3717],
    "воронеж": [51.6608, 39.2003],
    "москва": [55.7558, 37.6173],
    "ростов": [47.2357, 39.7015],
    "краснодар": [45.0393, 38.9872],
    "енгельс": [51.4782, 46.1306]
}

THREAT_TYPES = {
    r"(шахед|дрон|бпла|geran|геран)": "shahed",
    r"(ракета|калібр|х-101|х-555|х-59|х-69)": "cruise",
    r"(баліст|іскандер|с-300|с-400|кинджал|кінжал)": "ballistic",
    r"(наші дрони|хлопок|атака бпла|лютий|бобер)": "ukr_drone"
}

DIRECTIONS = {
    r"(північ|північн)": 0,
    r"(північний схід|пн-сх)": 45,
    r"(схід|східн)": 90,
    r"(південний схід|пд-сх)": 135,
    r"(південь|південн)": 180,
    r"(південний захід|пд-зх)": 225,
    r"(захід|західн)": 270,
    r"(північний захід|пн-зх)": 315
}

def parse_telegram():
    news = []
    threats = []

    for channel in CHANNELS:
        url = f"https://t.me/s/{channel}"
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            messages = soup.find_all('div', class_='tgme_widget_message_wrap')
            
            for msg in messages[-15:]:
                text_element = msg.find('div', class_='tgme_widget_message_text')
                if not text_element: continue
                
                raw_text = text_element.get_text()
                text = raw_text.lower()
                
                time_tag = msg.find('time')
                if time_tag and time_tag.has_attr('datetime'):
                    iso_time = time_tag['datetime']
                    dt = datetime.fromisoformat(iso_time.replace('Z', '+00:00'))
                    time_str = dt.strftime("%H:%M")
                    sort_key = dt.timestamp()
                else:
                    time_str = datetime.now().strftime("%H:%M")
                    sort_key = datetime.now().timestamp()
                
                channel_name = channel.replace('_', ' ').capitalize()
                news.append({
                    "time": time_str, 
                    "sort_key": sort_key,
                    "text": raw_text[:120] + "..." if len(raw_text) > 120 else raw_text,
                    "channel": channel_name
                })
                
                # Аналіз на загрози (тільки свіжі - останні 2 години)
                if (datetime.now().timestamp() - sort_key) > 7200:
                    continue

                found_type = None
                for pattern, t_type in THREAT_TYPES.items():
                    if re.search(pattern, text):
                        found_type = t_type
                        break
                
                if found_type:
                    found_loc = None
                    for loc_name, coords in LOCATIONS.items():
                        if loc_name in text:
                            found_loc = {"name": loc_name, "coords": coords}
                            break
                    
                    if found_loc:
                        angle = 0
                        for dir_pattern, dir_angle in DIRECTIONS.items():
                            if re.search(dir_pattern, text):
                                angle = dir_angle
                                break
                        
                        threats.append({
                            "type": found_type,
                            "lat": found_loc["coords"][0],
                            "lon": found_loc["coords"][1],
                            "angle": angle,
                            "name": f"{found_type.replace('_', ' ').capitalize()}",
                            "location": found_loc["name"].capitalize(),
                            "time": time_str,
                            "sort_key": sort_key
                        })
                            
        except Exception as e:
            print(f"Error parsing {channel}: {e}")

    # Сортування новин та загроз за часом
    news.sort(key=lambda x: x['sort_key'], reverse=True)
    threats.sort(key=lambda x: x['sort_key'], reverse=True)
    
    # Видалення дублікатів
    unique_threats = []
    seen = set()
    for t in threats:
        key = f"{t['type']}_{t['lat']}_{t['lon']}"
        if key not in seen:
            unique_threats.append(t)
            seen.add(key)

    data = {"threats": unique_threats, "news": news[:20]}
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Дані оновлено. Знайдено загроз: {len(unique_threats)}")

if __name__ == "__main__":
    parse_telegram()

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

CHANNELS = [
    'vanek_nikolaev',
    'kpszsu' # Повітряні Сили
]

CITIES = {
    "київ": [50.4501, 30.5234],
    "одес": [46.4825, 30.7233],
    "харк": [49.9935, 36.2304],
    "дніпр": [48.4647, 35.0462],
    "львів": [49.8397, 24.0297],
    "микол": [46.9750, 31.9946],
    "черк": [49.4444, 32.0597],
    "запор": [47.8388, 35.1396],
    "херсон": [46.6354, 32.6169],
    "крив": [47.9105, 33.3918]
}

THREAT_KEYWORDS = {
    "шахед": "shahed",
    "дрон": "shahed",
    "ракета": "cruise",
    "калібр": "cruise",
    "іскандер": "ballistic",
    "баліст": "ballistic"
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
            
            for msg in messages[-5:]: # Останні 5 повідомлень
                text_element = msg.find('div', class_='tgme_widget_message_text')
                if not text_element: continue
                
                text = text_element.get_text().lower()
                time_element = msg.find('time')
                time_str = time_element.get_text() if time_element else datetime.now().strftime("%H:%M")
                
                news.append({"time": time_str, "text": text[:100] + "..."})
                
                # Аналіз на загрози
                found_type = None
                for key, t_type in THREAT_KEYWORDS.items():
                    if key in text:
                        found_type = t_type
                        break
                
                if found_type:
                    for city, coords in CITIES.items():
                        if city in text:
                            threats.append({
                                "type": found_type,
                                "lat": coords[0],
                                "lon": coords[1],
                                "angle": 0,
                                "name": f"{found_type.capitalize()} ({city.capitalize()})"
                            })
                            break
                            
        except Exception as e:
            print(f"Error parsing {channel}: {e}")

    # Збереження результатів
    data = {
        "threats": threats if threats else [],
        "news": news[:10]
    }
    
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("Дані оновлено.")

if __name__ == "__main__":
    parse_telegram()

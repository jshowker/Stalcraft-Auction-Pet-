import os
import json
import http.client

def get_access_token():
    """Получает новый токен доступа для API."""
    conn = http.client.HTTPSConnection("exbo.net")
    payload = "grant_type=client_credentials&client_id=555&client_secret=EFUqkfVxRIsdAdpNrMfxRFAOzSwtNZTQGGuxqblm"
    headers = {
        'Content-Type': "application/x-www-form-urlencoded"
    }

    try:
        conn.request("POST", "/oauth/token", payload, headers)
        res = conn.getresponse()
        if res.status != 200:
            print(f"Failed to fetch access token: {res.status}")
            return None

        data = json.loads(res.read().decode("utf-8"))
        return data.get("access_token")
    except Exception as e:
        print(f"Error fetching access token: {e}")
        return None
    finally:
        conn.close()

def extract_compact_item_data(data):
    """Извлекает только id, category, name и ранк из предмета."""
    try:
        rank = None

        # Поиск ранка в infoBlocks
        for block in data.get("infoBlocks", []):
            if block.get("type") == "list":
                for element in block.get("elements", []):
                    if element.get("type") == "key-value":
                        key = element.get("key", {}).get("lines", {}).get("ru")
                        if key == "Ранг":
                            rank = element.get("value", {}).get("lines", {}).get("ru")
                            break

        return {
            "id": data.get("id"),
            "category": data.get("category"),
            "name": data.get("name", {}).get("lines", {}).get("ru"),
            "rank": rank
        }
    except Exception as e:
        print(f"Error extracting item data: {e}")
        return None

def fetch_auction_data(item_id, headers):
    """Делает запрос к API для получения данных об аукционе."""
    conn = http.client.HTTPSConnection("eapi.stalcraft.net")
    endpoint = f"/ru/auction/{item_id}/history?offset=1000"

    try:
        conn.request("GET", endpoint, headers=headers)
        res = conn.getresponse()
        if res.status != 200:
            print(f"Failed to fetch auction data for {item_id}: {res.status}")
            return None

        data = json.loads(res.read().decode("utf-8"))
        return data
    except Exception as e:
        print(f"Error fetching auction data for {item_id}: {e}")
        return None
    finally:
        conn.close()

def process_items(directory):
    items_minimal = {
        "items_ru_full": []
    }
    items_map = {
        "id_to_ru": []
    }

    # Получение токена доступа
    access_token = get_access_token()
    if not access_token:
        print("Failed to retrieve access token. Exiting.")
        return

    headers = {
        'Content-Type': "application/json",
        'Authorization': f"Bearer {access_token}"
    }

    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return

    file_count = 0

    for root, dirs, files in os.walk(directory):
        # Исключаем папки _variants и artefact
        dirs[:] = [d for d in dirs if d not in ["_variants", "artefact"]]

        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")
                    continue

                # Извлечение данных предмета
                item_data = extract_compact_item_data(data)
                if item_data:
                    items_minimal["items_ru_full"].append(item_data)

                    # Запрос к API для проверки аукциона
                    auction_data = fetch_auction_data(item_data["id"], headers)
                    if auction_data and auction_data.get("total", 0) > 0 and auction_data.get("prices"):
                        items_map["id_to_ru"].append(item_data)

                file_count += 1
                if file_count % 100 == 0:
                    print(f"Processed {file_count} files...")

    print(f"Total files processed: {file_count}")

    # Перезапись файла items_full.json
    try:
        with open("C:/Users/timur/PycharmProjects/stalcraftApp/data/items/items_full.json", "w", encoding='utf-8') as f:
            json.dump(items_minimal, f, ensure_ascii=False, indent=4)
        print("Updated items_full.json")
    except Exception as e:
        print(f"Error saving items_full.json: {e}")

    # Перезапись файла items_map.json
    try:
        with open("C:/Users/timur/PycharmProjects/stalcraftApp/data/items/items_map.json", "w", encoding='utf-8') as f:
            json.dump(items_map, f, ensure_ascii=False, indent=4)
        print("Updated items_map.json")
    except Exception as e:
        print(f"Error saving items_map.json: {e}")

if __name__ == "__main__":
    process_items("C:/Users/timur/PycharmProjects/stalcraftApp/stalcraft-database/ru/items")
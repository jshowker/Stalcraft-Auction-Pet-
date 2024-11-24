import os
import json

source_dir = r"C:\Users\timur\PycharmProjects\stalcraftApp\stalcraft-database\global\items"
output_file = r"C:\Users\timur\PycharmProjects\stalcraftApp\data\items\items_map.json"

def collect_item_data():
    items_data = {"id_to_ru": {}}

    for root, dirs, files in os.walk(source_dir):
        dirs[:] = [d for d in dirs if d != "_variants"]

        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)

                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                    item_id = data.get("id")
                    item_name_ru = data.get("name", {}).get("lines", {}).get("ru")

                    if item_id and item_name_ru:
                        items_data["id_to_ru"][item_id] = item_name_ru

    return items_data

def update_items_map():
    items_data = collect_item_data()

    # Запись данных в items_map.json
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(items_data, f, ensure_ascii=False, indent=4)

    print(f"Database updated successfully! Saved to {output_file}")

if __name__ == "__main__":
    update_items_map()

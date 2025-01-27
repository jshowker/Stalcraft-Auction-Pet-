import React from "react";
import { createRoot } from "react-dom/client";
import ChartComponent from "../renderer/ChartComponent.jsx";

const graphContainer = document.getElementById("graph-container");
if (graphContainer) {
    const root = createRoot(graphContainer);
    root.render(<ChartComponent />);
} else {
    console.error("Graph container not found");
}

const minButton = document.getElementById("min-button");
const maxButton = document.getElementById("max-button");
const restoreButton = document.getElementById("restore-button");
const closeButton = document.getElementById("close-button");

const updateMaximizeRestoreButtons = (isMaximized) => {
    if (isMaximized) {
        maxButton.style.display = "none";
        restoreButton.style.display = "flex";
    } else {
        maxButton.style.display = "flex";
        restoreButton.style.display = "none";
    }
};

if (minButton) {
    minButton.addEventListener("click", () => {
        window.electronAPI.minimizeWindow();
    });
}

if (maxButton) {
    maxButton.addEventListener("click", () => {
        window.electronAPI.maximizeWindow();
    });
}

if (restoreButton) {
    restoreButton.addEventListener("click", () => {
        window.electronAPI.unmaximizeWindow();
    });
}

if (closeButton) {
    closeButton.addEventListener("click", () => {
        window.electronAPI.closeWindow();
    });
}

window.electronAPI.onMaximizeStateChange((isMaximized) => {
    updateMaximizeRestoreButtons(isMaximized);
});
async function getAccessToken() {
  const url = "https://exbo.net/oauth/token";
  const authData = {
    grant_type: "client_credentials",
    client_id: "555",
    client_secret: "EFUqkfVxRIsdAdpNrMfxRFAOzSwtNZTQGGuxqblm",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(authData),
    });

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("[getAccessToken] Error:", error);
    return null;
  }
}

async function fetchData(id) {
  const url = `https://eapi.stalcraft.net/ru/auction/${id}/lots?order=asc`;
  const token = await getAccessToken();


  if (!token) return { lots: [] };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(response.statusText);

    return await response.json();
  } catch (error) {
    console.error("[fetchData] Error:", error);
    return { lots: [] };
  }
}

async function loadJSON() {
  const filePath = "C:/Users/timur/PycharmProjects/stalcraftApp/data/items/items_map.json";
  const response = await fetch(filePath);
  return (await response.json()).id_to_ru;
}

function convertToArray(data) {
  return data.map((item) => [item.id, item.name, item.category, item.rank]);
}

function chunkArrayWithReduce(array, size) {
  return array.reduce((chunks, item, index) => {
    if (index % size === 0) {
      return [...chunks, array.slice(index, index + size)];
    }
    return chunks;
  }, []);
}

let allItems = [];
let filteredLocal = [];
let chunks = [];
let currentChunkIndex = 0;
let filterState = {
  searchText: "",
  priceMin: null,
  priceMax: null,
  selectedCategories: new Set(),
  selectedRarities: new Set(),
};

function passFilterLocal(item) {
  const [id, name, cat, rank] = item;

  if (filterState.searchText && !name.toLowerCase().includes(filterState.searchText.toLowerCase())) {
    return false;
  }

  if (filterState.selectedCategories.size > 0 && !filterState.selectedCategories.has(cat)) {
    return false;
  }

  if (filterState.selectedRarities.size > 0 && !filterState.selectedRarities.has(rank)) {
    return false;
  }

  return true;
}

function displayOneItem({ id, name, category, rank, buyoutText }) {
  const list = document.getElementById("items-list");
  if (!list) return;

  const li = document.createElement("li");
  li.classList.add("item");

  const rankClass = convertRankToClass(rank);
  if (rankClass) li.classList.add(rankClass);

  const img = document.createElement("img");
  img.src = `../stalcraft-database/ru/icons/${category}/${id}.png`;
  img.alt = name;
  img.style.width = "50px";
  img.style.height = "50px";

  li.textContent = `${name}, MinBuyout: ${buyoutText}`;
  li.setAttribute("data-id", id);
  li.prepend(img);
  list.appendChild(li);
}

function convertRankToClass(rank) {
  if (!rank) return null;
  switch (rank.toLowerCase()) {
    case "отмычка":
      return "rank-otmychka";
    case "новичок":
      return "rank-novichok";
    case "сталкер":
      return "rank-stalker";
    case "ветеран":
      return "rank-veteran";
    case "мастер":
      return "rank-master";
    case "легенда":
      return "rank-legend";
    default:
      return null;
  }
}

async function loadNextChunk(chunks, curIndex) {
  if (curIndex >= chunks.length) return curIndex;

  const currentChunk = chunks[curIndex];

  for (const [id, name, cat, rank] of currentChunk) {
    const auctionData = await fetchData(id);

    if (!auctionData.lots || auctionData.lots.length === 0) {
      const pMin = parseFloat(filterState.priceMin);
      if (!isNaN(pMin) && pMin > 0) continue;

      displayOneItem({ id, name, category: cat, rank, buyoutText: "N/A" });
      continue;
    }

    let minBuyout = Math.min(...auctionData.lots.map((lot) => lot.buyoutPrice));

    const pMin = parseFloat(filterState.priceMin);
    const pMax = parseFloat(filterState.priceMax);
    if (!isNaN(pMin) && minBuyout < pMin) continue;
    if (!isNaN(pMax) && minBuyout > pMax) continue;

    displayOneItem({ id, name, category: cat, rank, buyoutText: String(minBuyout) });
  }

  return curIndex + 1;
}

async function main() {
  const data = await loadJSON();
  allItems = convertToArray(data);
  filteredLocal = [...allItems];

  const applyBtn = document.querySelector(".footer-button:nth-child(1)");
  const resetBtn = document.querySelector(".footer-button:nth-child(2)");

  if (applyBtn) applyBtn.addEventListener("click", onApplyFilters);
  if (resetBtn) resetBtn.addEventListener("click", onResetFilters);

  doChunkAndLoad();
}

function onApplyFilters() {
  const searchEl = document.querySelector(".search-input");
  filterState.searchText = searchEl ? searchEl.value.trim() : "";

  const priceMinEl = document.getElementById("price-min");
  const priceMaxEl = document.getElementById("price-max");
  filterState.priceMin = priceMinEl.value ? priceMinEl.value.trim() : null;
  filterState.priceMax = priceMaxEl.value ? priceMaxEl.value.trim() : null;

  filterState.selectedCategories.clear();
  document.querySelectorAll(".category-checkbox").forEach((ch) => {
    if (ch.checked) filterState.selectedCategories.add(ch.value);
  });

  filterState.selectedRarities.clear();
  document.querySelectorAll(".rarity-checkbox").forEach((ch) => {
    if (ch.checked) filterState.selectedRarities.add(ch.value);
  });

  doChunkAndLoad();
}

function onResetFilters() {
  filterState.searchText = "";
  filterState.priceMin = null;
  filterState.priceMax = null;
  filterState.selectedCategories.clear();
  filterState.selectedRarities.clear();

  const searchEl = document.querySelector(".search-input");
  if (searchEl) searchEl.value = "";

  const priceMinEl = document.getElementById("price-min");
  if (priceMinEl) priceMinEl.value = "";

  const priceMaxEl = document.getElementById("price-max");
  if (priceMaxEl) priceMaxEl.value = "";

  document.querySelectorAll(".category-checkbox").forEach((ch) => {
    ch.checked = false;
  });
  document.querySelectorAll(".rarity-checkbox").forEach((ch) => {
    ch.checked = false;
  });

  doChunkAndLoad();
}

function doChunkAndLoad() {
  const list = document.getElementById("items-list");
  if (list) list.innerHTML = "";

  filteredLocal = allItems.filter(passFilterLocal);
  chunks = chunkArrayWithReduce(filteredLocal, 20);
  currentChunkIndex = 0;

  const largeBox = document.querySelector(".large-box");
  if (!largeBox) return;

  largeBox.removeEventListener("scroll", onScroll);
  largeBox.addEventListener("scroll", onScroll);

  loadNextChunk(chunks, currentChunkIndex).then((nextIndex) => {
    currentChunkIndex = nextIndex;
  });
}

async function onScroll() {
  const largeBox = document.querySelector(".large-box");
  if (!largeBox) return;

  if (largeBox.scrollTop + largeBox.clientHeight >= largeBox.scrollHeight - 10) {
    currentChunkIndex = await loadNextChunk(chunks, currentChunkIndex);
  }
}
const itemsList = document.getElementById("items-list");

if (itemsList) {
  itemsList.addEventListener("click", async (event) => {
    const target = event.target;

    if (target.tagName.toLowerCase() === "li") {
      try {
        const id = target.getAttribute("data-id"); 
        const token = await getAccessToken(); 
        if (!token) throw new Error("Token not available");

        const options = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const url = `https://eapi.stalcraft.net/ru/auction/${id}/history?limit=200`;
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const groupedData = groupByDay(data.prices); 

        window.dispatchEvent(
          new CustomEvent("chartDataUpdated", { detail: groupedData })
        );
      } catch (error) {
        console.error("Error fetching item history:", error);
      }
    }
  });
} else {
  console.error("Items list not found.");
}


function groupByDay(pricesArray) {
  const map = new Map();

  pricesArray.forEach((entry) => {
    const dateObj = new Date(entry.time);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;

    if (!map.has(key)) {
      map.set(key, { date: key, quantity: 0, price: Infinity });
    }

    const record = map.get(key);
    record.quantity += entry.amount;
    if (entry.price < record.price) {
      record.price = entry.price;
    }
    map.set(key, record);
  });

  return Array.from(map.values());
}

main();

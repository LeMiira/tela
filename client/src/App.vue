<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden"
  >
    <!-- Ambient Background Glow -->
    <div
      class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none"
    >
      <div
        class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px]"
      ></div>
      <div
        class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[100px]"
      ></div>
    </div>

    <div class="z-10 w-full max-w-md space-y-8">
      <!-- Header -->
      <header class="text-center space-y-2">
        <h1 class="text-4xl font-bold tracking-tight text-yellow-500">Tela</h1>
        <p class="text-neutral-400 text-sm">Altın kurları (Enpara)</p>
      </header>

      <!-- Main Price Card -->
      <div
        class="bg-neutral-800/50 backdrop-blur-md border border-neutral-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        ></div>

        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-12 space-y-4"
        >
          <div
            class="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"
          ></div>
          <p class="text-neutral-500 text-sm animate-pulse">
            Fetching gold rates...
          </p>
        </div>

        <div v-else-if="error" class="text-center py-8 space-y-4">
          <div class="text-red-400 text-lg font-medium">
            Fiyatlar yüklenemedi.
          </div>
          <p class="text-neutral-500 text-sm px-4">{{ error }}</p>
          <button
            @click="fetchPrices"
            class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm transition-colors"
          >
            Tekrar deneyin
          </button>
        </div>

        <div v-else class="space-y-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-semibold text-white">{{ goldType }}</h2>
              <p class="text-neutral-400 text-xs mt-1">
                Güncelleme: {{ lastUpdated }}
              </p>
            </div>
            <div
              class="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-medium border border-yellow-500/20"
            >
              Canlı
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div
              class="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800"
            >
              <p class="text-neutral-500 text-xs mb-1 uppercase tracking-wider">
                Banka Alış (TL)
              </p>
              <p class="text-2xl font-mono text-white tracking-tight">
                {{ formatPrice(prices.purchase) }}
              </p>
            </div>
            <div
              class="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800"
            >
              <p class="text-neutral-500 text-xs mb-1 uppercase tracking-wider">
                Banka Satış (TL)
              </p>
              <div class="flex items-center gap-2">
                <p
                  class="text-2xl font-mono text-white tracking-tight"
                  :class="{
                    'text-green-400': priceUp,
                    'text-red-400': priceDown,
                  }"
                >
                  {{ formatPrice(prices.sale) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alarm Section -->
      <div
        class="bg-neutral-800/30 backdrop-blur-sm border border-neutral-700/30 rounded-2xl p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-white flex items-center gap-2">
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="
                alarmActive
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  : 'bg-neutral-600'
              "
            ></span>
            Fiyat Alarmı
          </h3>
          <button
            @click="toggleAlarm"
            class="text-xs px-3 py-1.5 rounded-lg transition-all duration-300 font-medium"
            :class="
              alarmActive
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
            "
          >
            {{ alarmActive ? "Devre dışı bırak" : "Aktif et" }}
          </button>
        </div>

        <div class="space-y-4">
          <div class="relative">
            <label
              class="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider"
              >Hedef Satış Fiyatı (TL)</label
            >
            <input
              v-model="targetPrice"
              type="number"
              step="0.01"
              class="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-mono text-lg"
              placeholder="0.00"
            />
          </div>
          <p class="text-xs text-neutral-500 leading-relaxed">
            Fiyatları her dakika doğrulayacağız. Banka Satış fiyatı
            hedeflediğiniz fiyata veya altına düşerse, bir bildirim alacaksınız.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="text-center">
        <p class="text-neutral-600 text-xs"></p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { getGoldPrices } from "./api";

const prices = ref({ purchase: 0, sale: 0 });
const goldType = ref("Gram Gold (24K)");
const lastUpdated = ref("-");
const loading = ref(true);
const error = ref(null);
const targetPrice = ref("");
const alarmActive = ref(false);
const priceUp = ref(false);
const priceDown = ref(false);

let intervalId = null;
let previousSale = 0;

// Load alarm settings from localStorage
onMounted(() => {
  const savedTarget = localStorage.getItem("tela_target_price");
  const savedActive = localStorage.getItem("tela_alarm_active");

  if (savedTarget) targetPrice.value = savedTarget;
  if (savedActive === "true") alarmActive.value = true;

  fetchPrices();

  // Refresh every 60 seconds
  intervalId = setInterval(fetchPrices, 60000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Watchers to save settings
watch(targetPrice, (newVal) => {
  localStorage.setItem("tela_target_price", newVal);
});

watch(alarmActive, (newVal) => {
  localStorage.setItem("tela_alarm_active", newVal);
  if (newVal) {
    requestNotificationPermission();
  }
});

const formatPrice = (val) => {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
};

const toggleAlarm = () => {
  if (!targetPrice.value || targetPrice.value <= 0) {
    alert("Lütfen geçerli bir hedef fiyat girin.");
    return;
  }
  alarmActive.value = !alarmActive.value;
};

const fetchPrices = async () => {
  priceUp.value = false;
  priceDown.value = false;

  try {
    loading.value = prices.value.sale === 0;

    const data = await getGoldPrices();
    console.log("Gold API data:", data);

    if (!data || !data.buy || !data.sell) {
      throw new Error("Geçersiz altın fiyatı verileri");
    }

    const sale = data.sell; // Bank sells → user buys
    const purchase = data.buy; // Bank buys → user sells

    // price movement indicator (based on SELL price)
    if (previousSale > 0) {
      if (sale > previousSale) priceUp.value = true;
      if (sale < previousSale) priceDown.value = true;
    }
    previousSale = sale;

    prices.value = {
      sale,
      purchase,
    };

    goldType.value = data.product;
    lastUpdated.value = new Date(data.fetched_at).toLocaleTimeString();

    checkAlarm(purchase);

    error.value = null;
  } catch (err) {
    console.error(err);
    error.value = "Veri alma başarısız oldu.";
  } finally {
    loading.value = false;
  }
};

const checkAlarm = (currentSellPrice) => {
  if (!alarmActive.value || !targetPrice.value) return;

  // Logic: "Check if selling price >= alarm target"
  // User wants to know when they can SELL their gold for a certain price.
  // So if Current Sell Price >= Target, trigger alarm.

  const target = parseFloat(targetPrice.value);
  if (currentSellPrice >= target) {
    sendNotification(currentSellPrice);
  }
};

const sendNotification = (price) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification("Altın Fiyatı Uyarısı!", {
      body: `Satış fiyatına ulaşıldı ${formatPrice(
        price
      )} TL! (Hedef: ${formatPrice(targetPrice.value)} TL)`,
      icon: "/favicon.png", // Ensure this exists or use default
    });
  }
};
</script>

<style>
/* Custom transitions/animations if needed, mainly utilizing Tailwind */
</style>

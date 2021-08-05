<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown="handleKeyPressed"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="hints.length"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="hint in hints"
            :key="hint"
            @click="selectHint(hint)"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ hint }}
          </span>
        </div>
        <div v-if="error" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>

    <add-button @click="add" :disabled="disabled" />
  </section>
</template>

<script>
import AddButton from "./AddButton.vue";

export default {
  name: "AddTicker",
  components: {
    AddButton,
  },
  props: {
    coins: {
      type: Array,
      required: true,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    error: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: {
    "add-ticker": (value) => typeof value === "string",
    "set-error": (value) => typeof value === "boolean",
  },
  data() {
    return {
      ticker: "",
    };
  },
  methods: {
    add() {
      this.ticker = this.ticker.toUpperCase();
      this.$emit("add-ticker", this.ticker);
      this.ticker = "";
    },
    handleKeyPressed(e) {
      if (e.key === "Enter") {
        this.add();
      } else {
        this.$emit("set-error", false);
      }
    },
  },
  computed: {
    hints: function () {
      if (!this.ticker) {
        return [];
      }
      return this.coins
        .filter((coin) => {
          return coin.indexOf(this.ticker.toUpperCase()) >= 0;
        })
        .slice(0, 4);
    },
  },
};
</script>

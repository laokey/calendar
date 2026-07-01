<template>
  <view class="repeat-root" :style="rootStyle">
    <view class="block row-between">
      <view class="row-left">
        <image
          class="field-icon is-target"
          :src="repeatIconSrc"
          mode="aspectFit"
        />
        <text class="label">{{ label }}</text>
      </view>
      <switch :checked="enabled" color="#3d6afb" @change="onEnabledToggle" />
    </view>

    <view v-if="enabled && mode === 'full'" class="block">
      <view class="repeat-row">
        <view class="row-left">
          <image
            class="field-icon is-target"
            :src="repeatIconSrc"
            mode="aspectFit"
          />
          <text class="label">每一个</text>
        </view>
      </view>
      <view class="repeat-row m-top-12">
        <view class="row-left">
          <input v-model="everyProxy" class="every-input" type="number" />
          <view class="unit-wrap">
            <BlSegmented v-model="unitProxy" :options="unitOptions" />
          </view>
        </view>
      </view>
    </view>

    <view
      v-if="enabled && mode === 'full' && unitProxy === 'month'"
      class="block"
    >
      <view class="repeat-row">
        <view class="row-left">
          <image
            class="field-icon is-edit"
            :src="whenIconSrc"
            mode="aspectFit"
          />
          <text class="label">在什么时候</text>
        </view>
      </view>
      <view class="repeat-month m-top-12">
        <view
          class="repeat-pill repeat-pill-month"
          :class="{ 'is-active': monthRuleProxy.type === 'day' }"
          @click.stop="setMonthRuleType('day')"
        >
          <text class="repeat-pill-text">{{ monthRuleTextLeft }}</text>
        </view>
        <view
          class="repeat-pill repeat-pill-month"
          :class="{ 'is-active': monthRuleProxy.type !== 'day' }"
          @click.stop="setMonthRuleType('weekday')"
        >
          <text class="repeat-pill-text">{{ monthRuleTextRight }}</text>
        </view>
      </view>
    </view>

    <view
      v-if="enabled && mode === 'full' && unitProxy === 'week'"
      class="block"
    >
      <view class="repeat-week">
        <view class="repeat-row repeat-week-label">
          <view class="row-left">
            <image
              class="field-icon is-edit"
              :src="whenIconSrc"
              mode="aspectFit"
            />
            <text class="label week-when">在什么时间</text>
          </view>
        </view>
        <view class="repeat-weekdays-row m-top-12">
          <view
            v-for="d in weekdayOptions"
            :key="d.value"
            class="weekday-pill"
            :class="{ on: weekdaysProxy.includes(d.value) }"
            @click.stop="toggleWeekday(d.value)"
          >
            <text
              class="weekday-text"
              :class="{ on: weekdaysProxy.includes(d.value) }"
              >{{ d.label }}</text
            >
          </view>
        </view>
      </view>
    </view>

    <view v-if="enabled && mode === 'full'" class="block">
      <view class="repeat-row row-between">
        <view class="row-left">
          <image
            class="field-icon is-target"
            :src="untilIconSrc"
            mode="aspectFit"
          />
          <text class="label">重复直到</text>
        </view>
        <switch
          :checked="untilOnProxy"
          color="#3d6afb"
          @change="onUntilToggle"
        />
      </view>
      <view
        v-if="untilOnProxy"
        class="repeat-until-date"
        @click="requestUntilPick"
      >
        <text class="val">{{ untilText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, watch } from "vue";
import BlSegmented from "./BlSegmented.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "full" },
  label: { type: String, default: "重复" },
  theme: { type: String, default: "event" },
  repeatIconSrc: { type: String, default: "/static/calendar/icon_refresh.png" },
  whenIconSrc: {
    type: String,
    default: "/static/common/icon_calendar.png",
  },
  untilIconSrc: {
    type: String,
    default: "/static/calendar/icon_form_target.png",
  },
  every: { type: String, default: "1" },
  unit: { type: String, default: "day" },
  unitOptions: { type: Array, default: () => [] },
  monthRule: {
    type: Object,
    default: () => ({ type: "day", day: 1, nth: 1, weekday: 0 }),
  },
  weekdays: { type: Array, default: () => [] },
  untilOn: { type: Boolean, default: false },
  until: { type: String, default: "" },
  startDate: { type: String, default: "" },
  defaultUntil: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:every",
  "update:unit",
  "update:monthRule",
  "update:weekdays",
  "update:untilOn",
  "update:until",
  "request-until-pick",
]);

const enabled = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const everyProxy = computed({
  get: () => props.every,
  set: (v) => emit("update:every", String(v || "")),
});

const unitProxy = computed({
  get: () => props.unit,
  set: (v) => emit("update:unit", String(v || "")),
});

const monthRuleProxy = computed({
  get: () => props.monthRule || { type: "day", day: 1, nth: 1, weekday: 0 },
  set: (v) => emit("update:monthRule", v),
});

const weekdaysProxy = computed({
  get: () => (Array.isArray(props.weekdays) ? props.weekdays : []),
  set: (v) => emit("update:weekdays", Array.isArray(v) ? v : []),
});

const untilOnProxy = computed({
  get: () => !!props.untilOn,
  set: (v) => emit("update:untilOn", !!v),
});

const untilProxy = computed({
  get: () => props.until,
  set: (v) => emit("update:until", String(v || "")),
});

const weekdayOptions = [
  { label: "日", value: 0 },
  { label: "一", value: 1 },
  { label: "二", value: 2 },
  { label: "三", value: 3 },
  { label: "四", value: 4 },
  { label: "五", value: 5 },
  { label: "六", value: 6 },
];

function toCnDateText(key) {
  const parts = String(key || "").split("-");
  if (parts.length !== 3) return "";
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
}

const untilText = computed(() => toCnDateText(untilProxy.value));

function normalizeWeekdays(list) {
  const src = Array.isArray(list) ? list : [];
  const out = [];
  for (const x of src) {
    const n = Number(x);
    if (!Number.isFinite(n)) continue;
    const v = Math.floor(n);
    if (v < 0 || v > 6) continue;
    if (!out.includes(v)) out.push(v);
  }
  return out.sort((a, b) => a - b);
}

function weekdayFromKey(key) {
  const parts = String(key || "").split("-");
  if (parts.length !== 3) return 0;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const w = d.getDay();
  return typeof w === "number" && w >= 0 && w <= 6 ? w : 0;
}

function ensureWeekdayDefault() {
  if (!enabled.value) return;
  if (unitProxy.value !== "week") return;
  const next = normalizeWeekdays(weekdaysProxy.value);
  if (next.length) {
    weekdaysProxy.value = next;
    return;
  }
  const w = weekdayFromKey(props.startDate);
  weekdaysProxy.value = [w];
}

watch(
  () => [enabled.value, unitProxy.value, props.startDate],
  () => {
    ensureWeekdayDefault();
  },
);

function onEnabledToggle(e) {
  const next = !!(e && e.detail ? e.detail.value : false);
  enabled.value = next;
  if (!next) {
    untilOnProxy.value = false;
    untilProxy.value = "";
  } else {
    ensureWeekdayDefault();
  }
}

function setMonthRuleType(type) {
  const next = type === "day" ? "day" : "weekday";
  if (monthRuleProxy.value.type === next) return;
  monthRuleProxy.value = { ...monthRuleProxy.value, type: next };
}

const monthRuleTextLeft = computed(
  () => `${Number(monthRuleProxy.value.day) || 1}号`,
);
const monthRuleTextRight = computed(() => {
  const w = ["日", "一", "二", "三", "四", "五", "六"][
    Number(monthRuleProxy.value.weekday) || 0
  ];
  return `第${Number(monthRuleProxy.value.nth) || 1}个星期${w}`;
});

function toggleWeekday(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return;
  const w = Math.floor(n);
  if (w < 0 || w > 6) return;
  const next = normalizeWeekdays(weekdaysProxy.value);
  const idx = next.indexOf(w);
  if (idx >= 0) next.splice(idx, 1);
  else next.push(w);
  weekdaysProxy.value = next.sort((a, b) => a - b);
}

function requestUntilPick() {
  emit("request-until-pick");
}

function onUntilToggle(e) {
  const next = !!(e && e.detail ? e.detail.value : false);
  untilOnProxy.value = next;
  if (!next) {
    untilProxy.value = "";
    return;
  }
  if (!untilProxy.value)
    untilProxy.value = props.defaultUntil || props.startDate || "";
  requestUntilPick();
}

const rootStyle = computed(() => {
  if (props.theme === "task") {
    return {
      "--rep-bg": "#fafafa",
      "--rep-shadow": "0 4rpx 20rpx rgba(17, 17, 17, 0.04)",
      "--rep-pad-x": "28rpx",
      "--rep-pad-y": "24rpx",
      "--rep-mx": "28rpx",
      "--rep-mt": "20rpx",
    };
  }
  return {
    "--rep-bg": "#fafafa",
    "--rep-shadow": "0 10rpx 26rpx rgba(17, 17, 17, 0.06)",
    "--rep-pad-x": "22rpx",
    "--rep-pad-y": "20rpx",
    "--rep-mx": "0rpx",
    "--rep-mt": "16rpx",
  };
});
</script>

<style scoped lang="scss">
.block {
  background: #fafafa;
  border-radius: 28rpx;
  padding: var(--rep-pad-y) var(--rep-pad-x);
  margin: var(--rep-mt) var(--rep-mx) 0;
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.m-top-12 {
  margin-top: 12rpx;
}

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.val {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.field-icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
  display: block;
}

.repeat-row {
  display: flex;
  // background: #fafafa;
  align-items: center;
  justify-content: space-between;
}

.repeat-right {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.every-input {
  width: 92rpx;
  height: 92rpx;
  border-radius: 20rpx;
  background: #ffffff;
  text-align: center;
  font-size: 30rpx;
  font-weight: 900;
  color: #111111;
}

.unit-wrap {
  // width: 360rpx;
}

.repeat-month {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.repeat-pill {
  height: 72rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.repeat-pill-month {
  width: 50%;
  border-radius: 24rpx;
}

.repeat-pill.is-active {
  background: #3d6afb;
}

.repeat-pill-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.repeat-pill.is-active .repeat-pill-text {
  color: #ffffff;
}

.repeat-weekdays-row {
  margin-top: 12rpx;
  // padding-left: 42rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.weekday-pill {
  width: 68rpx;
  height: 68rpx;
  border-radius: 999rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weekday-pill.on {
  background: #3d6afb;
}

.weekday-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.weekday-text.on {
  color: #ffffff;
}

.repeat-until-date {
  margin-top: 10rpx;
  padding-left: 42rpx;
}
</style>

<template>
  <view class="bl-page detail-page">
    <BlHeader title="餐点详情" back>
      <template #right>
        <view class="top-del" @click="confirmOpen = true">
          <image
            class="top-del-icon"
            src="/static/meals/icon_trash.png"
            mode="aspectFit"
          />
        </view>
      </template>
    </BlHeader>

    <view class="hero">
      <image
        v-if="photoPath"
        class="hero-img"
        :src="photoPath"
        mode="aspectFill"
      />
      <view v-else class="hero-ph" />
    </view>

    <view class="card">
      <text class="title">{{ title }}</text>
      <text class="sub">{{ dateText }}</text>

      <view class="divider" />

      <view class="row" @click="catOpen = true">
        <view class="row-left">
          <image
            class="row-icon"
            src="/static/meals/icon_grid.png"
            mode="aspectFit"
          />
          <text class="row-title">分类</text>
        </view>
        <view class="row-right">
          <view class="badge" :style="{ background: catColor }"
            ><text class="glyph">{{ catGlyph }}</text></view
          >
          <text class="cat-name">{{ catName }}</text>
          <image
            class="row-icon"
            src="/static/common/icon_down.png"
            mode="aspectFit"
          />
        </view>
      </view>
    </view>

    <view class="bottom" @click="goEdit">
      <text class="bottom-text">编辑</text>
    </view>

    <BlSheet v-model="catOpen" title="分类" :confirm-text="''">
      <view class="cat-list">
        <view
          v-for="c in categories"
          :key="c.id"
          class="cat-item"
          @click="selectCategory(c.id)"
        >
          <view class="cat-left">
            <view class="cat-badge" :style="{ background: c.color }"
              ><text class="cat-glyph">{{ c.glyph }}</text></view
            >
            <text class="cat-name2">{{ c.name }}</text>
          </view>
          <view class="cat-right">
            <view v-if="categoryId === c.id" class="cat-check"
              ><text class="cat-check-text">✓</text></view
            >
            <view v-else class="cat-dot" />
          </view>
        </view>
      </view>
    </BlSheet>

    <view
      v-if="confirmOpen"
      class="dialog-mask"
      @click.self="confirmOpen = false"
    >
      <view class="dialog">
        <text class="dialog-title">您确定要删除吗?</text>
        <view class="dialog-actions">
          <view class="dialog-btn cancel" @click="confirmOpen = false"
            ><text class="dialog-btn-text">取消</text></view
          >
          <view class="dialog-btn ok" @click="del"
            ><text class="dialog-btn-text ok-text">删除</text></view
          >
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import BlHeader from "../../components/BlHeader.vue";
import BlSheet from "../../components/BlSheet.vue";
import {
  cnDateText,
  deletePlan,
  ensureMealState,
  findCategory,
  findPlan,
  findRecipe,
  listCategories,
  updatePlan,
} from "../../utils/mealStore";

const mealState = ref(ensureMealState());
const planId = ref("");

const catOpen = ref(false);
const confirmOpen = ref(false);

function refresh() {
  mealState.value = ensureMealState();
}

onLoad((options) => {
  planId.value = options && options.id ? String(options.id) : "";
  refresh();
});

onShow(() => refresh());

const plan = computed(() =>
  planId.value ? findPlan(mealState.value, planId.value) : null,
);
const recipe = computed(() =>
  plan.value ? findRecipe(mealState.value, plan.value.recipeId) : null,
);

const title = computed(() => (recipe.value ? recipe.value.title : ""));
const photoPath = computed(() => (recipe.value ? recipe.value.photoPath : ""));
const dateText = computed(() =>
  plan.value ? cnDateText(plan.value.date) : "",
);

const categories = computed(() =>
  listCategories(mealState.value, { enabledOnly: true }),
);
const categoryId = computed(() => (plan.value ? plan.value.categoryId : ""));
const cat = computed(() =>
  categoryId.value ? findCategory(mealState.value, categoryId.value) : null,
);
const catName = computed(() => (cat.value ? cat.value.name : ""));
const catGlyph = computed(() => (cat.value ? cat.value.glyph : ""));
const catColor = computed(() => (cat.value ? cat.value.color : "#3d6afb"));

function selectCategory(id) {
  if (!planId.value) return;
  updatePlan(mealState.value, planId.value, { categoryId: id });
  catOpen.value = false;
  refresh();
}

function goEdit() {
  if (!plan.value) return;
  uni.navigateTo({
    url: `/pages/meals/meal-plan-form?planId=${plan.value.id}`,
  });
}

function del() {
  if (!planId.value) return;
  deletePlan(mealState.value, planId.value);
  confirmOpen.value = false;
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.detail-page {
  padding-bottom: 220rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.top-del {
  width: 90rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.top-del-icon {
  width: 34rpx;
  height: 34rpx;
  display: block;
  opacity: 0.85;
}

.hero {
  margin-top: 10rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 32rpx;
  overflow: hidden;
  align-self: center;
  background: rgba(17, 17, 17, 0.04);
}

.hero-img {
  width: 280rpx;
  height: 280rpx;
}

.hero-ph {
  width: 280rpx;
  height: 280rpx;
  background: rgba(17, 17, 17, 0.12);
}

.card {
  margin-top: 18rpx;
  background: #f5f6f7;
  border-radius: 28rpx;
  padding: 22rpx;
  box-shadow: none;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.sub {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.55);
}

.divider {
  margin-top: 18rpx;
  height: 1px;
  background: rgba(17, 17, 17, 0.06);
}

.row {
  margin-top: 16rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.row-icon {
  width: 28rpx;
  height: 28rpx;
  display: block;
  opacity: 0.8;
}

.row-title {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.row-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.badge {
  width: 46rpx;
  height: 46rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glyph {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.cat-name {
  font-size: 28rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.6);
}

.arrow {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.35);
}

.bottom {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  background: #eef2ff;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-text {
  color: #3d6afb;
  font-size: 34rpx;
  font-weight: 900;
}

.cat-list {
  padding: 6rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.cat-item {
  height: 92rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.06);
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.cat-badge {
  width: 46rpx;
  height: 46rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-glyph {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.cat-name2 {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.cat-right {
  width: 54rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.cat-check {
  width: 38rpx;
  height: 38rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-check-text {
  font-size: 22rpx;
  font-weight: 900;
  color: #ffffff;
}

.cat-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.18);
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  width: 640rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx 26rpx 26rpx;
}

.dialog-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.dialog-actions {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.dialog-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-btn.cancel {
  background: #eef2ff;
}

.dialog-btn.ok {
  background: #3d6afb;
}

.dialog-btn-text {
  font-size: 32rpx;
  font-weight: 900;
  color: #3d6afb;
}

.ok-text {
  color: #ffffff;
}
</style>

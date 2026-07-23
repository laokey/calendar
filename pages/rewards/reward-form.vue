<template>
  <view class="bl-page form-page">
    <BlHeader
      :title="$t('添加奖励')"
      back
      back-icon-src="/static/reward/icon_nav_back_small.png"
    >
      <template #right>
        <view class="top-save" @click="save">
          <text class="top-save-text">{{ $t('保存') }}</text>
        </view>
      </template>
    </BlHeader>

    <view class="block">
      <view class="field-title">
        <image
          class="field-icon"
          src="/static/calendar/icon_form_title_edit.png"
          mode="aspectFit"
        />

        <text class="req">*</text>
        <text>{{ $t('标题') }}</text>
      </view>
      <view class="input-wrap">
        <input
          v-model="title"
          class="input"
          :placeholder="$t('请输入标题')"
          placeholder-class="ph"
        />
      </view>
    </view>

    <view class="block row-between" @click="emojiSheetOpen = true">
      <view class="row-left">
        <image
          class="field-icon"
          src="/static/reward/icon_smiley.png"
          mode="aspectFit"
        />
        <text class="label">{{ $t('表情符号(可选)') }}</text>
      </view>
      <image
        class="field-icon"
          src="/static/task/icon_chevron_down.png"
          mode="aspectFit"
        />
    </view>

    <view class="block row-between">
      <view class="row-left">
        <image
          class="field-icon"
          src="/static/task/icon_repeat.png"
          mode="aspectFit"
        />
        <text class="label">{{ $t('执行后重置') }}</text>
      </view>
      <switch
        :checked="resetAfter"
        color="#3d6afb"
        @change="resetAfter = !!$event.detail.value"
      />
    </view>

    <view class="block">
      <view class="field-title">
        <image
          class="field-icon"
          src="/static/reward/icon_heart_orange.png"
          mode="aspectFit"
        />
        <text class="req">*</text>
        <text>{{ $t('心心') }}</text>
      </view>
      <view class="input-wrap">
        <input
          v-model="hearts"
          class="input"
          type="number"
          :placeholder="$t('请输入心心数量')"
          placeholder-class="ph"
        />
      </view>
    </view>

    <view v-if="tipOpen" class="tip">
      <text class="tip-text"
        >{{ $t('请输入本次奖励或惩罚变更的星星数量。奖励会增加星星，惩罚会减少星星。') }}</text
      >
      <view class="tip-close" @click="tipOpen = false">
        <image
          class="tip-close-img"
          src="/static/reward/icon_close_x.png"
          mode="aspectFit"
        />
      </view>
    </view>

    <view class="block">
      <view class="field-title">
        <image
          class="field-icon"
          src="/static/reward/icon_members.png"
          mode="aspectFit"
        />
        <text class="req">*</text>
        <text>{{ $t('选择成员') }}</text>
      </view>
      <view class="members">
        <view
          v-for="m in memberItems"
          :key="m.id"
          class="mem"
          @click="toggleMember(m.id)"
        >
          <BlAvatar
            :glyph="m.glyph"
            :src="m.avatarUrl"
            :color="m.color"
            :size="72"
          />
          <view v-if="selectedMemberIdSet.has(String(m.id))" class="mem-check"
            ><text class="check">✓</text></view
          >
          <text class="mem-name">{{ m.name }}</text>
        </view>
        <view class="mem add" @click="goAddMember">
          <view class="add-circle"><text class="add-plus">+</text></view>
          <text class="mem-name">{{ $t('添加') }}</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="field-title row-between">
        <view class="row-left">
          <text class="req">*</text>
          <text>{{ $t('类型') }}</text>
        </view>
        <view class="q" @click="infoOpen = true"
          ><text class="q-text">?</text></view
        >
      </view>
      <view class="type">
        <view
          class="type-pill"
          :class="{ on: type === 'reward' }"
          @click="type = 'reward'"
        >
          <text class="type-text">{{ $t('奖励') }}</text>
        </view>
        <view
          class="type-pill punish"
          :class="{ on: type === 'punish' }"
          @click="type = 'punish'"
        >
          <text class="type-text">{{ $t('惩罚') }}</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="row-left">
        <image
          class="field-icon"
          src="/static/reward/icon_title_t.png"
          mode="aspectFit"
        />
        <text class="label">{{ $t('描述') }}</text>
      </view>
      <view class="input-wrap is-textarea">
        <textarea
          v-model="desc"
          class="textarea"
          :placeholder="$t('请输入描述')"
          placeholder-class="ph"
        />
      </view>
    </view>

    <view class="bottom-save" @click="save">
      <text class="bottom-save-text">{{ $t('保存') }}</text>
    </view>

    <BlEmojiPickerSheet v-model="emojiSheetOpen" :value="emoji" @pick="selectEmoji" />

    <BlSheet v-model="infoOpen" title="" :confirm-text="''">
      <view class="info">
        <view class="info-head">
          <text class="info-title">{{ $t('奖励与惩罚说明') }}</text>
          <view class="info-x" @click="infoOpen = false">
            <image
              class="info-x-img"
              src="/static/reward/icon_close.png"
              mode="aspectFit"
            />
          </view>
        </view>
        <text class="info-text">
          {{ $t('健康成长不仅需要掌声，也需要温柔的提醒。现在您可以直接配置奖励与惩罚，让孩子直观地看到行为带来的正向激励和结果反馈。') }}
        </text>
        <text class="info-subtitle">{{ $t('奖励与惩罚说明') }}</text>
        <text class="info-text"
          >{{ $t('1.奖励会增加星星，惩罚会减少星星。') }}</text
        >
        <text class="info-text"
          >{{ $t('2.保存的星星数量表示单次执行的变化值；奖励执行后增加对应数量，惩罚执行后扣减对应数量。') }}</text
        >
        <view class="info-btn" @click="infoOpen = false"
          ><text class="info-btn-text">{{ $t('立即体验') }}</text></view
        >
      </view>
    </BlSheet>
  </view>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import BlAvatar from "../../components/BlAvatar.vue";
import BlHeader from "../../components/BlHeader.vue";
import BlSheet from "../../components/BlSheet.vue";
import BlEmojiPickerSheet from "../../components/BlEmojiPickerSheet.vue";
import { ensureCalendarState, listMembers, setMembers } from "../../utils/calendarStore";
import { membersApi, rewardsApi } from "../../utils/api";

const calendarState = ref(ensureCalendarState());

const itemId = ref("");
const saving = ref(false);

const title = ref("");
const emoji = ref("");
const resetAfter = ref(false);
const hearts = ref("10");
const memberIds = ref([]);
const type = ref("reward");
const desc = ref("");

const tipOpen = ref(true);
const emojiSheetOpen = ref(false);
const infoOpen = ref(false);

function refresh() {
  calendarState.value = ensureCalendarState();
}

async function syncRemoteMembers() {
  const logged = !!uni.getStorageSync("auth_logged_in");
  if (!logged) return false;
  try {
    const list = await membersApi.getMemberList();
    setMembers(calendarState.value, membersApi.mapRemoteMembersToLocalMembers(list));
    return true;
  } catch (e) {
    return false;
  }
}

onShow(() => {
  (async () => {
    await syncRemoteMembers();
    refresh();
  })();
});

const memberItems = computed(() => {
  return listMembers(calendarState.value).filter((m) => m.enabled !== false);
});

const selectedMemberIdSet = computed(() => {
  const ids = Array.isArray(memberIds.value) ? memberIds.value : [];
  const set = new Set();
  for (const id of ids) {
    const s = String(id || "").trim();
    if (s) set.add(s);
  }
  return set;
});

function pickDefaultMemberId() {
  const first = memberItems.value.find((m) => m && m.id);
  return first && first.id ? String(first.id) : "";
}

function ensureMemberSelection() {
  const list = Array.isArray(memberItems.value) ? memberItems.value : [];
  const valid = new Set(list.map((m) => String(m && m.id ? m.id : "")).filter((x) => x));
  const current = Array.isArray(memberIds.value) ? memberIds.value : [];
  const next = current.map((x) => String(x || "").trim()).filter((x) => x && valid.has(x));
  if (next.length) {
    memberIds.value = next;
    return;
  }
  const fallback = pickDefaultMemberId();
  memberIds.value = fallback ? [fallback] : [];
}

function toggleMember(id) {
  const key = String(id || "").trim();
  if (!key) return;
  const current = Array.isArray(memberIds.value) ? memberIds.value.map((x) => String(x || "").trim()).filter((x) => x) : [];
  if (current.includes(key)) {
    const next = current.filter((x) => x !== key);
    memberIds.value = next;
    return;
  }
  memberIds.value = [...current, key];
}

watch(
  memberItems,
  () => {
    ensureMemberSelection();
  },
  { immediate: true },
);

onLoad((options) => {
  ;(async () => {
    refresh();
    await syncRemoteMembers();
    const id = options && options.id ? decodeQueryValue(options.id) : "";
    const t = options && options.type ? decodeQueryValue(options.type) : "";
    const mid = options && options.memberId ? decodeQueryValue(options.memberId) : "";

    if (mid) memberIds.value = [mid];
    if (t) type.value = t === "punish" ? "punish" : "reward";
    ensureMemberSelection();

    if (!id) return;
    itemId.value = id;
    await loadRewardDetail(id);
  })();
});

function decodeQueryValue(value) {
  const raw = value === undefined || value === null ? "" : String(value).trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

async function loadRewardDetail(id) {
  try {
    const it = await rewardsApi.getRewardInfo({ rewardId: id });
    title.value = it.rewardTitle || "";
    emoji.value = it.emoji || "";
    resetAfter.value = Number(it.isReset) === 1;
    hearts.value = String(it.starNumber || 0);
    memberIds.value = Array.isArray(it.members) ? it.members.map((m) => String(m && m.memberId ? m.memberId : "")).filter((x) => x) : memberIds.value;
    ensureMemberSelection();
    type.value = Number(it.rewardType) === 1 ? "punish" : "reward";
    desc.value = it.description || "";
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('获取奖励详情失败')), icon: "none" });
  }
}

function selectEmoji(e) {
  emoji.value = e;
  emojiSheetOpen.value = false;
}

function goAddMember() {
  uni.navigateTo({ url: "/pages/members/member-add" });
}

function validate() {
  if (!String(title.value || "").trim()) {
    uni.showToast({ title: uni.$t('请输入标题'), icon: "none" });
    return false;
  }
  const n = Number(hearts.value || 0) || 0;
  if (n <= 0) {
    uni.showToast({ title: uni.$t('请输入心心'), icon: "none" });
    return false;
  }
  if (!Array.isArray(memberIds.value) || !memberIds.value.length) {
    uni.showToast({ title: uni.$t('请选择成员'), icon: "none" });
    return false;
  }
  return true;
}

async function save() {
  if (!validate() || saving.value) return;
  saving.value = true;
  const payload = {
    rewardTitle: title.value,
    emoji: emoji.value,
    isReset: resetAfter.value ? 1 : 0,
    starNumber: Number(hearts.value || 0) || 0,
    members: memberIds.value.slice(),
    rewardType: type.value === "punish" ? 1 : 0,
    description: desc.value,
  };
  try {
    if (itemId.value) {
      await rewardsApi.updateRewardInfo({ rewardId: itemId.value, ...payload });
    } else {
      await rewardsApi.addRewardInfo(payload);
    }
    uni.$emit && uni.$emit("reward:refresh");
    uni.navigateBack();
  } catch (e) {
    uni.showToast({ title: String((e && e.message) || uni.$t('保存奖励失败')), icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.form-page {
  padding-bottom: 240rpx;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
}

.top-save {
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12rpx;
}

.top-save-text {
  color: #3d6afb;
  font-size: 30rpx;
  font-weight: 900;
}

.block {
  background: #fafafa;
  border-radius: 28rpx;
  padding: 20rpx 22rpx;
  margin-top: 16rpx;
}

.field-title {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
  margin-bottom: 12rpx;
}

.req {
  color: #ff3b30;
}

.input-wrap {
  height: 96rpx;
  border-radius: 24rpx;
  background: #fafafa;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
}

.input-wrap.is-textarea {
  height: 140rpx;
  align-items: flex-start;
  padding-top: 16rpx;
}

.input {
  width: 100%;
  font-size: 34rpx;
  font-weight: 900;
  color: #111111;
}

.textarea {
  width: 100%;
  height: 110rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111111;
}

.ph {
  color: rgba(17, 17, 17, 0.35);
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

.label {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.88);
}

.chev {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.4);
}

.field-icon {
  width: 28rpx;
  height: 28rpx;
  flex-shrink: 0;
  display: block;
}

.tip {
  margin-top: 14rpx;
  background: #eaf2ff;
  border-radius: 18rpx;
  padding: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.tip-text {
  flex: 1;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
  line-height: 1.3;
}

.tip-close {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.tip-close-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding-top: 10rpx;
}

.mem {
  width: 116rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.mem-check {
  position: absolute;
  top: 44rpx;
  right: 16rpx;
  width: 26rpx;
  height: 26rpx;
  border-radius: 999rpx;
  background: #2ecc71;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check {
  font-size: 18rpx;
  font-weight: 900;
  color: #ffffff;
}

.mem-name {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
}

.mem.add .mem-name {
  color: rgba(17, 17, 17, 0.55);
}

.add-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-plus {
  font-size: 40rpx;
  font-weight: 700;
  color: rgba(17, 17, 17, 0.6);
}

.type {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.type-pill {
  flex: 1;
  height: 74rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-pill.on {
  background: #3d6afb;
}

.type-pill.punish.on {
  background: #ff3b30;
}

.type-text {
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.type-pill.on .type-text {
  color: #ffffff;
}

.q {
  width: 50rpx;
  height: 50rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.55);
}

.bottom-save {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: 34rpx;
  height: 104rpx;
  background: #3d6afb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-save-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  padding: 10rpx 0 0;
}

.emoji-item {
  width: 150rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item.clear {
  background: rgba(61, 106, 251, 0.12);
}

.emoji-text {
  font-size: 28rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.75);
}

.sheet-cancel {
  margin-top: 18rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: rgba(17, 17, 17, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-cancel-text {
  font-size: 32rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.8);
}

.info {
  padding: 10rpx 0 10rpx;
}

.info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-title {
  font-size: 34rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.95);
}

.info-x {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.info-x-img {
  width: 28rpx;
  height: 28rpx;
  display: block;
}

.info-subtitle {
  margin-top: 18rpx;
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  color: rgba(17, 17, 17, 0.9);
}

.info-text {
  margin-top: 14rpx;
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: rgba(17, 17, 17, 0.75);
  line-height: 1.4;
}

.info-btn {
  margin-top: 20rpx;
  height: 96rpx;
  border-radius: 999rpx;
  background: #3d6afb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-btn-text {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}
</style>
